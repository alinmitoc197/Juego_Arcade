const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'PageUp', 'PageDown']);

/** Estado global del teclado + reenvío de teclas a la escena activa. */
class InputManager {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
    this.onKey = null; // (code, event) => void
  }
  init() {
    window.addEventListener('keydown', (e) => {
      if (PREVENT.has(e.code)) e.preventDefault();
      if (!e.repeat) { this.down.add(e.code); this.pressed.add(e.code); }
      this.onKey?.(e.code, e);
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => { this.down.clear(); this.pressed.clear(); });
  }
  isDown(code) { return this.down.has(code); }
  wasPressed(code) { return this.pressed.has(code); }
  /** Se llama tras cada paso de simulación: los "pulsado este frame" se consumen. */
  endStep() { this.pressed.clear(); }
}
export const Input = new InputManager();
