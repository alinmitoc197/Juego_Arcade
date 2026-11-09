// Teclas por jugador (usamos event.code: no depende de la distribución del teclado).
export const CONTROLS = [
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
    lp: 'KeyA', mp: 'KeyS', hp: 'KeyD', lk: 'KeyZ', mk: 'KeyX', hk: 'KeyC', taunt: 'Enter' },
  { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL',
    lp: 'KeyU', mp: 'KeyO', hp: 'KeyP', lk: 'KeyM', mk: 'Comma', hk: 'Period', taunt: 'ShiftRight' },
];

const SPECIAL = {
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  Comma: ',', Period: '.', Enter: 'Enter', ShiftRight: '⇧ Der.', ShiftLeft: '⇧ Izq.',
  Space: 'Espacio', Escape: 'Esc', Tab: 'Tab',
};

export function keyLabel(code) {
  if (SPECIAL[code]) return SPECIAL[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}
