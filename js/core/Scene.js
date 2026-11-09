/** Clase base de todas las escenas. */
export class Scene {
  constructor(ctx) { this.ctx = ctx; this.el = null; }
  mount(container, params = {}) {}
  unmount() { this.el?.remove(); this.el = null; }
  update(dt) {}
  onKey(code, e) {}
}
