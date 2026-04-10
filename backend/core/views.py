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

# Load the trained ML model once when the Django server starts
try:
    # Ensure this matches the exact name of the file generated by train_classifier.py
    ML_CLASSIFIER = joblib.load(os.path.join(settings.BASE_DIR, 'risk_classifier.pkl'))
    logger.info("--- [ML Engine] Successfully loaded risk_classifier.pkl ---")
except Exception as e:
    logger.error(f"--- [ML Engine ERROR] Could not load ML model: {e}. Did you run train_classifier.py? ---")
    ML_CLASSIFIER = None

@api_view(['POST'])
def analyze_risk_by_id(request, document_id):
    """
    ML-Powered Interceptor: 
    1. Chunks the document.
    2. Embeds chunks and runs them through the trained Scikit-Learn model.
    3. If flagged as predatory, uses Gemini to generate the structured report.
    """
    if ML_CLASSIFIER is None:
        return JsonResponse({'error': 'Machine Learning model not trained. Please run train_classifier.py first.'}, status=500)

    try:
        document = get_object_or_404(Document, pk=document_id)
        
        if not document.file or not document.file.path:
            return JsonResponse({'error': 'File not found for this document.'}, status=404)
        
        logger.info(f"--- [ML Interceptor] Extracting text from: {document.file.path} ---")
        loan_text = extract_text(document)
        if not loan_text or len(loan_text) < 50:
            return JsonResponse({'error': 'Could not extract sufficient text.'}, status=500)

        # Step 1: Chunk the text so the ML model can analyze specific clauses
        # Using 150 words per chunk ensures we capture full sentences/clauses accurately
        chunks = chunk_text(loan_text, chunk_size=150, overlap=30)
        
        # Step 2: Generate embeddings for all chunks using your existing RAG model
        logger.info(f"--- [ML Interceptor] Embedding {len(chunks)} chunks... ---")
        chunk_embeddings = model.encode(chunks)
        
        # SAFETY NET: Convert any rogue NaN values from PDF formatting into 0s
        import numpy as np
        chunk_embeddings = np.nan_to_num(chunk_embeddings)
        
        # Step 3: Let the autonomous ML model predict risks (0 = Safe, 1 = Predatory)
        predictions = ML_CLASSIFIER.predict(chunk_embeddings)
        
        final_report = []
        flagged_chunks = []

        for i, pred in enumerate(predictions):
            if pred == 1: # The ML model flagged this chunk autonomously!
                flagged_chunks.append(chunks[i])
                logger.info(f"--- [ML Interceptor] Predatory clause detected in chunk {i} ---")

        if not flagged_chunks:
             return JsonResponse({'report': [{"found": False, "risk_name": "General Check", "analysis": "The ML model analyzed the document and found no predatory clauses."}]})

        # Step 4: Pass ONLY the flagged chunks to Gemini to format the final JSON report
        for flagged_text in flagged_chunks:
            prompt = f"""
            You are a legal auditor. Our Machine Learning model has flagged the following text as a potentially predatory or risky clause.

            **Flagged Text:**
            ---
            {flagged_text}
            ---

            **Instructions:**
            Identify exactly what kind of risk this is (e.g., "Prepayment Penalty", "Arbitrary Rate Increase").
            Extract the exact clause text, and write a brief 1-sentence analysis of why it's bad.
            
            **JSON Response Template (Strict JSON only):**
            {{
              "found": true,
              "risk_name": "<Identify the risk name>",
              "clause_text": "<quote the exact problematic text>",
              "analysis": "<brief analysis>"
            }}
            """
            
            try:
                response_text = call_local_llm(prompt)
                
                # Extract JSON safely
                match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if match:
                    result_json = json.loads(match.group(0))
                    final_report.append(result_json)
            except Exception as e:
                logger.error(f"--- [ERROR] Local LLM extraction failed for a flagged chunk: {e} ---")
                
        # Deduplicate: If the ML model flagged overlapping chunks with the same issue, keep only one
        unique_report = list({v['clause_text']:v for v in final_report if 'clause_text' in v}.values())
        
        return JsonResponse({'report': unique_report})

    except Document.DoesNotExist:
        return JsonResponse({'error': 'Document not found.'}, status=404)
    except Exception as e:
        logger.error(f"--- [ERROR] ML Analysis failed: {e} ---")
        return JsonResponse({'error': f'An error occurred: {str(e)}'}, status=500)