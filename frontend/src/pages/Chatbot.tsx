
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SendIcon, SparkleIcon, UserIcon } from "../components/icons";
import "../styles/shared.css";
import "./Chatbot.css";

interface ChatSource {
  medicine: string;
  topic: string;
  source: string;
  source_url: string;
  similarity: number;
}

interface ChatMessage {
  id: number;
  sender: "user" | "bot";
  text: string;
  sources?: ChatSource[];
}

interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    sender: "bot",
    text:
      "Hi! I'm your MedCare assistant. Ask me about a medicine's common uses, side effects, or precautions. I share general, educational information only — always confirm with your doctor before making any changes.",
  },
];

async function sendChatMessage(message: string): Promise<ChatResponse> {
  const token = localStorage.getItem("token");

  const response = await fetch("http://localhost:5000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || data.error || "Failed to get a response from the chatbot."
    );
  }

  return data;
}

function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const text = input.trim();

    if (!text || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const data = await sendChatMessage(text);

      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: data.answer,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);

      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text:
          error instanceof Error
            ? error.message
            : "Sorry, I couldn't connect to the medical assistant. Please try again.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="chatbot-page">
      <div className="page-header">
        <div>
          <h2>AI Chatbot</h2>
          <p>
            Educational information only — not a substitute for professional
            medical advice.
          </p>
        </div>
      </div>

      <div className="chatbot-window">
        <div className="chatbot-messages">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`chatbot-message chatbot-message-${m.sender}`}
            >
              <div className="chatbot-avatar">
                {m.sender === "bot" ? (
                  <SparkleIcon width={16} height={16} />
                ) : (
                  <UserIcon width={16} height={16} />
                )}
              </div>

              <div>
                <div className="chatbot-bubble">{m.text}</div>

                {m.sender === "bot" &&
                  m.sources &&
                  m.sources.length > 0 && (
                    <div className="chatbot-sources">
                      <strong>Sources:</strong>

                      {m.sources.map((source, index) => (
                        <a
                          key={index}
                          href={source.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="chatbot-source"
                        >
                          {source.source} — {source.medicine} ({source.topic})
                        </a>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chatbot-message chatbot-message-bot">
              <div className="chatbot-avatar">
                <SparkleIcon width={16} height={16} />
              </div>

              <div className="chatbot-bubble chatbot-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <form className="chatbot-input-row" onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a medicine, its uses, or side effects..."
            disabled={isTyping}
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!input.trim() || isTyping}
          >
            <SendIcon width={16} height={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chatbot;