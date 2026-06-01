// Orquestra o app: auth → carrega dados → renderiza → liga interações e abas.

import { setupAuthGate } from './auth.js';
import { initCounts, tap, longPress, subscribe, allCounts, getCount } from './state.js';
import { readLocal, saveLocal, loadRemote, queueRemote, flushNow } from './storage.js';
import { renderIndex, renderAlbum, refreshSticker, refreshAll } from './render.js';
import { setupInteractions } from './interactions.js';
import { setupTabs } from './tabs.js';
import { renderMissing, renderDupes, renderStats } from './views.js';
import { setupExport } from './export.js';

let ctx = null; // { user, userId, email, displayName }
let started = false;

function start() {
  if (started) return;
  started = true;

  // Mostra quem está logado.
  const who = document.getElementById('who');
  if (who) who.textContent = ctx.displayName;

  // 1) Pinta com o cache local (instantâneo).
  initCounts(readLocal(ctx.userId));
  renderIndex(document.getElementById('index'));
  renderAlbum(document.getElementById('album'));

  // 2) Reage a cada mudança: atualiza a bolinha, salva local e agenda no Firestore.
  subscribe((id) => {
    const count = getCount(id);
    refreshSticker(id);
    saveLocal(ctx.userId, allCounts());
    queueRemote(ctx.userId, { email: ctx.email, displayName: ctx.displayName }, id, count);
  });

  // 3) Interações nas bolinhas (toque = +1, segurar 3s = -1).
  setupInteractions(document.getElementById('album'), {
    onTap: (id) => tap(id),
    onLongPress: (id) => longPress(id),
  });

  // 4) Abas (recalculam as views dinâmicas ao abrir).
  setupTabs((name) => {
    if (name === 'faltam') renderMissing(document.getElementById('view-faltam-body'), ctx.displayName);
    else if (name === 'repetidas') renderDupes(document.getElementById('view-repetidas-body'), ctx.displayName);
    else if (name === 'stats') renderStats(document.getElementById('view-stats-body'));
  });

  setupExport({ displayName: ctx.displayName });

  // 5) Reconcilia com o Firestore (fonte da verdade quando online).
  loadRemote(ctx.userId).then((res) => {
    if (res.ok) {
      initCounts(res.counts);
      saveLocal(ctx.userId, allCounts());
      refreshAll();
    }
  });

  // Garante o envio de mudanças pendentes ao fechar/ocultar a página.
  const flushOnLeave = () => { flushNow(); };
  window.addEventListener('pagehide', flushOnLeave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushOnLeave();
  });
}

setupAuthGate({
  onAuthorized: (info) => { ctx = info; start(); },
  onUnauthorized: () => {},
});

// Registra o service worker (PWA / offline). Caminho relativo p/ funcionar no GitHub Pages.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('[Figurinhas] SW:', e?.message || e));
  });
}
