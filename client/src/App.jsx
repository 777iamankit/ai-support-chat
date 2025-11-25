import React, { useState } from "react";
import ChatInterface from "./components/ChatInterface";
import AdminPanel from "./components/AdminPanel";
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState("chat");

  return (
    <div className="App">
      <nav className="app-nav">
        <button
          className={currentView === "chat" ? "active" : ""}
          onClick={() => setCurrentView("chat")}
        >
          Chat Support
        </button>
        <button
          className={currentView === "admin" ? "active" : ""}
          onClick={() => setCurrentView("admin")}
        >
          Admin Panel
        </button>
      </nav>

      <main className="app-main">
        {currentView === "chat" ? <ChatInterface /> : <AdminPanel />}
      </main>
    </div>
  );
}

export default App;
