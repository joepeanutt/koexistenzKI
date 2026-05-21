const TOKEN_KEY = 'admin_jwt_token';
const USER_KEY = 'admin_user_data';

// Demo Zugangsdaten für Schulprojekt
const DEMO_CREDENTIALS = {
  username: 'admin',
  password: 'admin2026'
};

async function validateExistingLogin(token) {
  // Demo: Prüfe Token Format
  if (token && token.startsWith('demo_')) {
    return true;
  }

  try {
    const response = await fetch('/api/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.ok;
  } catch (error) {
    console.log('Backend nicht erreichbar, verwende Demo-Login');
    return true;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const existingToken = localStorage.getItem(TOKEN_KEY);
  if (existingToken) {
    try {
      const stillValid = await validateExistingLogin(existingToken);
      if (stillValid) {
        window.location.href = '/admin/index.html';
        return;
      }
    } catch (error) {
      console.error('Token Check fehlgeschlagen:', error);
    }
  }

  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginError.textContent = '';
    loginBtn.disabled = true;
    loginBtn.textContent = 'Prüfe Login ...';

    const formData = new FormData(loginForm);
    const payload = {
      username: String(formData.get('username') || '').trim(),
      password: String(formData.get('password') || '')
    };

    try {
      // Demo Login für Schulprojekt
      if (payload.username === DEMO_CREDENTIALS.username && 
          payload.password === DEMO_CREDENTIALS.password) {
        
        const demoToken = 'demo_' + Date.now() + '_' + Math.random();
        const demoUser = {
          id: 1,
          username: payload.username,
          role: 'admin',
          loginTime: new Date().toISOString()
        };

        localStorage.setItem(TOKEN_KEY, demoToken);
        localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
        console.log('Demo-Login erfolgreich');
        window.location.href = '/admin/index.html';
        return;
      }

      // Versuche echten Backend-Login
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || data.status !== 'ok') {
        throw new Error(data.error || 'Login fehlgeschlagen.');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      window.location.href = '/admin/index.html';
    } catch (error) {
      // Fallback: Demo-Login anbieten
      if (payload.username === 'admin' && payload.password === 'admin2026') {
        const demoToken = 'demo_' + Date.now() + '_' + Math.random();
        const demoUser = {
          id: 1,
          username: payload.username,
          role: 'admin',
          loginTime: new Date().toISOString(),
          isDemo: true
        };

        localStorage.setItem(TOKEN_KEY, demoToken);
        localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
        console.log('Demo-Login (Fallback) erfolgreich');
        window.location.href = '/admin/index.html';
      } else {
        loginError.textContent = error.message;
      }
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Einloggen';
    }
  });
});
