# KI-Chatbot für Seminarkurs

Dieses Projekt enthält eine Website mit einem KI-Chatbot, der Fragen zu Künstlicher Intelligenz beantworten kann.

## Features

- **Intelligenter Chatbot**: Verwendet OpenAI GPT-3.5 für natürliche Konversationen
- **Themenspezifisch**: Spezialisiert auf KI-Themen (Definition, Anwendungen, Risiken, etc.)
- **Responsive Design**: Funktioniert auf Desktop und Mobile
- **Dark Mode**: Unterstützt hellen und dunklen Modus
- **API-Only**: Erfordert OpenAI API-Schlüssel für vollständige Funktionalität

## Setup

1. **Dependencies installieren**:
   ```bash
   npm install
   ```

2. **OpenAI API-Schlüssel einrichten** (erforderlich):
   - Erstelle einen Account bei [OpenAI](https://platform.openai.com/)
   - Generiere einen API-Schlüssel
   - Erstelle eine `.env` Datei im Projektverzeichnis:
     ```
     OPENAI_API_KEY=sk-...dein_api_schluessel...
     ```

3. **Server starten**:
   ```bash
   npm start
   ```
   Oder für Entwicklung:
   ```bash
   npm run dev
   ```

4. **Website öffnen**:
   - Öffne `index.html` in deinem Browser
   - Der Chatbot ist rechts unten verfügbar
   ```bash
   npm start
   ```
   Oder für Entwicklung:
   ```bash
   npm run dev
   ```

4. **Website öffnen**:
   - Öffne `index.html` in deinem Browser
   - Der Chatbot ist rechts unten verfügbar

## Verwendung

- Klicke auf das 🤖-Icon rechts unten
- Stelle Fragen zu KI-Themen wie:
  - "Was ist KI?"
  - "KI Risiken"
  - "KI in der Arbeitswelt"
  - "Hilfe" für eine Übersicht

## Technischer Aufbau

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js mit Express
- **KI-API**: OpenAI GPT-3.5-turbo
- **Fallback**: Lokale Antworten bei API-Ausfall

## Sicherheit

- API-Schlüssel wird nur serverseitig verwendet
- CORS ist für lokale Entwicklung konfiguriert
- Keine sensiblen Daten werden gespeichert

## Kosten

- OpenAI API hat Kosten pro Token
- Für Testzwecke: Verwende kostenlose Credits oder deaktiviere API-Schlüssel für Fallback-Modus

## Anpassung

- **Themen**: Bearbeite die System-Prompt in `backend.js`
- **Design**: CSS-Dateien anpassen
- **Antworten**: Fallback-Antworten in `script.js` ändern
Joel Stamler