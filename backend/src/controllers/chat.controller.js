const { chat } = require("../rag/chat");

async function chatController(req, res) {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required."
      });
    }

    const result = await chat({
      message,
      history
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Chat controller error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Unable to process your request right now. Please try again."
    });
  }
}

module.exports = {
  chatController
};