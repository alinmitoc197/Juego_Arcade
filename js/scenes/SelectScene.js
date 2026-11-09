import { Scene } from '../core/Scene.js';
import { h } from '../ui/dom.js';
import { FocusGroup } from '../ui/focus.js';
import { artEl } from '../ui/FighterArt.js';
import { ROSTER, GROUPS, randomFighter, groupOf, getFighter } from '../data/roster.js';
import { GAME } from '../data/config.js';
import { t } from '../core/I18n.js';
import { Settings } from '../core/Store.js';
import { Sfx } from '../core/Sfx.js';

const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

export class SelectScene extends Scene {
  mount(container, params = {}) {
    this.mode = params.mode || 'versus';
    this.phase = 'p1';
    this.picks = [params.p1 || null, null];
    this.variant = [0, 0];
    this.el = h('div', { class: 'scene scene-select bg-space' });
    container.append(this.el);

    this.heroL = h('div', { class: 'hero-art left' });
    this.heroR = h('div', { class: 'hero-art right' });
    this.ghost = h('div', { class: 'hero-ghost' });
    this.barL = h('div', { class: 'pbar p1' });
    this.barR = h('div', { class: 'pbar p2' });
    this.prompt = h('div', { class: 'prompt-title' });
    this.tip = h('div', { class: 'slot-tip hidden' });

    const slots = [];
    const groups = GROUPS.map((g) => {
      const members = ROSTER.filter((f) => f.group === g.id);
      const btns = members.map((f) => {
        const b = h('button', { class: 'slot', dataset: { id: f.id } }, artEl(f, 0, 'head'));
        slots.push(b); return b;
      });
      return h('div', { class: 'group', style: { '--gc': g.color } },
        h('div', { class: 'group-title' }, h('span', {}, t(`group.${g.id}`)), h('em', {}, String(members.length)), h('i')),
        h('div', { class: 'slot-grid' }, btns));
    });

    this.el.append(
      h('div', { class: 'topbar' },
        h('button', { class: 'btn-ghost back', onClick: () => this.back() }, `‹ ${t('common.back')}`),
        h('div', { class: 'topbar-title' }, GAME.name),
        h('div', { class: 'topbar-mode' }, t(`mode.${this.mode}`))),
      h('div', { class: 'hero' }, this.heroL, this.ghost, h('div', { class: 'vs-logo' }, 'VS'), this.heroR),
      h('div', { class: 'pbars' }, this.barL, this.barR),
      h('div', { class: 'prompt' }, h('span', { class: 'prompt-mode' }, t(`mode.${this.mode}`)), this.prompt),
      h('div', { class: 'groups' }, groups),
      this.tip,
      h('div', { class: 'select-foot' },
        h('div', { class: 'hint' }, t('select.hint')),
        h('div', { class: 'foot-btns' },
          h('button', { class: 'btn-ghost', onClick: () => this.randomPick() }, t('common.random')),
          h('button', { class: 'btn', onClick: () => this.confirm() }, t('common.confirm')))));

    this.focus = new FocusGroup(slots, {
      initial: params.p1 ? ROSTER.findIndex((f) => f.id === params.p1.id) : 0,
      onFocus: (btn) => { this.current = getFighter(btn.dataset.id); this.refresh(); this.placeTip(btn); },
      onActivate: () => this.confirm(),
    });
    this.refresh();
  }

  get active() { return this.phase === 'p1' ? 0 : 1; }

  placeTip(btn) {
    const sr = this.el.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    const k = sr.width / 1280;
    this.tip.textContent = this.current.name;
    this.tip.style.left = `${(r.left - sr.left + r.width / 2) / k}px`;
    this.tip.style.top = `${(r.top - sr.top + r.height) / k + 6}px`;
    this.tip.classList.remove('hidden');
  }

  barHTML(i, def, variantIdx) {
    const bar = i === 0 ? this.barL : this.barR;
    bar.innerHTML = '';
    bar.append(h('div', { class: 'ptag' }, i === 0 ? t('select.player1') : (this.mode === 'versus' ? t('select.player2') : t('select.cpu'))));
    if (def) bar.append(h('div', { class: 'pname' }, def.name), h('div', { class: 'pgroup' }, t(`group.${def.group}`)));
    else bar.append(h('div', { class: 'pname dim' }, '?'));
  }

  refresh() {
    const cur = this.current || ROSTER[0];
    const defs = [this.picks[0] ? getFighter(this.picks[0].id) : null, this.picks[1] ? getFighter(this.picks[1].id) : null];
    if (this.phase === 'p1') defs[0] = cur;
    if (this.phase === 'p2') defs[1] = cur;
    this.heroL.innerHTML = ''; this.heroR.innerHTML = '';
    if (defs[0]) this.heroL.append(artEl(defs[0], this.variant[0], 'full'));
    if (defs[1]) this.heroR.append(artEl(defs[1], this.variant[1], 'full'));
    this.ghost.textContent = cur.name;
    this.barHTML(0, defs[0]); this.barHTML(1, this.mode === 'versus' ? defs[1] : null);
    this.barL.classList.toggle('active', this.phase === 'p1');
    this.barR.classList.toggle('active', this.phase === 'p2');
    this.prompt.textContent = this.mode === 'versus' ? t(this.phase === 'p1' ? 'select.p1Choose' : 'select.p2Choose') : t('select.chooseFighter');
  }

  randomPick() {
    const f = randomFighter();
    const i = ROSTER.findIndex((x) => x.id === f.id);
    this.focus.set(i, true);
    this.confirm();
  }

  confirm() {
    const f = this.current || ROSTER[0];
    Sfx.play('confirm');
    const pick = { id: f.id, variant: this.variant[this.active] };
    if (this.phase === 'p1') {
      this.picks[0] = pick;
      if (this.mode === 'versus') { this.phase = 'p2'; this.variant[1] = 0; this.refresh(); return; }
      this.startMatch();
    } else { this.picks[1] = pick; this.startMatch(); }
  }

  startMatch() {
    const p1 = this.picks[0];
    if (this.mode === 'versus') return this.ctx.go('versusIntro', { mode: 'versus', p1, p2: this.picks[1] });
    if (this.mode === 'training') {
      const dummy = randomFighter(p1.id);
      return this.ctx.go('versusIntro', { mode: 'training', p1, p2: { id: dummy.id, variant: 1 } });
    }
    const total = Settings.get('arcadeFights');
    const ladder = shuffle(ROSTER.filter((f) => f.id !== p1.id)).slice(0, total).map((f) => f.id);
    this.ctx.go('versusIntro', { mode: 'arcade', p1, p2: { id: ladder[0], variant: p1.id === ladder[0] ? 1 : 0 }, ladder, index: 0 });
  }

  back() {
    Sfx.play('back');
    if (this.phase === 'p2') { this.phase = 'p1'; this.picks[1] = null; this.refresh(); } else this.ctx.go('menu', { focus: this.mode });
  }

  onKey(code) {
    if (code === 'Escape') return this.back();
    if (code === 'KeyR') return this.randomPick();
    if (code === 'Tab') { this.variant[this.active] = (this.variant[this.active] + 1) % 3; Sfx.play('move'); return this.refresh(); }
    this.focus.handleKey(code);
  }
}
