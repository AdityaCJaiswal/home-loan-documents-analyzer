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
    <div className="p-8 h-full flex flex-col overflow-y-auto scrollbar-legal bg-white/40 dark:bg-slate-900/40 relative">
      <div className="mb-8 shrink-0 relative z-10">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center">
          <ShieldAlert className="h-6 w-6 mr-3 text-red-600 dark:text-red-400" />
          Risk Interceptor Report
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
          Professional risk analysis powered by our curated legal knowledge base. 
          Identifies predatory clauses and potential legal issues in your document.
        </p>
      </div>
      
      {!report && !isLoading && !error && (
        <button
          onClick={runAnalysis}
          className="w-full btn-premium py-4 shadow-md flex items-center justify-center space-x-3 shrink-0 relative z-10"
        >
          <ShieldAlert className="h-5 w-5 text-sky-400" />
          <span>Run Comprehensive Risk Analysis</span>
        </button>
      )}

      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-up relative z-10">
          <div className="relative mx-auto w-20 h-20 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-sky-500 dark:border-sky-400 border-t-transparent animate-spin"></div>
            <ShieldAlert className="absolute inset-0 m-auto h-8 w-8 text-sky-500 dark:text-sky-400 animate-pulse" />
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Analyzing Document...
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs text-center">
            Our AI is carefully reviewing your document against our legal knowledge base
          </p>
        </div>
      )}

      {error && (
        <div className="badge-glass-danger w-full p-4 justify-start text-sm shrink-0 relative z-10">
          <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {report && (
        <div className="flex-1 space-y-8 animate-fade-up relative z-10">
          {/* Critical Risks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5" />
                <span>Critical Risks Detected</span>
              </h3>
              <span className="px-3 py-1 bg-red-100/50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full font-bold text-sm border border-red-200 dark:border-red-800/50">
                {foundRisks.length} Issues
              </span>
            </div>
            
            {foundRisks.length > 0 ? (
              <div className="space-y-4">
                {foundRisks.map((risk, index) => (
                  <div key={index} className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-red-200/50 dark:border-red-900/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <strong className="text-base text-slate-900 dark:text-white font-bold flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-3 text-red-500 flex-shrink-0" />
                        {risk.risk_name}
                      </strong>
                      <span className="text-xs font-bold px-2 py-1 rounded bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 tracking-wider">HIGH RISK</span>
                    </div>
                    <div className="space-y-3 pl-8">
                      <div className="bg-red-50/50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">Clause Identified</p>
                        <p className="text-sm text-slate-800 dark:text-slate-300 italic font-medium">"{risk.clause_text}"</p>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Analysis</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-light">{risk.analysis}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="badge-glass-safe w-full p-4 justify-start text-sm">
                <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                <span>No critical predatory risks identified</span>
              </div>
            )}
          </div>

          {/* Passed Checks Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5" />
                <span>Compliance Checks Passed</span>
              </h3>
              <span className="px-3 py-1 bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-bold text-sm border border-emerald-200 dark:border-emerald-800/50">
                {passedRisks.length} Checks
              </span>
            </div>
            
            {passedRisks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {passedRisks.map((risk, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-white/40 dark:bg-slate-800/40 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{risk.risk_name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-sm italic">No compliance checks were performed on this document.</p>
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
      <div className="h-[calc(100vh-120px)] flex items-center justify-center animate-fade-up">
        <div className="glass-panel p-12 rounded-3xl text-center shadow-md">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-sky-500 dark:border-sky-400 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">Loading Document</p>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Preparing your legal analysis platform</p>
        </div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center animate-fade-up">
        <div className="glass-panel p-12 rounded-3xl text-center shadow-md max-w-sm">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <p className="text-lg font-bold text-slate-900 dark:text-white mb-4">{error}</p>
          <button 
            onClick={() => navigate('/library')}
            className="btn-legal-outline w-full"
          >
            Return to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] max-w-full mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-8 flex flex-col transition-all duration-300 animate-fade-up pb-4">
      {/* Professional Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/library')} 
            className="p-3 mr-4 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white/50 dark:bg-slate-800/50 rounded-xl hover:shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-sky-500 dark:to-indigo-500 rounded-xl shadow-md mr-4">
              <Scale className="text-white h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {document?.title || 'Loading...'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                Professional Legal Document Analysis Platform
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 badge-glass-safe p-2 px-3 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800/50 dark:hover:text-white cursor-pointer transition-colors" onClick={() => setIsPreviewMaximized(!isPreviewMaximized)} title={isPreviewMaximized ? "Restore layout" : "Maximize preview"}>
          {isPreviewMaximized ? (
            <><Minimize2 className="h-4 w-4 mr-2" /><span>Collapse Preview</span></>
          ) : (
            <><Maximize2 className="h-4 w-4 mr-2" /><span>Expand Preview</span></>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden glass-panel rounded-3xl shadow-xl min-h-0">
        {/* Document Preview Panel */}
        <div className={`${isPreviewMaximized ? 'w-full' : 'w-[45%]'} border-r border-slate-200 dark:border-slate-700/50 overflow-y-auto bg-white/30 dark:bg-slate-900/30 transition-all duration-300 scrollbar-legal`}>
          <div className="sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/50 p-5 z-10">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <FileText className="mr-3 text-sky-600 dark:text-sky-400" size={20} />
              Document Content
            </h3>
            {highlightIndexes.length > 0 && mode === 'chat' && (
              <p className="badge-glass-safe mt-3 inline-flex">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                {highlightIndexes.length} relevant section{highlightIndexes.length !== 1 ? 's' : ''} highlighted
              </p>
            )}
          </div>
          
          <div className="p-6">
            {chunks.length > 0 ? (
              chunks.map((chunk, idx) => (
                <div
                  key={idx}
                  className={`mb-6 p-6 rounded-2xl transition-all duration-300 ${
                    highlightIndexes.includes(idx) && mode === 'chat'
                      ? 'bg-amber-50/80 dark:bg-amber-900/20 border-l-4 border-amber-500 shadow-sm'
                      : 'bg-white/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-sm'
                  }`}
                >
                  <p className="text-[15px] text-slate-800 dark:text-slate-300 leading-relaxed font-serif">
                    {chunk}
                  </p>
                  {highlightIndexes.includes(idx) && mode === 'chat' && (
                    <div className="mt-4 flex items-center text-xs text-amber-700 dark:text-amber-500 font-bold uppercase tracking-wider">
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Relevant to your query
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-16 opacity-50">
                <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  No preview available for this document.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat or Risk Analysis */}
        <div className={`${isPreviewMaximized ? 'hidden' : 'w-[55%]'} flex flex-col bg-white/40 dark:bg-slate-900/40 relative transition-all duration-300`}>
          
          {/* Background grid */}
          <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,transparent,black)] pointer-events-none z-0"></div>

          {/* Tab Buttons */}
          <div className="flex border-b border-slate-200 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md relative z-10 shrink-0">
            <button
              onClick={() => setMode('chat')}
              className={`flex-1 py-4 px-6 text-center font-bold text-sm transition-all flex flex-col items-center ${
                mode === 'chat' 
                  ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-500 bg-white/50 dark:bg-slate-800/50' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="h-5 w-5 mb-1.5" />
              Legal Assistant
            </button>
            <button
              onClick={() => setMode('risk')}
              className={`flex-1 py-4 px-6 text-center font-bold text-sm transition-all flex flex-col items-center ${
                mode === 'risk' 
                  ? 'text-red-600 dark:text-red-400 border-b-2 border-red-500 bg-white/50 dark:bg-slate-800/50' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="h-5 w-5 mb-1.5" />
              Risk Analysis
            </button>
          </div>

          {/* Conditional Rendering */}
          {mode === 'chat' ? (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-legal relative z-10">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center animate-fade-up">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-sky-100 dark:from-indigo-900/30 dark:to-sky-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm border border-indigo-200/50 dark:border-indigo-700/50 ring-8 ring-white/50 dark:ring-slate-900/50">
                      <Bot className="h-12 w-12 text-indigo-500 dark:text-sky-400 drop-shadow-md" />
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Professional Legal Assistant
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                      Ask questions about this document, request analysis, or explore specific clauses using the semantic LegalBERT engine.
                    </p>
                  </div>
                )}

                {messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.user ? 'justify-end' : 'justify-start'} animate-fade-up`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`max-w-[85%] group ${msg.user ? 'flex flex-row-reverse' : 'flex flex-row'}`}>
                      <div className={`flex-shrink-0 ${msg.user ? 'ml-4' : 'mr-4'} mt-1`}>
                        {msg.user ? (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-md">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md border ${msg.isError ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-sky-400'}`}>
                            <Bot className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      
                      <div
                        className={`px-6 py-4 rounded-3xl shadow-sm ${
                          msg.user
                            ? 'bg-gradient-to-br from-indigo-600 to-sky-600 text-white rounded-tr-sm'
                            : msg.isError
                            ? 'bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50 rounded-tl-sm'
                            : 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed text-[15px]">
                          {msg.text}
                        </p>
                        
                        <div className="flex items-center justify-between mt-3">
                          {!msg.user && !msg.isError && (
                            <button
                              onClick={() => copyToClipboard(msg.text, msg.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center font-bold uppercase tracking-wider"
                            >
                              {copiedMessageId === msg.id ? (
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 mr-1" />
                              )}
                              {copiedMessageId === msg.id ? 'Copied' : 'Copy'}
                            </button>
                          )}
                          <span className={`text-[10px] font-bold tracking-wider ml-auto uppercase opacity-60 ${msg.user ? 'text-white' : 'text-slate-500'}`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

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

              {/* Input Area */}
              <div className="p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 relative z-20 shrink-0">
                {error && (
                  <div className="badge-glass-danger w-full p-4 mb-4 justify-start text-sm">
                    <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="flex gap-4">
                  <textarea
                    ref={inputRef}
                    className="input-premium flex-1 resize-none py-4 px-5 text-sm"
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
                    className="btn-premium px-8 rounded-2xl flex items-center justify-center border-none min-w-[80px]"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Send className="h-6 w-6 text-white" />
                    )}
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-3 text-xs text-slate-400 dark:text-slate-500 font-medium px-1">
                  <span>Press <kbd className="bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded">Enter</kbd> to send • <kbd className="bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded">Shift</kbd> + <kbd className="bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded">Enter</kbd> for new line</span>
                  <span className={`font-mono ${input.length > 900 ? 'text-amber-500' : ''}`}>{input.length}/1000</span>
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