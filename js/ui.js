(function () {
  var THEME_KEY = 'site-theme';

  function applyTheme(theme) {
    var normalized = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', normalized);
    try {
      localStorage.setItem(THEME_KEY, normalized);
    } catch (e) {
      // ignore storage errors
    }

    var btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.textContent = normalized === 'dark' ? 'Tema: Scuro' : 'Tema: Chiaro';
      btn.setAttribute('aria-pressed', String(normalized === 'dark'));
    }
  }

  function initTheme() {
    var saved = 'light';
    try {
      saved = localStorage.getItem(THEME_KEY) || 'light';
    } catch (e) {
      saved = 'light';
    }
    applyTheme(saved);
  }

  function ensureThemeButton() {
    if (document.getElementById('themeToggleBtn')) return;

    var button = document.createElement('button');
    button.id = 'themeToggleBtn';
    button.type = 'button';
    button.className = 'theme-toggle-btn';
    button.textContent = 'Tema: Chiaro';
    button.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
      if (typeof window.showToast === 'function') {
        window.showToast('Tema aggiornato', 'info', 1800);
      }
    });

    document.body.appendChild(button);
  }

  function ensureToastContainer() {
    var existing = document.getElementById('toastContainer');
    if (existing) return existing;

    var container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  window.showToast = function (message, type, duration) {
    var container = ensureToastContainer();
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    var timeout = typeof duration === 'number' ? duration : 2600;
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () {
        toast.remove();
      }, 220);
    }, timeout);
  };

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    ensureThemeButton();
  });
})();
