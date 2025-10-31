import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload as UploadIcon, File, CheckCircle, AlertCircle, X, Scale, Shield, FileCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-[#fafbfc] via-[#f4f6f8] to-[#e8ecf0]">
      <div className="container mx-auto px-4 py-8">
        
        {/* Professional Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-3 rounded-full hover:bg-white/50 transition-colors duration-200 border-2 border-gray-300"
          >
            <ArrowLeft className="h-6 w-6 text-[#1e3a5f]" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-4 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] rounded-2xl shadow-xl">
              <Scale className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#1e3a5f]">
                Upload Legal Document
              </h1>
              <p className="text-gray-600 mt-1 font-medium">
                Secure document upload for AI-powered legal analysis
              </p>
            </div>
          </div>
        </div>

        {/* Security Banner */}
        <div className="max-w-3xl mx-auto mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-[#1e3a5f] p-5 rounded-xl shadow-md">
          <div className="flex items-start space-x-4">
            <Shield className="h-7 w-7 text-[#1e3a5f] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">Secure & Confidential</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Your documents are processed with enterprise-grade security. All files are encrypted during 
                transmission and storage. We never share your legal documents with third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Main Upload Card */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-10 border-2 border-gray-200">
            
            {/* Upload Area */}
            <div
              className={`relative border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-[#1e3a5f] bg-blue-50'
                  : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-[#8b5a3c] hover:bg-gray-50'
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
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {!selectedFile ? (
                <div className="space-y-6">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] rounded-2xl flex items-center justify-center shadow-lg">
                    <UploadIcon className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1e3a5f] mb-3">
                      Drop your legal document here
                    </p>
                    <p className="text-gray-600 mb-2">
                      or{' '}
                      <span className="text-[#8b5a3c] font-semibold cursor-pointer hover:underline">
                        browse files
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 mt-4">
                      Supported formats: PDF, DOCX, TXT • Maximum size: 10MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <File className="h-12 w-12 text-white" />
                  </div>
                  <div className="flex items-center justify-center space-x-4">
                    <div className="text-left bg-white p-4 rounded-lg border-2 border-green-200 flex-1 max-w-md">
                      <p className="text-lg font-bold text-[#1e3a5f] truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 font-medium">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <button
                      onClick={removeFile}
                      className="p-3 rounded-full hover:bg-red-100 transition-colors border-2 border-red-200"
                    >
                      <X className="h-6 w-6 text-red-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-semibold text-[#1e3a5f]">
                    Processing document...
                  </span>
                  <span className="text-base font-bold text-[#8b5a3c]">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden border border-gray-300">
                  <div
                    className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8f] h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Encrypting and uploading your document securely
                </p>
              </div>
            )}

            {/* Success Message */}
            {uploadSuccess && (
              <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-500 rounded-full">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-800">
                      Upload Successful!
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Redirecting to legal analysis platform...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-red-500 rounded-full flex-shrink-0">
                    <AlertCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-800">Upload Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            {selectedFile && !uploading && !uploadSuccess && (
              <div className="mt-8">
                <button
                  onClick={handleFileUpload}
                  className="w-full bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8f] hover:from-[#152d47] hover:to-[#1e3a5f] text-white font-bold py-5 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl text-lg flex items-center justify-center space-x-3"
                >
                  <UploadIcon className="h-6 w-6" />
                  <span>Upload Document for Analysis</span>
                </button>
              </div>
            )}

            {/* File Format Info */}
            <div className="mt-10 pt-8 border-t-2 border-gray-200">
              <h3 className="text-lg font-bold text-[#1e3a5f] mb-5 flex items-center">
                <FileCheck className="h-5 w-5 mr-2" />
                Supported Document Formats
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                      <File className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-red-800 font-bold text-center text-lg">PDF</div>
                  <div className="text-xs text-red-700 text-center mt-1 font-medium">
                    Portable Document
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <File className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-blue-800 font-bold text-center text-lg">DOCX</div>
                  <div className="text-xs text-blue-700 text-center mt-1 font-medium">
                    Word Document
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <File className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-green-800 font-bold text-center text-lg">TXT</div>
                  <div className="text-xs text-green-700 text-center mt-1 font-medium">
                    Plain Text File
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="max-w-3xl mx-auto mt-8 bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-[#1e3a5f] mb-3 flex items-center">
            <Scale className="h-5 w-5 mr-2" />
            What Happens Next?
          </h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>Your document is securely uploaded and encrypted</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>AI processes and analyzes the content using advanced NLP</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>You can chat with our legal AI about your document and run risk analysis</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}