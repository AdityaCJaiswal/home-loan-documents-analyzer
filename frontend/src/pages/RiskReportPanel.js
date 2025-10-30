// New File: components/RiskReportPanel.js
import React, { useState, useEffect } from 'react';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import axios from 'axios';

export const RiskReportPanel = ({ documentId }) => {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAnalysis = async () => {
    setIsLoading(true);
    setReport(null);
    setError(null);

    try {
      // THIS IS THE NEW BACKEND ENDPOINT WE MUST CREATE
      const response = await axios.post(
        `http://localhost:8000/api/document/${documentId}/analyze-risk/`
      );
      setReport(response.data.report);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to run analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const foundRisks = report?.filter(r => r.found) || [];
  const passedRisks = report?.filter(r => !r.found) || [];

  return (
    <div className="p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Risk Interceptor Report
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        This tool scans the document against our "Risk Knowledge Base"
        to find known predatory clauses.
      </p>
      
      {!report && !isLoading && (
        <button
          onClick={runAnalysis}
          className="w-full px-6 py-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
        >
          Run Risk Analysis
        </button>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p>Running Interceptor Loop... This may take a moment.</p>
        </div>
      )}

      {error && (
        <p className="text-red-500">Error: {error}</p>
      )}

      {report && (
        <div className="space-y-6 overflow-y-auto">
          {/* Red Flags */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 flex items-center">
              <ShieldAlert className="h-6 w-6 mr-2" />
              {foundRisks.length} Critical Risk(s) Found
            </h3>
            {foundRisks.map((risk, index) => (
              <div key={index} className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
                <strong className="text-red-800 dark:text-red-200">{risk.risk_name}</strong>
                <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                  <strong>Clause Found:</strong> "{risk.clause_text}"
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  <strong>Analysis:</strong> {risk.analysis}
                </p>
              </div>
            ))}
          </div>
          
          {/* Green Checks */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center">
              <ShieldCheck className="h-6 w-6 mr-2" />
              {passedRisks.length} Check(s) Passed
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
  );
};

export default RiskReportPanel;