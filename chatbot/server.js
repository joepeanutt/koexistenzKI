const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();


const app = express();
app.use(express.json());
// Stellt das public-Verzeichnis als Web-Root bereit
app.use(express.static(__dirname + '/../public'));

// Fallback: index.html für alle unbekannten GET-Routen (Single Page App Support)
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/../public/index.html');
});

app.post("/chat", async (req, res) => {
  const { messages } = req.body;

  try {
    const response = await fetch("https://api.mammouth.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MAMMOUTH_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: `Du bist ein hilfreicher KI-Assistent auf einer Schul-Seminarkurs-Website über das Thema \"KI & Un/Frieden\". Du hilfst Besuchern bei Fragen über:\n- Künstliche Intelligenz und ihre gesellschaftlichen Auswirkungen\n- Die Themen: Arbeitswelt, Politik, Überwachung, Bildung\n- Chancen und Risiken von KI\nAntworte immer auf Deutsch, freundlich und verständlich.`
          },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || response.statusText || 'Unbekannter Fehler';
      console.error('API Fehler:', msg);
      return res.status(response.status).json({ reply: '❌ API-Fehler: ' + msg });
    }
    const data = await response.json();
    console.log('MammouthAI API Antwort:', JSON.stringify(data, null, 2));
    let reply = '';
    if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      reply = data.choices[0].message.content;
    } else if (data.error) {
      reply = '❌ API-Fehler: ' + (data.error.message || JSON.stringify(data.error));
    } else {
      reply = '❌ Keine Antwort von der KI erhalten.';
    }
    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "API Fehler" });
  }
});

app.listen(3000, () => {
  console.log("✅ Server läuft auf http://localhost:3000");
});
