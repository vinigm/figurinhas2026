// Controle das abas: Todas · Me faltam · Repetidas · Estatísticas · Exportar.

export function setupTabs(onShow) {
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const views = Array.from(document.querySelectorAll('.view'));

  function show(name) {
    tabs.forEach((t) => {
      const active = t.dataset.tab === name;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', String(active));
    });
    views.forEach((v) => { v.hidden = v.dataset.view !== name; });
    onShow?.(name);
    // Volta o scroll ao topo ao trocar de aba (menos na principal).
    if (name !== 'todas') document.getElementById('main')?.scrollTo({ top: 0 });
  }

  tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.tab)));
  show('todas');
  return { show };
}
