from django.urls import path
# Import 'views' module itself, or add 'analyze_document_risks' to the list
from . import views 
from .views import (
    DocumentUploadView,
    DocumentListView, 
    DocumentDetailView, 
    DocumentDeleteView, 
    ChatSessionDetailView, 
    DocumentChunkListView,
    ask_question, 
    chat_history
)
from django.views.decorators.csrf import csrf_protect
from django.http import JsonResponse

# CSRF protection views
@csrf_protect
def csrf_token_view(request):
    return JsonResponse({'message': 'CSRF cookie set'})

@csrf_protect
def csrf_cookie_view(request):
    return JsonResponse({'message': 'CSRF cookie set'})

# URL patterns for document management and chat functionality
urlpatterns = [ 
    # Document operations
    path('upload/', DocumentUploadView.as_view(), name='upload-document'),
    path('documents/', DocumentListView.as_view(), name='document-list'),
    path('documents/<int:pk>/', DocumentDetailView.as_view(), name='document-detail'),
    path('documents/<int:pk>/delete/', DocumentDeleteView.as_view(), name='document-delete'),
    path('documents/<int:document_id>/chunks/', DocumentChunkListView.as_view(), name='document-chunks'),
    
    # --- YOUR NEW DEMO ENDPOINT ---
    # This line now works because we imported 'views'
    path('analyze-risks/', views.analyze_document_risks, name='analyze-risks'),
    
    # Chat functionality
    path('ask/', ask_question, name='ask-question'),
    path('sessions/<int:pk>/', ChatSessionDetailView.as_view(), name='chat-session-detail'),
    path('documents/<int:document_id>/chat-history/', chat_history, name='chat-history'),
    
    # Security
    path("api/csrf/", csrf_cookie_view),
    path('csrf/', csrf_token_view),
]