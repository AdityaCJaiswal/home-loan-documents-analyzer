from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.decorators import api_view 
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.generics import DestroyAPIView, RetrieveAPIView, ListAPIView
from .models import Document, Chunk, ChatSession, ChatMessage, DocumentChunk
from .rag_utils import process_document, doc_embeddings_map, model, index, extract_text
from .serializers import ChatSessionSerializer, DocumentChunkSerializer, DocumentSerializer
import numpy as np
import os
import requests
from django.views.decorators.csrf import ensure_csrf_cookie
import logging
import json
import re
import functools
from django.http import JsonResponse
from django.conf import settings
from django.shortcuts import get_object_or_404
import joblib
from .rag_utils import chunk_text # Ensure this is imported to break up the document

logger = logging.getLogger(__name__)

LOCAL_LLM_URL = "http://localhost:1234/v1/chat/completions"

def call_local_llm(prompt):
    """
    Helper function to call the local LLM (Mistral)
    Assumes an OpenAI-compatible API endpoint.
    """
    try:
        payload = {
            "model": "mistral", # Try common model names
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.0, # Set to 0.0 for maximum determinism
            "stream": False
        }
        headers = {"Content-Type": "application/json"}
        response = requests.post(LOCAL_LLM_URL, json=payload, headers=headers, timeout=120) 
        response.raise_for_status() 

        json_response = response.json()
        content = json_response['choices'][0]['message']['content']
        return content.strip()

    except requests.exceptions.ConnectionError:
        logger.error(f"--- [LLM ERROR] Connection refused. Is the local server running at {LOCAL_LLM_URL}? ---")
        raise Exception(f"ConnectionError: Cannot connect to local LLM at {LOCAL_LLM_URL}.")
    except requests.exceptions.HTTPError as e:
        logger.error(f"--- [LLM ERROR] HTTP Error: {str(e)} ---")
        logger.error(f"--- [LLM ERROR] Response body: {e.response.text} ---")
        raise Exception(f"HTTP Error: {str(e)}\nResponse: {e.response.text}")
    except requests.exceptions.RequestException as e:
        logger.error(f"--- [LLM ERROR] Request failed: {str(e)} ---")
        raise Exception(f"RequestException: {str(e)}")
    except (KeyError, IndexError) as e:
            logger.error(f"--- [LLM ERROR] Unexpected JSON response format from local LLM ---")
            raise Exception(f"JSONParseError: Invalid response format from LLM. {e}")
# --- END NEW HELPER FUNCTION ---

# -----------------------------------------------------------------
#  YOUR ORIGINAL CLASS-BASED VIEWS (REQUIRED BY URLS.PY)
# -----------------------------------------------------------------

# List all documents, ordered by creation date
class DocumentListView(ListAPIView):
    queryset = Document.objects.all().order_by('-created_at')
    serializer_class = DocumentSerializer

# Retrieve single document details
class DocumentDetailView(RetrieveAPIView):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

# Handle document upload and processing
@method_decorator(ensure_csrf_cookie, name='dispatch')
class DocumentUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = DocumentSerializer(data={'file': file, 'title': file.name})
        if serializer.is_valid():
            document = serializer.save()
            try:
                process_document(document)  # Process document for RAG
                logger.info(f"Document {document.id} processed successfully")
                return Response({
                    'message': 'Document uploaded and processed successfully',
                    'id': document.id,
                    'title': document.title,
                }, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Error processing document {document.id}: {str(e)}")
                document.delete()  # Clean up if processing fails
                return Response({'error': f'Document processing failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Delete document and clean up associated resources
class DocumentDeleteView(DestroyAPIView):
    queryset = Document.objects.all()

    def delete(self, request, *args, **kwargs):
        doc_id = kwargs.get('pk')
        try:
            document = Document.objects.get(id=doc_id)
            
            # Clean up chunks and file
            Chunk.objects.filter(document=document).delete()
            DocumentChunk.objects.filter(document=document).delete()
            
            if document.file and os.path.exists(document.file.path):
                os.remove(document.file.path)
            
            # Remove from embeddings map but don't reset entire index
            if doc_id in doc_embeddings_map:
                del doc_embeddings_map[doc_id]
                logger.info(f"Removed embeddings for document {doc_id}")
            
            # Only reset index if no documents remain
            if not doc_embeddings_map:
                index.reset()
                logger.info("Reset FAISS index as no documents remain")

            document.delete()
            return Response({"message": f"Document {doc_id} and all associated data deleted."})
        except Document.DoesNotExist:
            return Response({"error": "Document not found."}, status=404)
        except Exception as e:
            logger.error(f"Error deleting document {doc_id}: {str(e)}")
            return Response({"error": f"Error deleting document: {str(e)}"}, status=500)

# -----------------------------------------------------------------
#  YOUR FUNCTION-BASED VIEWS (RAG CHAT + INTERCEPTOR)
# -----------------------------------------------------------------

# Handle Q&A with RAG implementation
@api_view(['POST'])
def ask_question(request):
    try:
        document_id = int(request.data.get("document_id"))
        question = request.data.get("question")
        
        if not question or not question.strip():
            return Response({"error": "Question cannot be empty"}, status=400)
            
        logger.info(f"Processing question for document {document_id}: {question[:100]}...")
        
    except (TypeError, ValueError):
        return Response({"error": "Invalid or missing document_id/question"}, status=400)

    # Check if document exists in embeddings map
    if document_id not in doc_embeddings_map:
        logger.error(f"Document {document_id} embeddings not found in memory")
        return Response({"error": "Document embeddings not found in memory. Try re-uploading the document."}, status=500)

    try:
        # Get document data
        doc_data = doc_embeddings_map[document_id]
        chunks = doc_data.get("chunks", [])
        
        if not chunks:
            logger.error(f"No chunks found for document {document_id}")
            return Response({"error": "No content chunks found for this document."}, status=500)
        
        logger.info(f"Found {len(chunks)} chunks for document {document_id}")
        
        # Generate question embedding
        question_embedding = model.encode(question)
        question_embedding = np.array([question_embedding]).astype("float32")
        
        # Search for similar chunks
        k = min(5, len(chunks))  # Don't search for more chunks than available
        D, I = index.search(question_embedding, k=k)
        
        # Get matched chunks and their indices
        matched_chunks = []
        highlight_indexes = []
        
        for i, (distance, chunk_idx) in enumerate(zip(D[0], I[0])):
            if chunk_idx < len(chunks) and distance < 1.5:  # Distance threshold
                matched_chunks.append(chunks[chunk_idx])
                highlight_indexes.append(int(chunk_idx))  # Convert to int for JSON serialization
                logger.info(f"Match {i+1}: chunk {chunk_idx}, distance: {distance:.4f}")
        
        if not matched_chunks:
            logger.warning(f"No relevant chunks found for question: {question[:50]}...")
            # Fallback to first few chunks
            matched_chunks = chunks[:3]
            highlight_indexes = [0, 1, 2] if len(chunks) >= 3 else list(range(len(chunks)))
        
        # Prepare context from matched chunks
        context = "\n\n".join([f"Chunk {i+1}:\n{chunk}" for i, chunk in enumerate(matched_chunks)])
        
        # Create improved prompt
        prompt = f"""You are an AI assistant helping users understand a document. Use the provided context to answer the question accurately and concisely.

Context from the document:
{context}

Question: {question}

Instructions:
- Base your answer primarily on the provided context
- If the context doesn't contain enough information, clearly state what information is missing
- Be specific and cite relevant parts of the context when possible
- Keep your answer focused and relevant to the question
- Provide a detailed and helpful answer

Answer:"""

        logger.info(f"Sending request to local LLM with context length: {len(context)}")
        
        # --- Get response from local LLM ---
        try:
            answer = call_local_llm(prompt)
            logger.info(f"Generated answer length: {len(answer)}")
        except Exception as e:
            logger.error(f"Local LLM error in ask_question: {str(e)}")
            return Response({"error": f"LLM Error: {str(e)}"}, status=500)

        # Create or get chat session and save message
        session_id = request.data.get("session_id")
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, document_id=document_id)
            except ChatSession.DoesNotExist:
                session = ChatSession.objects.create(document_id=document_id)
        else:
            session = ChatSession.objects.create(document_id=document_id)

        # Save the chat message
        ChatMessage.objects.create(
            session=session,
            question=question,  
            answer=answer
        )

        return Response({
            "answer": answer,
            "session_id": session.id,
            "highlight_indexes": highlight_indexes,  # Include highlight indexes
            "chunks_used": len(matched_chunks)
        })

    except Exception as e:
        logger.error(f"Unexpected error in ask_question: {str(e)}")
        return Response({"error": f"Unexpected error: {str(e)}"}, status=500)

# Retrieve chat session details with messages
class ChatSessionDetailView(RetrieveAPIView):
    queryset = ChatSession.objects.all()
    serializer_class = ChatSessionSerializer

# List chunks for a specific document
class DocumentChunkListView(ListAPIView):
    serializer_class = DocumentChunkSerializer

    def get_queryset(self):
        doc_id = self.kwargs.get("document_id")
        return DocumentChunk.objects.filter(document_id=doc_id).order_by('chunk_index')


# Get chat history for a document
@api_view(['GET'])
def chat_history(request, document_id):
    try:
        sessions = ChatSession.objects.filter(document_id=document_id).order_by('-created_at')
        data = []
        for session in sessions:
            messages_data = []
            for msg in session.messages.all().order_by('created_at'):
                messages_data.append({
                    "question": msg.question,
                    "answer": msg.answer,
                    "created_at": msg.created_at
                })
            
            data.append({
                "session_id": session.id,
                "created_at": session.created_at,
                "messages": messages_data
            })
        
        logger.info(f"Retrieved {len(data)} chat sessions for document {document_id}")
        return Response(data)
    except Exception as e:
        logger.error(f"Error retrieving chat history for document {document_id}: {str(e)}")
        return Response({"error": f"Error retrieving chat history: {str(e)}"}, status=500)

# -----------------------------------------------------------------
#  THE "ENGINE": YOUR NEW ML-POWERED "INTERCEPTOR"
# -----------------------------------------------------------------

# ─────────────────────────────────────────────────────────────────────────────
#  ML ENGINE: Load the trained Logistic severity classifier at server start
#  The pkl is a dict: { "model": XGBClassifier, "label_encoder": LabelEncoder }
# ────────────────────────────────────────────────────────────────────────────
ML_BUNDLE = None
ML_MODEL  = None
ML_ENCODER = None

try:
    _pkl_path = os.path.join(settings.BASE_DIR, 'risk_classifier2.pkl')
    ML_BUNDLE = joblib.load(_pkl_path)
    # Support both old bare-classifier pkl and new dict-bundle pkl 
    if isinstance(ML_BUNDLE, dict):
        ML_MODEL   = ML_BUNDLE["model"]
        ML_ENCODER = ML_BUNDLE["label_encoder"]
    else:
        # Legacy binary classifier — treat as model only, no encoder
        ML_MODEL = ML_BUNDLE
        ML_ENCODER = None
    logger.info("--- [ML Engine] Successfully loaded risk_classifier.pkl ---")
except Exception as e:
    logger.error(f"--- [ML Engine ERROR] Could not load ML model: {e}. Did you run train_classifier.py? ---")

@api_view(['POST'])
def analyze_risk_by_id(request, document_id):
    """
    ML-Powered Severity Analyser:
    1. Chunks the document.
    2. Embeds each chunk (with Clause_Type prefix) via LegalBERT and runs the
       Logistic multiclass classifier to predict severity: Safe / Low / Medium / High.
    3. Passes non-Safe chunks to the local LLM for structured JSON reports.
    4. Returns a severity-grouped JSON response.
    """
    if ML_MODEL is None:
        return JsonResponse(
            {'error': 'ML model not loaded. Please run train_classifier.py first.'},
            status=500
        )

    # Severity ordering for sorting (lower index = more severe)
    SEVERITY_ORDER = {'High': 0, 'Medium': 1, 'Low': 2, 'Safe': 3}
    RISKY_SEVERITIES = {'Low', 'Medium', 'High'}

    try:
        document = get_object_or_404(Document, pk=document_id)

        if not document.file or not document.file.path:
            return JsonResponse({'error': 'File not found for this document.'}, status=404)

        logger.info(f"--- [ML Interceptor] Extracting text from: {document.file.path} ---")
        loan_text = extract_text(document)
        if not loan_text or len(loan_text) < 50:
            return JsonResponse({'error': 'Could not extract sufficient text.'}, status=500)

        # ── Step 1: Chunk the document ──────────────────────────────────────
        # The ML model was trained on individual clauses (typically 20-50 words).
        # A 150-word chunk dilutes risky signals with safe text. We use smaller chunks.
        clean_text = re.sub(r'\s+', ' ', loan_text).strip()
        
        # Try to split by numbered clauses e.g., "1. ", "2. "
        chunks = [c.strip() for c in re.split(r'\s+(?=\d+\.\s)', clean_text) if len(c.strip().split()) > 3]
        
        # Fallback to smaller word chunks if no numbered clauses found
        if len(chunks) < 2:
            chunks = chunk_text(clean_text, chunk_size=45, overlap=15)
            
        logger.info(f"--- [ML Interceptor] Embedding {len(chunks)} chunks... ---")

        # ── Step 2: Embed with the same prefix format used during training ──
        # Training used "Clause_Type [SEP] Clause_Text"; at inference we don't
        # know the clause type, so we use 'Unknown' as the prefix (matching train script).
        prefixed_chunks = [f"Unknown [SEP] {chunk}" for chunk in chunks]
        chunk_embeddings = model.encode(prefixed_chunks)
        chunk_embeddings = np.nan_to_num(chunk_embeddings, nan=0.0, posinf=0.0, neginf=0.0)

        # ── Step 3: Predict severity for every chunk ──────────────────────── 
        raw_preds = ML_MODEL.predict(chunk_embeddings)   # integer labels

        # Decode to string labels when an encoder is available
        if ML_ENCODER is not None:
            pred_labels = ML_ENCODER.inverse_transform(raw_preds)
        else:
            # Legacy binary model: 0 = Safe, 1 = Predatory (mapped to High)
            pred_labels = ['High' if p == 1 else 'Safe' for p in raw_preds]

        logger.info(f"--- [ML Interceptor] Predicted labels: {pred_labels} ---")
        for i, (chunk, label) in enumerate(zip(chunks, pred_labels)):
            logger.info(f"Chunk {i} [{label}]: {chunk[:100]}...")

        # ── Step 4: Collect non-Safe chunks grouped by severity ─────────────
        flagged = []   # list of (chunk_text, severity_label)
        for chunk, label in zip(chunks, pred_labels):
            if label in RISKY_SEVERITIES:
                flagged.append((chunk, label))
                logger.info(f"--- [ML Interceptor] Severity '{label}' detected ---")

        if not flagged:
            return JsonResponse({
                'summary': {
                    'total_chunks_analysed': len(chunks),
                    'flagged_chunks': 0,
                    'severity_counts': {'Safe': len(chunks), 'Low': 0, 'Medium': 0, 'High': 0},
                },
                'report': [
                    {
                        'found': False,
                        'severity': 'Safe',
                        'risk_name': 'General Check',
                        'analysis': 'The ML model analysed the document and found no risky clauses.',
                    }
                ],
            })

        # ── Step 5: LLM enrichment for each flagged chunk ───────────────────
        final_report = []
        seen_texts = set()   # deduplicate overlapping chunks

        for flagged_text, severity in sorted(flagged, key=lambda x: SEVERITY_ORDER.get(x[1], 99)):
            if flagged_text in seen_texts:
                continue
            seen_texts.add(flagged_text)

            prompt = f"""
You are a legal auditor specialising in home-loan contract review.
Our ML model classified the following clause as **{severity} severity**.

**Clause Text:**
---
{flagged_text}
---

**Instructions:**
- Identify the specific risk type (e.g. "Prepayment Penalty", "Uncapped Liability", "Exclusivity").
- Quote the single most problematic sentence.
- Write one concise sentence explaining why it is risky at {severity} severity.

**Respond in strict JSON only:**
{{
  "found": true,
  "severity": "{severity}",
  "risk_name": "<risk type>",
  "clause_text": "<most problematic quoted sentence>",
  "analysis": "<one-sentence explanation>"
}}
"""
            try:
                response_text = call_local_llm(prompt)
                match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if match:
                    result_json = json.loads(match.group(0))
                    # Ensure severity from model is authoritative (not LLM hallucination)
                    result_json['severity'] = severity
                    final_report.append(result_json)
            except Exception as e:
                logger.error(f"--- [ERROR] LLM enrichment failed for chunk: {e} ---")
                # Still include raw ML finding even if LLM fails
                final_report.append({
                    'found': True,
                    'severity': severity,
                    'risk_name': 'Unclassified Risk',
                    'clause_text': flagged_text[:500],
                    'analysis': f'ML model flagged this as {severity} severity. LLM explanation unavailable.',
                })

        # ── Step 6: Build summary statistics ────────────────────────────────
        severity_counts = {'Safe': 0, 'Low': 0, 'Medium': 0, 'High': 0}
        for label in pred_labels:
            severity_counts[label] = severity_counts.get(label, 0) + 1

        return JsonResponse({
            'summary': {
                'total_chunks_analysed': len(chunks),
                'flagged_chunks': len(final_report),
                'severity_counts': severity_counts,
            },
            'report': final_report,
        })

    except Document.DoesNotExist:
        return JsonResponse({'error': 'Document not found.'}, status=404)
    except Exception as e:
        logger.error(f"--- [ERROR] ML Analysis failed: {e} ---")
        return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)
