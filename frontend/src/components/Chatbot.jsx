import { useState } from "react";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);

    const userMessage = { text: input, sender: "user" };
    setMessages([...messages, userMessage]);

    try {
      const response = await fetch("http://localhost:8000/api/chatbot/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });
      const data = await response.json();

      const botMessage = { text: data.response, sender: "bot" };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <div className="  p-4 shadow-lg w-200% rounded-lg bg-white z-50">
      <div className="h-80 overflow-y-auto border p-2">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 text-sm ${msg.sender === "user" ? "text-right" : ""}`}>
            <span className={`inline-block px-3 py-1 rounded-lg ${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      <div className="flex mt-2">
        <input
          type="text"
          className="flex-1 border p-2 rounded-l-lg"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about project, tasks..."
        />
        <button onClick={sendMessage} className="bg-blue-500 text-white px-3 py-2 rounded-r-lg" disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
