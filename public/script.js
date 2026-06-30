// ============================================
// Page Transition System
// ============================================

const PageTransition = {
    isTransitioning: false,
    transitionDuration: 300, // Millisekunden für Fade-Out
    fadeInDelay: 300, // Verzögerung für Fade-In nach Seite geladen

    init() {
        // Erstelle Overlay-Element wenn es nicht existiert
        if (!document.getElementById('page-transition-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'page-transition-overlay';
            document.body.appendChild(overlay);
        }

        this.setupLinkInterception();
        this.triggerPageLoadFadeIn();
    },

    setupLinkInterception() {
        // Höre auf alle Link-Klicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;

            const href = link.getAttribute('href');
            
            // Ignoriere externe Links, Anchor Links, und spezielle Links
            if (
                href.startsWith('#') ||
                href.startsWith('javascript:') ||
                href.includes('://') ||
                link.target === '_blank' ||
                link.rel === 'external'
            ) {
                return;
            }

            e.preventDefault();
            this.navigateToPage(href);
        }, true);

        // Höre auch auf Form-Submits wenn nötig
        window.addEventListener('beforeunload', () => {
            document.body.classList.add('page-loading');
        });
    },

    navigateToPage(href) {
        if (this.isTransitioning) return;

        this.isTransitioning = true;
        const overlay = document.getElementById('page-transition-overlay');

        // Starte Fade-Out
        overlay.classList.add('fade-out');

        // Nach Fade-Out Animation, navigiere
        setTimeout(() => {
            window.location.href = href;
        }, this.transitionDuration);

        // Timeout-Schutz: navigiere auf jeden Fall
        setTimeout(() => {
            window.location.href = href;
        }, this.transitionDuration + 500);
    },

    triggerPageLoadFadeIn() {
        // Warte kurz damit Browser die Seite rendern kann
        setTimeout(() => {
            const overlay = document.getElementById('page-transition-overlay');
            if (overlay) {
                overlay.classList.remove('fade-out');
            }
            this.isTransitioning = false;
        }, 50);
    }
};

// Initialisiere Page Transition System beim Laden
document.addEventListener('DOMContentLoaded', () => {
    PageTransition.init();
}, { once: true });

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

    if (!cookieBanner) {
        return;
    }

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
    if (cookieModal) {
        cookieModal.addEventListener('click', (e) => {
            if (e.target === cookieModal) {
                cookieModal.classList.add('hidden');
            }
        });
    }
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
    const dropdownTrigger = dropdown ? dropdown.querySelector('.dropdown-trigger') : null;
    const dropdownMenu = dropdown ? dropdown.querySelector('.dropdown-menu') : null;

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    // Dropdown für Mobilgeräte
    if (dropdownTrigger) {
        dropdownTrigger.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                dropdown.classList.toggle('active');
            }
        });
    }

    if (dropdownMenu) {
        dropdownMenu.querySelectorAll('a').forEach((anchor) => {
            anchor.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    dropdown.classList.remove('active');
                    navLinks.classList.remove('active');
                    if (hamburger) {
                        hamburger.classList.remove('active');
                    }
                }
            });
        });
    }
});

// Aktiven Navigationspunkt markieren
document.addEventListener('DOMContentLoaded', () => {
    const navAnchors = document.querySelectorAll('.nav-links a[href]');
    if (!navAnchors.length) return;

    const normalizePath = (path) => {
        if (!path) return '/';

        let normalized;

        try {
            // Use URL to normalize the path relative to the current origin
            const url = new URL(path, window.location.origin);
            normalized = url.pathname;
        } catch (e) {
            // Fallback: assume `path` is already a pathname
            normalized = path;
        }

        // Collapse multiple consecutive slashes into a single slash
        normalized = normalized.replace(/\/{2,}/g, '/');

        // Remove trailing slashes except for the root path
        if (normalized.length > 1) {
            normalized = normalized.replace(/\/+$/, '');
        }

        if (!normalized) normalized = '/';

        // Treat `/index.html` (with or without trailing slash) as the directory root
        if (normalized.endsWith('/index.html')) {
            normalized = normalized.slice(0, -'/index.html'.length) || '/';
        }
        return normalized;
    };

    const currentPath = normalizePath(window.location.pathname);

    navAnchors.forEach((anchor) => {
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')) return;

        const absolutePath = new URL(href, window.location.href).pathname;
        const linkPath = normalizePath(absolutePath);

        if (linkPath === currentPath) {
            anchor.classList.add('nav-active');

            // Wenn ein Unterthema aktiv ist, auch den "Themen"-Trigger hervorheben.
            const dropdown = anchor.closest('.dropdown');
            if (dropdown) {
                const dropdownTrigger = dropdown.querySelector('.dropdown-trigger');
                if (dropdownTrigger) {
                    dropdownTrigger.classList.add('nav-active');
                }
            }
        }
    });
});

// Dark Mode Toggle
document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    // Standard = Light Mode; nur Dark Mode wenn User das explizit gewählt hat
    const darkModeCookie = CookieManager.getCookie('darkMode');
    const darkModeLocalStorage = localStorage.getItem('darkMode');
    const isDarkMode = darkModeCookie === 'enabled' || darkModeLocalStorage === 'enabled';

    if (isDarkMode) {
        body.classList.add('dark-mode');
    }

    if (!darkModeToggle) return;

    const moonIcon = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M21 13.5A8.5 8.5 0 1 1 10.5 3a7 7 0 0 0 10.5 10.5z" fill="currentColor"></path>
        </svg>
    `;

    const sunIcon = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="4" fill="currentColor"></circle>
            <g stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <line x1="12" y1="2" x2="12" y2="5"></line>
                <line x1="12" y1="19" x2="12" y2="22"></line>
                <line x1="2" y1="12" x2="5" y2="12"></line>
                <line x1="19" y1="12" x2="22" y2="12"></line>
                <line x1="4.9" y1="4.9" x2="7" y2="7"></line>
                <line x1="17" y1="17" x2="19.1" y2="19.1"></line>
                <line x1="17" y1="7" x2="19.1" y2="4.9"></line>
                <line x1="4.9" y1="19.1" x2="7" y2="17"></line>
            </g>
        </svg>
    `;

    const updateThemeToggleIcon = (isDarkMode) => {
        darkModeToggle.innerHTML = isDarkMode ? sunIcon : moonIcon;
        darkModeToggle.setAttribute(
            'aria-label',
            isDarkMode ? 'Zum Light Mode wechseln' : 'Zum Dark Mode wechseln'
        );
        darkModeToggle.setAttribute(
            'title',
            isDarkMode ? 'Light Mode' : 'Dark Mode'
        );
    };

    updateThemeToggleIcon(isDarkMode);

    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            CookieManager.setCookie('darkMode', 'enabled', 365);
            localStorage.setItem('darkMode', 'enabled');
            updateThemeToggleIcon(true);
            console.log('Dark Mode aktiviert (Cookie gespeichert)');
        } else {
            CookieManager.setCookie('darkMode', 'disabled', 365);
            localStorage.setItem('darkMode', 'disabled');
            updateThemeToggleIcon(false);
            console.log('Dark Mode deaktiviert (Cookie gespeichert)');
        }
    });
});

// Zurück nach oben Button (global)
document.addEventListener('DOMContentLoaded', () => {
    const backToTopBtn = document.getElementById('backToTop');
    if (!backToTopBtn) return;

    const toggleBackToTopVisibility = () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('is-visible');
        } else {
            backToTopBtn.classList.remove('is-visible');
        }
    };

    window.addEventListener('scroll', toggleBackToTopVisibility, { passive: true });
    toggleBackToTopVisibility();

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

// Sanfter Reveal für Überschriften
document.addEventListener('DOMContentLoaded', () => {
        // Content-Card Überschriften ohne Schreibeffekt
    const contentHeadings = document.querySelectorAll('.content-card h2');
    contentHeadings.forEach(heading => {
                heading.style.opacity = '1';
    });
});

// Matrix-Zahlenhintergrund fuer Hero-Bereiche
(function matrixRain() {
    const canvas = document.getElementById('matrix-bg');
    if (!canvas) return;

    const hero = document.querySelector('.hero');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chars = '01';
    const fontSize = 18;
    let width = 0;
    let height = 0;
    let drops = [];
    let rafId = null;

    const resize = () => {
        const heroRect = hero ? hero.getBoundingClientRect() : { width: window.innerWidth, height: 420 };
        width = Math.max(1, Math.floor(heroRect.width));
        height = Math.max(1, Math.floor(heroRect.height));
        canvas.width = width;
        canvas.height = height;

        const columns = Math.max(1, Math.floor(width / fontSize));
        drops = Array.from({ length: columns }, () => Math.floor(Math.random() * (height / fontSize)));
    };

    const draw = () => {
        ctx.fillStyle = 'rgba(14, 30, 44, 0.12)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(140, 219, 255, 0.65)';
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i += 1) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            ctx.fillText(char, x, y);

            if (y > height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i] += 1;
        }

        rafId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener('resize', resize);
    window.addEventListener('beforeunload', () => {
        if (rafId) {
            window.cancelAnimationFrame(rafId);
        }
    });
})();

// ============================================
// Suchfunktion für die Website
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('nav-search');
    const searchBtn = document.getElementById('nav-search-btn');
    const searchModal = document.getElementById('search-modal');
    const searchModalClose = document.getElementById('search-modal-close');
    const searchSuggestions = document.getElementById('search-suggestions');
    
    if (!searchInput || !searchBtn) return;
    
    // Searchable content structure
    const searchablePages = [
        { title: 'Home', url: 'index.html', keywords: ['home', 'startseite', 'hauptseite'] },
        { title: 'Themen', url: '#themen', keywords: ['themen', 'kategorien', 'bereiche'] },
        { title: 'Arbeitswelt', url: 'arbeitswelt/arbeitswelt.html', keywords: ['arbeit', 'arbeitswelt', 'job', 'beruf', 'employment'] },
        { title: 'Politik', url: 'politik/politik.html', keywords: ['politik', 'regierung', 'demokratie', 'wahlen'] },
        { title: 'Überwachung', url: 'ueberwachung/ueberwachung.html', keywords: ['überwachung', 'sicherheit', 'datenschutz', 'privacy'] },
        { title: 'Bildung', url: 'bildung/bildung.html', keywords: ['bildung', 'schule', 'lernen', 'education', 'university'] },
        { title: 'Interviews', url: 'interviews/interviews.html', keywords: ['interviews', 'gespräche', 'meinungen'] },
        { title: 'KI News', url: 'newsfeed/newsfeed.html', keywords: ['news', 'nachrichten', 'feeds', 'aktuell'] },
        { title: 'Quiz', url: 'quiz/quiz.html', keywords: ['quiz', 'test', 'fragen', 'wissen'] },
        { title: 'Timeline', url: 'timeline/zeitstrahl.html', keywords: ['timeline', 'zeitstrahl', 'geschichte', 'history'] },
        { title: 'Impressum', url: 'impressum.html', keywords: ['impressum', 'kontakt', 'verantwortlich'] },
        { title: 'Datenschutz', url: 'datenschutz.html', keywords: ['datenschutz', 'privacy', 'daten', 'schutz'] },
        { title: 'Nutzungsbedingungen', url: 'nutzungsbedingungen.html', keywords: ['nutzung', 'bedingungen', 'terms'] },
        { title: 'Cookies', url: 'cookies.html', keywords: ['cookies', 'cookie-richtlinie', 'tracking'] }
    ];
    
    const performSearch = (query) => {
        if (!query.trim()) return [];
        
        const queryLower = query.toLowerCase();
        const results = [];
        
        searchablePages.forEach(page => {
            let score = 0;
            
            // Exact title match
            if (page.title.toLowerCase() === queryLower) {
                score += 100;
            }
            // Title includes query
            else if (page.title.toLowerCase().includes(queryLower)) {
                score += 50;
            }
            
            // Keywords match
            page.keywords.forEach(keyword => {
                if (keyword.includes(queryLower)) {
                    score += 25;
                }
                if (queryLower.includes(keyword.substring(0, 3))) {
                    score += 10;
                }
            });
            
            if (score > 0) {
                results.push({ ...page, score });
            }
        });
        
        // Sort by score
        return results.sort((a, b) => b.score - a.score);
    };
    
    const displaySuggestions = (results) => {
        searchSuggestions.innerHTML = '';
        
        if (results.length === 0) {
            searchSuggestions.innerHTML = '<div class="search-empty">Keine Ergebnisse gefunden</div>';
            return;
        }
        
        results.slice(0, 8).forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-suggestion-item';
            item.innerHTML = `
                <div class="search-suggestion-title">${result.title}</div>
                <div class="search-suggestion-keywords">${result.keywords.slice(0, 2).join(', ')}</div>
            `;
            item.addEventListener('click', () => {
                navigateToResult(result);
            });
            searchSuggestions.appendChild(item);
        });
    };
    
    const navigateToResult = (result) => {
        const isInSubdir = window.location.pathname.includes('/public/') && 
                           !window.location.pathname.endsWith('/public/index.html') &&
                           !window.location.pathname.endsWith('/index.html');
        const pathPrefix = isInSubdir ? '../' : '';
        
        window.location.href = pathPrefix + result.url;
    };
    
    const openSearchModal = () => {
        searchModal.classList.remove('hidden');
        searchInput.focus();
    };
    
    const closeSearchModal = () => {
        searchModal.classList.add('hidden');
        searchInput.value = '';
        searchSuggestions.innerHTML = '';
    };
    
    // Event Listeners
    searchBtn.addEventListener('click', openSearchModal);
    
    searchModalClose.addEventListener('click', closeSearchModal);
    
    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) {
            closeSearchModal();
        }
    });
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        const results = performSearch(query);
        displaySuggestions(results);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const results = performSearch(searchInput.value);
            if (results.length > 0) {
                navigateToResult(results[0]);
            }
        }
    });
    
    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !searchModal.classList.contains('hidden')) {
            closeSearchModal();
        }
    });
});