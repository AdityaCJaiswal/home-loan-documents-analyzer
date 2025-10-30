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
  Zap
} from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

// This is the "honeypot" text you created.
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
      setError("Please paste some loan text to analyze.");
      return;
    }

    setIsLoading(true);
    setReport(null);
    setError(null);

    try {
      // Call your NEW Django endpoint
      const response = await axios.post('http://localhost:8000/api/analyze-risks/', {
        text: text,
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': Cookies.get('csrftoken'), // Pass the CSRF token
        },
      });

      setReport(response.data.report); // This is the array of risk objects

    } catch (err) {
      console.error('Error analyzing risks:', err);
      setError(err.response?.data?.error || 'Failed to analyze document. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper variables to split the report for display
  const foundRisks = report?.filter(r => r.found) || [];
  const passedRisks = report?.filter(r => !r.found) || [];

  // Copy helper function
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Loan Risk Interceptor (Demo)
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Demonstrating targeted risk analysis using a human-curated Knowledge Base.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Input Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Loan Agreement Text
            </h2>
            <button
              onClick={loadDemoText}
              className="w-full mb-4 px-6 py-3 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-lg font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center space-x-2"
            >
              <Zap className="h-5 w-5" />
              <span>Load "Honeypot" Demo Text</span>
            </button>
            <form onSubmit={handleSubmit}>
              <textarea
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none focus:ring-2 focus:ring-blue-500"
                rows="20"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your loan agreement text here..."
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                <span>{isLoading ? 'Analyzing...' : 'Run Risk Interceptor'}</span>
              </button>
            </form>
          </div>

          {/* Report Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Analysis Report
            </h2>
            
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-12">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Running Interceptor Loop...
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Querying Knowledge Base against document.
                </p>
              </div>
            )}

            {!report && !isLoading && !error && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Report will appear here
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Load the demo text and click "Run" to see the analysis.
                </p>
              </div>
            )}

            {report && (
              <div className="space-y-6">
                {/* --- RED FLAGS --- */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 flex items-center space-x-2">
                    <ShieldAlert className="h-6 w-6" />
                    <span>{foundRisks.length} Critical Risk(s) Found</span>
                  </h3>
                  {foundRisks.length > 0 ? (
                    foundRisks.map((risk, index) => (
                      <div key={index} className="group relative bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
                        <strong className="text-red-800 dark:text-red-200">{risk.risk_name}</strong>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                          <strong>Clause Found:</strong> "{risk.clause_text}"
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          <strong>Analysis:</strong> {risk.analysis}
                        </p>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(risk, null, 2), `risk-${index}`)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center"
                        >
                          {copiedMessageId === `risk-${index}` ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">No critical red flags identified from the Knowledge Base.</p>
                  )}
                </div>

                {/* --- GREEN CHECKS --- */}
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center space-x-2">
                    <ShieldCheck className="h-6 w-6" />
                    <span>{passedRisks.length} Check(s) Passed</span>
                  </h3>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    {passedRisks.map((risk, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                        {risk.risk_name} (Not Found)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}