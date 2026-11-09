import { Input } from '../core/Input.js';
import { CONTROLS } from '../data/controls.js';

export const BUTTON_IDS = ['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'taunt'];

/** Lee el teclado del jugador `index` (0 o 1). */
export class KeyboardController {
  constructor(index) { this.keys = CONTROLS[index]; }
  poll() {
    const k = this.keys;
    const pressed = {}, held = {};
    for (const b of BUTTON_IDS) { pressed[b] = Input.wasPressed(k[b]); held[b] = Input.isDown(k[b]); }
    return { left: Input.isDown(k.left), right: Input.isDown(k.right), up: Input.isDown(k.up), down: Input.isDown(k.down), pressed, held };
  }
}

/** No hace nada: el "muñeco" del modo entrenamiento. */
export class NullController {
  poll() { return { left: false, right: false, up: false, down: false, pressed: {}, held: {} }; }
}
