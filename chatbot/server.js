const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { query } = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

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

// API: The Guardian News
app.get('/api/news', async (req, res) => {
  const apiKey = process.env.GUARDIAN_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GUARDIAN_API_KEY nicht konfiguriert' });
  }

  const params = new URLSearchParams({
    q: 'artificial intelligence',
    'show-fields': 'thumbnail,headline,trailText,byline',
    'page-size': '12',
    'order-by': 'newest',
    'api-key': apiKey
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`https://content.guardianapis.com/search?${params}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({ error: `Guardian API Fehler: HTTP ${response.status}` });
    }

    const data = await response.json();

    if (data.response?.status !== 'ok') {
      return res.status(502).json({ error: 'Ungültige Antwort von Guardian API' });
    }

    const items = (data.response.results || []).map((result) => ({
      title: result.fields?.headline || result.webTitle,
      thumbnail: result.fields?.thumbnail || null,
      description: result.fields?.trailText || '',
      link: result.webUrl,
      pubDate: result.webPublicationDate,
      byline: result.fields?.byline || ''
    }));

    return res.json({ status: 'ok', items });
  } catch (error) {
    return res.status(500).json({ error: `Guardian API Fehler: ${error.message}` });
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
