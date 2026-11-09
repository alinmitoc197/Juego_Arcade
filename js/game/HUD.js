import { h } from '../ui/dom.js';
import { artEl } from '../ui/FighterArt.js';
import { t } from '../core/I18n.js';

/** HUD del combate (DOM sobre el canvas): vida, 3 segmentos de super, reloj circular, asaltos, combos y avisos. */
export class HUD {
  constructor(engine) {
    this.engine = engine;
    this.trail = [100, 100];
    this.sides = engine.fighters.map((f, i) => this.buildSide(f, i));
    this.timerEl = h('div', { class: 'hud-time' }, '99');
    this.pips = [h('div', { class: 'pips p1' }), h('div', { class: 'pips p2' })];
    this.comboEls = [0, 1].map((i) => h('div', { class: `combo c${i + 1}` }));
    this.banner = h('div', { class: 'banner' });
    this.el = h('div', { class: 'hud' },
      this.sides.map((s) => s.el),
      h('div', { class: 'hud-center' }, h('div', { class: 'hud-timer' }, this.timerEl), h('div', { class: 'pips-row' }, this.pips)),
      this.comboEls, this.banner);
    this.buildPips();
  }

  buildSide(f, i) {
    const fill = h('div', { class: 'fill' });
    const trail = h('div', { class: 'trail' });
    const segs = [0, 1, 2].map(() => h('i'));
    const el = h('div', { class: `side p${i + 1}` },
      h('div', { class: 'portrait' }, artEl(f.def, f.variant, 'head')),
      h('div', { class: 'pname' }, h('b', { class: 'ptag' }, `P${i + 1}`), f.def.name),
      h('div', { class: 'bar' }, h('div', { class: 'bar-in' }, trail, fill)),
      h('div', { class: 'sup' }, h('span', { class: 'sup-label' }, t('hud.super')), segs.map((s) => h('div', { class: 'sup-seg' }, s))));
    return { el, fill, trail, segs };
  }

  buildPips() {
    const need = this.engine.settings.roundsToWin;
    this.pips.forEach((p) => { p.innerHTML = ''; for (let i = 0; i < need; i++) p.append(h('i')); });
  }

  showBanner(text, kind = 'round', ms = 1400) {
    const b = this.banner;
    b.className = 'banner'; b.textContent = text;
    void b.offsetWidth; // reinicia la animación CSS
    b.className = `banner show ${kind}`;
    clearTimeout(this._bt);
    if (ms) this._bt = setTimeout(() => { b.className = 'banner'; }, ms);
  }

  update() {
    const e = this.engine;
    e.fighters.forEach((f, i) => {
      const s = this.sides[i];
      const pct = (f.hp / f.maxHp) * 100;
      if (this.trail[i] > pct) this.trail[i] = Math.max(pct, this.trail[i] - 0.45); else this.trail[i] = pct;
      s.fill.style.width = `${pct}%`;
      s.trail.style.width = `${this.trail[i]}%`;
      s.fill.classList.toggle('low', pct < 25);
      s.segs.forEach((seg, k) => { seg.style.width = `${Math.max(0, Math.min(100, f.meter - k * 100))}%`; });
      s.el.classList.toggle('ready', f.meter >= 100);
      const c = e.combo[i], ce = this.comboEls[i];
      if (c.t > 0 && c.hits >= 2) {
        ce.innerHTML = `<b>${t('hud.hits', { n: c.hits })}</b><span>${t('hud.damage', { n: c.damage })}</span>`;
        ce.classList.add('on');
      } else ce.classList.remove('on');
      [...this.pips[i].children].forEach((p, k) => p.classList.toggle('won', k < f.wins));
    });
    this.timerEl.textContent = e.timer === Infinity ? '∞' : String(Math.max(0, Math.ceil(e.timer / 60))).padStart(2, '0');
  }
}
