import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Filter,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle,
} from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

// ── Severity config ───────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  High: {
    label: 'High',
    badgeBg: 'bg-red-100 dark:bg-red-900/40',
    badgeText: 'text-red-700 dark:text-red-300',
    badgeBorder: 'border-red-300 dark:border-red-700',
    cardBorder: 'border-l-red-500',
    cardBg: 'bg-red-50/60 dark:bg-red-900/10',
    clauseBg: 'bg-red-50 dark:bg-red-900/20',
    clauseText: 'text-red-700 dark:text-red-300',
    icon: <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0" />,
    filterActive: 'bg-red-600 text-white border-red-600',
    filterIdle: 'border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
    dot: 'bg-red-500',
  },
  Medium: {
    label: 'Medium',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-300 dark:border-amber-700',
    cardBorder: 'border-l-amber-500',
    cardBg: 'bg-amber-50/60 dark:bg-amber-900/10',
    clauseBg: 'bg-amber-50 dark:bg-amber-900/20',
    clauseText: 'text-amber-700 dark:text-amber-300',
    icon: <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />,
    filterActive: 'bg-amber-500 text-white border-amber-500',
    filterIdle: 'border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20',
    dot: 'bg-amber-500',
  },
  Low: {
    label: 'Low',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-300 dark:border-blue-700',
    cardBorder: 'border-l-blue-500',
    cardBg: 'bg-blue-50/60 dark:bg-blue-900/10',
    clauseBg: 'bg-blue-50 dark:bg-blue-900/20',
    clauseText: 'text-blue-700 dark:text-blue-300',
    icon: <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />,
    filterActive: 'bg-blue-600 text-white border-blue-600',
    filterIdle: 'border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    dot: 'bg-blue-500',
  },
  Safe: {
    label: 'Safe',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-300 dark:border-emerald-700',
    cardBorder: 'border-l-emerald-500',
    cardBg: 'bg-emerald-50/60 dark:bg-emerald-900/10',
    clauseBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    clauseText: 'text-emerald-700 dark:text-emerald-300',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />,
    filterActive: 'bg-emerald-600 text-white border-emerald-600',
    filterIdle: 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    dot: 'bg-emerald-500',
  },
};

// ── Single risk card ──────────────────────────────────────────────────────────
const RiskCard = ({ risk, index }) => {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const cfg = SEVERITY_CONFIG[risk.severity] || SEVERITY_CONFIG.High;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(
        `[${risk.severity}] ${risk.risk_name}\n\nClause: "${risk.clause_text}"\n\nAnalysis: ${risk.analysis}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      className={`group relative rounded-2xl border-l-4 ${cfg.cardBorder} ${cfg.cardBg}
        border border-slate-200/50 dark:border-slate-700/40 shadow-sm
        hover:shadow-md transition-all duration-300`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between p-4 pb-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {cfg.icon}
          <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
            {risk.risk_name || 'Unclassified Risk'}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <span
            className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1
              rounded-full border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
          >
            {risk.severity}
          </span>
          <button
            onClick={copyToClipboard}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg
              hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-400"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50
              text-slate-400 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable body */}
      {expanded && (
        <div className="p-4 pt-3 space-y-3">
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
            <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Legal Analysis
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {risk.analysis}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Summary bar ───────────────────────────────────────────────────────────────
const SummaryBar = ({ summary }) => {
  if (!summary) return null;
  const { severity_counts } = summary;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {['High', 'Medium', 'Low', 'Safe'].map((sev) => {
        const cfg = SEVERITY_CONFIG[sev];
        const count = severity_counts?.[sev] ?? 0;
        return (
          <div
            key={sev}
            className={`flex flex-col items-center p-3 rounded-xl border
              ${cfg.badgeBg} ${cfg.badgeBorder} border`}
          >
            <span className={`text-2xl font-black ${cfg.badgeText}`}>{count}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.badgeText} opacity-80`}>
              {sev}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Main panel ────────────────────────────────────────────────────────────────
export const RiskReportPanel = ({ documentId, compact = false }) => {
  const [responseData, setResponseData] = useState(null); // { summary, report }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState(new Set(['High', 'Medium', 'Low']));

  const runAnalysis = async () => {
    setIsLoading(true);
    setResponseData(null);
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
      // Support both new { summary, report } shape and legacy { report } shape
      const data = response.data;
      setResponseData({
        summary: data.summary || null,
        report: Array.isArray(data.report) ? data.report : [],
      });
    } catch (err) {
      console.error('Error running risk analysis:', err);
      setError(err.response?.data?.error || 'Failed to run analysis. Check server logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFilter = (sev) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) {
        next.delete(sev);
      } else {
        next.add(sev);
      }
      return next;
    });
  };

  const allRisks = responseData?.report || [];
  const foundRisks = allRisks.filter((r) => r.found !== false);
  const safeItems = allRisks.filter((r) => r.found === false);

  const filteredRisks = foundRisks.filter((r) =>
    activeFilters.has(r.severity || 'High')
  );

  const totalFlagged = foundRisks.length;

  return (
    <div className={`flex flex-col h-full ${compact ? '' : 'p-8'} overflow-y-auto`}>
      {/* ── Header ── */}
      <div className="mb-6 shrink-0">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center">
          <ShieldAlert className="h-6 w-6 mr-3 text-red-500 dark:text-red-400" />
          Severity Risk Report
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          ML-powered multiclass severity analysis — each clause is classified as
          <span className="text-red-600 font-semibold"> High</span>,
          <span className="text-amber-600 font-semibold"> Medium</span>,
          <span className="text-blue-600 font-semibold"> Low</span>, or
          <span className="text-emerald-600 font-semibold"> Safe</span>.
        </p>
      </div>

      {/* ── Run button ── */}
      {!responseData && !isLoading && !error && (
        <button
          onClick={runAnalysis}
          className="w-full btn-premium py-4 shadow-md flex items-center justify-center space-x-3 shrink-0"
        >
          <ShieldAlert className="h-5 w-5 text-sky-400" />
          <span>Run Severity Risk Analysis</span>
        </button>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-up">
          <div className="relative mx-auto w-20 h-20 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700" />
            <div className="absolute inset-0 rounded-full border-4 border-sky-500 dark:border-sky-400 border-t-transparent animate-spin" />
            <ShieldAlert className="absolute inset-0 m-auto h-8 w-8 text-sky-500 dark:text-sky-400 animate-pulse" />
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Analysing Document…
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs text-center">
            Logistic Regression Model is classifying each clause by severity. This may take a moment.
          </p>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="badge-glass-danger w-full p-4 justify-start text-sm shrink-0">
          <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Results ── */}
      {responseData && (
        <div className="space-y-5 animate-fade-up">
          {/* Summary counts */}
          <SummaryBar summary={responseData.summary} />

          {/* All-clear message */}
          {totalFlagged === 0 && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
              <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-emerald-800 dark:text-emerald-200">
                  No risky clauses detected
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">
                  The ML model analysed {responseData.summary?.total_chunks_analysed ?? 0} chunks
                  and found no Medium, Low, or High severity risks.
                </p>
              </div>
            </div>
          )}

          {/* Filter bar */}
          {totalFlagged > 0 && (
            <div className="shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Filter by Severity
                </span>
                <span className="ml-auto text-xs text-slate-400">
                  {filteredRisks.length} of {totalFlagged} shown
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['High', 'Medium', 'Low'].map((sev) => {
                  const cfg = SEVERITY_CONFIG[sev];
                  const count = foundRisks.filter((r) => (r.severity || 'High') === sev).length;
                  if (count === 0) return null;
                  const isActive = activeFilters.has(sev);
                  return (
                    <button
                      key={sev}
                      onClick={() => toggleFilter(sev)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold
                        border transition-all duration-200 ${isActive ? cfg.filterActive : cfg.filterIdle}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : cfg.dot}`}
                      />
                      {sev} ({count})
                    </button>
                  );
                })}
                {/* All / None toggles */}
                <button
                  onClick={() => setActiveFilters(new Set(['High', 'Medium', 'Low']))}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-300 dark:border-slate-600
                    text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilters(new Set())}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-300 dark:border-slate-600
                    text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  None
                </button>
              </div>
            </div>
          )}

          {/* Risk cards */}
          {filteredRisks.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Flagged Clauses ({filteredRisks.length})
              </h4>
              {filteredRisks.map((risk, idx) => (
                <RiskCard key={idx} risk={risk} index={idx} />
              ))}
            </div>
          )}

          {filteredRisks.length === 0 && totalFlagged > 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-6">
              No results match the active filters. Try enabling more severity levels above.
            </p>
          )}

          {/* Safe items (collapsed list) */}
          {safeItems.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                <ShieldCheck className="h-4 w-4" />
                Passed Checks ({safeItems.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {safeItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-white/40 dark:bg-slate-800/40 p-3
                      rounded-xl border border-emerald-100 dark:border-emerald-900/30"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {item.risk_name || 'General Check'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Re-run button */}
          <button
            onClick={runAnalysis}
            className="w-full mt-2 py-2.5 text-sm font-semibold rounded-xl border
              border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400
              hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Re-run Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default RiskReportPanel;