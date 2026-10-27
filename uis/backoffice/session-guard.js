import { getCurrentUser, getToken, logout, safeReturnTarget, TOKEN_KEY } from './auth.js';

// One call per page. Initialization runs once; restored pages always revalidate.
export function guardSession(initialize) {
  const shells = document.querySelectorAll('[data-protected]');
  const panel = document.querySelector('#session-panel');
  const status = document.querySelector('#session-state');
  const retry = document.querySelector('#session-retry');
  let pending;
  let initialized = false;
  function conceal() {
    shells.forEach(shell => { shell.hidden = true; });
    panel.hidden = false;
  }
  function cancel() {
    pending?.abort();
    pending = undefined;
    conceal();
  }
  async function check() {
    cancel();
    const controller = new AbortController();
    pending = controller;
    const token = getToken();
    status.textContent = 'Checking your session…';
    retry.hidden = true;
    try {
      await getCurrentUser({ signal: controller.signal });
      if (controller.signal.aborted || getToken() !== token) return;
      if (!initialized) {
        initialize();
        initialized = true;
      }
      shells.forEach(shell => { shell.hidden = false; });
      panel.hidden = true;
    } catch {
      if (controller.signal.aborted || !getToken()) return;
      status.textContent = 'Unable to validate your session. Retry or sign out.';
      retry.hidden = false;
    }
  }
  retry.addEventListener('click', check);
  document.querySelectorAll('[data-logout]').forEach(button => {
    button.addEventListener('click', () => { cancel(); logout(); });
  });
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    const target = link.getAttribute('href');
    link.setAttribute('href', safeReturnTarget(target === './' ? 'index.html' : target));
  });
  window.addEventListener('pagehide', cancel);
  window.addEventListener('pageshow', event => { if (event.persisted) check(); });
  window.addEventListener('storage', event => {
    if (event.key === TOKEN_KEY || event.key === null) check();
  });
  check();
}
