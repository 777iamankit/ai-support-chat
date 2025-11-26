🤖 AI-Powered Conversations Project

A real-time AI chat interface with a knowledge base, context-aware responses, and an admin panel for managing documents.


project link: [https://ai-support-chat-frontend.onrender.com]


✨ Features
1>AI-Powered Conversations

2>Real-time chat interface with AI assistant

3>Context-aware responses using Groq AI

4>Intelligent conversation handling

5>Typing indicators and smooth user experience

6>Knowledge Base Management

7>Upload FAQ documents: PDF, TXT, DOCX

8>AI leverages uploaded content for accurate responses

10>Document preview and management





Secure file processing

User Experience

Responsive design for all devices

Session management

Chat history persistence

Admin panel for document and knowledge base management





🛠️ Technical Features

Database: MongoDB Atlas for data storage

Backend: Express.js RESTful APIs

Frontend: React with MobX for state management

File Uploads: Multer

CORS: Enabled for cross-origin requests





🏗️ Architecture
Frontend (React)
       ↓
Backend (Express.js)
       ↓
AI API (Groq)
       ↓
Database (MongoDB Atlas)





Frontend: Client UI, state management

Backend: Business logic, file processing

AI API: Context-aware AI responses

Database: Session history and document storage






🛠️ Technology Stack

Frontend

React 18 – UI framework

MobX – State management

Axios – HTTP client

Vite – Build tool

CSS3 – Styling




Backend

Node.js – Runtime environment

Express.js – Web framework

MongoDB – Database

Mongoose – ODM

Multer – File uploads

CORS – Cross-origin requests

AI & APIs

Groq API – AI language model

PDF-parse – PDF text extraction

Mammoth – DOCX text extraction

Deployment

Render – Hosting platform

MongoDB Atlas – Cloud database





📦 Installation & Local Development
Prerequisites

Node.js (v18 or higher)

MongoDB (local or Atlas)

Groq API account

Steps

Clone the repository:

git clone https://github.com/yourusername/your-repo.git


Navigate to the project directory:

cd your-repo







Install dependencies:

npm install






Set up environment variables in .env:

MONGODB_ATLAS_URI=your_mongodb_atlas_connection_string
GROQ_API_KEY=your_groq_api_key
PORT=5000






Start the backend server:

npm run server


Start the frontend:

npm run dev


Open your browser at http://localhost:5173