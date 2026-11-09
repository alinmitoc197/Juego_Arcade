import { Scene } from '../core/Scene.js';
import { h } from '../ui/dom.js';
import { Settings } from '../core/Store.js';
import { I18n, t } from '../core/I18n.js';
import { Sfx } from '../core/Sfx.js';
import { GAME } from '../data/config.js';

const onoff = (v) => t(v ? 'option.on' : 'option.off');
const nums = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// Esquema declarativo: añadir un ajuste = añadir una línea aquí (+ su texto en i18n).
const SCHEMA = [
  { tab: 'game', key: 'cpuDifficulty', values: nums(1, 8), fmt: (v) => `${v} · ${t(`difficulty.${v}`)}` },
  { tab: 'game', key: 'roundTime', values: [30, 60, 99, 0], fmt: (v) => (v === 0 ? t('option.unlimited') : t('option.seconds', { n: v })) },
  { tab: 'game', key: 'roundsToWin', values: [1, 2, 3], fmt: (v) => t('option.firstTo', { n: v }) },
  { tab: 'game', key: 'arcadeFights', values: [3, 6, 9, 12], fmt: (v) => String(v) },
  { tab: 'screen', key: 'sfxVolume', values: nums(0, 10), fmt: (v) => (v === 0 ? t('option.off') : `${v * 10}%`) },
  { tab: 'screen', key: 'screenShake', values: [true, false], fmt: onoff },
  { tab: 'screen', key: 'showFps', values: [true, false], fmt: onoff },
  { tab: 'screen', key: 'showHitboxes', values: [true, false], fmt: onoff },
  { tab: 'language', key: 'language', values: ['es', 'en'], fmt: (v) => (v === 'es' ? 'Español' : 'English') },
];
const TABS = ['game', 'screen', 'language'];

export class OptionsScene extends Scene {
  mount(container, params = {}) {
    this.from = params.from ?? 0;
    this.tab = 0; this.row = 0;
    this.el = h('div', { class: 'scene scene-options bg-space' });
    container.append(this.el);
    this.render();
    this.off = I18n.onChange(() => this.render());
  }
  unmount() { this.off?.(); super.unmount(); }

  rows() { return SCHEMA.filter((s) => s.tab === TABS[this.tab]); }

  render() {
    const rows = this.rows();
    const n = rows.length;
    if (this.row > n + 1) this.row = 0;
    this.el.innerHTML = '';
    this.el.append(
      h('div', { class: 'topbar' }, h('button', { class: 'btn-ghost back', onClick: () => this.back() }, `‹ ${t('common.back')}`),
        h('div', { class: 'topbar-title' }, GAME.name), h('div', { class: 'topbar-mode' }, t('options.title'))),
      h('h1', { class: 'page-title' }, t('options.title')),
      h('div', { class: 'opt-tabs' }, TABS.map((k, i) => h('button', { class: `opt-tab${i === this.tab ? ' on' : ''}`, onClick: () => { this.tab = i; this.row = 0; Sfx.play('move'); this.render(); } },
        h('span', { class: 'num' }, `0${i + 1}`), h('span', {}, t(`options.tab.${k}`))))),
      h('div', { class: 'opt-panel' }, rows.map((s, i) => {
        const val = Settings.get(s.key);
        const step = (d) => this.change(s, d);
        return h('div', { class: `opt-row${this.row === i ? ' is-focus' : ''}`, onMouseenter: () => { if (this.row !== i) { this.row = i; this.render(); } } },
          h('div', { class: 'opt-info' }, h('div', { class: 'opt-name' }, t(`option.${s.key}`)), h('div', { class: 'opt-desc' }, t(`option.${s.key}.desc`))),
          h('div', { class: 'stepper' }, h('button', { onClick: () => step(-1) }, '‹'), h('div', { class: 'stepper-val' }, s.fmt(val)), h('button', { onClick: () => step(1) }, '›')));
      })),
      h('div', { class: 'opt-foot' },
        h('div', { class: 'hint' }, t('options.hint')),
        h('div', { class: 'foot-btns' },
          h('button', { class: `btn-ghost${this.row === n ? ' is-focus' : ''}`, onClick: () => { Settings.reset(); I18n.setLang(Settings.get('language')); Sfx.play('confirm'); this.render(); } }, t('common.reset')),
          h('button', { class: `btn${this.row === n + 1 ? ' is-focus' : ''}`, onClick: () => this.back() }, t('common.back.upper')))));
  }

  change(s, d) {
    const i = s.values.indexOf(Settings.get(s.key));
    const next = s.values[(i + d + s.values.length) % s.values.length];
    Settings.set(s.key, next);
    if (s.key === 'language') I18n.setLang(next);
    Sfx.play('move');
    this.render();
  }

  back() { Sfx.play('back'); this.ctx.go('menu', { focus: this.from }); }

  onKey(code, e) {
    const n = this.rows().length;
    if (code === 'Escape') return this.back();
    if (code === 'Tab') { this.tab = (this.tab + (e.shiftKey ? 2 : 1)) % TABS.length; this.row = 0; Sfx.play('move'); return this.render(); }
    if (code === 'ArrowDown') { this.row = Math.min(n + 1, this.row + 1); Sfx.play('move'); return this.render(); }
    if (code === 'ArrowUp') { this.row = Math.max(0, this.row - 1); Sfx.play('move'); return this.render(); }
    if (code === 'ArrowLeft' || code === 'ArrowRight') {
      const d = code === 'ArrowLeft' ? -1 : 1;
      if (this.row < n) return this.change(this.rows()[this.row], d);
      this.row = this.row === n ? n + 1 : n; return this.render();
    }
    if (code === 'Enter') {
      if (this.row === n) { Settings.reset(); I18n.setLang(Settings.get('language')); Sfx.play('confirm'); this.render(); }
      else if (this.row === n + 1) this.back();
      else this.change(this.rows()[this.row], 1);
    }
  }
}
