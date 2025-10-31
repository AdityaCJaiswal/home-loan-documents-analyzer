import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  FileText, 
  MessageSquare, 
  Loader2, 
  Maximize2, 
  Minimize2,
  Copy,
  CheckCircle,
  User,
  Bot,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Scale
} from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

const RiskReportPanel = ({ documentId }) => {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAnalysis = async () => {
    setIsLoading(true);
    setReport(null);
    setError(null);

    try {
      const response = await axios.post(
        `http://localhost:8000/api/document/${documentId}/analyze-risk/`,
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': Cookies.get('csrftoken'),
          },
        }
      );
      setReport(response.data.report);
    } catch (err) {
      console.error('Error running risk analysis:', err);
      setError(err.response?.data?.error || 'Failed to run analysis. Check server logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const foundRisks = report?.filter(r => r.found) || [];
  const passedRisks = report?.filter(r => !r.found) || [];

  return (
    <div className="p-6 h-full flex flex-col overflow-y-auto scrollbar-legal">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-blue-800 mb-2 flex items-center">
          <ShieldAlert className="h-6 w-6 mr-2" />
          Risk Interceptor Report
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Professional risk analysis powered by our curated legal knowledge base. 
          Identifies predatory clauses and potential legal issues in your document.
        </p>
      </div>
      
      {!report && !isLoading && !error && (
        <button
          onClick={runAnalysis}
          className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
        >
          <ShieldAlert className="h-6 w-6" />
          <span>Run Comprehensive Risk Analysis</span>
        </button>
      )}

      {isLoading && (
        <div className="text-center py-16 flex flex-col items-center">
          <div className="relative">
            <div className="spinner-legal h-16 w-16 mb-6"></div>
          </div>
          <p className="text-xl font-semibold text-blue-800 mb-2">
            Analyzing Document...
          </p>
          <p className="text-gray-600">
            Our AI is carefully reviewing your document against our legal knowledge base
          </p>
        </div>
      )}

      {error && (
        <div className="p-5 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 mb-1">Analysis Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {report && (
        <div className="space-y-8 animate-fade-in-scale">
          {/* Critical Risks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-red-700 flex items-center space-x-2">
                <ShieldAlert className="h-7 w-7" />
                <span>Critical Risks Detected</span>
              </h3>
              <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full font-bold text-lg border-2 border-red-200">
                {foundRisks.length}
              </span>
            </div>
            
            {foundRisks.length > 0 ? (
              <div className="space-y-4">
                {foundRisks.map((risk, index) => (
                  <div key={index} className="group relative bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-600 p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <strong className="text-lg text-red-900 font-bold flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        {risk.risk_name}
                      </strong>
                      <span className="badge-risk-critical">HIGH RISK</span>
                    </div>
                    <div className="space-y-3 pl-7">
                      <div className="bg-white/70 p-3 rounded border border-red-200">
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Clause Identified:</p>
                        <p className="text-sm text-red-800 italic">"{risk.clause_text}"</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Analysis:</p>
                        <p className="text-sm text-red-800 leading-relaxed">{risk.analysis}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-lg">
                <p className="text-green-800 font-medium flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  No critical risks identified in this document
                </p>
              </div>
            )}
          </div>

          {/* Passed Checks Section */}
          <div className="space-y-3 bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-green-800 flex items-center space-x-2">
                <ShieldCheck className="h-6 w-6" />
                <span>Compliance Checks Passed</span>
              </h3>
              <span className="px-4 py-2 bg-green-200 text-green-900 rounded-full font-bold text-lg border-2 border-green-300">
                {passedRisks.length}
              </span>
            </div>
            
            {passedRisks.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {passedRisks.map((risk, index) => (
                  <li key={index} className="flex items-center space-x-2 bg-white/70 p-3 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-green-900 font-medium">{risk.risk_name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-green-700 text-sm">No compliance checks were performed on this document.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function EnhancedChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const docId = new URLSearchParams(location.search).get('doc');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const [mode, setMode] = useState('chat');
  const [document, setDocument] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [highlightIndexes, setHighlightIndexes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [error, setError] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (mode === 'chat') {
      scrollToBottom();
    }
  }, [messages, mode]);

  useEffect(() => {
    if (!docId) {
      navigate('/library');
      return;
    }

    const loadDocumentData = async () => {
      try {
        setDocumentLoading(true);
        setError(null);

        const docResponse = await axios.get(`http://localhost:8000/api/documents/${docId}/`);
        setDocument(docResponse.data);

        const chunksResponse = await axios.get(`http://localhost:8000/api/documents/${docId}/chunks/`);
        setChunks(chunksResponse.data.map(c => c.content));

        const historyResponse = await axios.get(`http://localhost:8000/api/documents/${docId}/chat-history/`);
        if (historyResponse.data.length > 0) {
          const latestSession = historyResponse.data[0];
          setSessionId(latestSession.session_id);
          const loadedMessages = latestSession.messages.flatMap((msg, index) => [
            { 
              id: `q-${index}`,
              user: true, 
              text: msg.question,
              timestamp: new Date(msg.created_at || Date.now())
            },
            { 
              id: `a-${index}`,
              user: false, 
              text: msg.answer,
              timestamp: new Date(msg.created_at || Date.now())
            }
          ]);
          setMessages(loadedMessages);
        }
      } catch (err) {
        console.error('Failed to load document data:', err);
        setError('Failed to load document. Please try again.');
      } finally {
        setDocumentLoading(false);
      }
    };

    loadDocumentData();
  }, [docId, navigate]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { 
      id: `user-${Date.now()}`,
      user: true, 
      text: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8000/api/ask/', {
        document_id: parseInt(docId),
        question: currentInput,    
        session_id: sessionId
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': Cookies.get('csrftoken'),
        },
      });

      const botMessage = { 
        id: `bot-${Date.now()}`,    
        user: false, 
        text: response.data.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setSessionId(response.data.session_id);

      if (response.data.highlight_indexes) {
        setHighlightIndexes(response.data.highlight_indexes);
      }

    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = { 
        id: `error-${Date.now()}`,
        user: false, 
        text: "I apologize, but I encountered an error while analyzing your question. Please try again.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setError('Failed to get response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (documentLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-white shadow-xl rounded-2xl flex items-center justify-center h-[90vh]">
        <div className="text-center">
          <div className="spinner-legal h-12 w-12 mx-auto mb-6"></div>
          <p className="text-xl font-semibold text-[#1e3a5f]">Loading Document...</p>
          <p className="text-gray-600 mt-2">Preparing your legal analysis platform</p>
        </div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-white shadow-xl rounded-2xl flex items-center justify-center h-[90vh]">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/library')}
            className="btn-legal-primary"
          >
            Return to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 bg-white shadow-2xl rounded-2xl flex flex-col h-[95vh] border-2 border-gray-200">
      {/* Professional Header */}
      <div className="flex items-center justify-between mb-6 pb-5 border-b-2 border-gray-200">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/library')} 
            className="p-2 mr-3 text-gray-500 hover:text-blue-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] rounded-xl mr-3">
              <Scale className="text-white h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1e3a5f]">
                {document?.title || 'Loading...'}
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                Professional Legal Document Analysis Platform
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPreviewMaximized(!isPreviewMaximized)}
            className="p-2 text-gray-500 hover:text-blue-700 hover:bg-gray-100 rounded-full transition-colors"
            title={isPreviewMaximized ? "Restore layout" : "Maximize preview"}
          >
            {isPreviewMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden border-2 border-gray-200 rounded-xl">
        {/* Document Preview Panel */}
        <div className={`${isPreviewMaximized ? 'w-full' : 'w-1/2'} border-r-2 border-gray-200 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 transition-all duration-300 scrollbar-legal`}>
          <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-5 z-10 shadow-sm">
            <h3 className="text-xl font-bold text-blue-800 flex items-center">
              <FileText className="mr-2 text-cyan-600" size={22} />
              Document Content
            </h3>
            {highlightIndexes.length > 0 && mode === 'chat' && (
              <p className="text-sm text-cyan-700 font-medium mt-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                {highlightIndexes.length} relevant section{highlightIndexes.length !== 1 ? 's' : ''} highlighted
              </p>
            )}
          </div>
          
          <div className="p-6">
            {chunks.length > 0 ? (
              chunks.map((chunk, idx) => (
                <div
                  key={idx}
                  className={`mb-5 p-5 rounded-xl transition-all duration-300 ${
                    highlightIndexes.includes(idx) && mode === 'chat'
                      ? 'bg-yellow-50 border-l-4 border-yellow-500 shadow-lg transform scale-[1.01]'
                      : 'bg-white border border-gray-200 hover:shadow-md hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-serif">
                    {chunk}
                  </p>
                  {highlightIndexes.includes(idx) && mode === 'chat' && (
                    <div className="mt-3 flex items-center text-xs text-yellow-700 font-semibold">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Relevant to your query
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium">
                  No preview available for this document.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat or Risk Analysis */}
        <div className={`${isPreviewMaximized ? 'hidden' : 'w-1/2'} flex flex-col bg-white transition-all duration-300`}>
          
          {/* Tab Buttons */}
          <div className="flex border-b-2 border-gray-200 bg-gray-50">
            <button
              onClick={() => setMode('chat')}
              className={`flex-1 py-4 px-6 text-center font-semibold text-sm transition-all ${
                mode === 'chat' 
                  ? 'text-blue-700 border-b-4 border-blue-700 bg-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="h-5 w-5 mx-auto mb-1" />
              Legal Assistant
            </button>
            <button
              onClick={() => setMode('risk')}
              className={`flex-1 py-4 px-6 text-center font-semibold text-sm transition-all ${
                mode === 'risk' 
                  ? 'text-red-700 border-b-4 border-red-700 bg-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShieldAlert className="h-5 w-5 mx-auto mb-1" />
              Risk Analysis
            </button>
          </div>

          {/* Conditional Rendering */}
          {mode === 'chat' ? (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-legal">
                {messages.length === 0 && (
                  <div className="text-center py-16">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6">
                      <Bot className="h-10 w-10 text-blue-700" />
                    </div>
                    <p className="text-lg font-semibold text-blue-800 mb-2">
                      Professional Legal Assistant
                    </p>
                    <p className="text-sm text-gray-600 max-w-md mx-auto">
                      Ask questions about this document, request analysis, or explore specific clauses
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.user ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] group ${msg.user ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-center mb-2">
                        {msg.user ? (
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-blue-100 rounded-full">
                              <User className="h-4 w-4 text-blue-700" />
                            </div>
                            <span className="text-xs font-semibold text-gray-600">You</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className={`p-1.5 ${msg.isError ? 'bg-red-100' : 'bg-green-100'} rounded-full`}>
                              <Bot className={`h-4 w-4 ${msg.isError ? 'text-red-600' : 'text-green-700'}`} />
                            </div>
                            <span className="text-xs font-semibold text-gray-600">Legal AI</span>
                          </div>
                        )}
                        <span className="text-xs text-gray-500 ml-auto">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div
                        className={`p-4 rounded-xl shadow-md ${
                          msg.user
                            ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white'
                            : msg.isError
                            ? 'bg-red-50 text-red-800 border-2 border-red-200'
                            : 'bg-gray-100 text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed text-sm">
                          {msg.text}
                        </p>
                        
                        {!msg.user && (
                          <button
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-600 hover:text-gray-900 flex items-center font-medium"
                          >
                            {copiedMessageId === msg.id ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 border border-gray-200 p-4 rounded-xl flex items-center shadow-md">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-700 mr-3" />
                      <span className="text-sm text-gray-700 font-medium">
                        Analyzing document...
                      </span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-sm text-red-800 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {error}
                  </div>
                )}
                
                <div className="flex gap-3">
                  <textarea
                    ref={inputRef}
                    className="flex-1 p-4 border-2 border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all bg-white"
                    placeholder="Ask about specific clauses, terms, or legal implications..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    rows={2}
                    disabled={loading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="px-8 py-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-xl hover:from-blue-800 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center min-w-[70px] font-semibold"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-3 text-xs text-gray-500 font-medium">
                  <span>Press Enter to send • Shift+Enter for new line</span>
                  <span className={input.length > 900 ? 'text-amber-600' : ''}>{input.length}/1000</span>
                </div>
              </div>
            </>
          ) : (
            <RiskReportPanel documentId={docId} />
          )}
        </div>
      </div>
    </div>
  );
}