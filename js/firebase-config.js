// Configuração do Firebase — projeto figurinhas2026-30596.
// Pegar em: https://console.firebase.google.com/u/0/project/figurinhas2026-30596/settings/general
// > Seus apps > Configuração SDK > "Config".
//
// Obs.: deixar a apiKey aqui é normal/seguro num app web do Firebase. A proteção
// real vem das regras do Firestore (firestore.rules) + whitelist de e-mails (auth.js)
// + "Domínios autorizados" no Authentication.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyD8GcqKOHlJcfZILqsNrMnSR4svDx0HZq8',
  authDomain: 'figurinhas2026-30596.firebaseapp.com',
  projectId: 'figurinhas2026-30596',
  storageBucket: 'figurinhas2026-30596.firebasestorage.app',
  messagingSenderId: '162482779761',
  appId: '1:162482779761:web:5d64b20277d4a7b0ad8dd0',
};

export const app = initializeApp(firebaseConfig);

// Firestore com cache offline persistente (IndexedDB). Assim as marcações feitas
// offline ficam enfileiradas e sincronizam sozinhas quando a conexão volta.
let _db;
try {
  _db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch (e) {
  // Fallback (ex.: navegador sem IndexedDB / aba privada): Firestore em memória.
  console.warn('[Figurinhas] persistência offline indisponível, usando memória:', e?.message || e);
  const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js');
  _db = getFirestore(app);
}

export const db = _db;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
