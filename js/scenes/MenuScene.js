import { Scene } from '../core/Scene.js';
import { h } from '../ui/dom.js';
import { FocusGroup } from '../ui/focus.js';
import { artEl } from '../ui/FighterArt.js';
import { ROSTER } from '../data/roster.js';
import { GAME } from '../data/config.js';
import { I18n, t } from '../core/I18n.js';
import { Settings } from '../core/Store.js';
import { Sfx } from '../core/Sfx.js';

// row = fila del mosaico (r1..r4). imgs = imágenes reales en assets/characters/ (tienen prioridad).
// art = índices del plantel provisional (0-11 Vanguardia, 12-23 Arcanos, 24-35 Calle). c/cd = color del fondo (claro/oscuro).
// Con dos luchadores se colocan enfrentados: así cada modo "cuenta" un bando contra otro.
const TILES = [
  { id: 'arcade', badge: '1P', row: 'r1', imgs: ['assets/characters/arcade-1.webp'], art: [3, 14], c: '#fa3756', cd: '#57111c' },
  { id: 'versus', badge: '2P', row: 'r1', art: [8, 20], c: '#ef4444' },
  { id: 'coop', badge: '2P', row: 'r2', art: [1, 6], c: '#3b82f6', off: true },
  { id: 'survival', badge: '1P', row: 'r2', art: [30], c: '#fbbf24', off: true },
  { id: 'survivalCoop', badge: '2P', row: 'r2', art: [26, 33], c: '#fbbf24', off: true },
  { id: 'training', badge: '1P', row: 'r3', art: [10], c: '#fbbf24' },
  { id: 'spectator', badge: 'CPU', row: 'r3', art: [17, 22], c: '#ef4444' },
  { id: 'options', icon: '⚙', row: 'r4' },
  { id: 'help', icon: '?', row: 'r4' },
  { id: 'credits', icon: '★', row: 'r4' },
];

export class MenuScene extends Scene {
  mount(container, params = {}) {
    const f = params.focus;
    this.focusIndex = typeof f === 'string' ? Math.max(0, TILES.findIndex((x) => x.id === f)) : (f ?? 1);
    this.el = h('div', { class: 'scene scene-menu bg-space' });
    container.append(this.el);
    this.render();
    this.off = I18n.onChange(() => this.render());
  }
  unmount() { this.off?.(); super.unmount(); }

  render() {
    const el = this.el;
    el.innerHTML = '';
    const desc = h('div', { class: 'menu-desc' });
    const tiles = TILES.map((tl) => {
      const solo = (n) => (n === 1 ? ' solo' : '');
      const placeholders = () => (tl.art || []).map((i, k) => artEl(ROSTER[i], 0, 'full', `tile-art a${k}${solo(tl.art.length)}`));
      // si la imagen real no carga (archivo ausente), se muestran los muñecos provisionales
      const art = tl.imgs
        ? tl.imgs.map((src, k) => h('img', { class: `tile-img a${k}${solo(tl.imgs.length)}`, src, alt: '', draggable: 'false',
            onError: (e) => { const back = placeholders(); if (k === 0) e.target.replaceWith(...back); else e.target.remove(); } }))
        : placeholders();
      return h('button', { class: `tile ${tl.row}${tl.imgs ? ' img' : ''}`, style: { '--c': tl.c || '#8f98c0', '--cd': tl.cd || '#1a1d3a' }, dataset: { id: tl.id, disabled: tl.off ? 'true' : 'false' } },
        h('div', { class: 'tile-in' }, art,
          tl.badge ? h('span', { class: 'badge' }, tl.badge) : null,
          tl.icon ? h('span', { class: 'tile-icon' }, tl.icon) : null,
          h('span', { class: 'tile-label' }, t(`menu.${tl.id}`)),
          tl.off ? h('span', { class: 'soon' }, t('common.soon')) : null));
    });
    const langSel = h('select', { class: 'lang-select', onChange: (e) => { Settings.set('language', e.target.value); I18n.setLang(e.target.value); } },
      h('option', { value: 'es', selected: I18n.lang === 'es' }, 'Español'),
      h('option', { value: 'en', selected: I18n.lang === 'en' }, 'English'));
    langSel.addEventListener('keydown', (e) => e.stopPropagation());

    el.append(
      h('div', { class: 'menu-left' },
        h('div', { class: 'kicker' }, t('menu.kicker')),
        h('div', { class: 'title' },
          h('span', { class: 'title-w t1' }, GAME.title[0]), h('span', { class: 'vs-badge' }, 'VS'), h('span', { class: 'title-w t2' }, GAME.title[1])),
        h('div', { class: 'title-rule' }),
        desc,
        h('div', { class: 'lang-box' }, h('span', { class: 'globe' }, '🌐'), langSel),
        h('div', { class: 'hint' }, t('menu.hint'))),
      h('div', { class: 'menu-grid' }, tiles),
      h('div', { class: 'version' }, `v${GAME.version}`),
      this.credits = h('div', { class: 'overlay hidden', onClick: () => this.toggleCredits(false) },
        h('div', { class: 'panel credits-panel' }, h('h2', {}, t('menu.credits')), h('p', {}, t('menu.creditsText')), h('div', { class: 'btn' }, t('common.close')))));

    this.focus = new FocusGroup(tiles, {
      initial: this.focusIndex,
      onFocus: (btn) => { this.focusIndex = tiles.indexOf(btn); desc.textContent = t(`menu.desc.${btn.dataset.id}`); },
      onActivate: (btn) => this.activate(btn.dataset.id),
    });
  }

  toggleCredits(on) { this.credits.classList.toggle('hidden', !on); this.creditsOpen = on; }

  activate(id) {
    const idx = this.focusIndex;
    switch (id) {
      case 'arcade': this.ctx.go('select', { mode: 'arcade' }); break;
      case 'versus': this.ctx.go('select', { mode: 'versus' }); break;
      case 'training': this.ctx.go('select', { mode: 'training' }); break;
      case 'spectator': this.ctx.go('versusIntro', { mode: 'spectator', p1: { id: null }, p2: { id: null } }); break;
      case 'options': this.ctx.go('options', { from: idx }); break;
      case 'help': this.ctx.go('help', { from: idx }); break;
      case 'credits': this.toggleCredits(true); break;
      default: break;
    }
  }

  onKey(code) {
    if (this.creditsOpen) { if (code === 'Escape' || code === 'Enter' || code === 'Space') { Sfx.play('back'); this.toggleCredits(false); } return; }
    this.focus.handleKey(code);
  }
}
