/* Runs before paint on every page. No framework or network dependency. */
(() => {
  const root = document.documentElement;
  const key = 'learning-hub-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const mobile = window.matchMedia('(max-width: 780px)');
  let preference;
  try { preference = localStorage.getItem(key); } catch { /* Storage may be blocked. */ }
  if (!['light', 'dark'].includes(preference)) preference = null;
  const paths = {
    moon: '<path d="M20.9 13a9 9 0 0 1-9.9-9.9A9 9 0 1 0 20.9 13Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
    panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18m6-13-4 4 4 4"/>',
    arrow: '<path d="M19 12H5m7-7-7 7 7 7"/>',
    wave: '<path d="M2 12h3l3-8 5 16 3-8h6"/>',
    print: '<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-2"/><path d="M6 14h12v7H6zm11-2h1"/>',
    book: '<path d="M12 5v16m0-16C9 3 5 3 2 4v16c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z"/>',
    refresh: '<path d="M3 11a9 9 0 1 1 2.7 6.4M3 3v8h8"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
  };
  function drawIcon(element, name) {
    element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`;
  }
  function refresh() {
    document.querySelectorAll('[data-icon]').forEach(el => drawIcon(el, el.dataset.icon));
    const dark = root.dataset.theme === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      const label = dark ? 'Light mode' : 'Dark mode';
      button.setAttribute('aria-label', `Switch to ${label.toLowerCase()}`);
      button.querySelector('[data-theme-label]').textContent = label;
      drawIcon(button.querySelector('[data-theme-icon]'), dark ? 'sun' : 'moon');
    });
    document.querySelectorAll('[data-sidebar-toggle]').forEach(button => {
      const hidden = root.dataset.navigation === 'hidden';
      button.setAttribute('aria-expanded', String(!hidden));
      button.setAttribute('aria-label', hidden ? 'Show navigation' : 'Hide navigation');
    });
  }
  function apply(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    refresh();
    window.dispatchEvent(new Event('hub:theme-change'));
  }
  apply(preference || (system.matches ? 'dark' : 'light'));
  function syncMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.open = !mobile.matches;
  }
  document.addEventListener('DOMContentLoaded', () => { refresh(); syncMenu(); });
  window.addEventListener('hub:controls-ready', () => { refresh(); syncMenu(); });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-theme-toggle]')) {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch { /* Keep the current-page choice. */ }
      apply(preference);
    }
    if (event.target.closest('[data-sidebar-toggle]')) {
      root.dataset.navigation = root.dataset.navigation === 'hidden' ? 'visible' : 'hidden';
      refresh();
      window.dispatchEvent(new Event('resize'));
    }
    if (mobile.matches && event.target.closest('#navigation a, #navigation button')) {
      document.getElementById('mobile-menu').open = false;
    }
  });
  mobile.addEventListener('change', syncMenu);
  system.addEventListener('change', () => { if (!preference) apply(system.matches ? 'dark' : 'light'); });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = ['light', 'dark'].includes(event.newValue) ? event.newValue : null;
    apply(preference || (system.matches ? 'dark' : 'light'));
  });
})();
