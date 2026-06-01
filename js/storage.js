// Persistência: documento por usuário em /albums/{uid}.
//   { uid, ownerEmail, displayName, stickers: { [id]: count }, updatedAt }
// O mapa "stickers" é esparso: só guarda figurinhas com count >= 1.
//
// Escrita no Firestore é "debounced" (agrupa cliques rápidos). Um cache em
// localStorage permite abrir o app instantaneamente e funcionar offline.

import {
  doc, getDoc, setDoc, serverTimestamp, deleteField,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
import { db } from './firebase-config.js';

const LS_PREFIX = 'fig:album:';
const DEBOUNCE_MS = 600;

// ---- Cache local (síncrono) ----

export function readLocal(uid) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + uid);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

export function saveLocal(uid, countsObj) {
  try {
    localStorage.setItem(LS_PREFIX + uid, JSON.stringify(countsObj));
  } catch (_) {}
}

// ---- Firestore ----

export async function loadRemote(uid) {
  try {
    const snap = await getDoc(doc(db, 'albums', uid));
    if (snap.exists()) {
      const data = snap.data();
      return { ok: true, counts: data.stickers || {} };
    }
    return { ok: true, counts: {} };
  } catch (e) {
    console.warn('[Figurinhas] loadRemote falhou (usando cache local):', e?.message || e);
    return { ok: false, counts: readLocal(uid) };
  }
}

// Buffer de mudanças pendentes por usuário, com flush debounced.
const pending = new Map(); // id -> count
let timer = null;
let ctxRef = { uid: null, email: '', displayName: '' };

export function queueRemote(uid, ctx, id, count) {
  ctxRef = { uid, email: ctx.email, displayName: ctx.displayName };
  pending.set(id, count);
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, DEBOUNCE_MS);
}

async function flush() {
  timer = null;
  if (!ctxRef.uid || pending.size === 0) return;
  const stickers = {};
  for (const [id, count] of pending.entries()) {
    stickers[id] = count > 0 ? count : deleteField();
  }
  pending.clear();
  const payload = {
    uid: ctxRef.uid,
    ownerEmail: ctxRef.email,
    displayName: ctxRef.displayName,
    stickers,
    updatedAt: serverTimestamp(),
  };
  try {
    // merge:true preserva as demais figurinhas; deleteField() remove as zeradas.
    await setDoc(doc(db, 'albums', ctxRef.uid), payload, { merge: true });
  } catch (e) {
    // Com a persistência offline do Firestore, a escrita fica enfileirada e
    // sincroniza sozinha; o cache local já cobre a leitura nesse meio-tempo.
    console.warn('[Figurinhas] escrita adiada (offline?):', e?.message || e);
  }
}

// Garante que mudanças pendentes sejam enviadas (ex.: ao sair da página).
export function flushNow() {
  if (timer) { clearTimeout(timer); timer = null; }
  return flush();
}
