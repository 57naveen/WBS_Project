import { useState } from "react";
import { BACKEND_URL } from "@/constants";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const formatBotResponse = (response) => {
    if (response.tasks && Array.isArray(response.tasks)) {
      return (
        <div>
          {response.tasks.map((task, index) => (
            <div key={index} className="p-2 mb-2 border rounded bg-gray-100 text-left">
              <p className="font-semibold">{task.title}</p>
              <p className="text-sm text-gray-700">{task.description}</p>
              <p className="text-sm text-gray-600">Assigned to: {task.assigned_to_id}</p>
              <p className="text-sm text-gray-600">
                Skills: {task.required_skills.join(", ")}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return response; // fallback if it's plain text
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
  
    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
  
    try {
      const response = await fetch(`${BACKEND_URL}/api/chatbot/query/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });
  
      const data = await response.json();
      let botText = data.response?.response || "Sorry, I couldn't understand the response.";
  
      // If the response is multi-line, split it into an array of lines
      if (botText.includes("\n")) {
        const lines = botText.split("\n").map((line, index) => (
          <div key={index} className="mb-2">{line.trim()}</div>
        ));
        botText = <div>{lines}</div>;
      } else {
        // For single-line response, just show it as is
        botText = <div>{botText.trim()}</div>;
      }
  
      const botMessage = { text: botText, sender: "bot" };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { text: "An error occurred.", sender: "bot" }]);
    }
  
    setInput("");
    setLoading(false);
  };

  return (
    <div className="p-4 shadow-lg w-[100%] rounded-lg bg-white z-50">
      <div className="h-100 overflow-y-auto border p-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 text-sm ${msg.sender === "user" ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block px-3 py-1 rounded-lg max-w-full ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              {msg.isJSX ? msg.text : <span>{msg.text}</span>}
            </div>
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
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-3 py-2 rounded-r-lg"
          disabled={loading}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
