import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

// ChatInterface: A component for handling document-based Q&A interactions
// Props:
// - documentId: ID of the current document
// - messages: Array of chat messages
// - onSendMessage: Callback for sending new messages
// - loading: Boolean indicating if a response is being processed
const ChatInterface = ({ documentId, messages, onSendMessage, loading }) => {
  // State for managing user input
  const [question, setQuestion] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle message submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      onSendMessage(question);
      setQuestion('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/40 dark:bg-slate-900/40 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,transparent,black)] pointer-events-none"></div>
      
      {/* Chat messages container with scroll */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-legal relative z-10">
        {messages.length === 0 ? (
          // Empty state with suggestions
          <div className="h-full flex flex-col items-center justify-center text-center animate-fade-up">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-sky-100 dark:from-indigo-900/30 dark:to-sky-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm border border-indigo-200/50 dark:border-indigo-700/50 ring-8 ring-white/50 dark:ring-slate-900/50">
              <Bot className="h-12 w-12 text-indigo-500 dark:text-sky-400 drop-shadow-md" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Legal AI Assistant</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm leading-relaxed">
              I can analyze this document, extract key clauses, and answer any legal questions you might have.
            </p>
          </div>
        ) : (
          // Message list with user/bot styling
          messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`} style={{ animationDelay: `${index * 50}ms` }}>
              <div className={`flex max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-4' : 'mr-4'} mt-1`}>
                  {message.type === 'user' ? (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-md">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-md border border-slate-200 dark:border-slate-700">
                      <Bot className="w-5 h-5 text-indigo-600 dark:text-sky-400" />
                    </div>
                  )}
                </div>
                {/* Message bubble */}
                <div className={`px-6 py-4 rounded-3xl shadow-sm ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-br from-indigo-600 to-sky-600 text-white rounded-tr-sm' 
                    : 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                }`}>
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  {message.timestamp && (
                    <p className={`text-xs mt-3 flex items-center ${
                      message.type === 'user' ? 'text-indigo-100/70' : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start animate-fade-up">
            <div className="flex mr-4 mt-1 shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-md border border-slate-200 dark:border-slate-700">
                <Bot className="w-5 h-5 text-indigo-600 dark:text-sky-400" />
              </div>
            </div>
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 px-6 py-5 rounded-3xl rounded-tl-sm shadow-sm flex flex-col items-start min-w-[120px]">
              <div className="flex space-x-2.5 items-center justify-center flex-1 w-full">
                <div className="w-2.5 h-2.5 bg-indigo-500 dark:bg-sky-400 rounded-full animate-bounce"></div>
                <div className="w-2.5 h-2.5 bg-indigo-500 dark:bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2.5 h-2.5 bg-indigo-500 dark:bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-2 font-bold w-full text-center">Thinking</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <div className="p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 relative z-20">
        <form onSubmit={handleSubmit} className="flex space-x-4 max-w-5xl mx-auto">
          <div className="relative flex-1 group">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about this document..."
              className="input-premium pl-6 pr-12 w-full py-4 text-base shadow-sm"
              disabled={loading}
            />
            {question.trim() && (
              <button
                type="submit"
                disabled={loading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors rounded-xl disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;