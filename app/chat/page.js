"use client";

import { useRef, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);

  async function sendMessage(text) {
    const userMessage = { role: "user", content: text };
    const history = [...messages, userMessage];
    setMessages([...history, { role: "assistant", content: "" }]);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

      setMessages([
        ...history,
        { role: "assistant", content: data.message.content },
      ]);
    } catch (err) {
      setMessages(history);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    sendMessage(text);
  }

  return (
    <main className="chat">
      <header className="chat-header">
        <h1>Mistral Chat</h1>
        <p>Powered by mistral-small-latest</p>
      </header>

      <div className="messages" ref={listRef}>
        {messages.length === 0 && (
          <p className="empty">Say something to start the conversation.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            <span className="role">{m.role === "user" ? "You" : "Mistral"}</span>
            <p>{m.content || (loading && i === messages.length - 1 ? "…" : "")}</p>
          </div>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      <form className="composer" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={loading}
          autoFocus
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "…" : "Send"}
        </button>
      </form>
    </main>
  );
}
