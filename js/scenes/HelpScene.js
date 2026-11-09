import { Scene } from '../core/Scene.js';
import { h } from '../ui/dom.js';
import { FocusGroup } from '../ui/focus.js';
import { artEl } from '../ui/FighterArt.js';
import { CONTROLS, keyLabel } from '../data/controls.js';
import { BUTTON_GROUPS } from '../data/moves.js';
import { ROSTER, GROUPS, getMoveList } from '../data/roster.js';
import { I18n, t } from '../core/I18n.js';
import { Sfx } from '../core/Sfx.js';
import { GAME } from '../data/config.js';

const TABS = ['fight', 'moves', 'keys'];
const ARROW = { 2: '↓', 3: '↘', 6: '→', 4: '←', 1: '↙', 8: '↑', 9: '↗', 7: '↖' };
const key = (label, cls = '') => h('span', { class: `keycap ${cls}` }, label);

export class HelpScene extends Scene {
  mount(container, params = {}) {
    this.from = params.from ?? 0;
    this.tab = 0; this.player = 0; this.fighter = 0;
    this.el = h('div', { class: 'scene scene-help bg-space' });
    container.append(this.el);
    this.render();
    this.off = I18n.onChange(() => this.render());
  }
  unmount() { this.off?.(); super.unmount(); }
  get keys() { return CONTROLS[this.player]; }

  render() {
    this.el.innerHTML = '';
    this.el.append(
      h('div', { class: 'topbar' }, h('button', { class: 'btn-ghost back', onClick: () => this.back() }, `‹ ${t('common.back')}`),
        h('div', { class: 'topbar-title' }, GAME.name), h('div', { class: 'topbar-mode' }, t('menu.help'))),
      h('div', { class: 'help-head' },
        h('h1', { class: 'page-title small' }, t('help.title')),
        h('div', { class: 'opt-tabs row' }, TABS.map((k, i) => h('button', { class: `opt-tab${i === this.tab ? ' on' : ''}`, onClick: () => { this.tab = i; Sfx.play('move'); this.render(); } }, t(`help.tab.${k}`)))),
        h('div', { class: 'seg' }, [0, 1].map((p) => h('button', { class: this.player === p ? 'on' : '', onClick: () => { this.player = p; this.render(); } }, t(`help.p${p + 1}`))))),
      this[`tab_${TABS[this.tab]}`](),
      h('div', { class: 'select-foot' },
        h('div', { class: 'hint' }, t(this.tab === 1 ? 'help.hintMoves' : 'help.hintFight')),
        h('div', { class: 'foot-btns' }, h('button', { class: 'btn', onClick: () => this.back() }, t('common.back.upper')))));
  }

  tab_fight() {
    const k = this.keys;
    const dirKey = (code, label) => h('div', { class: 'dirkey' }, key(keyLabel(code), 'big'), h('small', {}, label));
    const atk = (b) => h('div', { class: 'atk' }, key(keyLabel(k[b]), 'big'), h('div', {}, h('b', {}, t(`btn.${b}`)), h('span', {}, t(`btn.${b}.desc`))));
    return h('div', { class: 'help-body two' },
      h('div', { class: 'help-card' }, h('h3', {}, t('help.movement')),
        h('div', { class: 'dpad' },
          h('div', { class: 'u' }, dirKey(k.up, t('help.jump'))), h('div', { class: 'l' }, dirKey(k.left, t('help.back'))),
          h('div', { class: 'r' }, dirKey(k.right, t('help.forward'))), h('div', { class: 'd' }, dirKey(k.down, t('help.crouch')))),
        h('p', {}, t('help.block1')), h('p', {}, t('help.block2'))),
      h('div', { class: 'help-card' }, h('h3', {}, t('help.attacks')),
        h('div', { class: 'atk-grid' }, ['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'taunt'].map(atk)), h('p', { class: 'combo-note' }, t('help.combos'))));
  }

  tab_moves() {
    const slots = ROSTER.map((f) => h('button', { class: 'slot small', title: f.name }, artEl(f, 0, 'head')));
    const list = h('div', { class: 'help-slots' }, GROUPS.map((g) => h('div', { class: 'help-group', style: { '--gc': g.color } },
      h('div', { class: 'group-title' }, h('span', {}, t(`group.${g.id}`)), h('i')),
      h('div', { class: 'slot-grid c3' }, slots.filter((_, i) => ROSTER[i].group === g.id)))));
    this.slotFocus = new FocusGroup(slots, { initial: this.fighter, silent: false,
      onFocus: (_, i) => { if (i !== this.fighter) { this.fighter = i; this.updateMoves(); } } });
    this.moveBox = h('div', { class: 'help-card moves' });
    queueMicrotask(() => this.updateMoves());
    return h('div', { class: 'help-body moves-layout' }, list, this.moveBox);
  }

  updateMoves() {
    if (!this.moveBox) return;
    const def = ROSTER[this.fighter];
    const k = this.keys;
    this.moveBox.innerHTML = '';
    this.moveBox.append(
      h('div', { class: 'move-head' }, artEl(def, 0, 'head', 'mh-portrait'), h('div', {}, h('div', { class: 'mh-name' }, def.name), h('div', { class: 'mh-sub' }, `${t(`group.${def.group}`)} · ${def.archetype.toUpperCase()}`))),
      h('div', { class: 'legend' }, [['→', t('help.forward')], [keyLabel(k.lp), t('btn.lp')], [keyLabel(k.mp), t('btn.mp')], [keyLabel(k.hp), t('btn.hp')], [keyLabel(k.lk), t('btn.lk')], [keyLabel(k.mk), t('btn.mk')], [keyLabel(k.hk), t('btn.hk')]]
        .map(([c, l]) => h('span', {}, key(c, 'face'), ' ', l))),
      ...getMoveList(def).map((m) => {
        const btns = BUTTON_GROUPS[m.input].map((b) => key(keyLabel(k[b]), 'face')).flatMap((x, i) => (i ? [h('span', { class: 'sep' }, '/'), x] : [x]));
        const seq = m.motion.flatMap((n, i) => (i ? [h('span', { class: 'sep' }, '›'), key(ARROW[n], 'arrow')] : [key(ARROW[n], 'arrow')]));
        return h('div', { class: 'move-row' },
          h('div', { class: 'move-name' }, t(`move.${m.id}`), m.cost ? h('span', { class: 'tag' }, t('help.cost', { n: m.cost / 100 })) : null),
          h('div', { class: 'move-seq' }, seq, h('span', { class: 'sep' }, '›'), btns));
      }));
  }

  tab_keys() {
    const k = this.keys;
    const row = (label, code) => h('div', { class: 'key-row' }, h('span', {}, label), key(keyLabel(code), 'big'));
    return h('div', { class: 'help-body two' },
      h('div', { class: 'help-card' }, h('h3', {}, `${t('help.keysTitle')} ${this.player + 1}`),
        row(t('help.jump'), k.up), row(t('help.crouch'), k.down), row('←', k.left), row('→', k.right),
        ...['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'taunt'].map((b) => row(t(`btn.${b}`), k[b]))),
      h('div', { class: 'help-card' }, h('h3', {}, t('help.menuKeys')), h('p', {}, t('help.menuKeysList'))));
  }

  back() { Sfx.play('back'); this.ctx.go('menu', { focus: this.from }); }

  onKey(code, e) {
    if (code === 'Escape') return this.back();
    if (code === 'Tab') { this.player = 1 - this.player; Sfx.play('move'); return this.render(); }
    if (code === 'PageUp' || code === 'PageDown') { this.tab = (this.tab + (code === 'PageDown' ? 1 : TABS.length - 1)) % TABS.length; Sfx.play('move'); return this.render(); }
    if (this.tab === 1) { this.slotFocus?.handleKey(code); return; }
    if (code === 'ArrowLeft' || code === 'ArrowRight') { this.tab = (this.tab + (code === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length; Sfx.play('move'); this.render(); }
  }
}
