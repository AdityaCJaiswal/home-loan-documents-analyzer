import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload as UploadIcon, File, CheckCircle, AlertCircle, X, Scale, Shield } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function Upload() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const acceptedFormats = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt'
  };

  const maxFileSize = 10 * 1024 * 1024;

  const validateFile = (file) => {
    if (!file) return { valid: false, error: 'No file selected' };
    
    if (!Object.keys(acceptedFormats).includes(file.type)) {
      return { valid: false, error: 'Unsupported file format. Please upload PDF, DOCX, or TXT files only.' };
    }
    
    if (file.size > maxFileSize) {
      return { valid: false, error: 'File exceeds maximum size of 10MB. Please upload a smaller document.' };
    }
    
    return { valid: true };
  };

  const handleFileSelect = (file) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    setUploadSuccess(false);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:8000/api/upload/', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': Cookies.get('csrftoken'),
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      setUploadSuccess(true);
      setTimeout(() => {
        const { id } = response.data;
        navigate(`/chat?doc=${id}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Upload failed. Please verify your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-12 pb-12 animate-fade-up">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Professional Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 transition-colors duration-200 border border-slate-200 dark:border-slate-700 backdrop-blur-sm"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-sky-500 dark:to-indigo-500 rounded-xl shadow-md">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Ingest Document
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Securely upload files to your encrypted workspace.
              </p>
            </div>
          </div>
        </div>

        {/* Security Banner */}
        <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-sky-500 flex items-start space-x-4">
          <Shield className="h-6 w-6 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Encrypted Ingestion Pipeline</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Documents are processed with highly secure SOC2 configurations. Files are parsed strictly for vector embedding and are never transmitted to third parties.
            </p>
          </div>
        </div>

        {/* Main Upload Card */}
        <div className="glass-panel p-8 sm:p-12 rounded-3xl">
          
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
              dragActive
                ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-900/20'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20'
                : 'border-slate-300 dark:border-slate-600 hover:border-sky-400 dark:hover:border-sky-500 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={Object.values(acceptedFormats).join(',')}
              onChange={handleInputChange}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
            />

            {!selectedFile ? (
              <div className="space-y-6 animate-scale-in">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700/50 rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/50 dark:border-slate-600/50">
                  <UploadIcon className="h-8 w-8 text-slate-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Drag and drop your contract
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mb-2">
                    or{' '}
                    <span className="text-sky-600 dark:text-sky-400 font-semibold cursor-pointer hover:underline">
                      browse files
                    </span>
                  </p>
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <span className="badge-glass-safe">PDF</span>
                    <span className="badge-glass-safe">DOCX</span>
                    <span className="badge-glass-safe">TXT</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-scale-in">
                <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-200 dark:border-emerald-800/50">
                  <File className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="text-left bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-200 w-full sm:w-auto min-w-[250px]">
                    <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-red-200 dark:border-red-800/50"
                  >
                    <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-8 animate-fade-up">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Processing document...
                </span>
                <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                <div
                  className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <div className="mt-8 badge-glass-safe w-full p-4 justify-start text-sm animate-fade-up">
              <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <span>Upload Successful! Generating FAISS Embeddings and routing to analytics pipeline...</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-8 badge-glass-danger w-full p-4 justify-start text-sm animate-fade-up">
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Button */}
          {selectedFile && !uploading && !uploadSuccess && (
            <div className="mt-8 animate-fade-up">
              <button
                onClick={handleFileUpload}
                className="w-full btn-premium-accent py-4 text-lg"
              >
                <UploadIcon className="h-5 w-5 mr-3" />
                <span>Begin Analysis</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}