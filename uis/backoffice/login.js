import { login, safeReturnTarget } from './auth.js';

const form = document.querySelector('#login-form');
const fields = form.querySelector('fieldset');
const state = document.querySelector('#login-state');
let pending;

window.addEventListener('pagehide', () => {
  pending?.abort();
  pending = undefined;
  fields.disabled = false;
  form.removeAttribute('aria-busy');
  form.elements.password.value = '';
  state.textContent = 'Use your TrackFlow account.';
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (pending) return;
  const data = new FormData(form);
  const controller = new AbortController();
  pending = controller;
  fields.disabled = true;
  form.setAttribute('aria-busy', 'true');
  state.classList.remove('state-error');
  state.textContent = 'Signing in…';
  try {
    await login(data.get('email').trim(), data.get('password'), { signal: controller.signal });
    if (!controller.signal.aborted) {
      window.location.replace(safeReturnTarget(new URLSearchParams(window.location.search).get('next')));
    }
  } catch (error) {
    if (!controller.signal.aborted) {
      state.classList.add('state-error');
      state.textContent = error instanceof TypeError
        ? 'Unable to connect. Please try again.' : error.message;
    }
  } finally {
    if (pending === controller) {
      pending = undefined;
      fields.disabled = false;
      form.removeAttribute('aria-busy');
      form.elements.password.value = '';
    }
  }
});
