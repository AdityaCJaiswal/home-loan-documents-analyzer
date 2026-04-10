import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Hash, ExternalLink } from 'lucide-react';
import ChatInterface from '../components/ChatInterface';
import LoadingSpinner from '../components/LoadingSpinner';
import { documentAPI } from '../services/api';
import { useChat } from '../hooks/useChat';

const DocumentChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { messages, sendMessage, loading: chatLoading } = useChat(id);

  useEffect(() => {
    loadDocument();
  }, [id]);

  const loadDocument = async () => {
    try {
      const response = await documentAPI.getDocument(id);
      setDocument(response.data);
    } catch (err) {
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner text="Loading document..." />;
  }

  if (error || !document) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Document not found
        </h3>
        <p className="text-gray-600 mb-6">
          The document you're looking for doesn't exist or has been removed.
        </p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6 mt-4 mb-8">
      {/* Document Info Sidebar */}
      <div className="w-80 glass-panel rounded-3xl p-6 flex flex-col h-full animate-fade-up shrink-0">
        <div className="flex items-center space-x-3 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white/50 dark:bg-slate-800/50 rounded-xl hover:shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">File Details</h2>
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto pr-2 scrollbar-legal">
          {/* Document Title */}
          <div>
            <div className="flex items-start space-x-4 mb-4 p-4 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              <div className="p-2.5 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-xl shadow-md shrink-0 mt-1">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                  {document.title || document.filename}
                </h3>
                <span className="badge-glass-safe mt-2 inline-block">
                  {document.file_type?.toUpperCase() || 'PDF'}
                </span>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-4 px-2">
            <div className="flex items-center space-x-4 text-sm group">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform">
                <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Uploaded</p>
                <p className="text-slate-900 dark:text-slate-200 font-medium">{formatDate(document.uploaded_at)}</p>
              </div>
            </div>

            {document.pages && (
              <div className="flex items-center space-x-4 text-sm group">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform">
                  <Hash className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pages</p>
                  <p className="text-slate-900 dark:text-slate-200 font-medium">{document.pages}</p>
                </div>
              </div>
            )}

            {document.file_size && (
              <div className="flex items-center space-x-4 text-sm group">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform">
                  <ExternalLink className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Size</p>
                  <p className="text-slate-900 dark:text-slate-200 font-medium">
                    {(document.file_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Example Questions */}
          <div className="pt-8 border-t border-slate-200/50 dark:border-slate-700/50 px-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Ask AI Assistant</h4>
            <div className="space-y-2.5">
              {[
                "Analyze the key terms in this document.",
                "Summarize the main obligations.",
                "Are there any penalty clauses?",
                "Identify termination conditions.",
              ].map((question, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(question)}
                  className="w-full text-left p-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white/40 dark:bg-slate-800/40 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:text-sky-700 dark:hover:text-sky-400 rounded-xl border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 shadow-sm disabled:opacity-50"
                  disabled={chatLoading}
                >
                  "{question}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 glass-panel rounded-3xl overflow-hidden shadow-xl animate-fade-up flex flex-col delay-75 h-full">
        <ChatInterface
          documentId={id}
          messages={messages}
          onSendMessage={sendMessage}
          loading={chatLoading}
        />
      </div>
    </div>
  );
};

export default DocumentChat;