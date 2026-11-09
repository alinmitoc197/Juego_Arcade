import { Sfx } from '../core/Sfx.js';

const DIRS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

/** Elige el siguiente elemento en una dirección usando la geometría real en pantalla. */
export function pickNext(items, index, dir) {
  const cur = items[index].getBoundingClientRect();
  const cx = cur.left + cur.width / 2, cy = cur.top + cur.height / 2;
  let best = -1, bestScore = Infinity;
  items.forEach((el, i) => {
    if (i === index) return;
    const r = el.getBoundingClientRect();
    const dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
    let main, cross;
    if (dir === 'right') { if (dx <= 4) return; main = dx; cross = Math.abs(dy); }
    else if (dir === 'left') { if (dx >= -4) return; main = -dx; cross = Math.abs(dy); }
    else if (dir === 'down') { if (dy <= 4) return; main = dy; cross = Math.abs(dx); }
    else { if (dy >= -4) return; main = -dy; cross = Math.abs(dx); }
    const score = main + cross * 2.4;
    if (score < bestScore) { bestScore = score; best = i; }
  });
  return best === -1 ? index : best;
}

/** Grupo de elementos enfocables: teclado (flechas/Enter) + ratón (hover/click). */
export class FocusGroup {
  constructor(items, { onFocus, onActivate, initial = 0, silent = false } = {}) {
    this.onFocus = onFocus; this.onActivate = onActivate; this.silent = silent;
    this.index = -1;
    this.setItems(items, initial);
  }
  setItems(items, initial = this.index < 0 ? 0 : this.index) {
    this.items = items;
    items.forEach((el, i) => {
      el.addEventListener('mouseenter', () => this.set(i));
      el.addEventListener('click', () => { this.set(i, true); this.activate(); });
    });
    this.index = -1;
    this.set(Math.min(initial, items.length - 1), true);
  }
  set(i, quiet = false) {
    if (i === this.index || !this.items[i]) return;
    this.items[this.index]?.classList.remove('is-focus');
    this.index = i;
    this.items[i].classList.add('is-focus');
    if (!quiet && !this.silent) Sfx.play('move');
    this.onFocus?.(this.items[i], i);
  }
  move(dir) { this.set(pickNext(this.items, this.index, dir)); }
  activate() {
    const el = this.items[this.index];
    if (!el) return;
    if (el.dataset.disabled === 'true') { Sfx.play('deny'); return; }
    Sfx.play('confirm');
    this.onActivate?.(el, this.index);
  }
  handleKey(code) {
    if (DIRS[code]) { this.move(DIRS[code]); return true; }
    if (code === 'Enter' || code === 'Space') { this.activate(); return true; }
    return false;
  }
}
