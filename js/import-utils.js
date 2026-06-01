// Lê uma lista de figurinhas colada (ex: "MEX 8 17 20" por linha, "FWC 6")
// e converte em ids do catálogo. Usado pela importação no Admin.

import { ALL_IDS } from './album-data.js';

// Códigos que as pessoas costumam escrever diferente do catálogo (FIFA).
const ALIASES = { JAP: 'JPN' };

const ID_SET = new Set(ALL_IDS);

// Retorna { listed: Set<id>, warnings: string[] }.
export function parseList(text) {
  const listed = new Set();
  const warnings = [];
  for (const raw of String(text || '').split('\n')) {
    const line = raw.replace(/,/g, ' ').trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    let code = (parts[0] || '').toUpperCase();
    code = ALIASES[code] || code;
    const nums = parts.slice(1);
    if (!nums.length) { warnings.push(`Linha sem números: "${raw.trim()}"`); continue; }
    for (const n of nums) {
      if (!/^\d+$/.test(n)) { warnings.push(`Número inválido: "${code} ${n}"`); continue; }
      const id = `${code}${parseInt(n, 10)}`; // FWC6, MEX8, etc.
      if (ID_SET.has(id)) listed.add(id);
      else warnings.push(`Não existe no álbum: ${code} ${n}`);
    }
  }
  return { listed, warnings };
}

// mode: 'tenho' (marca só as listadas) | 'falto' (marca todas MENOS as listadas).
// Retorna um mapa { id: 1 } das figurinhas que a pessoa TEM.
export function computeOwned(listed, mode) {
  const owned = {};
  if (mode === 'tenho') {
    for (const id of listed) owned[id] = 1;
  } else {
    for (const id of ALL_IDS) if (!listed.has(id)) owned[id] = 1;
  }
  return owned;
}
