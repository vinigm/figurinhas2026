// Tela de Trocas: cruza o álbum da sua família com o das outras e mostra
// o que dá pra trocar. "Você dá" = suas repetidas que faltam pra eles.
// "Você recebe" = repetidas deles que faltam pra você.

import { loadRemote } from './storage.js';
import { ALBUM } from './album-data.js';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Agrupa uma lista de ids de figurinha por tópico (na ordem do álbum).
function groupByTopic(ids) {
  const set = new Set(ids);
  const out = [];
  for (const t of ALBUM) {
    const nums = t.stickers.filter((s) => set.has(s.id)).map((s) => s.label);
    if (nums.length) out.push({ short: t.short, flag: t.flag, nums });
  }
  return out;
}

function listHtml(ids, cls) {
  const groups = groupByTopic(ids);
  if (!groups.length) return '<p class="hint">—</p>';
  return groups.map((g) => `
    <div class="trade-group">
      <span class="trade-grp-label">${g.flag} ${esc(g.short)}</span>
      ${g.nums.map((n) => `<span class="trade-num ${cls}">${esc(n)}</span>`).join('')}
    </div>`).join('');
}

export async function renderTrades(container, { albumId, config }) {
  const families = (config && config.families) || {};
  const otherIds = Object.keys(families).filter((id) => id !== albumId);

  const head = '<div class="view-head"><h2>🔄 Trocas</h2></div>';

  if (!albumId) {
    container.innerHTML = head + '<div class="empty">Você ainda não está numa família.</div>';
    return;
  }
  if (otherIds.length === 0) {
    container.innerHTML = head + '<div class="empty">Ainda não há outras famílias cadastradas pra trocar.<br>Cadastre na aba 👑 Admin.</div>';
    return;
  }

  container.innerHTML = head + '<p class="hint">Carregando as coleções das famílias…</p>';

  const mine = (await loadRemote(albumId)).counts || {};
  const cards = [];
  for (const fid of otherIds) {
    const theirs = (await loadRemote(fid)).counts || {};
    const iGive = [];
    const iGet = [];
    for (const t of ALBUM) {
      for (const s of t.stickers) {
        const m = mine[s.id] || 0;
        const o = theirs[s.id] || 0;
        if (m >= 2 && o === 0) iGive.push(s.id); // tenho repetida, falta pra eles
        if (o >= 2 && m === 0) iGet.push(s.id);  // eles têm repetida, falta pra mim
      }
    }
    cards.push({ name: families[fid], iGive, iGet });
  }

  cards.sort((a, b) => (b.iGive.length + b.iGet.length) - (a.iGive.length + a.iGet.length));

  const cardsHtml = cards.map((c) => {
    const total = c.iGive.length + c.iGet.length;
    if (total === 0) {
      return `<div class="trade-family"><h3>🤝 ${esc(c.name)}</h3><p class="hint">Nenhuma troca possível no momento.</p></div>`;
    }
    return `
      <div class="trade-family">
        <h3>🤝 ${esc(c.name)} <span class="count-pill">${total}</span></h3>
        <div class="trade-cols">
          <div class="trade-col">
            <h4 class="give">⬆️ Você dá <span>(${c.iGive.length})</span></h4>
            ${listHtml(c.iGive, 'give')}
          </div>
          <div class="trade-col">
            <h4 class="get">⬇️ Você recebe <span>(${c.iGet.length})</span></h4>
            ${listHtml(c.iGet, 'get')}
          </div>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = head
    + '<p class="hint"><b>Você dá</b> = suas repetidas que faltam pra eles · <b>Você recebe</b> = repetidas deles que faltam pra você.</p>'
    + cardsHtml;
}
