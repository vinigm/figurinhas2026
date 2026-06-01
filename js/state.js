// Estado em memória das figurinhas: { [id]: count }, com count de 0 a 6.
//   0 = não tenho · 1 = tenho · 2..6 = tenho + (count-1) repetidas (máx 5).

import { ALBUM } from './album-data.js';

export const MAX_COUNT = 6; // 1 que tenho + até 5 repetidas

let counts = {};
const listeners = new Set();

export function initCounts(obj) {
  counts = {};
  if (obj) {
    for (const [id, n] of Object.entries(obj)) {
      const c = clamp(n);
      if (c > 0) counts[id] = c;
    }
  }
}

function clamp(n) {
  n = Number(n) || 0;
  if (n < 0) return 0;
  if (n > MAX_COUNT) return MAX_COUNT;
  return Math.floor(n);
}

export function getCount(id) {
  return counts[id] || 0;
}

export function allCounts() {
  return counts;
}

// Define o count de uma figurinha e avisa os ouvintes. count 0 remove a chave.
export function setCount(id, n) {
  const c = clamp(n);
  if (c === 0) delete counts[id];
  else counts[id] = c;
  listeners.forEach((fn) => fn(id, c));
  return c;
}

// Toque curto: +1 (até o máximo).
export function tap(id) {
  return setCount(id, getCount(id) + 1);
}

// Segurar 3s: -1 (remove uma repetida; em 1 volta a 0 = desmarca).
export function longPress(id) {
  return setCount(id, getCount(id) - 1);
}

// Inscreve um ouvinte (id, novoCount) chamado a cada mudança. Retorna desinscrição.
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---- Derivações úteis pra stats / abas ----

// Quantas figurinhas distintas eu tenho (count >= 1).
export function ownedCount() {
  return Object.keys(counts).length;
}

// Total de repetidas (soma de count-1 pra cada figurinha com count >= 2).
export function dupesCount() {
  let s = 0;
  for (const n of Object.values(counts)) if (n >= 2) s += n - 1;
  return s;
}

// Progresso de um tópico: { owned, total }.
export function topicProgress(topic) {
  let owned = 0;
  for (const s of topic.stickers) if (getCount(s.id) >= 1) owned++;
  return { owned, total: topic.stickers.length };
}

// Tudo que falta, agrupado por tópico (só tópicos com faltantes).
export function missingByTopic() {
  return ALBUM
    .map((t) => ({ topic: t, missing: t.stickers.filter((s) => getCount(s.id) === 0) }))
    .filter((x) => x.missing.length > 0);
}

// Tudo que está repetido, agrupado por tópico (count >= 2).
export function dupesByTopic() {
  return ALBUM
    .map((t) => ({
      topic: t,
      dupes: t.stickers
        .filter((s) => getCount(s.id) >= 2)
        .map((s) => ({ ...s, extra: getCount(s.id) - 1 })),
    }))
    .filter((x) => x.dupes.length > 0);
}
