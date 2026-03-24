const questions = [
  {
    question: "Wofür steht die Abkürzung KI?",
    answers: ["Kognitive Integration", "Künstliche Intelligenz", "Kreative Informatik", "Komplexe Interaktion"],
    correctIndex: 1,
    explanation: "KI bedeutet Künstliche Intelligenz und beschreibt Systeme, die intelligente Aufgaben ausführen können."
  },
  {
    question: "Was ist ein typisches Beispiel für KI im Alltag?",
    answers: ["Taschenrechner ohne Lernfunktion", "Textverarbeitung ohne Autokorrektur", "Sprachassistent wie Siri", "USB-Stick"],
    correctIndex: 2,
    explanation: "Sprachassistenten nutzen KI, um Sprache zu verstehen und passende Antworten zu geben."
  },
  {
    question: "Welche Aussage passt am besten zu Machine Learning?",
    answers: ["Computer lernen aus Daten", "Computer werden mechanisch gebaut", "Computer arbeiten ohne Algorithmen", "Computer nutzen nur feste Regeln"],
    correctIndex: 0,
    explanation: "Machine Learning trainiert Modelle mit Daten, damit sie Muster erkennen und Vorhersagen treffen."
  },
  {
    question: "Welches Tool ist ein bekanntes KI-Sprachmodell?",
    answers: ["Photoshop", "ChatGPT", "Excel", "PowerPoint"],
    correctIndex: 1,
    explanation: "ChatGPT ist ein großes Sprachmodell für dialogbasierte Aufgaben."
  },
  {
    question: "Wofür wird Midjourney hauptsächlich genutzt?",
    answers: ["Datenbankverwaltung", "Bildgenerierung aus Text", "Tabellenkalkulation", "Netzwerkdiagnose"],
    correctIndex: 1,
    explanation: "Midjourney erstellt Bilder auf Basis von Textbeschreibungen."
  },
  {
    question: "Was ist ein mögliches Risiko von KI-Tools?",
    answers: ["Immer perfekte Objektivität", "Kein Energieverbrauch", "Bias durch verzerrte Trainingsdaten", "Unbegrenzte Genauigkeit"],
    correctIndex: 2,
    explanation: "Wenn Trainingsdaten verzerrt sind, kann das Modell diese Verzerrungen übernehmen."
  },
  {
    question: "Welcher Algorithmus-Typ wird oft für Klassifikation genutzt?",
    answers: ["Sortieralgorithmus Bubble Sort", "Entscheidungsbaum", "Dateikompression ZIP", "Hashfunktion MD5"],
    correctIndex: 1,
    explanation: "Entscheidungsbäume sind ein klassischer Ansatz für Klassifikationsprobleme."
  },
  {
    question: "Was beschreibt ein neuronales Netz am besten?",
    answers: ["Eine Liste von Dateien", "Ein KI-Modell mit verknüpften Schichten künstlicher Neuronen", "Ein Netzwerk aus Routern", "Eine Programmiersprache"],
    correctIndex: 1,
    explanation: "Neuronale Netze bestehen aus Schichten von Knoten, die gemeinsam Muster lernen."
  },
  {
    question: "Was ist der Zweck einer Aktivierungsfunktion in neuronalen Netzen?",
    answers: ["Dateien zu speichern", "Nichtlinearität ins Modell zu bringen", "Die CPU zu kühlen", "Das Netzwerk zu komprimieren"],
    correctIndex: 1,
    explanation: "Aktivierungsfunktionen erlauben dem Modell, komplexe nichtlineare Zusammenhänge zu lernen."
  },
  {
    question: "Warum ist ein separater Testdatensatz wichtig?",
    answers: ["Damit das Modell weniger Daten sieht", "Um die Leistung auf unbekannten Daten fair zu prüfen", "Damit Training schneller läuft", "Um den Speicher zu leeren"],
    correctIndex: 1,
    explanation: "Nur mit unbekannten Testdaten kann man die Generalisierung eines Modells realistisch bewerten."
  }
];

function shuffleArray(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const quizStage = document.getElementById("quizStage");
const resultStage = document.getElementById("resultStage");
const questionText = document.getElementById("questionText");
const answersWrap = document.getElementById("answers");
const feedback = document.getElementById("feedback");
const progressLabel = document.getElementById("progressLabel");
const scoreLabel = document.getElementById("scoreLabel");
const progressBar = document.getElementById("progressBar");
const nextButton = document.getElementById("nextButton");
const restartButton = document.getElementById("restartButton");
const finalScore = document.getElementById("finalScore");
const finalRating = document.getElementById("finalRating");

let currentIndex = 0;
let score = 0;
let answered = false;
let quizQuestions = shuffleArray(questions);

function updateProgress() {
  const questionNumber = currentIndex + 1;
  progressLabel.textContent = `Frage ${questionNumber} von ${quizQuestions.length}`;
  scoreLabel.textContent = `Punkte: ${score}`;
  const percent = (questionNumber / quizQuestions.length) * 100;
  progressBar.style.width = `${percent}%`;
  const track = progressBar.parentElement;
  if (track) {
    track.setAttribute("aria-valuenow", String(Math.round(percent)));
  }
}

function renderQuestion() {
  answered = false;
  nextButton.classList.add("hidden");
  feedback.className = "feedback hidden";
  feedback.textContent = "";
  answersWrap.innerHTML = "";

  const current = quizQuestions[currentIndex];
  questionText.textContent = current.question;
  updateProgress();

  current.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-btn";
    button.textContent = answer;
    button.setAttribute("role", "listitem");
    button.addEventListener("click", () => selectAnswer(index));
    answersWrap.appendChild(button);
  });
}

function selectAnswer(selectedIndex) {
  if (answered) return;
  answered = true;

  const current = quizQuestions[currentIndex];
  const buttons = Array.from(answersWrap.querySelectorAll(".answer-btn"));

  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === current.correctIndex) {
      btn.classList.add("correct");
    }
    if (idx === selectedIndex && idx !== current.correctIndex) {
      btn.classList.add("wrong");
    }
  });

  const isCorrect = selectedIndex === current.correctIndex;
  if (isCorrect) {
    score += 1;
    scoreLabel.textContent = `Punkte: ${score}`;
  }

  feedback.classList.remove("hidden");
  feedback.classList.add(isCorrect ? "ok" : "bad");
  feedback.innerHTML = `${isCorrect ? "✅ Richtig!" : "❌ Falsch."} ${current.explanation}`;

  nextButton.classList.remove("hidden");
}

function getRatingMessage(points) {
  if (points === 10) return "KI Experte! Perfekte Runde.";
  if (points >= 8) return "Sehr stark! Du kennst dich richtig gut aus.";
  if (points >= 6) return "Gute Leistung! Solide KI-Kenntnisse.";
  if (points >= 4) return "Guter Anfang! Mit etwas Übung geht noch mehr.";
  return "Starter-Level: Weiterlernen lohnt sich!";
}

function showResults() {
  quizStage.classList.add("hidden");
  resultStage.classList.remove("hidden");
  finalScore.textContent = `Du hast ${score} von ${quizQuestions.length} Punkten erreicht.`;
  finalRating.textContent = getRatingMessage(score);
}

nextButton.addEventListener("click", () => {
  if (currentIndex < quizQuestions.length - 1) {
    currentIndex += 1;
    renderQuestion();
    return;
  }
  showResults();
});

restartButton.addEventListener("click", () => {
  quizQuestions = shuffleArray(questions);
  currentIndex = 0;
  score = 0;
  quizStage.classList.remove("hidden");
  resultStage.classList.add("hidden");
  renderQuestion();
});

renderQuestion();
