export class SceneManager {
  constructor(root, fadeEl, ctx) {
    this.root = root; this.fade = fadeEl; this.ctx = ctx;
    this.registry = {}; this.current = null; this.busy = false;
  }
  register(name, SceneClass) { this.registry[name] = SceneClass; }

  async go(name, params = {}) {
    if (this.busy) return;
    this.busy = true;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    if (this.current) { this.fade.classList.add('on'); await wait(190); this.current.unmount(); this.current = null; }
    const scene = new this.registry[name](this.ctx);
    scene.mount(this.root, params);
    this.current = scene;
    await wait(30);
    this.fade.classList.remove('on');
    this.busy = false;
  }

  update(dt) { if (!this.busy) this.current?.update(dt); }
  onKey(code, e) { if (!this.busy) this.current?.onKey(code, e); }
}
