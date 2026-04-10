import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  FileText, 
  Loader2, 
  Copy,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Scale,
  Zap,
  FileCheck
} from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

const DEMO_TEXT = `ARTICLE 1: DEFINITIONS
(g) "Applicable Law" means any law...
(k) "Conditions Precedent" shall mean...

Pre Mature Closure/ Part Payment:
For Fixed Rate Loans ("FRHL"), the prepayment charge shall be levied at the rate of 2%, plus applicable taxes/statutory levies of the amounts being so prepaid on account of part or full prepayments.

ARTICLE 7: COVENANTS
7.1(e) Maintenance of Property: The Borrower shall maintain...
7.1(f) Compliance with Applicable Laws: The Borrower shall ensure...

ARTICLE 9: DEFAULT
A final balloon payment of $35,000 will be due at the end of the loan term.

ARTICLE 10: DISPUTES
All disputes under this agreement shall be resolved by binding arbitration and the Borrower hereby agrees to waive your right to a jury trial.
`;

export default function LoanAnalyzerDemo() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const loadDemoText = () => {
    setText(DEMO_TEXT);
    setReport(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) {
      setError("Please paste loan agreement text to analyze.");
      return;
    }

    setIsLoading(true);
    setReport(null);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8000/api/analyze-risks/', {
        text: text,
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': Cookies.get('csrftoken'),
        },
      });

      setReport(response.data.report);

    } catch (err) {
      console.error('Error analyzing risks:', err);
      setError(err.response?.data?.error || 'Failed to analyze document. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const foundRisks = report?.filter(r => r.found) || [];
  const passedRisks = report?.filter(r => !r.found) || [];

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="space-y-12 pb-12 animate-fade-up">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Professional Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 transition-colors duration-200 border border-slate-200 dark:border-slate-700 backdrop-blur-sm"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-red-600 to-red-800 dark:from-red-500 dark:to-red-900 rounded-xl shadow-md">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Risk Interceptor Demo
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Professional Loan Agreement Risk Analysis Platform
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-red-500 flex items-start space-x-4">
          <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">How It Works</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-4xl">
              Our Risk Interceptor uses a curated legal knowledge base to identify predatory clauses, hidden fees, 
              and unfair terms in loan agreements. This demo analyzes sample text against known risk patterns used 
              by predatory lenders.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Input Panel */}
          <div className="glass-panel rounded-3xl p-8 shrink-0 flex flex-col h-[800px]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                <FileText className="h-6 w-6 mr-3 text-sky-600 dark:text-sky-400" />
                Loan Agreement Text
              </h2>
              <div className="badge-glass-safe">
                <FileCheck className="h-4 w-4 mr-2" />
                <span>{text.length} characters</span>
              </div>
            </div>
            
            <button
              onClick={loadDemoText}
              className="w-full mb-6 py-3 bg-gradient-to-r from-sky-600/10 to-indigo-600/10 dark:from-sky-500/20 dark:to-indigo-500/20 text-sky-700 dark:text-sky-300 rounded-xl font-semibold hover:from-sky-600/20 hover:to-indigo-600/20 transition-all duration-300 border border-sky-500/20 dark:border-sky-400/30 flex items-center justify-center space-x-2 shrink-0"
            >
              <Zap className="h-4 w-4" />
              <span>Load Sample Predatory Loan Agreement</span>
            </button>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 h-full">
              <textarea
                className="input-premium flex-1 resize-none font-mono text-sm leading-relaxed p-6"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your loan agreement text here for professional risk analysis..."
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 btn-premium py-4 shrink-0 shadow-lg text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    <span>Analyzing Document...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-3 text-sky-400" />
                    <span>Run Comprehensive Risk Analysis</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Report Panel */}
          <div className="glass-panel rounded-3xl p-8 flex flex-col h-[800px]">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center shrink-0">
              <ShieldAlert className="h-6 w-6 mr-3 text-red-600 dark:text-red-400" />
              Risk Analysis Report
            </h2>
            
            {error && (
              <div className="badge-glass-danger w-full p-4 justify-start text-sm mb-6 shrink-0">
                <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center animate-fade-up">
                <div className="relative mx-auto w-20 h-20 mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-sky-500 dark:border-sky-400 border-t-transparent animate-spin"></div>
                  <ShieldAlert className="absolute inset-0 m-auto h-8 w-8 text-sky-500 dark:text-sky-400 animate-pulse" />
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Analyzing Loan Agreement
                </p>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm text-center">
                  Our AI is scanning the document against our curated LegalBERT semantic knowledge base...
                </p>
              </div>
            )}

            {!report && !isLoading && !error && (
              <div className="flex-1 flex flex-col items-center justify-center animate-fade-up">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Awaiting Analysis
                </p>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm text-center text-sm">
                  Load the sample text or paste your own loan agreement, then click "Run Analysis" to identify potential risks.
                </p>
              </div>
            )}

            {report && (
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 animate-fade-up">
                {/* Critical Risks */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
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
                          <div className="flex items-start justify-between mb-4">
                            <strong className="text-base text-slate-900 dark:text-white font-bold flex items-center">
                              <AlertTriangle className="h-5 w-5 mr-3 text-red-500 flex-shrink-0" />
                              {risk.risk_name}
                            </strong>
                            <button
                              onClick={() => copyToClipboard(JSON.stringify(risk, null, 2), `risk-${index}`)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500"
                            >
                              {copiedMessageId === `risk-${index}` ? (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <div className="space-y-3 pl-8">
                            <div className="bg-red-50/50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                              <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">Predatory Clause Identified</p>
                              <p className="text-sm text-slate-800 dark:text-slate-300 italic font-medium leading-relaxed">"{risk.clause_text}"</p>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Legal Analysis</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-light">{risk.analysis}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="badge-glass-safe w-full p-4 justify-start text-sm">
                      <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span>No critical predatory risks identified by the ML pipeline</span>
                    </div>
                  )}
                </div>

                {/* Passed Checks */}
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
                    <div className="grid grid-cols-1 gap-2">
                      {passedRisks.map((risk, index) => (
                        <div key={index} className="flex items-center space-x-3 bg-white/40 dark:bg-slate-800/40 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                          <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{risk.risk_name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm italic">No valid compliance checks were completed on this document block.</p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer Info */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <Scale className="h-6 w-6 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Legal Disclaimer</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                This tool provides AI-powered analysis based on a curated knowledge base of known predatory lending practices. 
                Results should be reviewed by qualified legal professionals. This demo is for educational purposes and does not 
                constitute legal advice. Always consult with a licensed attorney for specific legal matters.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}