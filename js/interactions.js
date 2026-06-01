// Toque curto = +1 · Segurar 3s = -1 (uma repetida a menos / desmarca).
// Usa pointer events com delegação: um único listener cuida das 980 bolinhas.

const HOLD_MS = 3000;

export function setupInteractions(container, { onTap, onLongPress }) {
  let activeEl = null;
  let activeId = null;
  let held = false;
  let timer = null;

  function clearActive() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (activeEl) activeEl.classList.remove('holding');
    activeEl = null;
    activeId = null;
  }

  container.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.sticker');
    if (!el || !container.contains(el)) return;
    e.preventDefault();

    clearActive();
    activeEl = el;
    activeId = el.dataset.id;
    held = false;
    el.classList.add('holding');
    try { el.setPointerCapture(e.pointerId); } catch (_) {}

    timer = setTimeout(() => {
      held = true;
      el.classList.remove('holding');
      navigator.vibrate?.(40);
      onLongPress?.(activeId, el);
    }, HOLD_MS);
  });

  function finish(e) {
    if (!activeEl) return;
    const wasHeld = held;
    const id = activeId;
    const el = activeEl;
    clearActive();
    if (!wasHeld && e.type === 'pointerup') {
      onTap?.(id, el);
    }
  }

  container.addEventListener('pointerup', finish);
  container.addEventListener('pointercancel', finish);

  // Evita o menu de contexto ao segurar (long-press) no mobile/desktop.
  container.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.sticker')) e.preventDefault();
  });

  // Acessibilidade: teclado (Enter = +1, Shift+Enter / Backspace = -1).
  container.addEventListener('keydown', (e) => {
    const el = e.target.closest('.sticker');
    if (!el) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.shiftKey) onLongPress?.(el.dataset.id, el);
      else onTap?.(el.dataset.id, el);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      onLongPress?.(el.dataset.id, el);
    }
  });
}
