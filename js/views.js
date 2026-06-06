// Views derivadas do estado: "Me faltam", "Repetidas" e "Estatísticas".

import { ALBUM, TOTAL } from './album-data.js';
import {
  ownedCount, dupesCount, allCounts, missingByTopic, dupesByTopic, topicProgress, setCount,
} from './state.js';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const old = btn.textContent;
    btn.textContent = '✓ Copiado!';
    setTimeout(() => { btn.textContent = old; }, 1500);
  } catch (_) {
    alert('Não consegui copiar automaticamente. Segue o texto:\n\n' + text);
  }
}

function attachCopy(container, text) {
  const btn = container.querySelector('[data-copy]');
  if (btn) btn.addEventListener('click', () => copyText(text, btn));
}

// ---- Me faltam ----
export function renderMissing(container, displayName) {
  const groups = missingByTopic();
  const totalMissing = TOTAL - ownedCount();

  if (totalMissing === 0) {
    container.innerHTML = `<div class="empty">🎉 Você completou o álbum! Não falta nenhuma figurinha.</div>`;
    return;
  }

  const textLines = [`Figurinhas que faltam (${displayName}) — ${totalMissing} de ${TOTAL}:`];
  const htmlGroups = groups.map((g) => {
    const nums = g.missing.map((s) => s.label);
    textLines.push(`${g.topic.short}: ${nums.join(', ')}`);
    return `
      <div class="list-group">
        <div class="list-group-head"><span>${g.topic.flag}</span> ${esc(g.topic.name)}
          <span class="badge">${g.missing.length}</span></div>
        <div class="list-nums">${nums.map((n) => `<span class="missing-num">${esc(n)}</span>`).join('')}</div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="view-head">
      <h2>Me faltam <span class="count-pill">${totalMissing}</span></h2>
      <button class="btn-ghost" data-copy>📋 Copiar lista</button>
    </div>
    ${htmlGroups}`;
  attachCopy(container, textLines.join('\n'));
}

// ---- Repetidas ----
export function renderDupes(container, displayName) {
  const groups = dupesByTopic();
  const total = dupesCount();

  if (total === 0) {
    container.innerHTML = `<div class="empty">Você ainda não tem figurinhas repetidas.</div>`;
    return;
  }

  const textLines = [`Repetidas (${displayName}) — ${total} no total:`];
  const htmlGroups = groups.map((g) => {
    const parts = g.dupes.map((d) => d.extra > 1 ? `${d.label} (×${d.extra})` : d.label);
    textLines.push(`${g.topic.short}: ${parts.join(', ')}`);
    return `
      <div class="list-group">
        <div class="list-group-head"><span>${g.topic.flag}</span> ${esc(g.topic.name)}
          <span class="badge">${g.dupes.reduce((a, d) => a + d.extra, 0)}</span></div>
        <div class="list-nums">${g.dupes.map((d) => `
          <span class="dup-num">${esc(d.label)}${d.extra > 1 ? `<i>×${d.extra}</i>` : ''}</span>`).join('')}</div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="view-head">
      <h2>Repetidas <span class="count-pill">${total}</span></h2>
      <div class="view-actions">
        <button class="btn-ghost" data-copy>📋 Copiar</button>
        <button class="btn-danger" data-clear-dupes>🗑️ Zerar</button>
      </div>
    </div>
    <p class="hint">Use esta lista pra trocar. Trocou tudo? Toque em <b>Zerar</b> pra remover as extras — mantém 1 de cada no álbum. ✌️</p>
    ${htmlGroups}`;
  attachCopy(container, textLines.join('\n'));

  container.querySelector('[data-clear-dupes]')?.addEventListener('click', () => {
    const n = dupesCount();
    if (n === 0) return;
    if (!confirm(`Zerar ${n} repetida(s)?\n\nMantém 1 de cada figurinha no álbum — remove só as extras. Não dá pra desfazer.`)) return;
    for (const g of dupesByTopic()) {
      for (const d of g.dupes) setCount(d.id, 1); // volta de 2+ para 1
    }
    renderDupes(container, displayName); // re-renderiza (agora vazio)
  });
}

// ---- Estatísticas ----
export function renderStats(container) {
  const owned = ownedCount();
  const missing = TOTAL - owned;
  const dupes = dupesCount();
  const physical = Object.values(allCounts()).reduce((a, n) => a + n, 0); // total de figurinhas físicas
  const pct = Math.round((owned / TOTAL) * 100);

  const cards = `
    <div class="stat-cards">
      <div class="stat-card big">
        <div class="stat-num">${pct}%</div>
        <div class="stat-label">do álbum completo</div>
        <div class="bar big"><i style="width:${pct}%"></i></div>
        <div class="stat-sub">${owned} de ${TOTAL} figurinhas</div>
      </div>
      <div class="stat-card"><div class="stat-num">${owned}</div><div class="stat-label">tenho (diferentes)</div></div>
      <div class="stat-card warn"><div class="stat-num">${missing}</div><div class="stat-label">me faltam</div></div>
      <div class="stat-card rep"><div class="stat-num">${dupes}</div><div class="stat-label">repetidas</div></div>
      <div class="stat-card"><div class="stat-num">${physical}</div><div class="stat-label">figurinhas no total (com repetidas)</div></div>
    </div>`;

  const rows = ALBUM.map((t) => {
    const { owned: o, total } = topicProgress(t);
    const p = Math.round((o / total) * 100);
    return `
      <div class="prog-row ${o === total ? 'done' : ''}">
        <span class="prog-flag">${t.flag}</span>
        <span class="prog-name">${esc(t.short)}</span>
        <span class="bar"><i style="width:${p}%"></i></span>
        <span class="prog-frac">${o}/${total}</span>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="view-head"><h2>Estatísticas</h2></div>
    ${cards}
    <h3 class="prog-title">Progresso por seção</h3>
    <div class="prog-list">${rows}</div>`;
}
