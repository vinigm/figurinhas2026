// Cadastro do app, guardado em Firestore (config/app):
//   { members: { 'email': 'albumId' }, families: { 'albumId': 'Nome da Família' } }
// Quem está em "members" pode usar o app; o albumId define qual álbum a pessoa edita.
// Só o admin (ver ADMIN_EMAIL em auth.js) pode escrever este documento.

import {
  doc, getDoc, setDoc, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
import { db } from './firebase-config.js';

const SEED = {
  members: {
    'vinigm@gmail.com': 'vini-vivi',
    'victoria.cerutti@gmail.com': 'vini-vivi',
  },
  families: {
    'vini-vivi': 'Vini & Vivi',
  },
};

export async function loadConfig() {
  try {
    const snap = await getDoc(doc(db, 'config', 'app'));
    if (snap.exists()) {
      const d = snap.data();
      return { members: d.members || {}, families: d.families || {} };
    }
  } catch (e) {
    console.warn('[Figurinhas] loadConfig falhou:', e?.message || e);
  }
  return null;
}

export async function saveConfig(cfg) {
  await setDoc(doc(db, 'config', 'app'), {
    members: cfg.members || {},
    families: cfg.families || {},
    updatedAt: serverTimestamp(),
  });
}

// Cria o cadastro inicial se ainda não existir (só o admin consegue gravar).
export async function seedConfigIfMissing() {
  const existing = await loadConfig();
  if (existing) return existing;
  try {
    await saveConfig(SEED);
    console.log('[Figurinhas] cadastro inicial criado');
  } catch (e) {
    console.warn('[Figurinhas] não consegui criar o cadastro inicial:', e?.message || e);
  }
  return { members: { ...SEED.members }, families: { ...SEED.families } };
}
