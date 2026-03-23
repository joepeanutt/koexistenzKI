const NEWS_API = '/api/news';
const MAX_ARTICLES = 12;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const newsGrid = document.getElementById('newsGrid');
const newsStatus = document.getElementById('newsStatus');
const lastUpdated = document.getElementById('lastUpdated');

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Datum unbekannt';
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
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

  for (let i = 0; i < MAX_ARTICLES; i += 1) {
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

const getFallbackImage = () =>
  `https://picsum.photos/400/200?random=${Math.floor(Math.random() * 1000)}`;

const renderNews = (items) => {
  newsGrid.innerHTML = '';

  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'news-card';

    // Bild
    const imageWrap = document.createElement('div');
    imageWrap.className = 'news-card-image';

    const img = document.createElement('img');
    img.className = 'news-img';
    img.alt = item.title || 'News Bild';
    img.loading = 'lazy';
    img.src = item.thumbnail || getFallbackImage();
    img.onerror = () => {
      img.src = getFallbackImage();
      img.onerror = null;
    };
    imageWrap.appendChild(img);

    // Inhalt
    const body = document.createElement('div');
    body.className = 'news-card-body';

    const meta = document.createElement('p');
    meta.className = 'news-date';
    meta.textContent = item.byline
      ? `${formatDateTime(item.pubDate)} · ${item.byline}`
      : formatDateTime(item.pubDate);

    const title = document.createElement('h2');
    title.className = 'news-title';
    title.textContent = item.title || 'Ohne Titel';

    const excerpt = document.createElement('p');
    excerpt.className = 'news-excerpt';
    const plainDesc = stripHtml(item.description || '');
    excerpt.textContent = truncate(plainDesc || 'Keine Beschreibung verfügbar.');

    const readButton = document.createElement('a');
    readButton.className = 'news-read';
    readButton.href = item.link || '#';
    readButton.target = '_blank';
    readButton.rel = 'noopener noreferrer';
    readButton.textContent = 'Lesen →';

    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(excerpt);
    body.appendChild(readButton);

    card.appendChild(imageWrap);
    card.appendChild(body);

    newsGrid.appendChild(card);
  });
};

const updateLastUpdated = () => {
  const now = new Date();
  const display = new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(now);
  lastUpdated.textContent = `Letzte Aktualisierung: ${display}`;
};

const fetchNews = async () => {
  setStatus('loading', 'News werden geladen...');
  renderLoadingCards();

  try {
    const response = await fetch(NEWS_API, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const payload = await response.json();

    if (payload.error) {
      throw new Error(payload.error);
    }

    if (payload.status !== 'ok' || !Array.isArray(payload.items)) {
      throw new Error('Ungültige Antwort vom Server');
    }

    if (!payload.items.length) {
      throw new Error('Keine Artikel gefunden');
    }

    renderNews(payload.items);
    setStatus('', '');
    updateLastUpdated();
  } catch (error) {
    console.error('Newsfeed Fehler:', error.message);
    renderError(`News konnten nicht geladen werden: ${error.message}`);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  fetchNews();
  window.setInterval(fetchNews, REFRESH_INTERVAL_MS);

  // Zurück nach oben Button
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('is-visible');
      } else {
        backToTopBtn.classList.remove('is-visible');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
