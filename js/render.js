// Renderiza o álbum (tópicos + bolinhas), o índice de atalho e as barras de progresso.

import { ALBUM, TOTAL } from './album-data.js';
import { getCount, ownedCount, topicProgress } from './state.js';

const stickerEls = new Map();   // id -> <button.sticker>
const topicEls = new Map();     // topicId -> { section, frac, barFill, chip }
const idToTopicId = new Map();  // stickerId -> topicId

export function describe(id, count) {
  if (count === 0) return `${id}: falta`;
  if (count === 1) return `${id}: tenho`;
  return `${id}: tenho + ${count - 1} repetida${count - 1 > 1 ? 's' : ''}`;
}

function applyVisual(el, count) {
  el.classList.toggle('has', count >= 1);
  el.classList.toggle('rep', count >= 2);
  const dup = el.querySelector('.dup');
  dup.textContent = count >= 2 ? String(count - 1) : '';
  el.title = describe(el.dataset.id, count);
  el.setAttribute('aria-label', describe(el.dataset.id, count));
}

// --- Índice de atalho (chips que rolam até o tópico) ---
export function renderIndex(container) {
  container.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (const t of ALBUM) {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.dataset.topic = t.id;
    chip.innerHTML = `<span class="chip-flag">${t.flag}</span><span>${t.short}</span>`;
    chip.addEventListener('click', () => {
      document.getElementById('topic-' + t.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    const rec = topicEls.get(t.id) || {};
    rec.chip = chip;
    topicEls.set(t.id, rec);
    frag.appendChild(chip);
  }
  container.appendChild(frag);
}

// --- Álbum completo ---
export function renderAlbum(container) {
  container.innerHTML = '';
  stickerEls.clear();
  idToTopicId.clear();
  const frag = document.createDocumentFragment();

  for (const t of ALBUM) {
    const section = document.createElement('section');
    section.className = 'topic';
    section.id = 'topic-' + t.id;
    section.dataset.topic = t.id;

    const head = document.createElement('button');
    head.className = 'topic-head';
    head.setAttribute('aria-expanded', 'true');
    head.innerHTML = `
      <span class="topic-flag">${t.flag}</span>
      <span class="topic-name">${t.name}</span>
      <span class="topic-prog"><span class="bar"><i></i></span><span class="frac"></span></span>
      <span class="chev" aria-hidden="true">▾</span>`;
    head.addEventListener('click', () => {
      const collapsed = section.classList.toggle('collapsed');
      head.setAttribute('aria-expanded', String(!collapsed));
    });

    const grid = document.createElement('div');
    grid.className = 'grid';

    for (const s of t.stickers) {
      const btn = document.createElement('button');
      btn.className = 'sticker';
      btn.dataset.id = s.id;
      btn.dataset.topic = t.id;
      btn.innerHTML = `<span class="num">${s.label}</span><span class="dup"></span>`;
      applyVisual(btn, getCount(s.id));
      grid.appendChild(btn);
      stickerEls.set(s.id, btn);
      idToTopicId.set(s.id, t.id);
    }

    section.appendChild(head);
    section.appendChild(grid);
    frag.appendChild(section);

    const rec = topicEls.get(t.id) || {};
    rec.section = section;
    rec.frac = head.querySelector('.frac');
    rec.barFill = head.querySelector('.bar > i');
    topicEls.set(t.id, rec);
  }

  container.appendChild(frag);
  for (const t of ALBUM) updateTopicProgress(t.id);
  updateGlobalProgress();
}

// Atualiza uma bolinha a partir do estado atual.
export function refreshSticker(id) {
  const el = stickerEls.get(id);
  if (el) applyVisual(el, getCount(id));
  const tid = idToTopicId.get(id);
  if (tid) updateTopicProgress(tid);
  updateGlobalProgress();
}

// Atualiza todas as bolinhas (usado ao reconciliar com o Firestore no boot).
export function refreshAll() {
  for (const [id, el] of stickerEls) applyVisual(el, getCount(id));
  for (const t of ALBUM) updateTopicProgress(t.id);
  updateGlobalProgress();
}

// Mostra um conjunto arbitrário de counts (modo "ver álbum de outra família",
// só leitura). NÃO mexe no estado — só atualiza o visual do grid e o progresso.
export function displayCounts(counts) {
  const get = (id) => counts[id] || 0;
  let ownedG = 0;
  for (const t of ALBUM) {
    let owned = 0;
    for (const s of t.stickers) {
      const el = stickerEls.get(s.id);
      const c = get(s.id);
      if (el) applyVisual(el, c);
      if (c >= 1) owned++;
    }
    ownedG += owned;
    const rec = topicEls.get(t.id);
    if (rec) {
      const pct = Math.round((owned / t.stickers.length) * 100);
      if (rec.frac) rec.frac.textContent = `${owned}/${t.stickers.length}`;
      if (rec.barFill) rec.barFill.style.width = pct + '%';
      const done = owned === t.stickers.length;
      if (rec.section) rec.section.classList.toggle('done', done);
      if (rec.chip) rec.chip.classList.toggle('done', done);
    }
  }
  const pctG = Math.round((ownedG / TOTAL) * 100);
  const fill = document.getElementById('global-bar-fill');
  const label = document.getElementById('global-progress-label');
  if (fill) fill.style.width = pctG + '%';
  if (label) label.textContent = `${ownedG} / ${TOTAL} · ${pctG}%`;
}

export function updateTopicProgress(topicId) {
  const t = ALBUM.find((x) => x.id === topicId);
  const rec = topicEls.get(topicId);
  if (!t || !rec) return;
  const { owned, total } = topicProgress(t);
  const pct = Math.round((owned / total) * 100);
  if (rec.frac) rec.frac.textContent = `${owned}/${total}`;
  if (rec.barFill) rec.barFill.style.width = pct + '%';
  const done = owned === total;
  rec.section?.classList.toggle('done', done);
  rec.chip?.classList.toggle('done', done);
}

export function updateGlobalProgress() {
  const owned = ownedCount();
  const pct = Math.round((owned / TOTAL) * 100);
  const fill = document.getElementById('global-bar-fill');
  const label = document.getElementById('global-progress-label');
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = `${owned} / ${TOTAL} · ${pct}%`;
}
