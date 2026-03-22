// ============================================
// Cookie Management System
// ============================================

const CookieManager = {
    // Setze einen Cookie
    setCookie(name, value, days = 365) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Strict`;
    },

    // Lese einen Cookie
    getCookie(name) {
        const nameEQ = name + '=';
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.indexOf(nameEQ) === 0) {
                return decodeURIComponent(cookie.substring(nameEQ.length));
            }
        }
        return null;
    },

    // Lösche einen Cookie
    deleteCookie(name) {
        this.setCookie(name, '', -1);
    },

    // Prüfe ob Cookie-Zustimmung gegeben wurde
    hasConsentBeenGiven() {
        return this.getCookie('cookie-consent') !== null;
    },

    // Prüfe ob ein bestimmter Cookie-Typ akzeptiert wurde
    isCookieTypeAccepted(type) {
        const consent = this.getCookie('cookie-consent');
        if (!consent) return false;
        try {
            const consentData = JSON.parse(consent);
            return consentData[type] === true;
        } catch (e) {
            return false;
        }
    },

    // Speichere Cookie-Preferences
    setConsentPreferences(preferences) {
        const consentData = {
            essential: true, // Immer wahr
            functional: preferences.functional || false,
            analytics: preferences.analytics || false,
            timestamp: new Date().toISOString()
        };
        this.setCookie('cookie-consent', JSON.stringify(consentData), 365);
        
        // Logge Cookie-Zustimmung an Backend
        fetch('http://localhost:3000/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'cookie',
                message: 'functional:' + (preferences.functional ? 'accept' : 'reject')
            })
        }).catch(e => console.log('Logging fehlgeschlagen'));
    }
};

// ============================================
// Cookie Banner Funktionalität
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const cookieBanner = document.getElementById('cookie-banner');
    const cookieModal = document.getElementById('cookie-modal');
    const cookieAcceptBtn = document.getElementById('cookie-accept');
    const cookieRejectBtn = document.getElementById('cookie-reject');
    const cookieMoreInfoBtn = document.getElementById('cookie-more-info');
    const cookieModalCloseBtn = document.getElementById('cookie-modal-close');
    const cookieSettingsRejectBtn = document.getElementById('cookie-settings-reject');
    const cookieSettingsSaveBtn = document.getElementById('cookie-settings-save');

    // Zeige Banner nur wenn noch keine Zustimmung gegeben wurde
    if (!CookieManager.hasConsentBeenGiven()) {
        cookieBanner.classList.remove('hidden');
    } else {
        cookieBanner.classList.add('hidden');
    }

    // Akzeptiere alle Cookies
    if (cookieAcceptBtn) {
        cookieAcceptBtn.addEventListener('click', () => {
            CookieManager.setConsentPreferences({
                functional: true,
                analytics: true
            });
            cookieBanner.classList.add('hidden');
            console.log('Alle Cookies akzeptiert');
        });
    }

    // Lehne Cookies ab
    if (cookieRejectBtn) {
        cookieRejectBtn.addEventListener('click', () => {
            CookieManager.setConsentPreferences({
                functional: false,
                analytics: false
            });
            cookieBanner.classList.add('hidden');
            console.log('Cookies abgelehnt');
        });
    }

    // Öffne Cookie-Einstellungsmodal
    if (cookieMoreInfoBtn) {
        cookieMoreInfoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            cookieModal.classList.remove('hidden');
            
            // Lade aktuelle Einstellungen
            const functional = document.getElementById('cookie-functional');
            const analytics = document.getElementById('cookie-analytics');
            
            functional.checked = CookieManager.isCookieTypeAccepted('functional');
            analytics.checked = CookieManager.isCookieTypeAccepted('analytics');
        });
    }

    // Schließe Modal
    if (cookieModalCloseBtn) {
        cookieModalCloseBtn.addEventListener('click', () => {
            cookieModal.classList.add('hidden');
        });
    }

    // Lehne alle in Modal ab
    if (cookieSettingsRejectBtn) {
        cookieSettingsRejectBtn.addEventListener('click', () => {
            CookieManager.setConsentPreferences({
                functional: false,
                analytics: false
            });
            cookieModal.classList.add('hidden');
            console.log('Alle Cookies in Einstellungen abgelehnt');
        });
    }

    // Speichere Einstellungen
    if (cookieSettingsSaveBtn) {
        cookieSettingsSaveBtn.addEventListener('click', () => {
            const functional = document.getElementById('cookie-functional').checked;
            const analytics = document.getElementById('cookie-analytics').checked;
            
            CookieManager.setConsentPreferences({
                functional: functional,
                analytics: analytics
            });
            
            cookieModal.classList.add('hidden');
            console.log('Cookie-Einstellungen gespeichert');
        });
    }

    // Schließe Modal bei Klick außerhalb
    cookieModal.addEventListener('click', (e) => {
        if (e.target === cookieModal) {
            cookieModal.classList.add('hidden');
        }
    });
});

// Wartet, bis das Dokument geladen ist
document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('colorButton');
    const hero = document.querySelector('.hero');

    // Funktion: Ändert die Farbe des Hero-Bereichs beim Klicken
    if (button) {
        button.addEventListener('click', () => {
            const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            hero.style.backgroundColor = randomColor;
            console.log("Farbe wurde geändert auf: " + randomColor);
        });
    }
});

// Hamburger Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const dropdown = document.getElementById('dropdown');
    const dropdownMenu = dropdown ? dropdown.querySelector('.dropdown-menu') : null;

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    // Dropdown für Mobilgeräte
    if (dropdown) {
        dropdown.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                dropdown.classList.toggle('active');
            }
        });
    }
});

// Dark Mode Toggle
document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    // Load saved theme from Cookie und localStorage
    const darkModeCookie = CookieManager.getCookie('darkMode');
    const darkModeLocalStorage = localStorage.getItem('darkMode');
    const isDarkMode = darkModeCookie === 'enabled' || darkModeLocalStorage === 'enabled';

    if (isDarkMode) {
        body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️';
    }

    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            CookieManager.setCookie('darkMode', 'enabled', 365);
            localStorage.setItem('darkMode', 'enabled');
            darkModeToggle.textContent = '☀️';
            console.log('Dark Mode aktiviert (Cookie gespeichert)');
        } else {
            CookieManager.setCookie('darkMode', 'disabled', 365);
            localStorage.setItem('darkMode', 'disabled');
            darkModeToggle.textContent = '🌙';
            console.log('Dark Mode deaktiviert (Cookie gespeichert)');
        }
    });
});

// Scroll Animationen
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.01,
        rootMargin: '0px 0px 0px 0px'
    };

    // Fallback für ältere Browser ohne IntersectionObserver
    if (!window.IntersectionObserver) {
        console.warn('IntersectionObserver nicht unterstützt. Fallback wird verwendet.');
        const cards = document.querySelectorAll('.content-card, .ki-info-card, .app-card, .about-us-section, .member');
        cards.forEach(card => card.classList.add('visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Trigger Typing for KI text
                if (entry.target.classList.contains('ki-info-card')) {
                    const kiText = document.getElementById('ki-text');
                    if (kiText && !kiText.dataset.typed) {
                        kiText.dataset.typed = 'true';
                        const text = kiText.textContent;
                        typeWriter(kiText, text, 50);
                    }
                }
            } else if (entry.target.classList.contains('member')) {
                entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    const cards = document.querySelectorAll('.content-card, .ki-info-card, .app-card, .about-us-section, .member');
    cards.forEach(card => observer.observe(card));
});

// Scroll Progress Bar + Team-Interaktion
window.addEventListener('scroll', () => {
    const progressBar = document.getElementById('scroll-progress');
    if (progressBar) {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = scrollPercent + '%';
    }
});

// Typing Effect für Hero und Content-Überschriften
document.addEventListener('DOMContentLoaded', () => {
    const typeWriter = (element, text, speed = 100) => {
        element.textContent = '';
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
    };

    // Hero-Text
    const heroText = document.querySelector('.hero h2');
    if (heroText) {
        const text = heroText.textContent;
        typeWriter(heroText, text);
    }

    // Content-Card Überschriften
    const contentHeadings = document.querySelectorAll('.content-card h2');
    contentHeadings.forEach(heading => {
        const text = heading.textContent;
        typeWriter(heading, text, 80); // Schneller für Unterseiten
    });
});

// Interaktiver Parallax-Effekt für Hero-Hintergrund
window.addEventListener('scroll', () => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const scrollY = window.scrollY || window.pageYOffset;
  // Parallax: verschiebe den Hintergrund leicht vertikal
  hero.style.backgroundPosition = `center ${-scrollY * 0.18}px`;
  // Optional: animiere die Scanlines-Deckkraft je nach Scroll
  const after = hero.querySelector('::after');
  // (Pseudo-Elemente können nicht direkt per JS angesprochen werden)
  // Daher: Passe die Opazität via CSS-Variable an
  hero.style.setProperty('--scanline-opacity', 1 - Math.min(scrollY / 600, 0.7));
});

// Passe Scanline-Deckkraft im CSS an
const style = document.createElement('style');
style.innerHTML = `
.hero::after {
  opacity: var(--scanline-opacity, 1);
}`;
document.head.appendChild(style);

// Matrix-Zahlenregen für alle Themenseiten
(function matrixRain(){
  const canvas = document.getElementById('matrix-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let hero = document.querySelector('.hero');
  let height = canvas.height = hero ? hero.offsetHeight : 400;
  let fontSize = 22;
  let columns = Math.floor(width / fontSize);
  let drops = Array(columns).fill(1);
  const chars = '01';

  function draw() {
    ctx.fillStyle = 'rgba(15,32,39,0.18)';
    ctx.fillRect(0, 0, width, height);
    ctx.font = fontSize + 'px monospace';
    ctx.fillStyle = '#00ffe7';
    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if (Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
      if (drops[i] * fontSize > height) drops[i] = 0;
    }
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    hero = document.querySelector('.hero');
    height = canvas.height = hero ? hero.offsetHeight : 400;
    columns = Math.floor(width / fontSize);
    drops = Array(columns).fill(1);
  }

  window.addEventListener('resize', resize);
  setInterval(draw, 55);
  resize();
})();