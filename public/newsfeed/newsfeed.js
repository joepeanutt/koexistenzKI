// ===== NewsAPI.org Integration für KI News =====
const NEWSAPI_KEY = '6503deb1d20846d2bd29d173f7f1c010';
const NEWSAPI_ENDPOINT = 'https://newsapi.org/v2/everything';
const API_PAGE_SIZE = 100;
const INITIAL_VISIBLE_COUNT = 9;
const LOAD_STEP = 9;
const SKELETON_COUNT = 9;
const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 Minuten
const CACHE_KEY = 'ai_news_cache';
const CACHE_TIMESTAMP_KEY = 'ai_news_cache_timestamp';

const newsGrid = document.getElementById('newsGrid');
const newsStatus = document.getElementById('newsStatus');
const lastUpdated = document.getElementById('lastUpdated');
const searchInput = document.getElementById('newsSearchInput');
const searchClear = document.getElementById('newsSearchClear');
const searchResultsInfo = document.getElementById('searchResultsInfo');
const sortButtons = Array.from(document.querySelectorAll('.sort-btn'));
const loadMoreButton = document.getElementById('loadMoreNews');

// Globaler Zustand
let allArticles = [];
let filteredArticles = [];
let visibleCount = INITIAL_VISIBLE_COUNT;
let currentSort = 'newest';
let currentSearchQuery = '';
let currentSearchScores = new Map();

const relevanceKeywords = [
  'ki', 'künstliche intelligenz', 'artificial intelligence', 'ai',
  'openai', 'chatgpt', 'machine learning', 'neural', 'modell', 'algorithmus'
];

const synonyms = {
  chatbot: ['chatgpt', 'ki assistent', 'bot', 'claude', 'chatbot'],
  roboter: ['automatisierung', 'maschine', 'robot', 'roboter', 'robotics'],
  auto: ['fahrzeug', 'tesla', 'selbstfahrend', 'auto', 'autonomous'],
  zukunft: ['prognose', 'trend', 'entwicklung', 'zukunft', 'vorhersage'],
  sicherheit: ['sicherheit', 'cybersicherheit', 'schutz', 'datenschutz', 'risiko'],
  ethik: ['ethik', 'moral', 'verantwortung', 'bias', 'fairness'],
  sprache: ['sprache', 'nlp', 'sprachmodell', 'gpt', 'linguistik'],
  vision: ['vision', 'bilderkennung', 'computer vision', 'sehen'],
  medizin: ['medizin', 'gesundheit', 'arzt', 'diagnose', 'healthcare'],
  musik: ['musik', 'audio', 'sound', 'komponist', 'melodie'],
  kunst: ['kunst', 'bildaktion', 'design', 'kreativität', 'dall-e'],
  bildung: ['bildung', 'lernen', 'schule', 'uni', 'unterricht'],
  arbeit: ['arbeit', 'job', 'beschäftigung', 'arbeitsplatz', 'karriere'],
  geld: ['geld', 'finanz', 'börse', 'kryptowährung', 'handel']
};

// Formatiere Datum relativ (z.B. "Heute 14:32", "Gestern 10:15")
const formatRelativeDate = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return 'Datum unbekannt';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const articleDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  let dateLabel = '';
  if (articleDate.getTime() === today.getTime()) {
    dateLabel = 'Heute';
  } else if (articleDate.getTime() === yesterday.getTime()) {
    dateLabel = 'Gestern';
  } else {
    dateLabel = new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  }

  const time = new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);

  return `${dateLabel} ${time}`;
};

const stripHtml = (html) => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return (doc.body.textContent || '').trim();
};

const truncate = (text, maxLength = 170) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + '…';
};

const setStatus = (type, message) => {
  newsStatus.innerHTML = '';

  if (!message) return;

  const pill = document.createElement('div');
  pill.className = `status-pill ${type}`;

  if (type === 'loading') {
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    spinner.setAttribute('aria-hidden', 'true');
    pill.appendChild(spinner);
  }

  const text = document.createElement('span');
  text.textContent = message;
  pill.appendChild(text);

  newsStatus.appendChild(pill);
};

const renderLoadingCards = () => {
  newsGrid.innerHTML = '';

  for (let i = 0; i < SKELETON_COUNT; i += 1) {
    const skeleton = document.createElement('article');
    skeleton.className = 'news-card skeleton';

    const imgPlaceholder = document.createElement('div');
    imgPlaceholder.className = 'skeleton-img';
    skeleton.appendChild(imgPlaceholder);

    const body = document.createElement('div');
    body.className = 'news-card-body';
    const lines = ['sm', 'lg', 'md', 'md', 'sm'];
    lines.forEach((size) => {
      const line = document.createElement('div');
      line.className = `skeleton-line ${size}`;
      body.appendChild(line);
    });
    skeleton.appendChild(body);

    newsGrid.appendChild(skeleton);
  }
};

const renderError = (message) => {
  newsGrid.innerHTML = '';
  setStatus('error', message);
};

// Erstelle Platzhalter mit KI-Icon
const createPlaceholderImage = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" fill="#e0e0e0"/>
    <circle cx="50" cy="35" r="12" fill="#999"/>
    <path d="M 35 55 Q 50 70 65 55" stroke="#999" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="40" cy="50" r="3" fill="#999"/>
    <circle cx="60" cy="50" r="3" fill="#999"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const articleKey = (article, index = 0) => {
  if (article?.__id) return article.__id;
  return article.url || `${article.title || 'news'}-${article.publishedAt || '0'}-${index}`;
};

const computeTextRelevance = (article) => {
  const title = (article.title || '').toLowerCase();
  const desc = (article.description || '').toLowerCase();
  const content = (article.content || '').toLowerCase();
  const fullText = `${title} ${desc} ${content}`;

  let score = 0;
  relevanceKeywords.forEach((keyword) => {
    if (title.includes(keyword)) score += 10;
    if (desc.includes(keyword)) score += 6;
    if (fullText.includes(keyword)) score += 3;
  });

  return score;
};

const decorateArticles = (articles) => {
  return articles.map((article, index) => {
    const publishedTs = new Date(article.publishedAt || 0).getTime();
    return {
      ...article,
      __id: articleKey(article, index),
      __publishedTs: Number.isNaN(publishedTs) ? 0 : publishedTs,
      __relevanceScore: computeTextRelevance(article)
    };
  });
};

const createNewsCard = (article, animate = false, animationIndex = 0) => {
  const card = document.createElement('article');
  card.className = `news-card${animate ? ' news-card-enter' : ''}`;
  if (animate) {
    card.style.animationDelay = `${animationIndex * 35}ms`;
  }

  const imageWrap = document.createElement('div');
  imageWrap.className = 'news-card-image';

  const img = document.createElement('img');
  img.className = 'news-img';
  img.alt = article.title || 'News Bild';
  img.loading = 'lazy';
  img.src = article.urlToImage || createPlaceholderImage();

  img.onerror = () => {
    img.src = createPlaceholderImage();
    img.onerror = null;
  };
  imageWrap.appendChild(img);

  const body = document.createElement('div');
  body.className = 'news-card-body';

  const meta = document.createElement('p');
  meta.className = 'news-date';
  const publisher = article.source?.name || 'Quelle unbekannt';
  meta.textContent = `${formatRelativeDate(article.publishedAt)} · ${publisher}`;

  const title = document.createElement('h2');
  title.className = 'news-title';
  title.textContent = article.title || 'Ohne Titel';

  const excerpt = document.createElement('p');
  excerpt.className = 'news-excerpt';
  const description = stripHtml(article.description || '');
  excerpt.textContent = truncate(description || 'Keine Beschreibung verfügbar.');

  const readButton = document.createElement('a');
  readButton.className = 'news-read';
  readButton.href = article.url || '#';
  readButton.target = '_blank';
  readButton.rel = 'noopener noreferrer';
  readButton.textContent = 'Lesen →';

  body.appendChild(meta);
  body.appendChild(title);
  body.appendChild(excerpt);
  body.appendChild(readButton);

  card.appendChild(imageWrap);
  card.appendChild(body);

  return card;
};

const renderNewsSlice = (articles, startIndex = 0, animate = true) => {
  articles.forEach((article, index) => {
    const card = createNewsCard(article, animate, startIndex + index);
    newsGrid.appendChild(card);
  });
};

const updateLoadMoreButton = () => {
  if (!loadMoreButton) return;

  const hasMore = visibleCount < filteredArticles.length;
  loadMoreButton.classList.toggle('hidden', !hasMore);
  loadMoreButton.disabled = !hasMore;

  if (!hasMore) return;

  const remaining = filteredArticles.length - visibleCount;
  const nextCount = Math.min(LOAD_STEP, remaining);
  loadMoreButton.textContent = `Mehr anzeigen (${nextCount})`;
};

const updateSortButtons = () => {
  sortButtons.forEach((button) => {
    const isActive = button.dataset.sort === currentSort;
    button.classList.toggle('is-active', isActive);
  });
};

const renderVisibleNews = ({ reset = true, fromIndex = 0 } = {}) => {
  if (reset) {
    newsGrid.innerHTML = '';
  }

  if (!filteredArticles.length) {
    if (reset) {
      newsGrid.innerHTML = '';
    }
    updateLoadMoreButton();
    return;
  }

  const toIndex = Math.min(visibleCount, filteredArticles.length);
  const start = reset ? 0 : fromIndex;
  const chunk = filteredArticles.slice(start, toIndex);
  renderNewsSlice(chunk, start, true);
  updateLoadMoreButton();
};

const setSearchResultsInfo = (query, count) => {
  if (!searchResultsInfo) return;

  if (!query) {
    searchResultsInfo.textContent = '';
    searchResultsInfo.className = 'search-results-info';
    return;
  }

  if (count === 0) {
    searchResultsInfo.textContent = `Ähnliche News zu: "${query}" (keine gefunden)`;
    searchResultsInfo.className = 'search-results-info not-found';
    return;
  }

  searchResultsInfo.textContent = `${count} Ergebnisse für: "${query}"`;
  searchResultsInfo.className = 'search-results-info found';
};

const sortArticles = (articles) => {
  const copy = [...articles];

  if (currentSort === 'oldest') {
    return copy.sort((a, b) => a.__publishedTs - b.__publishedTs);
  }

  if (currentSort === 'relevance') {
    if (currentSearchQuery) {
      return copy.sort((a, b) => {
        const scoreA = currentSearchScores.get(a.__id) || 0;
        const scoreB = currentSearchScores.get(b.__id) || 0;
        return scoreB - scoreA || b.__publishedTs - a.__publishedTs;
      });
    }

    return copy.sort((a, b) => {
      return b.__relevanceScore - a.__relevanceScore || b.__publishedTs - a.__publishedTs;
    });
  }

  return copy.sort((a, b) => b.__publishedTs - a.__publishedTs);
};

// Fuzzy-Matching: Levenshtein-ähnliche Distanz (vereinfacht)
function fuzzySimilarity(str1, str2) {
  str1 = str1.toLowerCase();
  str2 = str2.toLowerCase();

  if (str1 === str2) return 1;
  if (str1.includes(str2) || str2.includes(str1)) return 0.9;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const costs = [];
  for (let i = 0; i <= longer.length; i += 1) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j += 1) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }

  const distance = costs[shorter.length];
  const maxLen = Math.max(str1.length, str2.length);
  return 1 - (distance / maxLen);
}

const expandSearchTerms = (query) => {
  const terms = new Set(query.toLowerCase().split(/\s+/).filter((x) => x.length > 0));
  const expanded = [...terms];

  for (const term of terms) {
    for (const [key, syns] of Object.entries(synonyms)) {
      if (fuzzySimilarity(term, key) > 0.7) {
        expanded.push(...syns);
      }
    }
  }

  return Array.from(new Set(expanded)).map((t) => t.toLowerCase());
};

const searchArticlesWithScores = (query) => {
  if (!query || query.trim().length === 0) {
    return { articles: [...allArticles], scores: new Map() };
  }

  const expandedTerms = expandSearchTerms(query);
  const scored = new Map();

  allArticles.forEach((article) => {
    const titleLower = (article.title || '').toLowerCase();
    const descLower = (article.description || '').toLowerCase();
    const contentLower = (article.content || '').toLowerCase();
    const fullText = `${titleLower} ${descLower} ${contentLower}`;

    let score = 0;
    expandedTerms.forEach((term) => {
      if (titleLower.includes(term)) score += 10;
      if (descLower.includes(term)) score += 5;
      if (fullText.includes(term)) score += 2;

      const similarity = fuzzySimilarity(fullText, term);
      if (similarity > 0.6) score += similarity * 3;
    });

    if (score > 0) {
      scored.set(article.__id, score);
    }
  });

  const resultArticles = allArticles.filter((article) => scored.has(article.__id));
  return { articles: resultArticles, scores: scored };
};

const applyCurrentView = ({ resetVisible = false } = {}) => {
  const query = currentSearchQuery.trim();
  const searchResult = searchArticlesWithScores(query);
  currentSearchScores = searchResult.scores;

  const base = query ? searchResult.articles : [...allArticles];
  filteredArticles = sortArticles(base);

  if (resetVisible) {
    visibleCount = INITIAL_VISIBLE_COUNT;
  }

  setSearchResultsInfo(query, base.length);
  updateSortButtons();
  renderVisibleNews({ reset: true, fromIndex: 0 });
};

const setupNewsControls = () => {
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim();
      applyCurrentView({ resetVisible: true });
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      currentSearchQuery = '';
      applyCurrentView({ resetVisible: true });
    });
  }

  sortButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextSort = button.dataset.sort;
      if (!nextSort || nextSort === currentSort) return;

      currentSort = nextSort;
      applyCurrentView({ resetVisible: false });
    });
  });

  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', () => {
      if (visibleCount >= filteredArticles.length) return;
      const previousCount = visibleCount;
      visibleCount = Math.min(visibleCount + LOAD_STEP, filteredArticles.length);
      renderVisibleNews({ reset: false, fromIndex: previousCount });
    });
  }
};

const updateLastUpdated = () => {
  const now = new Date();
  const time = new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(now);
  lastUpdated.textContent = `Zuletzt aktualisiert: ${time} Uhr`;
};

// Lade News von NewsAPI.org
const fetchNews = async () => {
  setStatus('loading', 'News werden geladen...');
  renderLoadingCards();

  try {
    const url = new URL(NEWSAPI_ENDPOINT);
    url.searchParams.append('q', 'artificial intelligence OR KI OR ChatGPT OR OpenAI');
    url.searchParams.append('language', 'de');
    url.searchParams.append('sortBy', 'publishedAt');
    url.searchParams.append('pageSize', API_PAGE_SIZE);
    url.searchParams.append('apiKey', NEWSAPI_KEY);

    const response = await fetch(url.toString(), { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'ok') {
      throw new Error(data.message || 'API Fehler');
    }

    if (!Array.isArray(data.articles) || data.articles.length === 0) {
      throw new Error('Keine Artikel verfügbar');
    }

    // Cache speichern
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data.articles));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().toISOString());
    } catch (e) {
      console.warn('Cache konnte nicht gespeichert werden:', e);
    }

    allArticles = decorateArticles(data.articles);
    applyCurrentView({ resetVisible: true });
    setStatus('', '');
    updateLastUpdated();
  } catch (error) {
    console.error('NewsAPI Fehler:', error.message);

    // Versuche, gecachte News zu laden
    try {
      const cachedArticles = localStorage.getItem(CACHE_KEY);
      if (cachedArticles) {
        const articles = JSON.parse(cachedArticles);
        allArticles = decorateArticles(articles);
        applyCurrentView({ resetVisible: true });
        const cachedTime = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        if (cachedTime) {
          const time = new Intl.DateTimeFormat('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date(cachedTime));
          lastUpdated.textContent = `Zuletzt aktualisiert: ${time} Uhr (gecacht)`;
        }
        setStatus('warning', 'Mit gecachten News, API-Verbindung fehlgeschlagen');
        return;
      }
    } catch (cacheError) {
      console.warn('Cache konnte nicht geladen werden:', cacheError);
    }

    renderError(`News konnten nicht geladen werden: ${error.message}`);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setupNewsControls();
  fetchNews();
  window.setInterval(fetchNews, REFRESH_INTERVAL_MS);
});

// ===== KI Markt & Aktien (Yahoo-only, ohne API Key) =====
(function initAiMarketModule() {
  const MARKET_REFRESH_MS = 30 * 1000;
  const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
  const CORS_PROXY = 'https://corsproxy.io/?';

  const STOCKS = [
    { symbol: 'NVDA', name: 'NVIDIA', logo: 'https://logo.clearbit.com/nvidia.com' },
    { symbol: 'MSFT', name: 'Microsoft', logo: 'https://logo.clearbit.com/microsoft.com' },
    { symbol: 'GOOGL', name: 'Google', logo: 'https://logo.clearbit.com/google.com' },
    { symbol: 'META', name: 'Meta', logo: 'https://logo.clearbit.com/meta.com' },
    { symbol: 'TSLA', name: 'Tesla', logo: 'https://logo.clearbit.com/tesla.com' },
    { symbol: 'AAPL', name: 'Apple', logo: 'https://logo.clearbit.com/apple.com' }
  ];

  const OPENAI_INFO = { symbol: 'OPENAI', note: 'nicht boersennotiert' };

  const tickerEl = document.getElementById('marketTicker');
  const cardsEl = document.getElementById('marketCards');
  const aiSectorIndexEl = document.getElementById('aiSectorIndex');
  const aiTotalMarketCapEl = document.getElementById('aiTotalMarketCap');
  const aiTopWinnerEl = document.getElementById('aiTopWinner');
  const aiTopLoserEl = document.getElementById('aiTopLoser');
  const marketNewsListEl = document.getElementById('marketNewsList');
  const marketNewsTimestampEl = document.getElementById('marketNewsTimestamp');

  if (!tickerEl || !cardsEl) return;

  const chartInstances = {};
  const fmtPercent = (n) => `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
  const fmtEuro = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const fmtCompact = new Intl.NumberFormat('de-DE', {
    notation: 'compact',
    maximumFractionDigits: 2
  });

  const fallbackUsdToEur = 0.92;
  const fallbackQuotes = [
    { symbol: 'NVDA', priceUsd: 122.4, changePercent: 1.82, marketCapUsd: 3010000000000 },
    { symbol: 'MSFT', priceUsd: 417.1, changePercent: 0.74, marketCapUsd: 3120000000000 },
    { symbol: 'GOOGL', priceUsd: 186.7, changePercent: -0.66, marketCapUsd: 2320000000000 },
    { symbol: 'META', priceUsd: 531.9, changePercent: 2.02, marketCapUsd: 1340000000000 },
    { symbol: 'TSLA', priceUsd: 179.3, changePercent: -1.24, marketCapUsd: 571000000000 },
    { symbol: 'AAPL', priceUsd: 214.8, changePercent: 0.21, marketCapUsd: 3320000000000 }
  ];

  async function fetchJsonWithCorsFallback(url) {
    try {
      const direct = await fetch(url, { cache: 'no-store' });
      if (!direct.ok) {
        throw new Error(`HTTP ${direct.status}`);
      }
      return await direct.json();
    } catch {
      const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
      const proxied = await fetch(proxiedUrl, { cache: 'no-store' });
      if (!proxied.ok) {
        throw new Error(`Proxy HTTP ${proxied.status}`);
      }
      return await proxied.json();
    }
  }

  function extractSeries(result) {
    const closes = result?.indicators?.quote?.[0]?.close || [];
    return closes.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  }

  async function fetchUsdToEurRate() {
    const url = `${YAHOO_BASE}EURUSD=X?interval=1d&range=1d`;
    try {
      const data = await fetchJsonWithCorsFallback(url);
      const result = data?.chart?.result?.[0];
      const eurUsd = result?.meta?.regularMarketPrice || extractSeries(result).at(-1);
      if (typeof eurUsd !== 'number' || eurUsd <= 0) {
        throw new Error('ungueltiger EURUSD-Kurs');
      }
      return 1 / eurUsd;
    } catch (err) {
      console.warn('EUR/USD konnte nicht geladen werden, nutze Fallback:', err.message);
      return fallbackUsdToEur;
    }
  }

  async function fetchStockSnapshot(symbol) {
    const url = `${YAHOO_BASE}${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const data = await fetchJsonWithCorsFallback(url);
    const result = data?.chart?.result?.[0];
    if (!result) {
      throw new Error(`Keine Daten fuer ${symbol}`);
    }

    const meta = result.meta || {};
    const priceUsd = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose;
    const marketCapUsd = meta.marketCap;

    if (typeof priceUsd !== 'number' || typeof prevClose !== 'number' || prevClose === 0) {
      throw new Error(`Unvollstaendige Kursdaten fuer ${symbol}`);
    }

    const changePercent = ((priceUsd - prevClose) / prevClose) * 100;

    return {
      symbol,
      priceUsd,
      changePercent,
      marketCapUsd: typeof marketCapUsd === 'number' ? marketCapUsd : 0
    };
  }

  async function fetchChart7dUsd(symbol) {
    const url = `${YAHOO_BASE}${encodeURIComponent(symbol)}?interval=1d&range=7d`;
    const data = await fetchJsonWithCorsFallback(url);
    const result = data?.chart?.result?.[0];
    const series = extractSeries(result);
    if (!series.length) {
      throw new Error(`Keine 7d-Chartdaten fuer ${symbol}`);
    }
    return series;
  }

  function valueClass(changePercent) {
    return changePercent >= 0 ? 'pos' : 'neg';
  }

  function arrow(changePercent) {
    return changePercent >= 0 ? '▲' : '▼';
  }

  function ensureCardSkeleton() {
    cardsEl.innerHTML = STOCKS.map((s) => `
      <article class="market-card" id="market-card-${s.symbol}">
        <div class="market-card-top">
          <div class="market-company">
            <img class="market-logo" src="${s.logo}" alt="${s.name} Logo" loading="lazy" onerror="this.style.opacity='0.25'">
            <div>
              <div class="market-name">${s.name}</div>
              <div class="market-symbol">${s.symbol}</div>
            </div>
          </div>
          <div class="change" id="market-change-${s.symbol}">-</div>
        </div>
        <div class="market-price" id="market-price-${s.symbol}">-</div>
        <div class="sparkline-wrap"><canvas class="sparkline" id="spark-${s.symbol}"></canvas></div>
      </article>
    `).join('');
  }

  function renderTicker(quotesBySymbol, usdToEur) {
    const rows = STOCKS.map((stock) => {
      const q = quotesBySymbol[stock.symbol];
      const price = typeof q?.priceUsd === 'number' ? fmtEuro.format(q.priceUsd * usdToEur) : '-';
      const cp = typeof q?.changePercent === 'number' ? q.changePercent : 0;

      return `
        <div class="ticker-item">
          <span class="ticker-symbol">${stock.symbol}</span>
          <span class="ticker-price">${price}</span>
          <span class="ticker-change ${valueClass(cp)}">${arrow(cp)} ${fmtPercent(cp)}</span>
        </div>
      `;
    }).join('');

    const openAiRow = `
      <div class="ticker-item">
        <span class="ticker-symbol">${OPENAI_INFO.symbol}</span>
        <span class="ticker-price">${OPENAI_INFO.note}</span>
      </div>
    `;

    tickerEl.innerHTML = rows + openAiRow;
  }

  function renderCardPrices(quotesBySymbol, usdToEur) {
    STOCKS.forEach((stock) => {
      const q = quotesBySymbol[stock.symbol];
      const priceEl = document.getElementById(`market-price-${stock.symbol}`);
      const changeEl = document.getElementById(`market-change-${stock.symbol}`);
      if (!priceEl || !changeEl) return;

      const price = typeof q?.priceUsd === 'number' ? fmtEuro.format(q.priceUsd * usdToEur) : '-';
      const cp = typeof q?.changePercent === 'number' ? q.changePercent : 0;

      priceEl.textContent = price;
      changeEl.textContent = `${arrow(cp)} ${fmtPercent(cp)}`;
      changeEl.className = `change ${valueClass(cp)}`;
    });
  }

  function renderOverview(quotes, usdToEur) {
    const valid = quotes.filter((q) => typeof q.changePercent === 'number');
    if (!valid.length) return;

    const avg = valid.reduce((sum, q) => sum + q.changePercent, 0) / valid.length;
    const winner = [...valid].sort((a, b) => b.changePercent - a.changePercent)[0];
    const loser = [...valid].sort((a, b) => a.changePercent - b.changePercent)[0];
    const marketCapTotalUsd = valid.reduce((sum, q) => sum + (q.marketCapUsd || 0), 0);
    const marketCapTotalEur = marketCapTotalUsd * usdToEur;

    aiSectorIndexEl.textContent = `${avg >= 0 ? '▲' : '▼'} ${fmtPercent(avg)}`;
    aiSectorIndexEl.className = avg >= 0 ? 'pos' : 'neg';

    aiTotalMarketCapEl.textContent = marketCapTotalEur > 0
      ? `${fmtCompact.format(marketCapTotalEur)} €`
      : '-';

    aiTopWinnerEl.textContent = `${winner.symbol} ${fmtPercent(winner.changePercent)}`;
    aiTopWinnerEl.className = 'pos';

    aiTopLoserEl.textContent = `${loser.symbol} ${fmtPercent(loser.changePercent)}`;
    aiTopLoserEl.className = 'neg';
  }

  function drawSparkline(symbol, pointsEur, isPositive) {
    const canvas = document.getElementById(`spark-${symbol}`);
    if (!canvas || typeof Chart === 'undefined') return;

    if (chartInstances[symbol]) {
      chartInstances[symbol].destroy();
    }

    chartInstances[symbol] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: pointsEur.map((_, i) => i + 1),
        datasets: [{
          data: pointsEur,
          borderColor: isPositive ? '#24d07a' : '#ff6666',
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 0,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false }
        }
      }
    });
  }

  function renderMarketNewsFromQuotes(quotes) {
    if (!marketNewsListEl) return;

    const valid = quotes.filter((q) => typeof q.changePercent === 'number');
    if (!valid.length) {
      marketNewsListEl.innerHTML = `
        <li>Yahoo-Daten derzeit nicht verfuegbar, Fallback-Marktdaten aktiv.</li>
        <li>KI-Aktien werden weiter alle 30 Sekunden neu geladen.</li>
      `;
      return;
    }

    const sorted = [...valid].sort((a, b) => b.changePercent - a.changePercent);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const avg = valid.reduce((sum, q) => sum + q.changePercent, 0) / valid.length;

    marketNewsListEl.innerHTML = `
      <li>Top-Performer heute: ${best.symbol} (${fmtPercent(best.changePercent)}).</li>
      <li>Schwaechster Wert heute: ${worst.symbol} (${fmtPercent(worst.changePercent)}).</li>
      <li>Durchschnitt KI-Basket: ${avg >= 0 ? '▲' : '▼'} ${fmtPercent(avg)}.</li>
      <li>Live-Datenquelle: Yahoo Finance Chart API.</li>
    `;
  }

  function renderUpdateMeta(usdToEur) {
    if (!marketNewsTimestampEl) return;

    const time = new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());

    marketNewsTimestampEl.textContent = `1 USD = ${usdToEur.toFixed(2).replace('.', ',')} € | Zuletzt aktualisiert: ${time} Uhr`;
  }

  async function loadQuotesWithFallback() {
    const results = await Promise.allSettled(STOCKS.map((s) => fetchStockSnapshot(s.symbol)));
    const ok = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);

    if (ok.length) {
      return ok;
    }

    return fallbackQuotes;
  }

  async function loadChartWithFallback(symbol) {
    try {
      return await fetchChart7dUsd(symbol);
    } catch {
      const base = 90 + Math.random() * 60;
      return Array.from({ length: 7 }, (_, i) => +(base + (Math.random() - 0.45) * i * 2).toFixed(2));
    }
  }

  async function updateMarketData() {
    ensureCardSkeleton();

    const usdToEur = await fetchUsdToEurRate();
    const quotes = await loadQuotesWithFallback();

    const quotesBySymbol = {};
    quotes.forEach((q) => {
      if (q?.symbol) quotesBySymbol[q.symbol] = q;
    });

    renderTicker(quotesBySymbol, usdToEur);
    renderCardPrices(quotesBySymbol, usdToEur);
    renderOverview(quotes, usdToEur);
    renderMarketNewsFromQuotes(quotes);
    renderUpdateMeta(usdToEur);

    const chartResults = await Promise.allSettled(
      STOCKS.map((s) => loadChartWithFallback(s.symbol).then((pointsUsd) => ({
        symbol: s.symbol,
        pointsEur: pointsUsd.map((v) => v * usdToEur)
      })))
    );

    chartResults.forEach((res) => {
      if (res.status !== 'fulfilled') return;
      const { symbol, pointsEur } = res.value;
      const cp = quotesBySymbol[symbol]?.changePercent ?? 0;
      drawSparkline(symbol, pointsEur, cp >= 0);
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await updateMarketData();
    window.setInterval(updateMarketData, MARKET_REFRESH_MS);
  });
})();
