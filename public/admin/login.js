const TOKEN_KEY = 'admin_jwt_token';
const USER_KEY = 'admin_user_data';

async function validateExistingLogin(token) {
  const response = await fetch('/api/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.ok;
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
      loginError.textContent = error.message;
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Einloggen';
    }
  });
});
