// Catálogo do álbum Panini FIFA World Cup 2026 — 980 figurinhas.
//
// Estrutura: 20 especiais (FWC) + 48 seleções × 20 = 980.
//
// ⚠️ A ordem e os códigos das seleções vêm de checklists online (não-oficiais).
// CONFIRA com o álbum físico e ajuste à vontade — é só editar a lista COUNTRIES
// abaixo (código, nome, bandeira). Nada mais precisa mudar.

// Gera figurinhas numeradas: range('MEX', 1, 20) => [{id:'MEX1', label:'1'}, ...]
function range(prefix, from, to) {
  const out = [];
  for (let i = from; i <= to; i++) out.push({ id: `${prefix}${i}`, label: String(i) });
  return out;
}

// As 48 seleções na ordem de paginação do álbum (código FIFA, nome PT-BR, bandeira).
export const COUNTRIES = [
  { code: 'MEX', name: 'México', flag: '🇲🇽' },
  { code: 'RSA', name: 'África do Sul', flag: '🇿🇦' },
  { code: 'KOR', name: 'Coreia do Sul', flag: '🇰🇷' },
  { code: 'CZE', name: 'Tchéquia', flag: '🇨🇿' },
  { code: 'CAN', name: 'Canadá', flag: '🇨🇦' },
  { code: 'BIH', name: 'Bósnia e Herzegovina', flag: '🇧🇦' },
  { code: 'QAT', name: 'Catar', flag: '🇶🇦' },
  { code: 'SUI', name: 'Suíça', flag: '🇨🇭' },
  { code: 'BRA', name: 'Brasil', flag: '🇧🇷' },
  { code: 'MAR', name: 'Marrocos', flag: '🇲🇦' },
  { code: 'HAI', name: 'Haiti', flag: '🇭🇹' },
  { code: 'SCO', name: 'Escócia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'USA', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'PAR', name: 'Paraguai', flag: '🇵🇾' },
  { code: 'AUS', name: 'Austrália', flag: '🇦🇺' },
  { code: 'TUR', name: 'Turquia', flag: '🇹🇷' },
  { code: 'GER', name: 'Alemanha', flag: '🇩🇪' },
  { code: 'CUW', name: 'Curaçao', flag: '🇨🇼' },
  { code: 'CIV', name: 'Costa do Marfim', flag: '🇨🇮' },
  { code: 'ECU', name: 'Equador', flag: '🇪🇨' },
  { code: 'NED', name: 'Holanda', flag: '🇳🇱' },
  { code: 'JPN', name: 'Japão', flag: '🇯🇵' },
  { code: 'SWE', name: 'Suécia', flag: '🇸🇪' },
  { code: 'TUN', name: 'Tunísia', flag: '🇹🇳' },
  { code: 'BEL', name: 'Bélgica', flag: '🇧🇪' },
  { code: 'EGY', name: 'Egito', flag: '🇪🇬' },
  { code: 'IRN', name: 'Irã', flag: '🇮🇷' },
  { code: 'NZL', name: 'Nova Zelândia', flag: '🇳🇿' },
  { code: 'ESP', name: 'Espanha', flag: '🇪🇸' },
  { code: 'CPV', name: 'Cabo Verde', flag: '🇨🇻' },
  { code: 'KSA', name: 'Arábia Saudita', flag: '🇸🇦' },
  { code: 'URU', name: 'Uruguai', flag: '🇺🇾' },
  { code: 'FRA', name: 'França', flag: '🇫🇷' },
  { code: 'SEN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'IRQ', name: 'Iraque', flag: '🇮🇶' },
  { code: 'NOR', name: 'Noruega', flag: '🇳🇴' },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  { code: 'ALG', name: 'Argélia', flag: '🇩🇿' },
  { code: 'AUT', name: 'Áustria', flag: '🇦🇹' },
  { code: 'JOR', name: 'Jordânia', flag: '🇯🇴' },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹' },
  { code: 'COD', name: 'Congo (RD)', flag: '🇨🇩' },
  { code: 'UZB', name: 'Uzbequistão', flag: '🇺🇿' },
  { code: 'COL', name: 'Colômbia', flag: '🇨🇴' },
  { code: 'ENG', name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'CRO', name: 'Croácia', flag: '🇭🇷' },
  { code: 'GHA', name: 'Gana', flag: '🇬🇭' },
  { code: 'PAN', name: 'Panamá', flag: '🇵🇦' },
];

// Tópicos do álbum (cada um vira uma seção colapsável na página).
// kind: 'fwc' (especiais) ou 'country'.
export const ALBUM = [
  {
    id: 'fwc-especiais', kind: 'fwc', short: 'FWC', flag: '🏆',
    name: 'FWC — Especiais',
    stickers: [{ id: '00', label: '00' }, ...range('FWC', 1, 4)],
  },
  {
    id: 'fwc-sedes', kind: 'fwc', short: 'Sedes', flag: '🏟️',
    name: 'FWC — Bola e Países-sede',
    stickers: range('FWC', 5, 8),
  },
  {
    id: 'fwc-historia', kind: 'fwc', short: 'História', flag: '📜',
    name: 'FWC — História da Copa',
    stickers: range('FWC', 9, 19),
  },
  ...COUNTRIES.map((c) => ({
    id: c.code, kind: 'country', short: c.code, flag: c.flag,
    name: `${c.code} — ${c.name}`,
    countryName: c.name,
    stickers: range(c.code, 1, 20),
  })),
];

// Lista plana de todos os IDs e o total esperado.
export const ALL_STICKERS = ALBUM.flatMap((t) => t.stickers);
export const ALL_IDS = ALL_STICKERS.map((s) => s.id);
export const TOTAL = ALL_IDS.length; // deve ser 980

// Sanidade: avisa no console se a contagem não fechar em 980.
if (TOTAL !== 980) {
  console.warn(`[Figurinhas] Atenção: catálogo tem ${TOTAL} figurinhas (esperado 980).`);
}
