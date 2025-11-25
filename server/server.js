import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI || 
                   process.env.MONGODB_ATLAS_URI || 
                   'mongodb://127.0.0.1:27017/ai-support-chat';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.log('💡 Connection URI used:', MONGODB_URI.replace(/mongodb\+srv:\/\/[^:]+:[^@]+@/, 'mongodb+srv://username:password@'));
  });

// Import models
import './models/ChatSession.js';
import './models/KnowledgeDocument.js';

const ChatSession = mongoose.model('ChatSession');
const KnowledgeDocument = mongoose.model('KnowledgeDocument');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Groq API integration with better error handling
async function getGroqResponse(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  
  // Check if API key is set
  if (!apiKey || apiKey === 'PASTE_YOUR_GROQ_KEY_HERE') {
    throw new Error('Groq API key not configured. Please check your .env file');
  }

  // Check if API key format is valid
  if (!apiKey.startsWith('gsk_')) {
    throw new Error('Invalid Groq API key format. Key should start with "gsk_"');
  }

  try {
    console.log('🔄 Sending request to Groq API...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful customer support assistant. Provide accurate, friendly responses based on the context provided. Keep responses concise and professional.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      })
    });

    console.log(`📡 Groq API response status: ${response.status}`);
    
    if (response.status === 401) {
      throw new Error('Invalid Groq API key. Please check your API key in the .env file');
    }
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Groq API');
    }
    
    console.log('✅ Successfully received response from Groq API');
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error('❌ Groq API error:', error.message);
    throw new Error(`AI service error: ${error.message}`);
  }
}

// Fallback mock responses when API fails
function getMockResponse(message, context) {
  const responses = [
    `I understand you're asking about "${message}". Based on our documentation, I'd be happy to help you with this.`,
    `Thank you for your question about "${message}". Our team is here to assist you with this matter.`,
    `I see you need help with "${message}". Let me provide you with the best information we have available.`,
    `That's a great question about "${message}". Based on our resources, here's what I can tell you...`,
    `I appreciate you reaching out about "${message}". Let me guide you through the solution.`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Routes
app.post('/api/chat/session', async (req, res) => {
  try {
    const session = new ChatSession({
      userId: req.body.userId || 'anonymous',
      startedAt: new Date()
    });
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' });
    }
    
    console.log(`💬 Received message: ${message}`);
    
    // Get relevant knowledge base content
    const knowledgeDocs = await KnowledgeDocument.find({});
    const knowledgeContext = knowledgeDocs.map(doc => doc.content).join('\n\n');
    
    // Create AI prompt with context
    const prompt = `
      You are a customer support assistant. Use the following company information to answer questions accurately:
      
      COMPANY INFORMATION:
      ${knowledgeContext}
      
      CUSTOMER QUESTION: ${message}
      
      Please provide a helpful, accurate response based on the information above. If the information isn't in the provided context, say you don't know but can direct them to human support.
      Be friendly, professional, and concise in your response.
    `;

    let aiResponse;
    
    try {
      // Try to get response from Groq API
      aiResponse = await getGroqResponse(prompt);
    } catch (apiError) {
      console.log('🔄 Falling back to mock response due to API error');
      // Fallback to mock response if API fails
      aiResponse = getMockResponse(message, knowledgeContext);
    }

    // Save message to session
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    session.messages.push({
      userMessage: message,
      aiResponse: aiResponse,
      timestamp: new Date()
    });
    await session.save();

    res.json({ response: aiResponse, sessionId: session._id });
  } catch (error) {
    console.error('❌ Error in chat message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Knowledge base routes (unchanged)
app.post('/api/knowledge/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    let content = '';
    
    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdf(dataBuffer);
      content = pdfData.text;
    } else if (req.file.mimetype === 'text/plain') {
      content = fs.readFileSync(req.file.path, 'utf8');
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: req.file.path });
      content = result.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    const document = new KnowledgeDocument({
      filename: req.file.originalname,
      content: content,
      uploadedAt: new Date(),
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });

    await document.save();
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({ message: 'Document uploaded successfully', document });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/knowledge/documents', async (req, res) => {
  try {
    const documents = await KnowledgeDocument.find().sort({ uploadedAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/knowledge/documents/:id', async (req, res) => {
  try {
    await KnowledgeDocument.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced API status check
app.get('/api/status', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;
    
    const status = {
      server: 'running',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      database_type: mongoURI && mongoURI.includes('mongodb+srv') ? 'atlas' : 'local',
      groq_api: apiKey ? (apiKey.startsWith('gsk_') ? 'configured' : 'invalid_format') : 'not_configured',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
    
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running correctly',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🤖 Using Groq AI API`);
  console.log(`🗄️ Database: ${process.env.MONGODB_URI ? 'Atlas' : 'Local'}`);
  console.log(`📊 Check API status: http://localhost:${PORT}/api/status`);
  console.log(`💬 Chat API ready: http://localhost:${PORT}/api/chat`);
});