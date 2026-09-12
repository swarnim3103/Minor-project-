import { useEffect, useRef, useState, type FormEvent } from "react";
import { SendIcon, SparkleIcon, UserIcon } from "../components/icons";
import "../styles/shared.css";
import "./Chatbot.css";

interface ChatMessage {
  id: number;
  sender: "user" | "bot";
  text: string;
}

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    sender: "bot",
    text:
      "Hi! I'm your MedCare assistant. Ask me about a medicine's common uses, side effects, or precautions. I share general, educational information only — always confirm with your doctor before making any changes.",
  },
];

// TODO: replace with a real call to POST /api/chatbot, which will
// proxy to the Gemini API on the backend.
function getMockReply(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("metformin")) {
    return "Metformin is commonly used to manage blood sugar in type 2 diabetes. It's often taken with food to reduce stomach upset. Common side effects include nausea and mild digestive discomfort. This is general information only — please confirm dosage and suitability with your doctor.";
  }
  if (q.includes("side effect")) {
    return "Side effects vary by medicine and person. Common ones include mild nausea, drowsiness, or headache, but some medicines carry more serious risks. Let me know which medicine you're asking about, and always report new or severe symptoms to your doctor.";
  }
  return "That's a good question. I can share general educational information about medicine uses, side effects, and precautions, but for anything specific to your health, please consult your doctor or pharmacist.";
}

function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMessage: ChatMessage = { id: Date.now(), sender: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "bot", text: getMockReply(text) },
      ]);
      setIsTyping(false);
    }, 700);
  }

  return (
    <div className="chatbot-page">
      <div className="page-header">
        <div>
          <h2>AI Chatbot</h2>
          <p>Educational information only — not a substitute for professional medical advice.</p>
        </div>
      </div>

      <div className="chatbot-window">
        <div className="chatbot-messages">
          {messages.map((m) => (
            <div key={m.id} className={`chatbot-message chatbot-message-${m.sender}`}>
              <div className="chatbot-avatar">
                {m.sender === "bot" ? <SparkleIcon width={16} height={16} /> : <UserIcon width={16} height={16} />}
              </div>
              <div className="chatbot-bubble">{m.text}</div>
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
          />
          <button type="submit" className="btn btn-primary" disabled={!input.trim()}>
            <SendIcon width={16} height={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chatbot;
