
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SendIcon, SparkleIcon, UserIcon } from "../components/icons";
import {
  createSpeechRecognition,
  type SpeechRecognitionResult,
} from "../services/speechService";
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
  text?: string;
  structuredAnswer?: StructuredAnswer;
  sources?: ChatSource[];
}

interface MedicineInfo {
  name: string;
  composition: string;
  uses: string;
  sideEffects: string[];
}

interface StructuredAnswer {
  title: string;
  summary: string;
  standaloneAvailable: boolean;
  medicines: MedicineInfo[];
  warning: string;
}

interface ChatResponse {
  answer: StructuredAnswer;
  sources: ChatSource[];
  verified?: boolean;
  similarity?: number;
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
function MedicineAnswer({
  answer,
}: {
  answer: StructuredAnswer;
}) {
  return (
    <div className="medicine-answer">
      <div className="medicine-answer-header">
        <div className="medicine-icon">💊</div>

        <div>
          <h3>{answer.title}</h3>

          <span
            className={
              answer.standaloneAvailable
                ? "medicine-status available"
                : "medicine-status unavailable"
            }
          >
            {answer.standaloneAvailable
              ? "Standalone medicine found"
              : "No standalone entry found"}
          </span>
        </div>
      </div>

      <p className="medicine-summary">
        {answer.summary}
      </p>

      {answer.medicines.length > 0 && (
        <div className="medicine-list">
          <h4>Available medicines</h4>

          {answer.medicines.map((medicine, index) => (
            <div
              className="medicine-card"
              key={`${medicine.name}-${index}`}
            >
              <h4>{medicine.name}</h4>

              <div className="medicine-section">
                <span>Composition</span>
                <p>{medicine.composition}</p>
              </div>

              <div className="medicine-section">
                <span>Uses</span>
                <p>{medicine.uses}</p>
              </div>

              {medicine.sideEffects.length > 0 && (
                <div className="medicine-section">
                  <span>Common side effects</span>

                  <ul>
                    {medicine.sideEffects.map(
                      (effect, effectIndex) => (
                        <li key={effectIndex}>
                          {effect}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {answer.warning && (
        <div className="medicine-warning">
          <span>⚠️</span>

          <div>
            <strong>Medical guidance</strong>
            <p>{answer.warning}</p>
          </div>
        </div>
      )}
    </div>
  );
}
function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
const [speechError, setSpeechError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);
function handleSpeechResult(
  result: SpeechRecognitionResult
) {
  setInput(result.transcript);
}

function startListening() {
  if (isTyping) return;

  setSpeechError("");

  try {
    const recognition = createSpeechRecognition(
      handleSpeechResult,
      (error) => {
        console.error("Speech recognition error:", error);
        setSpeechError(error);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    recognitionRef.current = recognition;

    recognition.start();

    setIsListening(true);
  } catch (error) {
    console.error(
      "Unable to start speech recognition:",
      error
    );

    setSpeechError(
      error instanceof Error
        ? error.message
        : "Speech recognition is not available."
    );

    setIsListening(false);
  }
}

function stopListening() {
  recognitionRef.current?.stop();
  recognitionRef.current = null;
  setIsListening(false);
}

function toggleListening() {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
}
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const text = input.trim();

    if (!text || isTyping) return;
if (isListening) {
  stopListening();
}
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
    structuredAnswer: data.answer,
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
              {m.sender === "bot" && m.structuredAnswer ? (
  <div className="chatbot-bubble chatbot-structured-bubble">
    <MedicineAnswer answer={m.structuredAnswer} />
  </div>
) : (
  <div className="chatbot-bubble">
    {m.text}
  </div>
)}

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
 {speechError && (
    <div className="chatbot-speech-error">
      {speechError}
    </div>
  )}
      <form className="chatbot-input-row" onSubmit={handleSubmit}>
  <input
    value={input}
    onChange={(e) => setInput(e.target.value)}
    placeholder={
      isListening
        ? "Listening..."
        : "Ask about a medicine, its uses, or side effects..."
    }
    disabled={isTyping}
  />

  <button
    type="button"
    className={`chatbot-mic-button ${
      isListening ? "chatbot-mic-listening" : ""
    }`}
    onClick={toggleListening}
    disabled={isTyping}
    title={isListening ? "Stop dictation" : "Start dictation"}
    aria-label={isListening ? "Stop dictation" : "Start dictation"}
  >
    {isListening ? "🔴" : "🎙️"}
  </button>

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