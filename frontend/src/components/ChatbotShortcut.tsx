import { useLocation, useNavigate } from "react-router-dom";
import { SparkleIcon } from "./icons";
import "./ChatbotShortcut.css";

function ChatbotShortcut() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show the shortcut while already on the chatbot page.
  if (location.pathname === "/chatbot") {
    return null;
  }

  return (
    <button
      className="chatbot-shortcut"
      onClick={() => navigate("/chatbot")}
      aria-label="Open AI Chatbot"
      title="Open AI Chatbot"
    >
      <SparkleIcon width={23} height={23} />
    </button>
  );
}

export default ChatbotShortcut;