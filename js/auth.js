// Login com Google + porteiro (gate) com whitelist de e-mails.

import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import { auth, googleProvider } from './firebase-config.js';

// 👇 Adicione aqui os e-mails dos amigos que poderão usar o app.
export const AUTHORIZED_EMAILS = [
  'vinigm@gmail.com',
  // 'amigo@gmail.com',
];

function isAuthorized(email) {
  return AUTHORIZED_EMAILS.includes((email || '').toLowerCase());
}

export function setupAuthGate({ onAuthorized, onUnauthorized }) {
  const gate = document.getElementById('auth-gate');
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const errEl = document.getElementById('auth-error');
  const app = document.getElementById('app');

  function showGate(errorMsg) {
    document.documentElement.classList.add('auth-hidden');
    if (gate) gate.hidden = false;
    if (app) app.hidden = true;
    if (errEl) {
      if (errorMsg) { errEl.textContent = errorMsg; errEl.hidden = false; }
      else errEl.hidden = true;
    }
  }

  function hideGate() {
    document.documentElement.classList.remove('auth-hidden');
    if (gate) gate.hidden = true;
    if (app) app.hidden = false;
  }

  btnLogin?.addEventListener('click', async () => {
    if (errEl) errEl.hidden = true;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      if (
        e.code === 'auth/popup-blocked' ||
        e.code === 'auth/cancelled-popup-request' ||
        e.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        await signInWithRedirect(auth, googleProvider);
      } else if (errEl) {
        errEl.textContent = 'Erro ao entrar: ' + (e.message || e.code);
        errEl.hidden = false;
      }
    }
  });

  btnLogout?.addEventListener('click', async () => {
    await signOut(auth);
    location.reload();
  });

  // Trata o retorno do fluxo de redirect (quando o popup é bloqueado).
  getRedirectResult(auth).catch((e) => console.error('[Figurinhas] redirect erro', e));

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      showGate();
      onUnauthorized?.();
      return;
    }
    const email = (user.email || '').toLowerCase();
    if (!isAuthorized(email)) {
      showGate('E-mail não autorizado: ' + email + '. Peça pro Vini liberar seu acesso.');
      signOut(auth);
      onUnauthorized?.();
      return;
    }
    hideGate();
    onAuthorized?.({
      user,
      userId: user.uid,
      email,
      displayName: user.displayName || email.split('@')[0],
      photoURL: user.photoURL || '',
    });
  });
}
