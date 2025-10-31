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
    <div className="min-h-screen bg-gradient-to-br from-[#fafbfc] via-[#f4f6f8] to-[#e8ecf0]">
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Professional Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-3 rounded-full hover:bg-white/50 transition-colors duration-200 border-2 border-gray-300"
          >
            <ArrowLeft className="h-6 w-6 text-[#1e3a5f]" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-4 bg-gradient-to-br from-[#8b2e2e] to-[#a63a3a] rounded-2xl shadow-xl">
              <Scale className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#1e3a5f]">
                Risk Interceptor Demo
              </h1>
              <p className="text-gray-600 mt-1 font-medium">
                Professional Loan Agreement Risk Analysis Platform
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="max-w-7xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-[#1e3a5f] p-6 rounded-xl shadow-md">
          <div className="flex items-start space-x-4">
            <ShieldAlert className="h-8 w-8 text-[#1e3a5f] flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">How It Works</h3>
              <p className="text-gray-700 leading-relaxed">
                Our Risk Interceptor uses a curated legal knowledge base to identify predatory clauses, hidden fees, 
                and unfair terms in loan agreements. This demo analyzes sample text against known risk patterns used 
                by predatory lenders.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          
          {/* Input Panel */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1e3a5f] flex items-center">
                <FileText className="h-7 w-7 mr-3 text-[#8b5a3c]" />
                Loan Agreement Text
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FileCheck className="h-4 w-4" />
                <span>{text.length} characters</span>
              </div>
            </div>
            
            <button
              onClick={loadDemoText}
              className="w-full mb-6 px-6 py-4 bg-gradient-to-r from-[#8b5a3c] to-[#6d4730] text-white rounded-xl font-semibold hover:from-[#6d4730] hover:to-[#5a3826] transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
            >
              <Zap className="h-5 w-5" />
              <span>Load Sample Predatory Loan Agreement</span>
            </button>
            
            <form onSubmit={handleSubmit}>
              <textarea
                className="w-full p-5 border-2 border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent bg-white text-gray-900 font-mono text-sm scrollbar-legal"
                rows="22"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your loan agreement text here for professional risk analysis..."
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8f] text-white rounded-xl font-semibold hover:from-[#152d47] hover:to-[#1e3a5f] disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Analyzing Document...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6" />
                    <span>Run Comprehensive Risk Analysis</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Report Panel */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6 flex items-center">
              <ShieldAlert className="h-7 w-7 mr-3 text-[#8b2e2e]" />
              Risk Analysis Report
            </h2>
            
            {error && (
              <div className="p-5 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3 mb-6">
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 mb-1">Analysis Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-20">
                <div className="relative mx-auto w-20 h-20 mb-8">
                  <div className="spinner-legal h-20 w-20"></div>
                </div>
                <p className="text-xl font-semibold text-[#1e3a5f] mb-3">
                  Analyzing Loan Agreement
                </p>
                <p className="text-gray-600">
                  Our AI is scanning the document against our legal knowledge base...
                </p>
              </div>
            )}

            {!report && !isLoading && !error && (
              <div className="text-center py-20">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-700 mb-3">
                  Awaiting Analysis
                </p>
                <p className="text-gray-600 max-w-md mx-auto">
                  Load the sample text or paste your own loan agreement, then click "Run Analysis" to identify potential risks.
                </p>
              </div>
            )}

            {report && (
              <div className="space-y-8 scrollbar-legal overflow-y-auto max-h-[600px]">
                {/* Critical Risks */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-red-200">
                    <h3 className="text-2xl font-bold text-[#8b2e2e] flex items-center space-x-2">
                      <ShieldAlert className="h-7 w-7" />
                      <span>Critical Risks Detected</span>
                    </h3>
                    <span className="px-5 py-2 bg-red-100 text-red-800 rounded-full font-bold text-xl border-2 border-red-200">
                      {foundRisks.length}
                    </span>
                  </div>
                  
                  {foundRisks.length > 0 ? (
                    <div className="space-y-4">
                      {foundRisks.map((risk, index) => (
                        <div key={index} className="group relative bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-600 p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                          <div className="flex items-start justify-between mb-3">
                            <strong className="text-lg text-red-900 font-bold flex items-center">
                              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                              {risk.risk_name}
                            </strong>
                            <button
                              onClick={() => copyToClipboard(JSON.stringify(risk, null, 2), `risk-${index}`)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-200 rounded"
                            >
                              {copiedMessageId === `risk-${index}` ? (
                                <CheckCircle className="h-4 w-4 text-red-800" />
                              ) : (
                                <Copy className="h-4 w-4 text-red-700" />
                              )}
                            </button>
                          </div>
                          <div className="space-y-3 pl-7">
                            <div className="bg-white/80 p-4 rounded-lg border border-red-200">
                              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Predatory Clause Identified:</p>
                              <p className="text-sm text-red-900 italic font-medium">"{risk.clause_text}"</p>
                            </div>
                            <div className="bg-white/60 p-4 rounded-lg border border-red-200">
                              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Legal Analysis:</p>
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
                        No critical predatory risks identified in this document
                      </p>
                    </div>
                  )}
                </div>

                {/* Passed Checks */}
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
                    <ul className="grid grid-cols-1 gap-3">
                      {passedRisks.map((risk, index) => (
                        <li key={index} className="flex items-center space-x-3 bg-white/80 p-4 rounded-lg border border-green-200">
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
        </div>

        {/* Footer Info */}
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-start space-x-4">
            <Scale className="h-8 w-8 text-[#1e3a5f] flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">Legal Disclaimer</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
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