// Exportação: gera um relatório imprimível (→ "Salvar como PDF") em 3 modos.

import { ALBUM, TOTAL } from './album-data.js';
import { getCount, ownedCount, dupesCount } from './state.js';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function todayBR() {
  const d = new Date();
  return d.toLocaleDateString('pt-BR');
}

function summaryHtml() {
  const owned = ownedCount();
  const pct = Math.round((owned / TOTAL) * 100);
  return `
  <div class="summary">
    <div class="box"><h3>Completo</h3><div class="total">${pct}%</div></div>
    <div class="box"><h3>Tenho</h3><div class="total">${owned}</div></div>
    <div class="box"><h3>Faltam</h3><div class="total">${TOTAL - owned}</div></div>
    <div class="box"><h3>Repetidas</h3><div class="total">${dupesCount()}</div></div>
  </div>`;
}

function fullHtml() {
  return ALBUM.map((t) => {
    const cells = t.stickers.map((s) => {
      const c = getCount(s.id);
      const cls = c === 0 ? 'miss' : c >= 2 ? 'rep' : 'have';
      const tag = c >= 2 ? `<i>${c - 1}</i>` : '';
      return `<span class="cell ${cls}">${esc(s.label)}${tag}</span>`;
    }).join('');
    const { length } = t.stickers;
    const owned = t.stickers.filter((s) => getCount(s.id) >= 1).length;
    return `<div class="grp"><h2>${t.flag} ${esc(t.name)} <small>${owned}/${length}</small></h2>
      <div class="cells">${cells}</div></div>`;
  }).join('');
}

function listHtml(predicate, withExtra) {
  const groups = ALBUM.map((t) => {
    const items = t.stickers.filter((s) => predicate(getCount(s.id)));
    return { t, items };
  }).filter((g) => g.items.length > 0);

  if (groups.length === 0) return '<p class="empty">Nada por aqui. 🎉</p>';

  return groups.map((g) => {
    const cells = g.items.map((s) => {
      const c = getCount(s.id);
      const tag = withExtra && c - 1 > 1 ? `<i>×${c - 1}</i>` : '';
      return `<span class="cell ${withExtra ? 'rep' : 'miss'}">${esc(s.label)}${tag}</span>`;
    }).join('');
    return `<div class="grp"><h2>${g.t.flag} ${esc(g.t.name)} <small>${g.items.length}</small></h2>
      <div class="cells">${cells}</div></div>`;
  }).join('');
}

function buildReport(mode, displayName) {
  const titles = { completo: 'Álbum completo', faltam: 'Figurinhas que faltam', repetidas: 'Figurinhas repetidas', troca: 'Pra trocar' };
  // Cabeçalho visível (h1) — separado do título do arquivo/aba.
  const headings = {
    completo: '⚽ Álbum completo',
    faltam: '🙋 Se você tiver essas figurinhas EU QUERO!',
    repetidas: '🔁 Essas aqui são minhas figurinhas repetidas que eu posso trocar com vc!',
    troca: '🔄 Bora trocar figurinhas?',
  };
  let body;
  if (mode === 'faltam') body = listHtml((c) => c === 0, false);
  else if (mode === 'repetidas') body = listHtml((c) => c >= 2, true);
  else if (mode === 'troca') body = `
    <h2 class="section-banner need">🙋 Preciso de: ${TOTAL - ownedCount()}</h2>
    ${listHtml((c) => c === 0, false)}
    <h2 class="section-banner trade">🔁 Tenho pra trocar: ${dupesCount()}</h2>
    ${listHtml((c) => c >= 2, true)}`;
  else body = fullHtml();

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${esc(titles[mode])} — ${esc(displayName)}</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; margin: 24px; }
  h1 { margin: 0 0 2px; color: #6d28d9; }
  .sub { color: #666; margin-bottom: 18px; font-size: 14px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .box { border: 1px solid #eee; border-radius: 10px; padding: 10px 12px; text-align: center; }
  .box h3 { margin: 0 0 4px; font-size: 11px; text-transform: uppercase; color: #999; letter-spacing: .05em; }
  .total { font-size: 26px; font-weight: 800; color: #6d28d9; }
  .grp { break-inside: avoid; margin: 0 0 14px; }
  .grp h2 { font-size: 15px; margin: 0 0 6px; border-bottom: 2px solid #f0e9ff; padding-bottom: 3px; }
  .grp h2 small { color: #999; font-weight: 500; font-size: 12px; }
  .cells { display: flex; flex-wrap: wrap; gap: 5px; }
  .cell { position: relative; min-width: 26px; height: 26px; padding: 0 5px; display: inline-flex;
          align-items: center; justify-content: center; border-radius: 50px; font-size: 12px;
          font-weight: 700; border: 1.5px solid #ddd; }
  .cell.have { background: #ede9fe; border-color: #c4b5fd; color: #5b21b6; }
  .cell.rep  { background: #fde68a; border-color: #f59e0b; color: #92400e; }
  .cell.miss { background: #fff; border-style: dashed; color: #bbb; }
  .cell i { position: absolute; top: -6px; right: -6px; background: #ef4444; color: #fff;
            font-style: normal; font-size: 9px; min-width: 14px; height: 14px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center; padding: 0 2px; }
  .empty { color: #888; }
  .section-banner { margin: 26px 0 12px; padding: 9px 14px; border-radius: 10px; font-size: 17px; font-weight: 800; }
  .section-banner.need { background: #eef2ff; color: #3730a3; border-left: 5px solid #6366f1; }
  .section-banner.trade { background: #fef3c7; color: #92400e; border-left: 5px solid #f59e0b; }
  .legend { font-size: 12px; color: #666; margin: 0 0 16px; display: flex; gap: 14px; flex-wrap: wrap; }
  .print-btn { position: fixed; top: 16px; right: 16px; background: #6d28d9; color: #fff; border: 0;
               padding: 10px 16px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 14px; }
  @media print { body { margin: 12mm; } .print-btn { display: none; } }
</style></head><body>
${mode === 'troca' ? '' : `<h1>${esc(headings[mode])}</h1>
<div class="sub">${esc(displayName)} · Copa 2026 · gerado em ${todayBR()}</div>
${summaryHtml()}`}
${mode === 'completo' ? `<div class="legend">
  <span><b style="color:#5b21b6">●</b> tenho</span>
  <span><b style="color:#92400e">●</b> repetida (nº = extras)</span>
  <span><b style="color:#bbb">○</b> falta</span></div>` : ''}
${body}
</body></html>`;
}

export function setupExport({ displayName }) {
  document.querySelectorAll('[data-export]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openReportOverlay(buildReport(btn.dataset.export, displayName));
    });
  });
}

// Mostra o relatório como uma camada DENTRO do app (com botão Voltar), em vez de
// abrir uma aba nova — assim não trava quando o app está instalado na tela inicial.
function openReportOverlay(html) {
  document.getElementById('report-overlay')?.remove();
  const ov = document.createElement('div');
  ov.id = 'report-overlay';
  ov.className = 'report-overlay';
  ov.innerHTML = `
    <div class="report-toolbar">
      <button class="report-close" type="button">✕ Voltar</button>
      <button class="report-print" type="button">🖨️ Imprimir / Salvar PDF</button>
    </div>
    <iframe class="report-frame" title="Relatório"></iframe>`;
  document.body.appendChild(ov);

  const frame = ov.querySelector('.report-frame');
  const doc = frame.contentDocument || frame.contentWindow.document;
  doc.open(); doc.write(html); doc.close();

  const close = () => {
    ov.remove();
    document.removeEventListener('keydown', onKey);
  };
  function onKey(e) { if (e.key === 'Escape') close(); }

  ov.querySelector('.report-close').addEventListener('click', close);
  ov.querySelector('.report-print').addEventListener('click', () => {
    try { frame.contentWindow.focus(); frame.contentWindow.print(); }
    catch (_) { window.print(); }
  });
  document.addEventListener('keydown', onKey);
}
