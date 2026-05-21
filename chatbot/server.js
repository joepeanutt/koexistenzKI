const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Parser = require('rss-parser');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { query } = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
const rssParser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }]
    ]
  }
});

const NEWS_RESULT_LIMIT = 24;
const NEWS_FETCH_TIMEOUT_MS = 12000;
const NEWS_RSS_FEEDS = [
  { name: 'heise online', url: 'https://www.heise.de/rss/heise-top-atom.xml' },
  { name: 'Golem.de', url: 'https://rss.golem.de/rss.php?feed=RSS2.0' },
  { name: 't3n', url: 'https://t3n.de/rss.xml' },
  { name: 'ComputerBase', url: 'https://www.computerbase.de/rss/news.xml' }
];
const NEWS_KEYWORDS = [
  'ki',
  'künstliche intelligenz',
  'kuenstliche intelligenz',
  'artificial intelligence',
  'ai',
  'openai',
  'chatgpt',
  'anthropic',
  'claude',
  'gemini',
  'copilot',
  'deepmind',
  'llm',
  'large language model',
  'machine learning',
  'neural',
  'nvidia',
  'roboter',
  'robotik',
  'sprachmodell',
  'deepfake',
  'autonom'
];
let latestNewsPayload = null;

if (!JWT_SECRET) {
  console.warn('WARNUNG: JWT_SECRET fehlt in .env.local');
}

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS blockiert diese Origin.'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

function detectDevice(userAgent = '') {
  const normalized = userAgent.toLowerCase();
  if (normalized.includes('mobile') || normalized.includes('android') || normalized.includes('iphone')) {
    return 'Handy';
  }
  return 'PC';
}

function detectBrowser(userAgent = '') {
  if (/edg\//i.test(userAgent)) return 'Edge';
  if (/chrome\//i.test(userAgent)) return 'Chrome';
  if (/firefox\//i.test(userAgent)) return 'Firefox';
  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) return 'Safari';
  return 'Unbekannt';
}

function buildAuthToken(user) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET fehlt.');
  }

  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function decodeHtmlEntities(value = '') {
  return String(value)
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

function stripHtml(value = '') {
  return decodeHtmlEntities(String(value).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeUrl(candidate, baseUrl) {
  if (!candidate || typeof candidate !== 'string') return null;

  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractImageFromHtml(html) {
  if (!html || typeof html !== 'string') return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? decodeHtmlEntities(match[1]) : null;
}

function extractImageUrl(item, feedUrl) {
  const candidates = [
    item.enclosure?.url,
    ...toArray(item.mediaContent).map((entry) => entry?.$?.url || entry?.url),
    ...toArray(item.mediaThumbnail).map((entry) => entry?.$?.url || entry?.url),
    extractImageFromHtml(item.contentEncoded),
    extractImageFromHtml(item.content),
    extractImageFromHtml(item.summary),
    extractImageFromHtml(item.description)
  ];

  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate, feedUrl);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsNewsKeyword(haystack, keyword) {
  if (!haystack || !keyword) return false;

  if (keyword.length <= 3) {
    const pattern = new RegExp(`(^|[^a-z0-9äöüß])${escapeRegex(keyword)}($|[^a-z0-9äöüß])`, 'i');
    return pattern.test(haystack);
  }

  return haystack.includes(keyword);
}

function scoreNewsArticle(article) {
  const haystack = `${article.title} ${article.description} ${article.content}`.toLowerCase();

  return NEWS_KEYWORDS.reduce((score, keyword) => {
    if (!containsNewsKeyword(haystack, keyword)) {
      return score;
    }

    if (containsNewsKeyword(article.title.toLowerCase(), keyword)) {
      return score + 6;
    }

    return score + 2;
  }, 0);
}

function normalizeNewsItem(item, feed) {
  const title = stripHtml(item.title || '');
  const description = stripHtml(item.contentSnippet || item.summary || item.description || item.contentEncoded || item.content || '');
  const url = normalizeUrl(item.link || item.guid, feed.url);

  if (!title || !url) {
    return null;
  }

  const publishedAt = item.isoDate || item.pubDate || item.published || item.updated || null;
  const article = {
    title,
    description,
    content: description,
    url,
    urlToImage: extractImageUrl(item, feed.url),
    publishedAt,
    source: { name: feed.name }
  };

  return {
    ...article,
    __isPromotional: /^(anzeige|deal)\b/i.test(title),
    __score: scoreNewsArticle(article)
  };
}

function withTimeout(promise, timeoutMs, errorMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    })
  ]);
}

async function buildLatestNewsPayload() {
  const feedResults = await Promise.allSettled(
    NEWS_RSS_FEEDS.map(async (feed) => {
      const parsedFeed = await withTimeout(
        rssParser.parseURL(feed.url),
        NEWS_FETCH_TIMEOUT_MS,
        `Timeout beim Laden von ${feed.name}`
      );

      return { feed, items: parsedFeed.items || [] };
    })
  );

  const successfulFeeds = feedResults
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  if (!successfulFeeds.length) {
    throw new Error('Die RSS-Feeds konnten nicht geladen werden.');
  }

  const deduplicatedArticles = new Map();

  successfulFeeds.forEach(({ feed, items }) => {
    items
      .map((item) => normalizeNewsItem(item, feed))
      .filter(Boolean)
      .forEach((article) => {
        if (!deduplicatedArticles.has(article.url)) {
          deduplicatedArticles.set(article.url, article);
        }
      });
  });

  const articles = Array.from(deduplicatedArticles.values())
    .filter((article) => !article.__isPromotional)
    .filter((article) => article.__score > 0)
    .sort((a, b) => {
      const scoreDiff = b.__score - a.__score;
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
    })
    .slice(0, NEWS_RESULT_LIMIT)
    .map(({ __isPromotional, __score, ...article }) => article);

  if (!articles.length) {
    throw new Error('Es wurden keine passenden KI-News in den RSS-Feeds gefunden.');
  }

  return {
    status: 'ok',
    articles,
    fetchedAt: new Date().toISOString(),
    sources: successfulFeeds.map(({ feed }) => feed.name)
  };
}

function requireAuth(req, res, next) {
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'JWT ist nicht konfiguriert.' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Nicht eingeloggt.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token ungültig oder abgelaufen.' });
  }
}

// API: Login
app.post('/api/login', async (req, res) => {
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'JWT_SECRET fehlt in .env.local' });
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Benutzername und Passwort sind erforderlich.' });
  }

  try {
    const users = await query(
      `SELECT id, username, email, password_hash, is_blocked, visits
       FROM users
       WHERE username = ?
       LIMIT 1`,
      [username]
    );

    if (!users.length) {
      return res.status(401).json({ error: 'Ungültige Login-Daten.' });
    }

    const user = users[0];

    if (user.is_blocked) {
      return res.status(403).json({ error: 'Dieser Account ist gesperrt.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash || '');

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Ungültige Login-Daten.' });
    }

    await query(
      `UPDATE users
       SET last_login = NOW(), visits = visits + 1
       WHERE id = ?`,
      [user.id]
    );

    await query(
      `INSERT INTO sessions (user_id, timestamp, device, browser)
       VALUES (?, NOW(), ?, ?)`,
      [user.id, detectDevice(req.headers['user-agent']), detectBrowser(req.headers['user-agent'])]
    );

    const token = buildAuthToken(user);

    return res.json({
      status: 'ok',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login Fehler:', error.message);
    return res.status(500).json({ error: 'Login nicht möglich.' });
  }
});

app.get('/api/me', requireAuth, async (req, res) => {
  return res.json({ status: 'ok', user: req.user });
});

app.post('/api/logout', requireAuth, async (req, res) => {
  return res.json({ status: 'ok', message: 'Logout erfolgreich.' });
});

// API: Dashboard-Statistiken
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const [
      totalVisitorsRows,
      activeUsersRows,
      topPagesRows,
      todayRows,
      weekRows,
      monthRows,
      trendRows,
      deviceRows
    ] = await Promise.all([
      query('SELECT COALESCE(SUM(views), 0) AS total FROM page_views'),
      query('SELECT COUNT(DISTINCT user_id) AS activeToday FROM sessions WHERE DATE(timestamp) = CURDATE()'),
      query('SELECT page, COALESCE(SUM(views), 0) AS views FROM page_views GROUP BY page ORDER BY views DESC LIMIT 5'),
      query('SELECT COALESCE(SUM(views), 0) AS todayViews FROM page_views WHERE date = CURDATE()'),
      query('SELECT COALESCE(SUM(views), 0) AS weekViews FROM page_views WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'),
      query('SELECT COALESCE(SUM(views), 0) AS monthViews FROM page_views WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'),
      query(`SELECT DATE_FORMAT(date, '%Y-%m-%d') AS label, COALESCE(SUM(views), 0) AS views
             FROM page_views
             WHERE date >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
             GROUP BY DATE(date)
             ORDER BY DATE(date) ASC`),
      query('SELECT device, COUNT(*) AS count FROM sessions GROUP BY device')
    ]);

    return res.json({
      status: 'ok',
      stats: {
        totalVisitors: Number(totalVisitorsRows[0]?.total || 0),
        activeUsersToday: Number(activeUsersRows[0]?.activeToday || 0),
        topPages: topPagesRows,
        timeframe: {
          day: Number(todayRows[0]?.todayViews || 0),
          week: Number(weekRows[0]?.weekViews || 0),
          month: Number(monthRows[0]?.monthViews || 0)
        },
        visitorsTrend: trendRows,
        deviceDistribution: deviceRows
      }
    });
  } catch (error) {
    console.error('Stats Fehler:', error.message);
    return res.status(500).json({ error: 'Statistiken konnten nicht geladen werden.' });
  }
});

// API: Nutzerliste
app.get('/api/users', requireAuth, async (req, res) => {
  const { q = '', sortBy = 'created_at', order = 'desc' } = req.query;

  const sortableColumns = {
    date: 'created_at',
    name: 'username',
    visits: 'visits',
    created_at: 'created_at',
    username: 'username'
  };

  const orderBy = sortableColumns[sortBy] || 'created_at';
  const orderDirection = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const searchTerm = `%${String(q).trim()}%`;

  try {
    const users = await query(
      `SELECT id, username, email, created_at, last_login, visits, is_blocked
       FROM users
       WHERE username LIKE ? OR email LIKE ?
       ORDER BY ${orderBy} ${orderDirection}`,
      [searchTerm, searchTerm]
    );

    return res.json({ status: 'ok', users });
  } catch (error) {
    console.error('Users Fehler:', error.message);
    return res.status(500).json({ error: 'Nutzer konnten nicht geladen werden.' });
  }
});

app.get('/api/users/:id', requireAuth, async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Ungültige User-ID.' });
  }

  try {
    const users = await query(
      `SELECT id, username, email, created_at, last_login, visits, is_blocked
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ error: 'User nicht gefunden.' });
    }

    const recentSessions = await query(
      `SELECT timestamp, device, browser
       FROM sessions
       WHERE user_id = ?
       ORDER BY timestamp DESC
       LIMIT 10`,
      [userId]
    );

    return res.json({ status: 'ok', user: users[0], recentSessions });
  } catch (error) {
    console.error('User Details Fehler:', error.message);
    return res.status(500).json({ error: 'User-Details konnten nicht geladen werden.' });
  }
});

app.delete('/api/users/:id', requireAuth, async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Ungültige User-ID.' });
  }

  try {
    const existing = await query('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!existing.length) {
      return res.status(404).json({ error: 'User nicht gefunden.' });
    }

    await query('DELETE FROM users WHERE id = ?', [userId]);
    return res.json({ status: 'ok', message: 'User gelöscht.' });
  } catch (error) {
    console.error('Delete User Fehler:', error.message);
    return res.status(500).json({ error: 'User konnte nicht gelöscht werden.' });
  }
});

app.patch('/api/users/:id/block', requireAuth, async (req, res) => {
  const userId = Number(req.params.id);
  const { blocked } = req.body || {};

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Ungültige User-ID.' });
  }

  try {
    await query('UPDATE users SET is_blocked = ? WHERE id = ?', [blocked ? 1 : 0, userId]);
    return res.json({ status: 'ok', message: blocked ? 'User gesperrt.' : 'User entsperrt.' });
  } catch (error) {
    console.error('Block User Fehler:', error.message);
    return res.status(500).json({ error: 'Status konnte nicht geändert werden.' });
  }
});

// API: Seitenaufrufe
app.get('/api/pageviews', requireAuth, async (req, res) => {
  try {
    const pageviews = await query(
      `SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, page, SUM(views) AS views
       FROM page_views
       GROUP BY DATE(date), page
       ORDER BY DATE(date) DESC, views DESC
       LIMIT 200`
    );

    return res.json({ status: 'ok', pageviews });
  } catch (error) {
    console.error('Pageviews Fehler:', error.message);
    return res.status(500).json({ error: 'Seitenaufrufe konnten nicht geladen werden.' });
  }
});

// API: KI News aus deutschen RSS-Feeds (ohne API-Key)
app.get('/api/news', async (req, res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'Surrogate-Control': 'no-store'
  });

  try {
    const payload = await buildLatestNewsPayload();
    latestNewsPayload = payload;
    return res.json(payload);
  } catch (error) {
    console.error('RSS News Fehler:', error.message);

    if (latestNewsPayload) {
      return res.json({
        ...latestNewsPayload,
        stale: true,
        staleReason: error.message
      });
    }

    return res.status(500).json({ error: `RSS News Fehler: ${error.message}` });
  }
});

app.post('/chat', async (req, res) => {
  const { messages } = req.body;

  try {
    const response = await fetch('https://api.mammouth.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MAMMOUTH_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein hilfreicher KI-Assistent auf einer Schul-Seminarkurs-Website über das Thema "KI & Un/Frieden". Du hilfst Besuchern bei Fragen über:\n- Künstliche Intelligenz und ihre gesellschaftlichen Auswirkungen\n- Die Themen: Arbeitswelt, Politik, Überwachung, Bildung\n- Chancen und Risiken von KI\nAntworte immer auf Deutsch, freundlich und verständlich.'
          },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || response.statusText || 'Unbekannter Fehler';
      console.error('API Fehler:', msg);
      return res.status(response.status).json({ reply: `API-Fehler: ${msg}` });
    }

    const data = await response.json();
    let reply = '';

    if (data?.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content;
    } else if (data.error) {
      reply = `API-Fehler: ${data.error.message || JSON.stringify(data.error)}`;
    } else {
      reply = 'Keine Antwort von der KI erhalten.';
    }

    return res.json({ reply });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'API Fehler' });
  }
});

app.get('/admin', (req, res) => {
  return res.redirect('/admin/login.html');
});

// Fallback: index.html für alle unbekannten GET-Routen
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});


const apiKey = process.env.MAMMOUTH_API_KEY;
if (!apiKey) {
  console.warn('WARNUNG: MAMMOUTH_API_KEY fehlt in .env.local. Die Chat-Funktion wird nicht funktionieren.');
}
