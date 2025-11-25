import { makeAutoObservable } from 'mobx';
import axios from 'axios';

class ChatStore {
  sessions = [];
  currentSession = null;
  messages = [];
  isLoading = false;
  knowledgeDocuments = [];

  constructor() {
    makeAutoObservable(this);
    this.initializeAxios();
  }

  initializeAxios() {
    axios.defaults.baseURL = 'http://localhost:5000';
  }

  async createSession(userId = 'anonymous') {
    this.isLoading = true;
    try {
      const response = await axios.post('/api/chat/session', { userId });
      this.currentSession = response.data;
      this.sessions.push(response.data);
      this.messages = [];
      return response.data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async sendMessage(message) {
    if (!this.currentSession) {
      await this.createSession();
    }

    this.isLoading = true;
    
    // Add user message immediately
    const userMessage = {
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    this.messages.push(userMessage);

    try {
      const response = await axios.post('/api/chat/message', {
        sessionId: this.currentSession._id,
        message: message
      });

      // Add AI response
      const aiMessage = {
        type: 'ai',
        content: response.data.response,
        timestamp: new Date()
      };
      this.messages.push(aiMessage);

      return aiMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      this.messages.push(errorMessage);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/knowledge/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      this.knowledgeDocuments.push(response.data.document);
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  async loadKnowledgeDocuments() {
    try {
      const response = await axios.get('/api/knowledge/documents');
      this.knowledgeDocuments = response.data;
    } catch (error) {
      console.error('Error loading documents:', error);
      throw error;
    }
  }

  async deleteDocument(documentId) {
    try {
      await axios.delete(`/api/knowledge/documents/${documentId}`);
      this.knowledgeDocuments = this.knowledgeDocuments.filter(doc => doc._id !== documentId);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  clearMessages() {
    this.messages = [];
  }
}

export default new ChatStore();