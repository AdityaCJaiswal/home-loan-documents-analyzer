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
  Info,
  Scale,
  Zap,
  FileCheck,
  Filter,
  CheckCircle2
} from 'lucide-react';

import axios from 'axios';
import Cookies from 'js-cookie';

// Severity colour config (mirrors RiskReportPanel)
const SEVERITY_CONFIG = {
  High: {
    badgeBg: 'bg-red-100 dark:bg-red-900/40',
    badgeText: 'text-red-700 dark:text-red-300',
    badgeBorder: 'border-red-300 dark:border-red-700',
    cardBorder: 'border-l-red-500',
    cardBg: 'bg-red-50/60 dark:bg-red-900/10',
    clauseBg: 'bg-red-50 dark:bg-red-900/20',
    clauseText: 'text-red-700 dark:text-red-300',
    icon: <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />,
    filterActive: 'bg-red-600 text-white border-red-600',
    filterIdle: 'border-red-300 text-red-600 dark:border-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
  Medium: {
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-300 dark:border-amber-700',
    cardBorder: 'border-l-amber-500',
    cardBg: 'bg-amber-50/60 dark:bg-amber-900/10',
    clauseBg: 'bg-amber-50 dark:bg-amber-900/20',
    clauseText: 'text-amber-700 dark:text-amber-300',
    icon: <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />,
    filterActive: 'bg-amber-500 text-white border-amber-500',
    filterIdle: 'border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  Low: {
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-300 dark:border-blue-700',
    cardBorder: 'border-l-blue-500',
    cardBg: 'bg-blue-50/60 dark:bg-blue-900/10',
    clauseBg: 'bg-blue-50 dark:bg-blue-900/20',
    clauseText: 'text-blue-700 dark:text-blue-300',
    icon: <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />,
    filterActive: 'bg-blue-600 text-white border-blue-600',
    filterIdle: 'border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  Safe: {
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-300 dark:border-emerald-700',
    cardBorder: 'border-l-emerald-500',
    cardBg: 'bg-emerald-50/60 dark:bg-emerald-900/10',
    clauseBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    clauseText: 'text-emerald-700 dark:text-emerald-300',
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />,
    filterActive: 'bg-emerald-600 text-white border-emerald-600',
    filterIdle: 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
};


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
  const [report, setReport] = useState(null);         // array of risk items
  const [summary, setSummary] = useState(null);       // { total_chunks_analysed, severity_counts, flagged_chunks }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [activeFilters, setActiveFilters] = useState(new Set(['High', 'Medium', 'Low']));

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
    setSummary(null);
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

      // Support both new { summary, report } and legacy { report } shapes
      const data = response.data;
      setReport(Array.isArray(data.report) ? data.report : []);
      setSummary(data.summary || null);

    } catch (err) {
      console.error('Error analyzing risks:', err);
      setError(err.response?.data?.error || 'Failed to analyze document. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFilter = (sev) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) { next.delete(sev); } else { next.add(sev); }
      return next;
    });
  };

  const foundRisks = (report || []).filter((r) => r.found !== false);
  const safeItems  = (report || []).filter((r) => r.found === false);
  const filteredRisks = foundRisks.filter((r) => activeFilters.has(r.severity || 'High'));

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
              <div className="flex-1 overflow-y-auto pr-2 space-y-5 animate-fade-up">

                {/* Summary counts */}
                {summary && (
                  <div className="grid grid-cols-3 gap-3">
                    {['High', 'Medium', 'Low'].map((sev) => {
                      const cfg = SEVERITY_CONFIG[sev];
                      const count = summary.severity_counts?.[sev] ?? 0;
                      return (
                        <div key={sev}
                          className={`flex flex-col items-center p-3 rounded-xl border ${cfg.badgeBg} ${cfg.badgeBorder}`}>
                          <span className={`text-2xl font-black ${cfg.badgeText}`}>{count}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.badgeText} opacity-80`}>{sev}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Filter bar */}
                {foundRisks.length > 0 && (
                  <div className="shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Filter by Severity
                      </span>
                      <span className="ml-auto text-xs text-slate-400">
                        {filteredRisks.length} of {foundRisks.length} shown
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['High', 'Medium', 'Low'].map((sev) => {
                        const cfg = SEVERITY_CONFIG[sev];
                        const count = foundRisks.filter((r) => (r.severity || 'High') === sev).length;
                        if (count === 0) return null;
                        const isActive = activeFilters.has(sev);
                        return (
                          <button key={sev} onClick={() => toggleFilter(sev)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                              border transition-all duration-200 ${isActive ? cfg.filterActive : cfg.filterIdle}`}>
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : cfg.dot}`} />
                            {sev} ({count})
                          </button>
                        );
                      })}
                      <button onClick={() => setActiveFilters(new Set(['High', 'Medium', 'Low']))}
                        className="px-3 py-1 rounded-full text-xs font-bold border border-slate-300 dark:border-slate-600
                          text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">All</button>
                      <button onClick={() => setActiveFilters(new Set())}
                        className="px-3 py-1 rounded-full text-xs font-bold border border-slate-300 dark:border-slate-600
                          text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">None</button>
                    </div>
                  </div>
                )}

                {/* All clear */}
                {foundRisks.length === 0 && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20
                    border border-emerald-200 dark:border-emerald-800/40">
                    <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <p className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">
                      No risky clauses detected by the ML pipeline
                    </p>
                  </div>
                )}

                {/* Severity-coloured risk cards */}
                {filteredRisks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-500" />
                      Flagged Clauses ({filteredRisks.length})
                    </h3>
                    {filteredRisks.map((risk, index) => {
                      const sev = risk.severity || 'High';
                      const cfg = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.High;
                      return (
                        <div key={index}
                          className={`group relative rounded-2xl border-l-4 ${cfg.cardBorder} ${cfg.cardBg}
                            border border-slate-200/50 dark:border-slate-700/40 p-4 shadow-sm
                            hover:shadow-md transition-all duration-300`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {cfg.icon}
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {risk.risk_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 ml-2 shrink-0">
                              <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1
                                rounded-full border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}>
                                {sev}
                              </span>
                              <button
                                onClick={() => copyToClipboard(JSON.stringify(risk, null, 2), `risk-${index}`)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg
                                  hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-400"
                              >
                                {copiedMessageId === `risk-${index}` ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2 pl-7">
                            {risk.clause_text && (
                              <div className={`p-3 rounded-xl ${cfg.clauseBg}`}>
                                <p className={`text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${cfg.clauseText}`}>
                                  Identified Clause
                                </p>
                                <p className="text-sm text-slate-800 dark:text-slate-200 italic leading-relaxed">
                                  "{risk.clause_text}"
                                </p>
                              </div>
                            )}
                            {risk.analysis && (
                              <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/50
                                border border-slate-200/50 dark:border-slate-700/50">
                                <p className="text-[10px] font-extrabold uppercase tracking-wider
                                  text-slate-500 dark:text-slate-400 mb-1.5">Legal Analysis</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {risk.analysis}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {filteredRisks.length === 0 && foundRisks.length > 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-6">
                    No results match the active filters.
                  </p>
                )}

                {/* Passed / Safe items */}
                {safeItems.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider
                      flex items-center gap-2 mb-3">
                      <ShieldCheck className="h-4 w-4" />
                      Passed Checks ({safeItems.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {safeItems.map((risk, index) => (
                        <div key={index} className="flex items-center space-x-3 bg-white/40 dark:bg-slate-800/40
                          p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                          <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{risk.risk_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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