let chatMessages = [];

function toggleChatbot() {
  const window = document.getElementById("chatbot-window");
  window.classList.toggle("hidden");
}

async function sendChatMessage() {
  const input = document.getElementById("chatbot-input");
  const text = input.value.trim();
  if (!text) return;

  // User Nachricht anzeigen
  addChatMessage(text, "user");
  chatMessages.push({ role: "user", content: text });
  input.value = "";

  // Typing Indicator
  const typing = document.createElement("div");
  typing.className = "chat-message bot typing";
  typing.id = "typing-indicator";
  typing.innerHTML = "<span>⏳ Schreibt...</span>";
  document.getElementById("chatbot-messages").appendChild(typing);
  scrollChat();

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatMessages })
    });

    const data = await response.json();
    document.getElementById("typing-indicator")?.remove();

    addChatMessage(data.reply, "bot");
    chatMessages.push({ role: "assistant", content: data.reply });

  } catch (error) {
    document.getElementById("typing-indicator")?.remove();
    addChatMessage("❌ Verbindungsfehler. Bitte versuche es erneut.", "bot");
  }
}


function addChatMessage(text, type) {
  const div = document.createElement("div");
  div.className = `chat-message ${type}`;
  // Einfache Markdown-zu-HTML-Umwandlung für **fett**
  let html = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  div.innerHTML = html;
  document.getElementById("chatbot-messages").appendChild(div);
  scrollChat();
}

function scrollChat() {
  const msgs = document.getElementById("chatbot-messages");
  msgs.scrollTop = msgs.scrollHeight;
}
