let chatMessages = [];

function toggleChatbot() {
  const chatWindow = document.getElementById("chatbot-window");
  const icon = document.getElementById("chatbot-icon");

  if (!chatWindow) return;

  if (icon) {
    icon.classList.remove("press-pop");
    // Reflow to restart animation on every click
    void icon.offsetWidth;
    icon.classList.add("press-pop");
  }

  const shouldOpen = chatWindow.classList.contains("hidden");

  if (shouldOpen) {
    chatWindow.classList.remove("hidden");
    chatWindow.classList.remove("is-opening");
    // Reflow to ensure the opening animation is replayed every time
    void chatWindow.offsetWidth;
    chatWindow.classList.add("is-opening");
    window.setTimeout(() => {
      chatWindow.classList.remove("is-opening");
    }, 520);
  } else {
    chatWindow.classList.add("hidden");
  }
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
