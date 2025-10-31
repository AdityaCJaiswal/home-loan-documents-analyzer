import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Upload, 
  FolderOpen, 
  Clock, 
  FileCheck,
  TrendingUp,
  Calendar,
  BarChart3,
  Scale,
  ShieldAlert,
  Shield,
  Briefcase,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import DocumentCard from '../components/DocumentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useDocuments } from '../context/DocumentContext';
import { documentAPI } from '../services/api';

const Dashboard = () => {
  const { state, dispatch } = useDocuments();
  const { documents, loading, error } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await documentAPI.getAllDocuments();
      dispatch({ type: 'SET_DOCUMENTS', payload: response.data });
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to load documents' 
      });
    }
  };

  const filteredDocuments = documents
    .filter(doc => 
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.filename?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.uploaded_at) - new Date(a.uploaded_at);
      }
      return a.title?.localeCompare(b.title) || 0;
    });

  const totalDocuments = documents.length;
  const recentDocuments = documents.filter(doc => {
    const uploadDate = new Date(doc.uploaded_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return uploadDate > weekAgo;
  }).length;

  const totalPages = documents.reduce((sum, doc) => sum + (doc.pages || 0), 0);

  if (loading) {
    return <LoadingSpinner text="Loading your legal document platform..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fafbfc] via-[#f4f6f8] to-[#e8ecf0]">
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Professional Legal Header */}
        <div className="text-center space-y-6 py-12">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-700 to-blue-600 rounded-2xl shadow-xl">
              <Scale className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-blue-800" style={{letterSpacing: '-0.02em'}}>
              Redline AI
            </h1>
          </div>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Professional Legal Document Intelligence Platform
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Analyze loan agreements, identify risk clauses, and make informed decisions with AI-powered insights
          </p>
          <div className="flex items-center justify-center space-x-8 mt-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-medium">Secure Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium">AI-Verified</span>
            </div>
            <div className="flex items-center space-x-2">
              <Scale className="h-5 w-5 text-green-600" />
              <span className="font-medium">Legal Compliance</span>
            </div>
          </div>
        </div>

        {/* Professional Action Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Upload Document */}
          <Link to="/upload" className="group transform transition-all duration-300 hover:-translate-y-2">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:border-blue-600 p-8 h-full transition-all duration-300">
              <div className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-blue-700 to-blue-600 rounded-xl group-hover:shadow-lg transition-shadow">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-blue-800">Upload Document</h3>
                      <p className="text-gray-600 text-sm mt-1">Add to your library</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Securely upload loan agreements, contracts, and legal documents for AI-powered analysis
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-green-600 mt-6 font-medium">
                  <Briefcase className="h-5 w-5" />
                  <span className="text-sm">Professional Processing</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Browse Library */}
          <div 
            className="group cursor-pointer transform transition-all duration-300 hover:-translate-y-2" 
            onClick={() => document.getElementById('documents-section').scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:border-cyan-600 p-8 h-full transition-all duration-300">
              <div className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-cyan-600 to-cyan-500 rounded-xl group-hover:shadow-lg transition-shadow">
                      <FolderOpen className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-blue-800">Document Library</h3>
                      <p className="text-gray-600 text-sm mt-1">Browse your collection</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Access your complete document repository with intelligent search and organization
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-cyan-700 mt-6 font-medium">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm">{totalDocuments} documents available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Analyzer */}
          <Link to="/loan-demo" className="group transform transition-all duration-300 hover:-translate-y-2">
            <div className="bg-gradient-to-br from-red-600 to-red-500 rounded-2xl shadow-lg border-2 border-red-600 p-8 h-full transition-all duration-300 hover:shadow-2xl text-white">
              <div className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-4 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                      <ShieldAlert className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Risk Interceptor</h3>
                      <p className="text-red-100 text-sm mt-1">Advanced Analysis</p>
                    </div>
                  </div>
                  <p className="text-red-50 text-sm leading-relaxed">
                    Identify predatory clauses and hidden risks in loan agreements using our AI-powered knowledge base
                  </p>
                </div>
                <div className="flex items-center space-x-2 mt-6 font-medium">
                  <AlertTriangle className="h-5 w-5 text-yellow-300" />
                  <span className="text-sm text-red-50">Instant Risk Detection</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Professional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-800">{totalDocuments}</p>
                <p className="text-gray-600 font-medium mt-1">Total Documents</p>
                <p className="text-xs text-gray-500 mt-2">In your legal library</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                <FileText className="h-8 w-8 text-blue-700" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-600 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-700">{recentDocuments}</p>
                <p className="text-gray-600 font-medium mt-1">Recent Uploads</p>
                <p className="text-xs text-gray-500 mt-2">This week</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-100 to-green-50 rounded-xl">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-cyan-600 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-cyan-700">{totalPages.toLocaleString()}</p>
                <p className="text-gray-600 font-medium mt-1">Pages Analyzed</p>
                <p className="text-xs text-gray-500 mt-2">Across all documents</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-xl">
                <BarChart3 className="h-8 w-8 text-cyan-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div id="documents-section" className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8">
            
            {/* Search and Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 pb-6 border-b-2 border-gray-200">
              <div>
                <h2 className="text-3xl font-bold text-blue-800 mb-2">Document Repository</h2>
                <p className="text-gray-600">Manage your legal document collection with intelligent analysis</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-80">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent bg-white text-gray-900"
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-gray-900 font-medium"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Documents Grid */}
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-20">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-blue-800 mb-3">
                  {searchTerm ? 'No documents found' : 'Your legal library awaits'}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {searchTerm 
                    ? 'Try adjusting your search terms or browse all documents'
                    : 'Upload your first legal document and begin intelligent risk analysis'
                  }
                </p>
                {!searchTerm && (
                  <Link to="/upload" className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                    <Plus className="h-5 w-5" />
                    <span>Upload Your First Document</span>
                    <Scale className="h-5 w-5" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <FileCheck className="h-6 w-6 text-green-600" />
                    <span className="text-lg font-semibold text-blue-800">
                      {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} ready for analysis
                    </span>
                  </div>
                </div>

                <div className="grid gap-6">
                  {filteredDocuments.map((document) => (
                    <LegalDocumentCard key={document.id} document={document} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Professional Legal Document Card
const LegalDocumentCard = ({ document }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileTypeColor = (filename) => {
    const extension = filename?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'bg-red-500';
      case 'docx':
        return 'bg-blue-500';
      case 'txt':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="group bg-white rounded-xl border-l-4 border-blue-700 shadow-md hover:shadow-xl p-6 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl group-hover:from-blue-100 group-hover:to-blue-200 transition-colors border border-blue-200">
            <FileText className="h-8 w-8 text-blue-700" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-3">
              <h3 className="text-xl font-bold text-blue-800 truncate">
                {document.title || document.filename}
              </h3>
              <div className={`w-3 h-3 ${getFileTypeColor(document.filename)} rounded-full`}></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-cyan-600" />
                <span className="font-medium">{formatDate(document.uploaded_at)}</span>
              </div>
              
              {document.pages && (
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-cyan-600" />
                  <span className="font-medium">{document.pages} pages</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium">Ready for AI analysis</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 ml-4">
          <Link
            to={`/chat?doc=${document.id}`}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Scale className="h-5 w-5" />
            <span>Analyze Document</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;