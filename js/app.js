// Orquestra o app: auth → carrega dados → renderiza → liga interações e abas.

import { setupAuthGate } from './auth.js';
import { initCounts, tap, longPress, subscribe, allCounts, getCount } from './state.js';
import { readLocal, saveLocal, loadRemote, queueRemote, flushNow } from './storage.js';
import { renderIndex, renderAlbum, refreshSticker, refreshAll } from './render.js';
import { setupInteractions } from './interactions.js';
import { setupTabs } from './tabs.js';
import { renderMissing, renderDupes, renderStats } from './views.js';
import { setupExport } from './export.js';
import { renderAdmin } from './admin.js';
import { renderTrades } from './trades.js';

let ctx = null; // { user, albumId, email, displayName }
let started = false;

function start() {
  if (started) return;
  started = true;

  // Mostra quem está logado.
  const who = document.getElementById('who');
  if (who) who.textContent = ctx.displayName;

  // A aba de Admin só aparece pro admin.
  if (ctx.isAdmin) {
    const adminTab = document.getElementById('tab-admin');
    if (adminTab) adminTab.hidden = false;
  }

  // 1) Pinta com o cache local (instantâneo).
  initCounts(readLocal(ctx.albumId));
  renderIndex(document.getElementById('index'));
  renderAlbum(document.getElementById('album'));

  // 2) Reage a cada mudança: atualiza a bolinha, salva local e agenda no Firestore.
  subscribe((id) => {
    const count = getCount(id);
    refreshSticker(id);
    if (!ctx.albumId) return; // admin ainda sem família: não grava álbum
    saveLocal(ctx.albumId, allCounts());
    queueRemote(ctx.albumId, { email: ctx.email, displayName: ctx.displayName }, id, count);
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
    else if (name === 'trocas') renderTrades(document.getElementById('view-trocas-body'), { albumId: ctx.albumId, config: ctx.config });
    else if (name === 'admin') renderAdmin(document.getElementById('view-admin-body'), ctx.config, (cfg) => { ctx.config = cfg; });
  });

  setupExport({ displayName: ctx.displayName });

  // 5) Reconcilia com o Firestore (fonte da verdade quando online).
  // Carrega o álbum (compartilhado). Se estiver vazio, migra UMA vez do álbum
  // pessoal antigo (id = uid), pra não perder o que já foi marcado.
  if (ctx.albumId) loadRemote(ctx.albumId).then(async (res) => {
    if (!res.ok) return;
    let counts = res.counts;
    if (Object.keys(counts).length === 0 && ctx.user?.uid) {
      const old = await loadRemote(ctx.user.uid);
      if (old.ok && Object.keys(old.counts).length > 0) {
        counts = old.counts;
        for (const [id, c] of Object.entries(counts)) {
          queueRemote(ctx.albumId, { email: ctx.email, displayName: ctx.displayName }, id, c);
        }
        flushNow();
        console.log('[Figurinhas] migradas', Object.keys(counts).length, 'figurinhas do álbum pessoal para o compartilhado');
      }
    }
    initCounts(counts);
    saveLocal(ctx.albumId, allCounts());
    refreshAll();
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
