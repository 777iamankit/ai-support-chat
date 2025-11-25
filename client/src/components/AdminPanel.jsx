import React, { useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import chatStore from '../stores/ChatStore';
import './AdminPanel.css';

const AdminPanel = observer(() => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
        setUploadStatus('');
      } else {
        setUploadStatus('Error: Please select a PDF, TXT, or DOCX file');
        setSelectedFile(null);
      }
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('Uploading...');

    try {
      await chatStore.uploadDocument(selectedFile);
      setUploadStatus('Document uploaded successfully!');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadStatus('Error uploading document: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await chatStore.deleteDocument(documentId);
        setUploadStatus('Document deleted successfully!');
      } catch (error) {
        setUploadStatus('Error deleting document: ' + error.message);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Knowledge Base Management</h2>
        <p>Upload FAQ documents to enhance AI responses</p>
      </div>
      
      <div className="upload-section">
        <div className="upload-card">
          <h3>Upload FAQ Document</h3>
          <form onSubmit={handleFileUpload} className="upload-form">
            <div className="file-input-container">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.txt,.docx"
                disabled={isUploading}
                className="file-input"
              />
              <div className="file-input-label">
                {selectedFile ? selectedFile.name : 'Choose PDF, TXT, or DOCX file'}
              </div>
            </div>
            <button 
              type="submit" 
              disabled={!selectedFile || isUploading}
              className="upload-button"
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>
          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.includes('Error') ? 'error' : 'success'}`}>
              {uploadStatus}
            </div>
          )}
        </div>
      </div>

      <div className="documents-section">
        <div className="documents-card">
          <h3>Uploaded Documents ({chatStore.knowledgeDocuments.length})</h3>
          {chatStore.knowledgeDocuments.length === 0 ? (
            <div className="empty-documents">
              <div className="empty-icon">📚</div>
              <p>No documents uploaded yet.</p>
              <p>Upload FAQ documents to help the AI provide better responses.</p>
            </div>
          ) : (
            <div className="documents-grid">
              {chatStore.knowledgeDocuments.map((doc) => (
                <div key={doc._id} className="document-card">
                  <div className="document-header">
                    <div className="document-icon">
                      {doc.fileType === 'application/pdf' ? '📄' : 
                       doc.fileType === 'text/plain' ? '📝' : '📘'}
                    </div>
                    <div className="document-info">
                      <h4 className="document-title">{doc.filename}</h4>
                      <div className="document-meta">
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize || 0)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc._id)}
                      className="delete-button"
                      title="Delete document"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="document-preview">
                    {doc.content.substring(0, 150)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default AdminPanel;