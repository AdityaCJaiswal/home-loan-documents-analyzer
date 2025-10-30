from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.decorators import api_view
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.generics import DestroyAPIView, RetrieveAPIView, ListAPIView
from .models import Document, Chunk, ChatSession, ChatMessage, DocumentChunk
from .rag_utils import process_document, doc_embeddings_map, model, index
from .serializers import ChatSessionSerializer, DocumentChunkSerializer, DocumentSerializer
import numpy as np
import os
import requests
from django.views.decorators.csrf import ensure_csrf_cookie
import logging
import google.generativeai as genai

import json
import re
import functools
from django.http import JsonResponse
from django.conf import settings

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.0-flash")


logger = logging.getLogger(__name__)

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

        logger.info(f"Sending request to LM Studio with context length: {len(context)}")
        
        # Get response from LM Studio
        try:
            response = gemini_model.generate_content(prompt)
            answer = response.text.strip()
            logger.info(f"Generated answer length: {len(answer)}")
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return Response({"error": f"Gemini API error: {str(e)}"}, status=500)

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

    except requests.exceptions.RequestException as e:
        logger.error(f"LM Studio connection error: {str(e)}")
        return Response({"error": f"Cannot connect to LM Studio. Please ensure it's running on localhost:1234. Error: {str(e)}"}, status=500)
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

@functools.lru_cache(maxsize=None)
def load_risk_knowledge_base():
    """
    Parses your risks.md file into a list of risk objects.
    This is cached, so it only runs once.
    """
    logger.info("--- [Risk DB] Loading knowledge base... ---")
    risks = []
    
    # Path to your risks.md file. Assumes it's in the Django project root
    file_path = str(settings.BASE_DIR / 'risks.md') 
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split the file by "# Risk:"
        risk_blocks = re.split(r'\n# Risk:\s*', content)
        
        for block in risk_blocks:
            if not block.strip():
                continue
            
            lines = block.strip().split('\n')
            risk_name = lines[0].strip()
            
            risk_obj = {"name": risk_name}
            
            for line in lines[1:]:
                if line.startswith('- **Description:**'):
                    risk_obj['description'] = line.split('**', 2)[-1].strip()
                elif line.startswith('- **Why it\'s harmful:**'):
                    risk_obj['harmful'] = line.split('**', 2)[-1].strip()
                elif line.startswith('- **Keywords to find:**'):
                    risk_obj['keywords'] = line.split('**', 2)[-1].strip()
            
            if 'name' in risk_obj and 'description' in risk_obj:
                risks.append(risk_obj)
                
    except FileNotFoundError:
        logger.error(f"--- [ERROR] risks.md not found at {file_path} ---")
        return []
    except Exception as e:
        logger.error(f"--- [ERROR] Failed to parse risks.md: {e} ---")
        return []

    logger.info(f"--- [Risk DB] Loaded {len(risks)} risks. ---")
    return risks

# -----------------------------------------------------------------
#  THE "ENGINE": YOUR NEW "INTERCEPTOR" API ENDPOINT
# -----------------------------------------------------------------
@api_view(['POST'])
def analyze_document_risks(request):
    """
    This is your new API view for the Risk Interceptor demo.
    It takes raw text, not a document_id.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

    # 1. Get the loan text from React
    try:
        loan_text = request.data.get('text')
        if not loan_text:
            return JsonResponse({'error': 'No text provided'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Invalid request body: {str(e)}'}, status=400)

    # 2. Load the "brain" (will be instant, from cache)
    risks = load_risk_knowledge_base()
    if not risks:
        return JsonResponse({'error': 'Risk knowledge base is empty or failed to load.'}, status=500)

    final_report = []

    # 3. This is the INTERCEPTOR LOOP
    for risk in risks:
        # 4. Craft the specific prompt for this one risk
        prompt = f"""
You are a senior loan analysis expert. Your task is to find one specific risk in the provided loan agreement.

**The Risk to Find:** {risk['name']}
**Definition of this Risk:** {risk.get('description', 'N/A')}
**Why it's Harmful:** {risk.get('harmful', 'N/A')}
**Keywords to look for:** {risk.get('keywords', 'N/A')}

**The Loan Agreement:**
---
{loan_text}
---

**Your Task:**
1. Read the entire Loan Agreement.
2. Determine if a clause matching the **Risk to Find** exists.
3. If it **DOES NOT** exist, respond with: {{"found": false, "risk_name": "{risk['name']}"}}
4. If it **DOES** exist, respond with a JSON object containing:
    * "found": true
    * "risk_name": "{risk['name']}"
    * "clause_text": "[The EXACT quote from the agreement, word-for-word]"
    * "analysis": "[A brief, simple explanation of why this specific clause is the risk, using the provided definition]"

**Respond ONLY with the JSON object and nothing else.**
"""

        # 5. Call the LLM (using YOUR configured Gemini model)
        try:
            logger.info(f"--- [Interceptor] Sending prompt for risk: {risk['name']} ---")
            response = gemini_model.generate_content(prompt)
            response_text = response.text.strip()

            # 6. [CRITICAL STEP] Parse the LLM's JSON response
            # LLMs love to add markdown or other text. We must extract *only* the JSON.
            match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if not match:
                # If no JSON object is found, log it and report as not found
                logger.warning(f"--- [WARN] No JSON object found in response for {risk['name']}. Response: {response_text}")
                raise json.JSONDecodeError("No JSON object found in LLM response", response_text, 0)
            
            json_string = match.group(0)
            result_json = json.loads(json_string)
            final_report.append(result_json)

        except json.JSONDecodeError:
            logger.error(f"--- [ERROR] LLM returned invalid JSON for risk: {risk['name']} ---")
            logger.error(f"Raw Response was: {response_text}")
            final_report.append({"found": False, "risk_name": risk['name'], "error": "AI response was not valid JSON."})
        except Exception as e:
            logger.error(f"--- [ERROR] Gemini call failed for risk {risk['name']}: {e} ---")
            final_report.append({"found": False, "risk_name": risk['name'], "error": str(e)})

    # 7. Send the full report back to React
    return JsonResponse({'report': final_report})

# -----------------------------------------------------------------
# --- [NEW CODE END] ---
# -----------------------------------------------------------------


# -----------------------------------------------------------------
# [NO CHANGE] YOUR EXISTING VIEWS ARE FINE
# -----------------------------------------------------------------

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