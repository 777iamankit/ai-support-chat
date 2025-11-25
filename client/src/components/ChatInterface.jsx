import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import chatStore from '../stores/ChatStore';
import './ChatInterface.css';

const ChatInterface = observer(() => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatStore.messages]);

  useEffect(() => {
    if (!chatStore.currentSession) {
      chatStore.createSession();
    }
    chatStore.loadKnowledgeDocuments();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatStore.isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await chatStore.sendMessage(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>AI Customer Support</h2>
        <div className="session-info">
          {chatStore.currentSession && (
            <>
              <span>Session: {chatStore.currentSession._id.slice(-8)}</span>
              <span className="message-count">
                {chatStore.messages.length} messages
              </span>
            </>
          )}
        </div>
      </div>

      <div className="messages-container">
        {chatStore.messages.length === 0 ? (
          <div className="empty-state">
            <div className="welcome-icon">🤖</div>
            <h3>Welcome to AI Support!</h3>
            <p>How can I help you today? Ask me anything about our services.</p>
          </div>
        ) : (
          chatStore.messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.type} ${message.isError ? 'error' : ''}`}
            >
              <div className="message-avatar">
                {message.type === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                <div className="message-timestamp">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        {chatStore.isLoading && (
          <div className="message ai">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="input-form">
        <div className="input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            disabled={chatStore.isLoading}
          />
          <button 
            type="submit" 
            disabled={!inputMessage.trim() || chatStore.isLoading}
            className="send-button"
          >
            {chatStore.isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </form>
    </div>
  );
});

export default ChatInterface;