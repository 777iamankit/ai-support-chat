import mongoose from 'mongoose';

const knowledgeDocumentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  content: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  fileType: { type: String, required: true },
  fileSize: { type: Number }
});

const KnowledgeDocument = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
export default KnowledgeDocument;