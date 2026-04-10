import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowDown, 
  ArrowUp, 
  Trash2, 
  FileText, 
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Eye
} from 'lucide-react';
import axios from 'axios';

export default function Library() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/documents/');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;
    
    if (searchTerm) {
      filtered = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredDocuments(filtered);
  };

  const sortDocuments = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedDocs = [...filteredDocuments].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === 'title') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDeleteClick = (doc, e) => {
    e.stopPropagation();
    setDocumentToDelete(doc);
    setShowDeleteModal(true);
    setDropdownOpen(null);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`http://localhost:8000/api/documents/${documentToDelete.id}/delete/`);
      setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error('Error deleting document:', error);
      // You could add error handling here
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRowClick = (docId) => {
    navigate(`/chat?doc=${docId}`);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? 
      <ArrowUp className="inline-block ml-1 h-4 w-4" /> : 
      <ArrowDown className="inline-block ml-1 h-4 w-4" />;
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 transition-colors duration-200 border border-slate-200 dark:border-slate-700 backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Document Library</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Manage and organize your vault
              </p>
            </div>
          </div>
          
          <div className="badge-glass-safe text-sm px-4 py-2">
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-premium pl-12"
              />
            </div>
            
            <div className="flex items-center space-x-2 badge-glass-safe opacity-80 backdrop-blur-md border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
              <Filter className="h-4 w-4" />
              <span>Sort by: {sortBy === 'title' ? 'Title' : 'Upload Date'}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="glass-panel overflow-hidden rounded-3xl">
          {sortedDocs.length === 0 ? (
            <div className="text-center py-16 animate-fade-up">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {searchTerm ? 'No documents found' : 'Your vault is empty'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
                {searchTerm ? 'Adjust your search parameters.' : 'Upload your first contract to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-700/50">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
                  <tr>
                    <th 
                      className="py-5 px-6 text-left text-sm font-semibold text-slate-900 dark:text-white cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                      onClick={() => sortDocuments('title')}
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <span>Document Title</span>
                        {getSortIcon('title')}
                      </div>
                    </th>
                    <th className="py-5 px-6 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Pages
                    </th>
                    <th className="py-5 px-6 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Size
                    </th>
                    <th 
                      className="py-5 px-6 text-left text-sm font-semibold text-slate-900 dark:text-white cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                      onClick={() => sortDocuments('created_at')}
                    >
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span>Upload Date</span>
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="py-5 px-6 text-right text-sm font-semibold text-slate-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50 bg-white/30 dark:bg-slate-900/30">
                  {sortedDocs.map((doc, index) => (
                    <tr 
                      key={doc.id} 
                      className="hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group animate-fade-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => handleRowClick(doc.id)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-xl shadow-sm border border-indigo-200/50 dark:border-indigo-700/50 group-hover:scale-105 transition-transform">
                            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {doc.title}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              ID: {doc.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                        {doc.pages || '-'}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDropdownOpen(dropdownOpen === doc.id ? null : doc.id);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          
                          {dropdownOpen === doc.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl shadow-glass border border-slate-200/50 dark:border-slate-700/50 z-10 overflow-hidden animate-scale-in">
                              <div className="py-1 flex flex-col">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowClick(doc.id);
                                  }}
                                  className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>Open Chat</span>
                                </button>
                                <button
                                  onClick={(e) => handleDeleteClick(doc, e)}
                                  className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-scale-in">
          <div className="glass-panel rounded-3xl max-w-md w-full p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Delete Document
              </h3>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 mb-8 font-light leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{documentToDelete?.title}"</span>? This action cannot be undone and will permanently erase vector embeddings from the FAISS index.
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDocumentToDelete(null);
                }}
                disabled={isDeleting}
                className="btn-legal-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="btn-premium !bg-red-600 hover:!bg-red-700 !border-red-700 flex-1 flex items-center justify-center space-x-2"
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setDropdownOpen(null)}
        ></div>
      )}
    </div>
  );
}