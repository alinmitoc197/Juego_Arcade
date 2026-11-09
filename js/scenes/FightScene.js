import { Scene } from '../core/Scene.js';
import { h } from '../ui/dom.js';
import { FocusGroup } from '../ui/focus.js';
import { FightEngine } from '../game/FightEngine.js';
import { Renderer } from '../game/Renderer.js';
import { HUD } from '../game/HUD.js';
import { KeyboardController, NullController } from '../game/controllers.js';
import { AIController } from '../game/AI.js';
import { STAGES } from '../game/StageBg.js';
import { getFighter, randomFighter } from '../data/roster.js';
import { WORLD } from '../data/config.js';
import { Input } from '../core/Input.js';
import { Settings } from '../core/Store.js';
import { Sfx } from '../core/Sfx.js';
import { t } from '../core/I18n.js';

const STEP = 1 / 60;

export class FightScene extends Scene {
  mount(container, params = {}) {
    this.params = params;
    const p = params;
    this.mode = p.mode;
    const d1 = getFighter(p.p1.id), d2 = getFighter(p.p2.id);
    const level = Math.min(8, Settings.get('cpuDifficulty') + Math.floor((p.index ?? 0) / 4));
    const controllers = {
      versus: [new KeyboardController(0), new KeyboardController(1)],
      arcade: [new KeyboardController(0), new AIController(level)],
      training: [new KeyboardController(0), new NullController()],
      spectator: [new AIController(Settings.get('cpuDifficulty')), new AIController(Settings.get('cpuDifficulty'))],
    }[this.mode];

    this.engine = new FightEngine({
      defs: [d1, d2], variants: [p.p1.variant || 0, p.p2.variant || 0], controllers, mode: this.mode,
      settings: { roundTime: Settings.get('roundTime'), roundsToWin: Settings.get('roundsToWin') },
      emit: (n, d) => this.onEvent(n, d),
    });
    this.hud = new HUD(this.engine);
    this.canvas = h('canvas', { width: WORLD.width, height: WORLD.height });
    this.renderer = new Renderer(this.canvas, STAGES[Math.floor(Math.random() * STAGES.length)]);
    this.world = h('div', { class: 'world' }, this.canvas);
    this.overlay = h('div', { class: 'overlay hidden' });
    this.el = h('div', { class: 'scene scene-fight' }, this.world, this.hud.el, this.overlay,
      this.mode === 'training' ? h('div', { class: 'training-tag' }, `${t('mode.training')} · Esc`) : null);
    container.append(this.el);
    this.acc = 0; this.shake = 0; this.paused = false; this.ended = false;
    if (this.mode === 'training') this.hud.showBanner(t('mode.training'), 'round', 900);
  }

  onEvent(name, d) {
    if (name === 'banner') this.hud?.showBanner(t(d.key, d.params), d.kind, d.kind === 'ko' ? 1800 : 1400);
    else if (name === 'sfx') Sfx.play(d);
    else if (name === 'shake') { if (Settings.get('screenShake')) this.shake = Math.max(this.shake, d); }
    else if (name === 'matchEnd') this.matchEnd(d.winner);
  }

  // ---------- final de combate
  matchEnd(winner) {
    if (this.ended) return;
    this.ended = true;
    const p = this.params;
    const go = (name, extra) => () => this.ctx.go(name, extra);
    const same = { ...p };
    let title, buttons;
    if (this.mode === 'arcade') {
      const last = (p.index ?? 0) + 1 >= p.ladder.length;
      if (winner === 0 && !last) {
        const next = (p.index ?? 0) + 1;
        title = t('result.win');
        buttons = [[t('result.next'), go('versusIntro', { ...p, index: next, p2: { id: p.ladder[next], variant: p.ladder[next] === p.p1.id ? 1 : 0 } })], [t('result.toMenu'), go('menu', { focus: 'arcade' })]];
      } else if (winner === 0) { title = t('result.complete'); buttons = [[t('result.toMenu'), go('menu', { focus: 'arcade' })]]; }
      else { title = t('result.lose'); buttons = [[t('result.retry'), go('versusIntro', same)], [t('result.toMenu'), go('menu', { focus: 'arcade' })]]; }
    } else if (this.mode === 'versus') {
      title = winner < 0 ? t('result.draw') : t(winner === 0 ? 'result.p1' : 'result.p2');
      buttons = [[t('result.rematch'), go('versusIntro', same)], [t('result.toSelect'), go('select', { mode: 'versus' })], [t('result.toMenu'), go('menu', { focus: 'versus' })]];
    } else {
      title = winner < 0 ? t('result.draw') : this.engine.fighters[winner].def.name;
      buttons = [[t('result.again'), go('versusIntro', { mode: 'spectator', p1: { id: null }, p2: { id: null } })], [t('result.toMenu'), go('menu', { focus: 'spectator' })]];
    }
    setTimeout(() => this.openOverlay(title, buttons), 600);
  }

  openOverlay(title, buttons) {
    const btns = buttons.map(([label, fn]) => h('button', { class: 'btn menu-btn', onClick: () => {} }, label));
    this.overlay.innerHTML = '';
    this.overlay.append(h('div', { class: 'panel pause-panel' }, h('h2', {}, title), h('div', { class: 'menu-list' }, btns)));
    this.overlay.classList.remove('hidden');
    this.overlayFocus = new FocusGroup(btns, { onActivate: (_, i) => buttons[i][1]() });
  }

  togglePause() {
    if (this.ended) return;
    this.paused = !this.paused;
    if (!this.paused) { this.overlay.classList.add('hidden'); this.overlayFocus = null; return; }
    const p = this.params;
    this.openOverlay(t('pause.title'), [
      [t('pause.resume'), () => this.togglePause()],
      [t('pause.restart'), () => this.ctx.go('versusIntro', { ...p })],
      ...(this.mode === 'spectator' ? [] : [[t('pause.select'), () => this.ctx.go('select', { mode: this.mode })]]),
      [t('pause.menu'), () => this.ctx.go('menu', { focus: this.mode })],
    ]);
  }

  update(dt) {
    const e = this.engine;
    const fps = document.getElementById('fps');
    if (fps) { this.fpsT = (this.fpsT || 0) + dt; this.fpsN = (this.fpsN || 0) + 1; if (this.fpsT >= 0.5) { fps.textContent = Settings.get('showFps') ? `${Math.round(this.fpsN / this.fpsT)} FPS` : ''; this.fpsT = 0; this.fpsN = 0; } }
    if (!this.paused) {
      this.acc += Math.min(dt, 0.1) * e.timeScale;
      let n = 0;
      while (this.acc >= STEP && n < 5) { e.step(); Input.endStep(); this.acc -= STEP; n++; }
    } else Input.endStep();
    this.renderer.draw(e, { showBoxes: Settings.get('showHitboxes') });
    this.hud.update();
    this.shake *= 0.86;
    this.world.style.transform = this.shake > 0.3 ? `translate(${(Math.random() - 0.5) * this.shake * 1.6}px, ${(Math.random() - 0.5) * this.shake}px)` : '';
  }

  unmount() { const fps = document.getElementById('fps'); if (fps) fps.textContent = ''; super.unmount(); }

  onKey(code) {
    if (code === 'Escape') return this.paused || !this.ended ? this.togglePause() : undefined;
    if (this.overlayFocus) this.overlayFocus.handleKey(code);
  }
}
