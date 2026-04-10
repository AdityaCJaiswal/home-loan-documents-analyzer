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
    <div className="space-y-12 pb-12">
      
      {/* 
        ========================================================
        HERO SECTION 
        ========================================================
      */}
      <section className="text-center space-y-6 py-16 animate-fade-up">
        <div className="inline-flex items-center justify-center p-2 mb-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
          <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-sky-500 dark:to-indigo-500 rounded-xl shadow-inner">
            <Scale className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-gradient">
          Legal Document Intelligence
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
          Analyze complex loan agreements, surface predatory compliance risks, and make informed decisions instantly.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
          <div className="badge-glass-safe">
            <Shield className="h-4 w-4 mr-2" />
            SOC2 Compliant Framework
          </div>
          <div className="badge-glass-safe">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            AI-Verified Extractions
          </div>
        </div>
      </section>

      {/* 
        ========================================================
        CORE ACTIONS GRID
        ========================================================
      */}
      <section className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto animate-fade-up delay-75">
        
        {/* Upload Action */}
        <Link to="/upload" className="block h-full cursor-pointer focus:outline-none focus:ring-4 focus:ring-sky-500/20 rounded-2xl">
          <div className="glass-card-interactive h-full p-8 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700/50 rounded-2xl flex items-center justify-center mb-6 border border-slate-200/50 dark:border-slate-600/50 shadow-sm transition-transform group-hover:scale-110">
                <Upload className="h-6 w-6 text-slate-700 dark:text-sky-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Ingest Contracts</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                Securely upload loan agreements and MSAs into your encrypted workspace.
              </p>
            </div>
            <div className="mt-8 flex items-center text-sm font-medium text-sky-600 dark:text-sky-400">
              Upload New Document <Briefcase className="h-4 w-4 ml-2" />
            </div>
            
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/0 via-sky-500/0 to-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </Link>

        {/* Library Action */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => document.getElementById('documents-section').scrollIntoView({ behavior: 'smooth' })}
          className="block h-full cursor-pointer focus:outline-none focus:ring-4 focus:ring-sky-500/20 rounded-2xl"
        >
          <div className="glass-card-interactive h-full p-8 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700/50 rounded-2xl flex items-center justify-center mb-6 border border-slate-200/50 dark:border-slate-600/50 shadow-sm transition-transform group-hover:scale-110">
                <FolderOpen className="h-6 w-6 text-slate-700 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Knowledge Base</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                Search and review active agreements in your intelligent repository.
              </p>
            </div>
            <div className="mt-8 flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
              View {totalDocuments} Files <FileText className="h-4 w-4 ml-2" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </div>

        {/* Interceptor Action */}
        <Link to="/loan-demo" className="block h-full cursor-pointer focus:outline-none focus:ring-4 focus:ring-red-500/20 rounded-2xl">
          <div className="glass-card-interactive h-full p-8 flex flex-col justify-between group !border-red-200/50 dark:!border-red-900/30">
            <div>
              <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/10 rounded-2xl flex items-center justify-center mb-6 border border-red-200/50 dark:border-red-800/50 shadow-sm transition-transform group-hover:scale-110">
                <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Risk Interceptor</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                Run an autonomous ML audit to surface predatory clauses instantly.
              </p>
            </div>
            <div className="mt-8 flex items-center text-sm font-medium text-red-600 dark:text-red-400">
              Launch Audit <AlertTriangle className="h-4 w-4 ml-2" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-red-500/0 via-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </Link>
      </section>

      {/* 
        ========================================================
        STATISTICS 
        ========================================================
      */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto animate-fade-up delay-150">
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Vault</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white">{totalDocuments}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Weekly Ingest</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white">{recentDocuments}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/30">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pages Parsed</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white">{totalPages.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center border border-sky-100 dark:border-sky-800/30">
            <BarChart3 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
        </div>
      </section>

      {/* 
        ========================================================
        DOCUMENT REPOSITORY
        ========================================================
      */}
      <section id="documents-section" className="max-w-7xl mx-auto animate-fade-up delay-300 scroll-mt-24">
        <div className="glass-panel rounded-3xl p-8">
          
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8 border-b border-slate-200 dark:border-slate-700/50 pb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Repository</h2>
              <p className="text-slate-500 dark:text-slate-400">Secure overview of active contracts.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search repository..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-premium pl-12"
                />
              </div>
              
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-premium appearance-none pr-10 font-medium"
                >
                  <option value="recent">Most Recent</option>
                  <option value="name">Alphabetical</option>
                </select>
                <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {error && (
            <div className="badge-glass-danger px-4 py-3 mb-6 w-full justify-start text-sm">
              <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Grid Content */}
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-24 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {searchTerm ? 'No matches found' : 'Your vault is empty'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
                {searchTerm 
                  ? 'Adjust your search parameters.'
                  : 'Start by uploading a legal document for automated ingestion.'
                }
              </p>
              {!searchTerm && (
                <Link to="/upload" className="btn-premium-accent">
                  <Upload className="h-4 w-4 mr-2" /> Ingest Document
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((document) => (
                <LegalDocumentCard key={document.id} document={document} />
              ))}
            </div>
          )}
        </div>
      </section>
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