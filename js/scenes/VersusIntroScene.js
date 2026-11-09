import { Scene } from '../core/Scene.js';
import { h } from '../ui/dom.js';
import { artEl } from '../ui/FighterArt.js';
import { getFighter, randomFighter } from '../data/roster.js';
import { t } from '../core/I18n.js';
import { Sfx } from '../core/Sfx.js';

export class VersusIntroScene extends Scene {
  mount(container, params = {}) {
    this.params = { ...params };
    const p = this.params;
    if (!p.p1?.id) p.p1 = { id: randomFighter().id, variant: 0 };
    if (!p.p2?.id) p.p2 = { id: randomFighter(p.p1.id).id, variant: 1 };
    const d1 = getFighter(p.p1.id), d2 = getFighter(p.p2.id);
    this.t = 0; this.done = false;
    const label = p.mode === 'arcade' ? t('intro.fightOf', { n: (p.index ?? 0) + 1, total: p.ladder.length }) : t(`intro.${p.mode}`);
    this.bar = h('div', { class: 'vs-progress-fill' });

    this.el = h('div', { class: 'scene scene-vs' },
      h('div', { class: 'vs-half left' }, artEl(d1, p.p1.variant || 0, 'full', 'vs-art')),
      h('div', { class: 'vs-half right' }, artEl(d2, p.p2.variant || 0, 'full', 'vs-art')),
      h('div', { class: 'vs-diag' }),
      h('div', { class: 'vs-ring' }, 'VS'),
      h('div', { class: 'vs-plate left' }, h('span', { class: 'vs-group' }, t(`group.${d1.group}`)), h('strong', {}, d1.name)),
      h('div', { class: 'vs-plate right' }, h('span', { class: 'vs-group' }, t(`group.${d2.group}`)), h('strong', {}, d2.name)),
      h('div', { class: 'vs-center' }, h('div', { class: 'vs-label' }, label), h('div', { class: 'vs-space' }, t('intro.space')),
        h('div', { class: 'vs-progress' }, this.bar), h('div', { class: 'vs-loading' }, t('intro.loading'))),
      h('button', { class: 'vs-close', onClick: () => this.leave() }, '✕'));
    container.append(this.el);
    Sfx.play('confirm');
  }

  leave() { if (this.done) return; this.done = true; Sfx.play('back'); this.ctx.go('menu', { focus: this.params.mode }); }
  go() { if (this.done) return; this.done = true; this.ctx.go('fight', this.params); }
  update(dt) { this.t += dt; this.bar.style.width = `${Math.min(1, this.t / 3) * 100}%`; if (this.t >= 3) this.go(); }
  onKey(code) { if (code === 'Space' || code === 'Enter') this.go(); else if (code === 'Escape') this.leave(); }
}
