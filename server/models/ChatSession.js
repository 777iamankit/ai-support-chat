import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  userMessage: { type: String, required: true },
  aiResponse: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  messages: [messageSchema],
  status: { type: String, enum: ['active', 'closed'], default: 'active' }
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession;