import { Input } from './core/Input.js';
import { Settings } from './core/Store.js';
import { I18n } from './core/I18n.js';
import { Sfx } from './core/Sfx.js';
import { SceneManager } from './core/SceneManager.js';
import { GAME } from './data/config.js';
import { MenuScene } from './scenes/MenuScene.js';
import { SelectScene } from './scenes/SelectScene.js';
import { VersusIntroScene } from './scenes/VersusIntroScene.js';
import { FightScene } from './scenes/FightScene.js';
import { OptionsScene } from './scenes/OptionsScene.js';
import { HelpScene } from './scenes/HelpScene.js';

Settings.load();
I18n.setLang(Settings.get('language'));

const stage = document.getElementById('stage');
function fit() {
  const k = Math.min(innerWidth / GAME.width, innerHeight / GAME.height);
  stage.style.transform = `translate(${(innerWidth - GAME.width * k) / 2}px, ${(innerHeight - GAME.height * k) / 2}px) scale(${k})`;
}
addEventListener('resize', fit);
fit();

const ctx = { go: (name, params) => scenes.go(name, params) };
const scenes = new SceneManager(document.getElementById('scene-root'), document.getElementById('fade'), ctx);
Object.entries({ menu: MenuScene, select: SelectScene, versusIntro: VersusIntroScene, fight: FightScene, options: OptionsScene, help: HelpScene })
  .forEach(([n, S]) => scenes.register(n, S));

Input.init();
Input.onKey = (code, e) => { scenes.onKey(code, e); };

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  scenes.update(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
scenes.go('menu');
// ayuda para depurar desde la consola del navegador
window.__game = { scenes, Settings, Sfx };
