// Tela de admin (só o admin vê): cria famílias e cadastra pessoas (e-mail → família).
// Salva no cadastro (config/app). Adicionar gente nunca mais mexe nas regras.

import { saveConfig } from './config.js';
import { ADMIN_EMAIL } from './auth.js';
import { parseList, computeOwned } from './import-utils.js';
import { setAlbumStickers } from './storage.js';

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Gera um id curto a partir do nome da família (sem acento/espaço).
function slug(s) {
  const base = (s || '').toString().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
  return base || 'familia';
}

export function renderAdmin(container, config, onChanged) {
  const cfg = {
    members: { ...((config && config.members) || {}) },
    families: { ...((config && config.families) || {}) },
  };

  async function persist() {
    try {
      await saveConfig(cfg);
      onChanged?.({ members: { ...cfg.members }, families: { ...cfg.families } });
      draw();
    } catch (e) {
      alert('Erro ao salvar o cadastro: ' + (e?.message || e));
    }
  }

  function draw() {
    const familyIds = Object.keys(cfg.families);
    const byFamily = {};
    familyIds.forEach((fid) => { byFamily[fid] = []; });
    for (const [email, fid] of Object.entries(cfg.members)) {
      (byFamily[fid] = byFamily[fid] || []).push(email);
    }

    const familiesHtml = familyIds.length === 0
      ? '<p class="hint">Nenhuma família ainda. Crie a primeira abaixo. 👇</p>'
      : familyIds.map((fid) => `
        <div class="admin-family">
          <div class="admin-family-head"><b>${esc(cfg.families[fid])}</b> <span class="admin-id">${esc(fid)}</span></div>
          <div class="admin-members">
            ${(byFamily[fid] || []).map((em) => `
              <span class="admin-chip">${esc(em)}${em === ADMIN_EMAIL
                ? '<i class="admin-tag">admin</i>'
                : `<button data-remove="${esc(em)}" title="Remover">×</button>`}</span>`).join('')
              || '<span class="hint">sem membros</span>'}
          </div>
        </div>`).join('');

    const familyOptions = familyIds
      .map((fid) => `<option value="${esc(fid)}">${esc(cfg.families[fid])}</option>`).join('');

    container.innerHTML = `
      <div class="view-head"><h2>👑 Admin — Famílias</h2></div>
      <p class="hint">Cada família compartilha um álbum. Cadastre a pessoa pelo <b>e-mail Google</b> dela; depois ela só entra e já cai no álbum certo.</p>
      ${familiesHtml}
      <div class="admin-box">
        <h3>Nova família</h3>
        <div class="admin-row">
          <input id="adm-fam-name" type="text" placeholder="Ex: Família Eduardo" autocomplete="off" />
          <button id="adm-fam-add" class="btn-ghost">Criar</button>
        </div>
      </div>
      <div class="admin-box">
        <h3>Adicionar pessoa</h3>
        <div class="admin-row">
          <input id="adm-mem-email" type="email" placeholder="email@gmail.com" autocomplete="off" />
          <select id="adm-mem-fam">${familyOptions || '<option value="">(crie uma família primeiro)</option>'}</select>
          <button id="adm-mem-add" class="btn-ghost">Adicionar</button>
        </div>
      </div>
      <div class="admin-box">
        <h3>📥 Importar coleção</h3>
        <p class="hint">Cole a lista (ex: <code>MEX 8 17 20</code> por linha; <code>FWC 6</code> pras especiais) pra marcar tudo de uma vez no álbum da família. Marca como "tenho" — repetidas a pessoa adiciona depois.</p>
        <select id="adm-imp-fam">${familyOptions || '<option value="">(crie uma família primeiro)</option>'}</select>
        <div class="imp-modes">
          <label><input type="radio" name="impmode" value="falto" checked> A lista é o que <b>me falta</b> (marca todas as outras)</label>
          <label><input type="radio" name="impmode" value="tenho"> A lista é o que <b>eu tenho</b></label>
        </div>
        <textarea id="adm-imp-text" rows="6" placeholder="FWC 6&#10;MEX 8 17 20&#10;RSA 1 12 15&#10;..."></textarea>
        <button id="adm-imp-go" class="btn-ghost">Importar pra família selecionada</button>
        <div id="adm-imp-result" class="imp-result" hidden></div>
      </div>`;

    container.querySelectorAll('[data-remove]').forEach((b) =>
      b.addEventListener('click', () => { delete cfg.members[b.dataset.remove]; persist(); }));

    container.querySelector('#adm-fam-add')?.addEventListener('click', () => {
      const name = container.querySelector('#adm-fam-name').value.trim();
      if (!name) return;
      let id = slug(name); let i = 2;
      while (cfg.families[id]) id = slug(name) + '-' + (i++);
      cfg.families[id] = name;
      persist();
    });

    container.querySelector('#adm-mem-add')?.addEventListener('click', () => {
      const email = container.querySelector('#adm-mem-email').value.trim().toLowerCase();
      const fam = container.querySelector('#adm-mem-fam').value;
      if (!email || !fam) return;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { alert('E-mail inválido.'); return; }
      cfg.members[email] = fam;
      persist();
    });

    container.querySelector('#adm-imp-go')?.addEventListener('click', async () => {
      const fam = container.querySelector('#adm-imp-fam').value;
      const text = container.querySelector('#adm-imp-text').value;
      const mode = container.querySelector('input[name="impmode"]:checked')?.value || 'falto';
      const resultEl = container.querySelector('#adm-imp-result');
      if (!fam) { alert('Escolha uma família.'); return; }
      const { listed, warnings } = parseList(text);
      if (listed.size === 0) { alert('Não reconheci nenhuma figurinha. Confira o formato (ex: MEX 8 17 20).'); return; }
      const owned = computeOwned(listed, mode);
      const n = Object.keys(owned).length;
      const famName = cfg.families[fam] || fam;
      const msg = mode === 'falto'
        ? `Vai marcar ${n} figurinhas como "tem" no álbum "${famName}" (tudo menos as ${listed.size} da lista). Continuar?`
        : `Vai marcar ${n} figurinhas como "tem" no álbum "${famName}". Continuar?`;
      if (!confirm(msg)) return;
      try {
        await setAlbumStickers(fam, owned, ADMIN_EMAIL);
        if (resultEl) {
          resultEl.hidden = false;
          resultEl.innerHTML = `✓ Pronto: <b>${n}</b> figurinhas marcadas em "${esc(famName)}".`
            + (warnings.length ? `<br><span class="imp-warn">⚠️ ${warnings.length} aviso(s): ${esc(warnings.slice(0, 4).join(' · '))}${warnings.length > 4 ? '…' : ''}</span>` : '');
        }
      } catch (e) {
        alert('Erro ao importar: ' + (e?.message || e));
      }
    });
  }

  draw();
}
