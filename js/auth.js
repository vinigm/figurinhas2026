// Login com Google + autorização pelo cadastro (config/app no Firestore).

import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import { auth, googleProvider } from './firebase-config.js';
import { loadConfig, seedConfigIfMissing } from './config.js';

// Único e-mail fixo: o admin que gerencia o cadastro (cria famílias, adiciona gente).
export const ADMIN_EMAIL = 'vinigm@gmail.com';

export function setupAuthGate({ onAuthorized, onUnauthorized }) {
  const gate = document.getElementById('auth-gate');
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const errEl = document.getElementById('auth-error');
  const app = document.getElementById('app');

  function showGate(msg) {
    document.documentElement.classList.add('auth-hidden');
    if (gate) gate.hidden = false;
    if (app) app.hidden = true;
    if (errEl) {
      if (msg) { errEl.textContent = msg; errEl.hidden = false; } else errEl.hidden = true;
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
      // Só popup: signInWithRedirect quebra no Safari/iOS (storage partitioning).
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      const code = e?.code || '';
      if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') return;
      const msg = code === 'auth/popup-blocked'
        ? 'O navegador bloqueou a janelinha de login. Permita pop-ups deste site e toque de novo.'
        : 'Não consegui entrar. Abra o site direto no Safari/Chrome (não pelo navegador dentro de outro app) e tente de novo.';
      if (errEl) { errEl.textContent = msg; errEl.hidden = false; }
      console.error('[Figurinhas] login erro', code, e?.message || e);
    }
  });

  btnLogout?.addEventListener('click', async () => {
    await signOut(auth);
    location.reload();
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) { showGate(); onUnauthorized?.(); return; }
    const email = (user.email || '').toLowerCase();
    const isAdmin = email === ADMIN_EMAIL;

    // O admin garante que o cadastro exista (cria na 1ª vez); os demais só leem.
    let config = null;
    try {
      config = isAdmin ? await seedConfigIfMissing() : await loadConfig();
    } catch (e) {
      console.error('[Figurinhas] erro ao carregar cadastro:', e?.message || e);
    }

    const albumId = (config && config.members && config.members[email]) || null;

    // Não cadastrado (e não é o admin) → barra.
    if (!albumId && !isAdmin) {
      showGate('Você ainda não foi cadastrado no app. Peça pro Vini te adicionar. 🙂');
      await signOut(auth);
      onUnauthorized?.();
      return;
    }

    hideGate();
    onAuthorized?.({
      user, email, albumId, isAdmin, config,
      displayName: user.displayName || email.split('@')[0],
      photoURL: user.photoURL || '',
    });
  });
}
