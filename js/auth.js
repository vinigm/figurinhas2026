// Login com Google + porteiro (gate) com whitelist de e-mails.

import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import { auth, googleProvider } from './firebase-config.js';

// Cada "álbum" é compartilhado pelos e-mails da lista (um casal/família).
// Quem está na mesma lista vê e edita o MESMO álbum. Para liberar uma família
// nova, crie uma entrada aqui (e replique a mesma lista nas firestore.rules).
export const ALBUMS = {
  'vini-vivi': ['vinigm@gmail.com', 'victoria.cerutti@gmail.com'],
  // 'eduardo': ['eduardo@gmail.com', 'esposa@gmail.com', 'filha1@gmail.com', 'filha2@gmail.com'],
  // 'jamaico': ['jamaico@gmail.com', 'esposa@gmail.com', 'filho1@gmail.com', 'filho2@gmail.com', 'filho3@gmail.com'],
  // 'natalia': ['natalia@gmail.com', 'marido@gmail.com', 'filho1@gmail.com', 'filho2@gmail.com'],
};

// Descobre qual álbum o e-mail pode acessar (ou null se não autorizado).
export function albumIdForEmail(email) {
  const e = (email || '').toLowerCase();
  for (const [albumId, members] of Object.entries(ALBUMS)) {
    if (members.some((m) => m.toLowerCase() === e)) return albumId;
  }
  return null;
}

function isAuthorized(email) {
  return albumIdForEmail(email) !== null;
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
      // Sempre popup. O signInWithRedirect quebra em navegadores com "storage
      // partitioning" (Safari/iOS) — dá "missing initial state" — porque o
      // authDomain do Firebase (...firebaseapp.com) é um domínio diferente do app.
      // O popup, acionado pelo toque, funciona nesses navegadores.
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      const code = e?.code || '';
      // Usuário fechou/cancelou: não mostra erro.
      if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') return;
      const msg = code === 'auth/popup-blocked'
        ? 'O navegador bloqueou a janelinha de login. Permita pop-ups deste site e toque de novo.'
        : 'Não consegui entrar. Abra o site direto no Safari ou Chrome (não pelo navegador dentro de outro app, tipo WhatsApp) e tente de novo.';
      if (errEl) { errEl.textContent = msg; errEl.hidden = false; }
      console.error('[Figurinhas] login erro', code, e?.message || e);
    }
  });

  btnLogout?.addEventListener('click', async () => {
    await signOut(auth);
    location.reload();
  });

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
      albumId: albumIdForEmail(email),
      email,
      displayName: user.displayName || email.split('@')[0],
      photoURL: user.photoURL || '',
    });
  });
}
