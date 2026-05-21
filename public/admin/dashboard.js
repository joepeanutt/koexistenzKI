const TOKEN_KEY = 'admin_jwt_token';
const USER_KEY = 'admin_user_data';

// Demo-Daten für Schulprojekt
const DEMO_STATS = {
  totalVisitors: 2847,
  activeUsersToday: 124,
  timeframe: {
    day: 342,
    week: 2156,
    month: 8923
  },
  topPages: [
    { page: '/index.html', views: 856 },
    { page: '/newsfeed/newsfeed.html', views: 634 },
    { page: '/ueberwachung/ueberwachung.html', views: 523 },
    { page: '/interview.html', views: 412 },
    { page: '/quiz/quiz.html', views: 356 }
  ],
  visitorsTrend: Array.from({ length: 30 }, (_, i) => ({
    label: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('de-DE'),
    views: Math.floor(Math.random() * 400) + 100
  })),
  deviceDistribution: [
    { device: 'Desktop', count: 1200 },
    { device: 'Mobile', count: 1400 },
    { device: 'Tablet', count: 247 }
  ]
};

const DEMO_USERS = [
  { id: 1, username: 'berat_ayhan', email: 'berat@school.local', created_at: '2024-01-15', visits: 245, is_blocked: false },
  { id: 2, username: 'raul_bugnar', email: 'raul@school.local', created_at: '2024-01-15', visits: 189, is_blocked: false },
  { id: 3, username: 'henrik_schnetzer', email: 'henrik@school.local', created_at: '2024-01-15', visits: 267, is_blocked: false },
  { id: 4, username: 'joel_stamler', email: 'joel@school.local', created_at: '2024-01-15', visits: 201, is_blocked: false },
  { id: 5, username: 'demo_user_1', email: 'demo1@school.local', created_at: '2024-02-01', visits: 34, is_blocked: false },
  { id: 6, username: 'demo_user_2', email: 'demo2@school.local', created_at: '2024-02-03', visits: 12, is_blocked: false }
];

const DEMO_PAGEVIEWS = [
  { date: new Date().toISOString(), page: '/index.html', views: 89 },
  { date: new Date(Date.now() - 86400000).toISOString(), page: '/index.html', views: 105 },
  { date: new Date(Date.now() - 86400000).toISOString(), page: '/newsfeed/newsfeed.html', views: 78 },
  { date: new Date(Date.now() - 172800000).toISOString(), page: '/quiz/quiz.html', views: 64 },
  { date: new Date(Date.now() - 172800000).toISOString(), page: '/ueberwachung/ueberwachung.html', views: 92 },
  { date: new Date(Date.now() - 259200000).toISOString(), page: '/interviews/interviews.html', views: 45 }
];

const state = {
  users: [],
  pageviews: [],
  lastTrend: [],
  currentRange: 30,
  currentSort: {
    sortBy: 'created_at',
    order: 'desc'
  },
  visitorsChart: null,
  deviceChart: null,
  isDemoMode: false
};

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function logout() {
  const token = getToken();
  if (token && !token.startsWith('demo_')) {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout Request fehlgeschlagen:', error);
    }
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/admin/login.html';
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  if (!token) {
    await logout();
    return null;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    if (response.status === 401) {
      await logout();
      return null;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Request fehlgeschlagen.');
    }

    return data;
  } catch (error) {
    console.log('API-Aufruf fehlgeschlagen, verwende Demo-Daten:', error.message);
    return null;
  }
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('de-DE');
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('de-DE');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

function updateSyncTime() {
  const label = document.getElementById('lastSync');
  if (!label) return;
  label.textContent = `Sync: ${new Date().toLocaleTimeString('de-DE')}`;
}

function toNumber(value) {
  return Number(value || 0);
}

function setWelcomeText() {
  const userRaw = localStorage.getItem(USER_KEY);
  const welcomeText = document.getElementById('welcomeText');

  if (!userRaw) {
    welcomeText.textContent = 'Willkommen im Admin-Bereich';
    return;
  }

  try {
    const user = JSON.parse(userRaw);
    welcomeText.textContent = `Eingeloggt als ${user.username}`;
  } catch (error) {
    welcomeText.textContent = 'Willkommen im Admin-Bereich';
  }
}

function renderStatCards(stats) {
  document.getElementById('totalVisitors').textContent = toNumber(stats.totalVisitors).toLocaleString('de-DE');
  document.getElementById('activeUsers').textContent = toNumber(stats.activeUsersToday).toLocaleString('de-DE');
  document.getElementById('visitsDay').textContent = toNumber(stats.timeframe.day).toLocaleString('de-DE');
  document.getElementById('visitsWeek').textContent = toNumber(stats.timeframe.week).toLocaleString('de-DE');
  document.getElementById('visitsMonth').textContent = toNumber(stats.timeframe.month).toLocaleString('de-DE');

  const topPagesList = document.getElementById('topPagesList');
  topPagesList.innerHTML = '';

  if (!stats.topPages.length) {
    topPagesList.innerHTML = '<li>Keine Daten vorhanden.</li>';
    return;
  }

  stats.topPages.forEach((entry) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${entry.page}</span><strong>${toNumber(entry.views).toLocaleString('de-DE')}</strong>`;
    topPagesList.appendChild(li);
  });
}

function renderVisitorsChart(trend) {
  const ctx = document.getElementById('visitorsChart');
  if (!ctx) return;

  if (state.visitorsChart) {
    state.visitorsChart.destroy();
  }

  const sortedTrend = [...trend].sort((a, b) => String(a.label).localeCompare(String(b.label)));
  const filteredTrend = sortedTrend.slice(-state.currentRange);
  const labels = filteredTrend.map((entry) => entry.label);
  const values = filteredTrend.map((entry) => Number(entry.views || 0));

  state.visitorsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Besuche',
        data: values,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(59, 130, 246, 0.16)',
        tension: 0.35,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: '#d4d7ff' }
        }
      },
      scales: {
        x: {
          ticks: { color: '#9ca3c9' },
          grid: { color: 'rgba(156, 163, 201, 0.12)' }
        },
        y: {
          ticks: { color: '#9ca3c9' },
          grid: { color: 'rgba(156, 163, 201, 0.12)' }
        }
      }
    }
  });
}

function renderPageviewsTable(entries) {
  const tbody = document.getElementById('pageviewsTableBody');
  const countLabel = document.getElementById('pageviewCount');

  if (!tbody || !countLabel) return;

  tbody.innerHTML = '';
  countLabel.textContent = `${entries.length} Einträge`;

  if (!entries.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="3">Keine Seitenaufrufe vorhanden.</td>';
    tbody.appendChild(tr);
    return;
  }

  entries.slice(0, 12).forEach((entry) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(entry.date)}</td>
      <td>${entry.page}</td>
      <td>${toNumber(entry.views).toLocaleString('de-DE')}</td>
    `;
    tbody.appendChild(tr);
  });
}

function exportUsersCsv() {
  if (!state.users.length) {
    showToast('Keine Nutzer zum Exportieren vorhanden.');
    return;
  }

  const rows = [
    ['id', 'username', 'email', 'created_at', 'last_login', 'visits', 'is_blocked']
  ];

  state.users.forEach((user) => {
    rows.push([
      user.id,
      user.username,
      user.email,
      user.created_at || '',
      user.last_login || '',
      user.visits,
      user.is_blocked
    ]);
  });

  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Users als CSV exportiert.');
}

async function refreshAllData() {
  await Promise.all([loadStats(), loadUsers(), loadPageviews()]);
  updateSyncTime();
}

function renderDeviceChart(distribution) {
  const ctx = document.getElementById('deviceChart');
  if (!ctx) return;

  if (state.deviceChart) {
    state.deviceChart.destroy();
  }

  state.deviceChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: distribution.map((entry) => entry.device),
      datasets: [{
        data: distribution.map((entry) => Number(entry.count || 0)),
        backgroundColor: ['#3b82f6', '#8b5cf6', '#06b6d4']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: '#d4d7ff' }
        }
      }
    }
  });
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '';

  if (!users.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="5">Keine Nutzer gefunden.</td>';
    tbody.appendChild(tr);
    return;
  }

  users.forEach((user) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${user.username}${user.is_blocked ? ' <span class="status-badge">gesperrt</span>' : ''}</td>
      <td>${user.email}</td>
      <td>${formatDate(user.created_at)}</td>
      <td>${user.visits}</td>
      <td>
        <div class="action-group">
          <button type="button" class="mini-btn" data-action="details" data-id="${user.id}">Details</button>
          <button type="button" class="mini-btn warn" data-action="block" data-id="${user.id}" data-blocked="${user.is_blocked ? '1' : '0'}">${user.is_blocked ? 'Entsperren' : 'Sperren'}</button>
          <button type="button" class="mini-btn danger" data-action="delete" data-id="${user.id}">Löschen</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openModal(html) {
  const modal = document.getElementById('userModal');
  const details = document.getElementById('userDetailsContent');
  details.innerHTML = html;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  const modal = document.getElementById('userModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

async function loadStats() {
  const payload = await apiFetch('/api/stats');
  
  if (!payload) {
    // Demo-Fallback
    state.isDemoMode = true;
    console.log('Verwende Demo-Daten für Stats');
    state.lastTrend = DEMO_STATS.visitorsTrend;
    renderStatCards(DEMO_STATS);
    renderVisitorsChart(state.lastTrend);
    renderDeviceChart(DEMO_STATS.deviceDistribution);
    return;
  }

  state.lastTrend = payload.stats.visitorsTrend || [];
  renderStatCards(payload.stats);
  renderVisitorsChart(state.lastTrend);
  renderDeviceChart(payload.stats.deviceDistribution || []);
}

async function loadUsers() {
  const searchInput = document.getElementById('searchInput');
  const params = new URLSearchParams({
    q: searchInput.value || '',
    sortBy: state.currentSort.sortBy,
    order: state.currentSort.order
  });

  const payload = await apiFetch(`/api/users?${params.toString()}`);
  
  if (!payload) {
    // Demo-Fallback
    state.isDemoMode = true;
    console.log('Verwende Demo-Daten für Users');
    let filteredUsers = [...DEMO_USERS];
    
    if (searchInput.value) {
      const query = searchInput.value.toLowerCase();
      filteredUsers = filteredUsers.filter(u => 
        u.username.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
      );
    }
    
    state.users = filteredUsers;
    renderUsersTable(state.users);
    return;
  }

  state.users = payload.users;
  renderUsersTable(state.users);
}

async function loadPageviews() {
  const payload = await apiFetch('/api/pageviews');
  
  if (!payload) {
    // Demo-Fallback
    state.isDemoMode = true;
    console.log('Verwende Demo-Daten für Pageviews');
    state.pageviews = DEMO_PAGEVIEWS;
    renderPageviewsTable(state.pageviews);
    return;
  }

  state.pageviews = payload.pageviews || [];
  renderPageviewsTable(state.pageviews);
}

async function showUserDetails(userId) {
  const payload = await apiFetch(`/api/users/${userId}`);
  
  if (!payload) {
    // Demo-Fallback
    const demoUser = DEMO_USERS.find(u => u.id === userId);
    if (!demoUser) {
      showToast('User nicht gefunden.');
      return;
    }

    const sessionsMarkup = `
      <ul class="session-list">
        <li>${formatDateTime(new Date(Date.now() - 3600000).toISOString())} - Desktop (Chrome)</li>
        <li>${formatDateTime(new Date(Date.now() - 7200000).toISOString())} - Mobile (Safari)</li>
        <li>${formatDateTime(new Date(Date.now() - 86400000).toISOString())} - Desktop (Firefox)</li>
      </ul>
    `;

    openModal(`
      <p><strong>Name:</strong> ${demoUser.username}</p>
      <p><strong>E-Mail:</strong> ${demoUser.email}</p>
      <p><strong>Besuche:</strong> ${demoUser.visits}</p>
      <p><strong>Erstellt:</strong> ${formatDateTime(demoUser.created_at)}</p>
      <p><strong>Letzter Login:</strong> ${formatDateTime(new Date().toISOString())}</p>
      <h4>Letzte Sessions (Demo)</h4>
      ${sessionsMarkup}
    `);
    return;
  }

  const user = payload.user;
  const sessions = payload.recentSessions || [];

  const sessionsMarkup = sessions.length
    ? `<ul class="session-list">${sessions.map((entry) => `<li>${formatDateTime(entry.timestamp)} - ${entry.device} (${entry.browser})</li>`).join('')}</ul>`
    : '<p>Keine Sessions vorhanden.</p>';

  openModal(`
    <p><strong>Name:</strong> ${user.username}</p>
    <p><strong>E-Mail:</strong> ${user.email}</p>
    <p><strong>Besuche:</strong> ${user.visits}</p>
    <p><strong>Erstellt:</strong> ${formatDateTime(user.created_at)}</p>
    <p><strong>Letzter Login:</strong> ${formatDateTime(user.last_login)}</p>
    <h4>Letzte Sessions</h4>
    ${sessionsMarkup}
  `);
}

async function deleteUser(userId) {
  const confirmed = window.confirm('User wirklich löschen?');
  if (!confirmed) return;

  await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
  await loadUsers();
  showToast('User wurde gelöscht.');
}

async function toggleBlock(userId, currentlyBlocked) {
  await apiFetch(`/api/users/${userId}/block`, {
    method: 'PATCH',
    body: JSON.stringify({ blocked: !currentlyBlocked })
  });
  await loadUsers();
  showToast(currentlyBlocked ? 'User entsperrt.' : 'User gesperrt.');
}

function bindEvents() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    logout().catch((error) => {
      console.error(error);
    });
  });
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);

  document.getElementById('userModal').addEventListener('click', (event) => {
    if (event.target.id === 'userModal') {
      closeModal();
    }
  });

  document.getElementById('searchInput').addEventListener('input', () => {
    loadUsers().catch((error) => {
      console.error(error);
      alert(error.message);
    });
  });

  document.getElementById('refreshBtn').addEventListener('click', () => {
    refreshAllData().then(() => {
      showToast('Daten aktualisiert.');
    }).catch((error) => {
      console.error(error);
      alert(error.message);
    });
  });

  document.getElementById('exportUsersBtn').addEventListener('click', exportUsersCsv);

  document.querySelectorAll('.range-btn').forEach((button) => {
    button.addEventListener('click', () => {
      state.currentRange = Number(button.dataset.range || 30);
      document.querySelectorAll('.range-btn').forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      renderVisitorsChart(state.lastTrend || []);
    });
  });

  document.querySelectorAll('th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const sortBy = th.dataset.sort;
      if (state.currentSort.sortBy === sortBy) {
        state.currentSort.order = state.currentSort.order === 'asc' ? 'desc' : 'asc';
      } else {
        state.currentSort.sortBy = sortBy;
        state.currentSort.order = 'asc';
      }

      loadUsers().catch((error) => {
        console.error(error);
        alert(error.message);
      });
    });
  });

  document.getElementById('usersTableBody').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const userId = Number(button.dataset.id);

    if (action === 'details') {
      showUserDetails(userId).catch((error) => {
        console.error(error);
        alert(error.message);
      });
      return;
    }

    if (action === 'delete') {
      deleteUser(userId).catch((error) => {
        console.error(error);
        alert(error.message);
      });
      return;
    }

    if (action === 'block') {
      const blocked = button.dataset.blocked === '1';
      toggleBlock(userId, blocked).catch((error) => {
        console.error(error);
        alert(error.message);
      });
    }
  });
}

async function initDashboard() {
  if (!getToken()) {
    await logout();
    return;
  }

  setWelcomeText();
  bindEvents();

  try {
    await refreshAllData();
  } catch (error) {
    console.error(error);
    alert(error.message || 'Dashboard konnte nicht geladen werden.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initDashboard().catch((error) => {
    console.error(error);
    alert(error.message || 'Unbekannter Fehler.');
  });
});
