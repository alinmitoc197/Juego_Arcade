// Configuración global del juego. Todo lo "mágico" vive aquí.
export const GAME = {
  name: 'CLASH DE BANDOS',
  version: '0.6', // se muestra abajo a la izquierda en el menú: sirve para saber qué copia estás ejecutando
  title: ['VANGUARDIA', 'ARCANOS'], // los dos bandos del título del menú
  width: 1280,
  height: 720,
};

export const WORLD = {
  width: 1280,
  height: 720,
  groundY: 620,
  wallL: 70,
  wallR: 1210,
  gravity: 0.85,
  jumpVy: 18,
  walkF: 4.2,
  walkB: 3.4,
};

export const DEFAULT_SETTINGS = {
  cpuDifficulty: 4,
  roundTime: 99,
  roundsToWin: 2,
  arcadeFights: 12,
  sfxVolume: 7,
  screenShake: true,
  showFps: false,
  showHitboxes: false,
  language: 'es',
};
