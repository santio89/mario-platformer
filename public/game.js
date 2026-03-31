// ================================================================
// CANVAS SETUP
// ================================================================
const canvas = document.getElementById('gameCanvas');
const TILE = 16;
const SCALE = 3;
const VIEW_W = 256;
const VIEW_H = 240;
const dpr = window.devicePixelRatio || 1;
const pixelScale = Math.round(SCALE * dpr);
canvas.width = VIEW_W * pixelScale;
canvas.height = VIEW_H * pixelScale;
canvas.style.width = (canvas.width / dpr) + 'px';
canvas.style.height = (canvas.height / dpr) + 'px';
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

const buf = document.createElement('canvas');
buf.width = VIEW_W;
buf.height = VIEW_H;
const bx = buf.getContext('2d');
bx.imageSmoothingEnabled = false;

// ================================================================
// COLORS (NES palette)
// ================================================================
const COL = {
  sky: '#5c94fc',
  ground: '#c84c0c',
  groundDark: '#a0380c',
  groundLight: '#e09060',
  brick: '#c84c0c',
  brickLine: '#a43000',
  block: '#f8d830',
  blockShade: '#e4a010',
  blockDark: '#b07000',
  pipe: '#00a800',
  pipeDark: '#005800',
  pipeHighlight: '#80d010',
  mario: '#e44030',
  marioSkin: '#fcbcb0',
  marioBrown: '#ac7c00',
  marioOveralls: '#6b88ff',
  goomba: '#c84c0c',
  goombaDark: '#a0380c',
  koopa: '#00a800',
  koopaDark: '#005800',
  coin: '#f8d830',
  mushroom: '#e44030',
  mushroomSpots: '#fcfcfc',
  white: '#fcfcfc',
  black: '#000000',
  flagPole: '#aaaaaa',
  bush: '#00a800',
  bushLight: '#80d010',
  cloud: '#fcfcfc',
  cloudShade: '#d0e8fc',
  hillGreen: '#00a800',
  hillLight: '#80d010',
  castle: '#999999',
  castleDark: '#666666',
  castleLight: '#bbbbbb',
  text: '#fcfcfc',
  hardBlock: '#68889c',
  hardBlockLight: '#9cbbd0',
  hardBlockDark: '#405868',
};

// ================================================================
// SPRITE DRAWING
// ================================================================
const _spriteCache = new Map();

function drawPixels(cx, x, y, pixels, palette, flipped, scale) {
  const s = scale || 1;
  const cacheKey = s > 1 ? (flipped ? 3 : 2) : (flipped ? 1 : 0);
  let palMap = _spriteCache.get(pixels);
  if (!palMap) {
    palMap = new Map();
    _spriteCache.set(pixels, palMap);
  }
  let byFlip = palMap.get(palette);
  if (!byFlip) {
    byFlip = [null, null, null, null];
    palMap.set(palette, byFlip);
  }
  if (!byFlip[cacheKey]) {
    const w = pixels[0].length;
    const h = pixels.length;
    const sc = document.createElement('canvas');
    sc.width = w * s;
    sc.height = h * s;
    const sctx = sc.getContext('2d');
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const p = pixels[row][col];
        if (p === 0) continue;
        const color = palette[p];
        if (!color) continue;
        sctx.fillStyle = color;
        const dx = flipped ? (w - 1 - col) * s : col * s;
        sctx.fillRect(dx, row * s, s, s);
      }
    }
    byFlip[cacheKey] = sc;
  }
  cx.drawImage(byFlip[cacheKey], x | 0, y | 0);
}

// Small Mario sprites (16x16)
const MARIO_STAND = [
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,3,3,3,2,2,3,2,0,0,0,0,0],
  [0,0,0,3,2,3,2,2,2,3,2,2,2,0,0,0],
  [0,0,0,3,2,3,3,2,2,2,3,2,2,2,0,0],
  [0,0,0,3,3,2,2,2,2,3,3,3,3,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,1,1,4,1,1,1,0,0,0,0,0,0],
  [0,0,0,1,1,1,4,1,1,4,1,1,1,0,0,0],
  [0,0,1,1,1,1,4,4,4,4,1,1,1,1,0,0],
  [0,0,2,2,1,4,2,4,4,2,4,1,2,2,0,0],
  [0,0,2,2,2,4,4,4,4,4,4,2,2,2,0,0],
  [0,0,2,2,4,4,4,4,4,4,4,4,2,2,0,0],
  [0,0,0,0,4,4,4,0,0,4,4,4,0,0,0,0],
  [0,0,0,3,3,3,0,0,0,0,3,3,3,0,0,0],
  [0,0,3,3,3,3,0,0,0,0,3,3,3,3,0,0],
];

const MARIO_RUN1 = [
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,3,3,3,2,2,3,2,0,0,0,0,0],
  [0,0,0,3,2,3,2,2,2,3,2,2,2,0,0,0],
  [0,0,0,3,2,3,3,2,2,2,3,2,2,2,0,0],
  [0,0,0,3,3,2,2,2,2,3,3,3,3,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,1,1,4,1,1,4,0,0,0,0,0,0],
  [0,0,0,1,1,1,1,4,4,1,0,0,0,0,0,0],
  [0,0,0,1,1,1,4,4,2,4,2,0,0,0,0,0],
  [0,0,0,0,0,0,4,4,4,4,2,0,0,0,0,0],
  [0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,3,3,3,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,3,3,3,3,0,0,0,0,0,0,0,0,0,0],
];

const MARIO_RUN2 = [
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,3,3,3,2,2,3,2,0,0,0,0,0],
  [0,0,0,3,2,3,2,2,2,3,2,2,2,0,0,0],
  [0,0,0,3,2,3,3,2,2,2,3,2,2,2,0,0],
  [0,0,0,3,3,2,2,2,2,3,3,3,3,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,1,1,1,4,1,1,0,0,0,0,0,0,0],
  [0,2,1,1,1,1,4,4,1,1,1,2,0,0,0,0],
  [0,2,2,1,1,4,4,4,4,1,1,2,0,0,0,0],
  [0,0,2,4,4,4,4,4,4,4,2,0,0,0,0,0],
  [0,0,0,4,4,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,4,4,0,4,4,0,0,0,0,0,0,0],
  [0,0,0,3,3,0,0,0,3,3,0,0,0,0,0,0],
  [0,0,3,3,3,0,0,0,3,3,3,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const MARIO_JUMP = [
  [0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,0,0,3,3,3,2,2,3,2,0,0,0,0],
  [0,0,0,0,3,2,3,2,2,2,3,2,2,2,0,0],
  [0,0,0,0,3,2,3,3,2,2,2,3,2,2,2,0],
  [0,0,0,0,3,3,2,2,2,2,3,3,3,3,0,0],
  [0,0,0,0,0,0,2,2,2,2,2,2,2,0,0,0],
  [0,0,0,0,1,1,1,4,1,1,4,0,0,0,0,0],
  [0,0,2,1,1,1,1,4,4,4,1,0,2,0,0,0],
  [0,2,2,1,1,1,4,4,4,1,0,0,2,2,0,0],
  [0,2,0,4,4,4,4,4,4,4,2,2,2,0,0,0],
  [0,0,0,4,4,4,4,4,4,4,4,4,0,0,0,0],
  [0,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0],
  [0,0,0,0,0,0,0,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const MARIO_DEAD = [
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,3,3,3,2,2,3,2,0,0,0,0,0],
  [0,0,0,3,2,3,2,2,2,3,2,2,2,0,0,0],
  [0,0,0,3,2,3,3,2,2,2,3,2,2,2,0,0],
  [0,0,0,3,3,2,2,2,2,3,3,3,3,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,2,0,1,1,4,1,1,1,0,0,2,0,0,0],
  [0,2,0,1,1,1,4,1,1,4,1,1,0,2,0,0],
  [2,0,1,1,1,1,4,4,4,4,1,1,1,0,2,0],
  [0,0,2,2,4,4,2,4,4,2,4,2,2,0,0,0],
  [0,0,0,2,4,4,4,4,4,4,4,2,0,0,0,0],
  [0,0,0,4,4,4,4,4,4,4,4,4,0,0,0,0],
  [0,0,3,3,3,0,0,0,0,0,3,3,3,0,0,0],
  [0,3,3,3,0,0,0,0,0,0,0,3,3,3,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const MARIO_SKID = [
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,3,3,3,2,2,3,2,0,0,0,0,0],
  [0,0,0,3,2,3,2,2,2,3,2,2,2,0,0,0],
  [0,0,0,3,2,3,3,2,2,2,3,2,2,2,0,0],
  [0,0,0,3,3,2,2,2,2,3,3,3,3,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,0,1,4,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,1,4,1,4,1,1,0,0,0,0,0],
  [0,0,0,1,1,1,4,4,4,4,1,1,0,0,0,0],
  [0,0,0,2,4,4,2,4,4,2,4,2,0,0,0,0],
  [0,0,0,2,4,4,4,4,4,4,2,0,0,0,0,0],
  [0,0,0,0,4,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,4,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0],
  [0,0,0,0,0,0,3,3,3,3,0,0,0,0,0,0],
];

const BIG_MARIO_STAND = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,3,3,3,2,2,3,2,0,0,0,0,0],
  [0,0,0,3,2,3,2,2,2,3,2,2,2,0,0,0],
  [0,0,0,3,2,3,3,2,2,2,3,2,2,2,0,0],
  [0,0,0,3,3,2,2,2,2,3,3,3,3,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,1,1,4,1,1,4,0,0,0,0,0,0],
  [0,0,0,1,1,1,4,4,1,1,1,0,0,0,0,0],
  [0,0,1,1,1,1,4,4,4,1,1,1,0,0,0,0],
  [0,2,2,1,1,4,2,4,2,4,1,2,2,0,0,0],
  [0,2,2,2,4,4,4,4,4,4,2,2,2,0,0,0],
  [0,2,2,4,4,4,4,4,4,4,4,2,2,0,0,0],
  [0,0,0,4,4,4,0,0,4,4,4,0,0,0,0,0],
  [0,0,0,4,4,0,0,0,0,4,4,0,0,0,0,0],
  [0,0,0,4,4,0,0,0,0,4,4,0,0,0,0,0],
  [0,0,3,3,3,3,0,0,3,3,3,3,0,0,0,0],
  [0,0,3,3,3,3,0,0,3,3,3,3,0,0,0,0],
];

const BIG_MARIO_RUN1 = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,3,3,3,2,2,3,2,0,0,0,0,0],
  [0,0,0,3,2,3,2,2,2,3,2,2,2,0,0,0],
  [0,0,0,3,2,3,3,2,2,2,3,2,2,2,0,0],
  [0,0,0,3,3,2,2,2,2,3,3,3,3,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,1,1,4,1,1,4,0,0,0,0,0,0],
  [0,0,0,1,1,1,4,4,1,1,0,0,0,0,0,0],
  [0,0,1,1,1,4,4,4,4,1,0,0,0,0,0,0],
  [0,2,2,1,4,4,4,4,4,4,2,0,0,0,0,0],
  [0,2,2,4,4,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,4,4,4,4,4,4,0,0,0,0,0,0,0],
  [0,0,0,0,4,4,0,4,4,0,0,0,0,0,0,0],
  [0,0,0,4,4,0,0,0,4,4,0,0,0,0,0,0],
  [0,0,3,3,3,0,0,0,0,4,0,0,0,0,0,0],
  [0,0,3,3,3,3,0,0,3,3,3,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,3,3,3,3,0,0,0,0],
];

const BIG_MARIO_RUN2 = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,3,3,3,2,2,3,2,0,0,0,0,0],
  [0,0,0,3,2,3,2,2,2,3,2,2,2,0,0,0],
  [0,0,0,3,2,3,3,2,2,2,3,2,2,2,0,0],
  [0,0,0,3,3,2,2,2,2,3,3,3,3,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,1,1,4,1,1,4,0,0,0,0,0,0],
  [0,0,2,1,1,1,4,4,1,1,1,2,0,0,0,0],
  [0,2,2,1,1,4,4,4,4,1,1,2,2,0,0,0],
  [0,0,2,4,4,4,4,4,4,4,4,2,0,0,0,0],
  [0,0,0,4,4,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,4,4,0,4,4,0,0,0,0,0,0,0],
  [0,0,0,4,4,0,0,0,4,4,0,0,0,0,0,0],
  [0,0,3,3,3,0,0,0,3,3,3,0,0,0,0,0],
  [0,3,3,3,3,0,0,3,3,3,3,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const BIG_MARIO_JUMP = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,0,0,3,3,3,2,2,3,2,0,0,0,0],
  [0,0,0,0,3,2,3,2,2,2,3,2,2,2,0,0],
  [0,0,0,0,3,2,3,3,2,2,2,3,2,2,2,0],
  [0,0,0,0,3,3,2,2,2,2,3,3,3,3,0,0],
  [0,0,0,0,0,0,2,2,2,2,2,2,2,0,0,0],
  [0,0,2,0,1,1,1,4,1,1,4,0,0,0,0,0],
  [0,2,2,1,1,1,1,4,4,4,1,0,2,0,0,0],
  [0,2,2,1,1,1,4,4,4,1,1,0,2,2,0,0],
  [0,0,0,4,4,4,4,4,4,4,2,2,0,0,0,0],
  [0,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0],
  [0,0,0,0,4,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,4,4,4,0,0,0,0,0,0,0,0,0,0],
  [0,0,3,3,3,3,0,0,0,4,4,0,0,0,0,0],
  [0,3,3,3,3,0,0,0,0,4,4,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,3,3,3,3,0,0,0,0],
  [0,0,0,0,0,0,0,3,3,3,3,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const BIG_MARIO_CROUCH = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,3,3,3,2,2,3,2,0,0,0,0,0],
  [0,0,0,3,2,3,2,2,2,3,2,2,2,0,0,0],
  [0,0,0,3,2,3,3,2,2,2,3,2,2,2,0,0],
  [0,0,0,3,3,2,2,2,2,3,3,3,3,0,0,0],
  [0,0,0,0,0,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,1,1,1,4,1,1,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,4,4,1,1,1,0,0,0,0,0],
  [0,2,2,1,1,4,4,4,4,1,1,2,2,0,0,0],
  [0,2,2,4,4,4,4,4,4,4,4,2,2,0,0,0],
  [0,0,3,3,3,3,3,3,3,3,3,3,0,0,0,0],
];

const MARIO_PALETTE = { 1: COL.mario, 2: COL.marioSkin, 3: COL.marioBrown, 4: COL.marioOveralls };
const FIRE_MARIO_PALETTE = { 1: '#fcfcfc', 2: COL.marioSkin, 3: COL.mario, 4: '#e44030' };

const BUZZY_SPRITE = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,2,1,1,1,1,2,1,1,0,0,0],
  [0,0,1,1,2,2,1,1,1,2,2,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,3,1,1,1,3,0,0,0,0,0,0],
  [0,0,0,0,3,3,3,1,3,3,3,0,0,0,0,0],
  [0,0,0,3,3,3,3,1,3,3,3,3,0,0,0,0],
  [0,0,0,3,3,0,3,3,3,0,3,3,0,0,0,0],
  [0,0,0,0,0,0,3,0,3,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,3,0,3,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const BUZZY_FLAT = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [1,1,2,2,1,1,1,1,1,2,2,1,1,1,1,0],
  [1,2,2,3,2,1,1,1,2,3,2,1,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const BUZZY_PALETTE = { 1: '#2038ec', 2: COL.white, 3: COL.black };

const PIRANHA_SPRITE1 = [
  [0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,1,1,2,2,1,1,1,1,2,2,1,1,0,0,0],
  [0,1,2,2,2,1,1,1,1,2,2,2,1,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,3,5,3,3,5,0,0,0,0,0,0],
  [0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0],
  [0,0,0,0,3,5,3,3,3,5,3,0,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,0,0,0,0,0],
  [0,0,0,0,0,3,5,3,3,5,0,0,0,0,0,0],
  [0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0],
  [0,0,0,0,3,5,3,3,3,5,3,0,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,0,0,0,0,0],
];
const PIRANHA_SPRITE2 = [
  [0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,1,1,2,2,1,1,1,1,2,2,1,1,0,0,0],
  [0,1,2,2,2,1,1,1,1,2,2,2,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,3,5,3,3,5,0,0,0,0,0,0],
  [0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0],
  [0,0,0,0,3,5,3,3,3,5,3,0,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,0,0,0,0,0],
  [0,0,0,0,0,3,5,3,3,5,0,0,0,0,0,0],
  [0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0],
  [0,0,0,0,3,5,3,3,3,5,3,0,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,0,0,0,0,0],
];
const PIRANHA_PALETTE = { 1: '#e44030', 2: COL.white, 3: '#00a800', 5: '#005800' };

const PIXEL_FONT = {
  'A':[0x0E,0x11,0x11,0x1F,0x11,0x11,0x11],'B':[0x1E,0x11,0x11,0x1E,0x11,0x11,0x1E],
  'C':[0x0E,0x11,0x10,0x10,0x10,0x11,0x0E],'D':[0x1C,0x12,0x11,0x11,0x11,0x12,0x1C],
  'E':[0x1F,0x10,0x10,0x1E,0x10,0x10,0x1F],'F':[0x1F,0x10,0x10,0x1E,0x10,0x10,0x10],
  'G':[0x0E,0x11,0x10,0x17,0x11,0x11,0x0F],'H':[0x11,0x11,0x11,0x1F,0x11,0x11,0x11],
  'I':[0x0E,0x04,0x04,0x04,0x04,0x04,0x0E],'J':[0x07,0x02,0x02,0x02,0x02,0x12,0x0C],
  'K':[0x11,0x12,0x14,0x18,0x14,0x12,0x11],'L':[0x10,0x10,0x10,0x10,0x10,0x10,0x1F],
  'M':[0x11,0x1B,0x15,0x15,0x11,0x11,0x11],'N':[0x11,0x19,0x15,0x13,0x11,0x11,0x11],
  'O':[0x0E,0x11,0x11,0x11,0x11,0x11,0x0E],'P':[0x1E,0x11,0x11,0x1E,0x10,0x10,0x10],
  'Q':[0x0E,0x11,0x11,0x11,0x15,0x12,0x0D],'R':[0x1E,0x11,0x11,0x1E,0x14,0x12,0x11],
  'S':[0x0E,0x11,0x10,0x0E,0x01,0x11,0x0E],'T':[0x1F,0x04,0x04,0x04,0x04,0x04,0x04],
  'U':[0x11,0x11,0x11,0x11,0x11,0x11,0x0E],'V':[0x11,0x11,0x11,0x11,0x11,0x0A,0x04],
  'W':[0x11,0x11,0x11,0x15,0x15,0x1B,0x11],'X':[0x11,0x11,0x0A,0x04,0x0A,0x11,0x11],
  'Y':[0x11,0x11,0x0A,0x04,0x04,0x04,0x04],'Z':[0x1F,0x01,0x02,0x04,0x08,0x10,0x1F],
  '0':[0x0E,0x11,0x13,0x15,0x19,0x11,0x0E],'1':[0x04,0x0C,0x04,0x04,0x04,0x04,0x0E],
  '2':[0x0E,0x11,0x01,0x06,0x08,0x10,0x1F],'3':[0x0E,0x11,0x01,0x06,0x01,0x11,0x0E],
  '4':[0x02,0x06,0x0A,0x12,0x1F,0x02,0x02],'5':[0x1F,0x10,0x1E,0x01,0x01,0x11,0x0E],
  '6':[0x06,0x08,0x10,0x1E,0x11,0x11,0x0E],'7':[0x1F,0x01,0x02,0x04,0x08,0x08,0x08],
  '8':[0x0E,0x11,0x11,0x0E,0x11,0x11,0x0E],'9':[0x0E,0x11,0x11,0x0F,0x01,0x02,0x0C],
  ':':[0x00,0x00,0x04,0x00,0x00,0x04,0x00],'-':[0x00,0x00,0x00,0x0E,0x00,0x00,0x00],
  '!':[0x04,0x04,0x04,0x04,0x04,0x00,0x04],' ':[0x00,0x00,0x00,0x00,0x00,0x00,0x00],
  'x':[0x00,0x00,0x11,0x0A,0x04,0x0A,0x11],'.':[0x00,0x00,0x00,0x00,0x00,0x00,0x04],
  '=':[0x00,0x00,0x1F,0x00,0x1F,0x00,0x00],'+':[0x00,0x04,0x04,0x1F,0x04,0x04,0x00],
};

function drawPixelText(ctx, text, x, y, color, shadowColor) {
  const str = String(text).toUpperCase();
  for (let i = 0; i < str.length; i++) {
    const glyph = PIXEL_FONT[str[i]];
    if (!glyph) { x += 6; continue; }
    const cx = x + i * 6;
    for (let row = 0; row < 7; row++) {
      const bits = glyph[row];
      for (let col = 0; col < 5; col++) {
        if (bits & (0x10 >> col)) {
          if (shadowColor) {
            ctx.fillStyle = shadowColor;
            ctx.fillRect(cx + col + 1, y + row + 1, 1, 1);
          }
          ctx.fillStyle = color;
          ctx.fillRect(cx + col, y + row, 1, 1);
        }
      }
    }
  }
}

const GOOMBA_SPRITE = [
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,2,2,1,1,1,2,2,1,1,0,0,0],
  [0,1,1,2,2,3,2,1,2,2,3,2,1,1,0,0],
  [0,1,1,2,2,3,2,1,2,2,3,2,1,1,0,0],
  [0,1,1,1,2,2,1,1,1,2,2,1,1,1,0,0],
  [0,0,1,1,1,1,2,2,2,1,1,1,1,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,3,1,1,1,1,1,3,0,0,0,0,0],
  [0,0,0,3,3,3,1,1,1,3,3,3,0,0,0,0],
  [0,0,3,3,3,3,1,1,1,3,3,3,3,0,0,0],
  [0,0,3,3,0,3,3,3,3,3,0,3,3,0,0,0],
  [0,0,0,0,0,3,3,0,3,3,0,0,0,0,0,0],
  [0,0,0,0,0,3,3,0,3,3,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const GOOMBA_FLAT = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [1,1,2,2,1,1,1,1,1,2,2,1,1,1,1,0],
  [1,2,2,3,2,1,1,1,2,3,2,1,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const GOOMBA_PALETTE = { 1: COL.goomba, 2: COL.white, 3: COL.black };

const KOOPA_SPRITE = [
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,2,2,1,2,1,0,0,0,0,0,0],
  [0,0,0,0,1,2,3,2,2,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0],
  [0,0,0,0,4,1,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,4,4,4,1,1,1,4,0,0,0,0,0,0],
  [0,0,4,4,4,4,1,1,4,4,4,0,0,0,0,0],
  [0,0,4,5,4,4,1,4,4,5,4,0,0,0,0,0],
  [0,0,4,5,5,4,4,4,5,5,4,0,0,0,0,0],
  [0,0,0,4,5,5,4,5,5,4,0,0,0,0,0,0],
  [0,0,0,0,4,4,4,4,4,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0],
  [0,0,0,0,6,6,0,6,6,0,0,0,0,0,0,0],
  [0,0,0,6,6,6,0,6,6,6,0,0,0,0,0,0],
];
const KOOPA_SHELL = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,4,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,4,4,5,4,4,5,4,4,0,0,0,0,0],
  [0,0,4,4,5,5,4,4,5,5,4,4,0,0,0,0],
  [0,0,4,4,5,5,4,4,5,5,4,4,0,0,0,0],
  [0,0,0,4,4,5,4,4,5,4,4,0,0,0,0,0],
  [0,0,0,0,4,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,6,6,6,6,6,6,6,6,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const KOOPA_PALETTE = { 1: COL.koopa, 2: COL.white, 3: COL.black, 4: COL.koopa, 5: COL.koopaDark, 6: '#fcbcb0' };

// Bowser boss sprite (32x32)
const BOWSER_SPRITE = [
  [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,1,2,2,1,0,1,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,2,2,2,2,1,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,2,2,2,2,2,2,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,1,1,2,2,2,2,2,2,2,2,2,2,1,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,3,3,1,1,1,1,1,1,1,1,1,1,3,3,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,3,4,4,3,3,3,3,3,3,3,3,3,3,4,4,3,1,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,3,4,4,5,5,3,3,3,3,3,3,3,3,5,5,4,4,3,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,3,4,5,6,6,5,5,3,3,3,3,5,5,6,6,5,4,3,1,0,0,0,0,0,0,0],
  [0,0,0,0,1,3,3,4,5,5,5,5,3,3,3,3,3,3,5,5,5,5,4,3,3,1,0,0,0,0,0,0],
  [0,0,0,0,1,3,3,3,4,4,4,3,3,3,3,3,3,3,3,4,4,4,3,3,3,1,0,0,0,0,0,0],
  [0,0,0,1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,1,3,3,3,3,3,3,3,7,7,7,7,7,7,7,7,3,3,3,3,3,3,3,1,0,0,0,0,0],
  [0,0,1,3,3,3,3,3,3,3,7,7,8,7,8,7,8,7,8,7,3,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,1,3,3,3,3,3,3,7,7,8,8,7,8,7,8,8,7,7,3,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,1,3,3,3,3,3,3,7,8,8,7,7,8,7,7,8,8,7,3,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,1,3,3,3,3,3,3,7,7,7,7,7,7,7,7,7,7,7,3,3,3,3,3,3,3,1,0,0,0,0],
  [0,0,0,1,3,3,3,3,3,3,7,7,7,7,7,7,7,7,7,3,3,3,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0],
  [0,0,0,0,1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,3,3,1,3,3,3,3,3,3,3,3,3,3,3,3,1,3,3,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,9,1,3,3,3,3,3,3,3,3,3,3,1,9,1,1,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,9,9,1,3,3,3,3,3,3,3,3,1,9,9,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,9,9,1,3,3,3,3,3,3,3,3,1,9,9,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,1,9,9,1,3,3,3,3,3,3,1,9,9,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,1,9,9,1,3,3,3,3,3,3,1,9,9,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,9,1,1,1,3,3,1,1,1,9,1,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,9,9,1,3,3,1,9,9,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,1,9,9,1,3,3,1,9,9,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1,1,9,1,0,1,1,0,1,9,1,1,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,1,9,9,1,0,0,0,0,0,0,1,9,9,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0],
];
const BOWSER_PALETTE = {
  1: '#d03000', 2: '#ff6020', 3: '#00a800', 4: '#80d010',
  5: '#fcfcfc', 6: '#000000', 7: '#e8c830', 8: '#a07000',
  9: '#e8c830',
};

// Boss fireball sprite (8x8)
const FIREBALL_SPRITE = [
  [0,0,1,1,1,1,0,0],
  [0,1,2,2,2,2,1,0],
  [1,2,3,3,2,2,2,1],
  [1,2,3,2,2,2,2,1],
  [1,2,2,2,2,3,2,1],
  [1,2,2,2,3,3,2,1],
  [0,1,2,2,2,2,1,0],
  [0,0,1,1,1,1,0,0],
];
const FIREBALL_PALETTE = { 1: '#ff4000', 2: '#ff8000', 3: '#ffe000' };

// ================================================================
// SOUND EFFECTS (Web Audio - NES style)
// ================================================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function ensureAudio() { if (!audioCtx) audioCtx = new AudioCtx(); }

function playSound(type) {
  try {
    ensureAudio();
    const c = audioCtx;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    gain.gain.setValueAtTime(0.07, c.currentTime);

    switch(type) {
      case 'jump':
        osc.type = 'square';
        osc.frequency.setValueAtTime(380, c.currentTime);
        osc.frequency.linearRampToValueAtTime(760, c.currentTime + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.18);
        break;
      case 'coin':
        osc.type = 'square';
        osc.frequency.setValueAtTime(988, c.currentTime);
        osc.frequency.setValueAtTime(1319, c.currentTime + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.18);
        break;
      case 'stomp':
        osc.type = 'square';
        osc.frequency.setValueAtTime(550, c.currentTime);
        osc.frequency.linearRampToValueAtTime(180, c.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.12);
        break;
      case 'powerup':
        osc.type = 'square';
        osc.frequency.setValueAtTime(523, c.currentTime);
        osc.frequency.setValueAtTime(659, c.currentTime + 0.07);
        osc.frequency.setValueAtTime(784, c.currentTime + 0.14);
        osc.frequency.setValueAtTime(1047, c.currentTime + 0.21);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.35);
        break;
      case 'shrink':
        osc.type = 'square';
        osc.frequency.setValueAtTime(784, c.currentTime);
        osc.frequency.setValueAtTime(523, c.currentTime + 0.08);
        osc.frequency.setValueAtTime(330, c.currentTime + 0.16);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.3);
        break;
      case 'die':
        osc.type = 'square';
        osc.frequency.setValueAtTime(580, c.currentTime);
        osc.frequency.linearRampToValueAtTime(90, c.currentTime + 0.55);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.6);
        break;
      case 'bump':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, c.currentTime);
        osc.frequency.linearRampToValueAtTime(90, c.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07);
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.07);
        break;
      case 'brick':
        osc.type = 'square';
        osc.frequency.setValueAtTime(190, c.currentTime);
        osc.frequency.linearRampToValueAtTime(70, c.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.1);
        break;
      case 'flagpole':
        osc.type = 'square';
        gain.gain.setValueAtTime(0.05, c.currentTime);
        for (let i = 0; i < 8; i++) osc.frequency.setValueAtTime(380 + i * 75, c.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.7);
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.7);
        break;
      case 'warning':
        osc.type = 'square';
        gain.gain.setValueAtTime(0.04, c.currentTime);
        osc.frequency.setValueAtTime(440, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.15);
        break;
      case 'bosshit':
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.08, c.currentTime);
        osc.frequency.setValueAtTime(200, c.currentTime);
        osc.frequency.linearRampToValueAtTime(80, c.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.25);
        break;
      case 'bossdie':
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.08, c.currentTime);
        osc.frequency.setValueAtTime(300, c.currentTime);
        osc.frequency.linearRampToValueAtTime(40, c.currentTime + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.0);
        osc.start(c.currentTime); osc.stop(c.currentTime + 1.0);
        break;
      case 'fireball':
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.05, c.currentTime);
        osc.frequency.setValueAtTime(600, c.currentTime);
        osc.frequency.linearRampToValueAtTime(200, c.currentTime + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.15);
        break;
    }
  } catch(e) {}
}

function startStarMusic() {
  stopStarMusic();
  const notes = [
    523, 587, 659, 698, 784, 698, 784, 880,
    784, 698, 659, 587, 523, 587, 659, 698,
  ];
  let idx = 0;
  function playNote() {
    if (!audioCtx || mario.starPower <= 0) { stopStarMusic(); return; }
    try {
      const c = audioCtx;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain); gain.connect(c.destination);
      osc.type = 'square';
      gain.gain.setValueAtTime(0.04, c.currentTime);
      osc.frequency.setValueAtTime(notes[idx % notes.length], c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
      osc.start(c.currentTime); osc.stop(c.currentTime + 0.12);
      idx++;
    } catch(e) {}
  }
  playNote();
  starMusicInterval = setInterval(playNote, 120);
}

function stopStarMusic() {
  if (starMusicInterval) { clearInterval(starMusicInterval); starMusicInterval = null; }
}

// ================================================================
// LEVEL BUILDER
// ================================================================
const LEVEL_WIDTH = 395;
const LEVEL_HEIGHT = 15;

function buildLevel() {
  const map = [];
  for (let y = 0; y < LEVEL_HEIGHT; y++) map[y] = new Array(LEVEL_WIDTH).fill(0);

  function ground(x1, x2) {
    for (let x = x1; x <= x2; x++) { map[13][x] = 1; map[14][x] = 1; }
  }
  function addPipe(x, height) {
    const topRow = 13 - height;
    map[topRow][x] = 12;
    map[topRow][x + 1] = 13;
    for (let r = topRow + 1; r <= 12; r++) { map[r][x] = 10; map[r][x + 1] = 11; }
  }
  function stairUp(startX, steps) {
    for (let s = 0; s < steps; s++) {
      for (let y = 12 - s; y <= 12; y++) map[y][startX + s] = 5;
    }
  }
  function stairDown(startX, steps) {
    for (let s = 0; s < steps; s++) {
      for (let y = 12 - (steps - 1 - s); y <= 12; y++) map[y][startX + s] = 5;
    }
  }

  // === SECTION 1: GREEN FIELDS (0-55) ===
  ground(0, 55);

  map[9][16] = 3;
  map[9][22] = 2;
  map[9][23] = 4;
  map[9][24] = 2;
  map[9][25] = 3;
  map[9][26] = 2;
  map[5][22] = 3;

  // === SECTION 2: PIPE VALLEY (55-100) ===
  ground(56, 100);
  addPipe(58, 2);
  addPipe(68, 3);
  addPipe(78, 3);
  addPipe(88, 4);
  map[9][62] = 3;
  map[9][73] = 3;
  map[9][83] = 3;
  map[9][84] = 4;

  // === SECTION 3: BLOCK PLAYGROUND (100-155) ===
  ground(101, 130);
  ground(134, 155);
  // gap at 131-133
  map[9][105] = 2;
  map[9][106] = 3;
  map[9][107] = 2;
  map[9][108] = 3;
  map[9][109] = 2;
  map[5][107] = 4;
  map[9][115] = 2;
  map[9][116] = 2;
  map[9][117] = 3;
  map[9][118] = 2;
  map[5][116] = 2;
  map[5][117] = 2;
  map[5][118] = 2;
  map[9][124] = 3;
  map[9][125] = 2;
  map[9][126] = 3;
  map[9][127] = 2;
  map[5][125] = 3;

  // === SECTION 4: ELEVATED CHALLENGE (155-210) ===
  ground(156, 164);
  ground(180, 210);
  // Big gap 165-179 with brick bridge at row 9
  for (let x = 165; x <= 179; x++) map[9][x] = 2;
  map[9][170] = 3;
  map[9][175] = 4;
  map[9][185] = 3;
  map[9][190] = 2;
  map[9][191] = 3;
  map[9][192] = 2;
  map[5][190] = 2;
  map[5][191] = 2;
  addPipe(200, 2);
  addPipe(207, 3);

  // === SECTION 5: ENEMY GAUNTLET (210-260) ===
  ground(211, 255);
  ground(259, 260);
  // gap at 256-258
  map[9][215] = 2;
  map[9][216] = 3;
  map[9][217] = 2;
  map[9][218] = 2;
  map[9][225] = 3;
  map[9][226] = 3;
  map[9][230] = 2;
  map[9][231] = 2;
  map[9][232] = 3;
  map[9][233] = 2;
  map[5][231] = 4;
  map[9][240] = 2;
  map[9][241] = 3;
  map[9][242] = 2;
  map[9][248] = 3;
  map[9][249] = 3;
  addPipe(245, 2);

  // === SECTION 6: SKY WALK (260-305) ===
  ground(261, 262);
  // floating platforms over gap
  for (let x = 265; x <= 270; x++) map[10][x] = 5;
  for (let x = 274; x <= 279; x++) map[10][x] = 5;
  for (let x = 283; x <= 288; x++) map[10][x] = 5;
  for (let x = 292; x <= 297; x++) map[10][x] = 5;
  // coins above platforms as guides
  map[7][267] = 3;
  map[7][276] = 3;
  map[7][285] = 3;
  map[7][294] = 4;
  ground(300, 305);

  // === SECTION 7: SPRINT & PIPES (305-335) ===
  ground(306, 335);
  addPipe(310, 2);
  addPipe(320, 3);
  map[9][313] = 3;
  map[9][314] = 2;
  map[9][315] = 3;
  map[9][325] = 2;
  map[9][326] = 3;
  map[9][327] = 2;
  map[5][326] = 2;

  // === SECTION 8: GRAND FINALE (335-394) ===
  ground(336, 394);
  stairUp(338, 4);
  stairDown(343, 4);

  // Boss arena: flat ground 347-358, gate at 359
  for (let y = 6; y <= 12; y++) map[y][359] = 5;  // gate wall

  // Victory staircase after boss (classic Mario ending)
  stairUp(367, 8);

  // === ADDITIONAL FEATURES FOR DIVERSITY ===

  // Section 1: Extra blocks and small staircase
  map[9][30] = 2; map[9][31] = 3; map[9][32] = 2; map[9][33] = 2;
  map[9][40] = 3;
  map[9][45] = 2; map[9][46] = 3; map[9][47] = 2; map[9][48] = 2;
  map[5][46] = 3;
  stairUp(50, 3);

  // Section 2: Coin guides above pipes + blocks between pipes
  map[7][59] = 3; map[7][69] = 3; map[7][79] = 3; map[7][89] = 3;
  map[9][64] = 2; map[9][65] = 3; map[9][66] = 2;
  map[9][94] = 2; map[9][95] = 3; map[9][96] = 2;

  // Section 3: Elevated block formations
  map[7][112] = 2; map[7][113] = 3; map[7][114] = 2;
  map[9][138] = 2; map[9][139] = 3; map[9][140] = 2; map[9][141] = 2;
  map[7][140] = 2; map[7][141] = 3;
  map[9][150] = 3; map[9][151] = 2; map[9][152] = 3;

  // Section 4: Bridge gap + extra blocks
  map[9][171] = 0; map[9][172] = 0;
  map[7][183] = 3; map[7][184] = 2;
  map[9][195] = 2; map[9][196] = 3; map[9][197] = 2;

  // Section 5: Elevated coin platforms
  map[7][220] = 3; map[7][221] = 2; map[7][222] = 3;
  map[9][236] = 3; map[9][237] = 2;

  // Section 6: Multi-height platforms
  for (let x = 269; x <= 271; x++) map[8][x] = 5;
  for (let x = 280; x <= 282; x++) map[7][x] = 5;

  // Section 7: Extra blocks and pipe
  map[9][308] = 3; map[9][309] = 2;
  map[7][318] = 2; map[7][319] = 3;
  addPipe(330, 2);

  // 1-UP blocks (hidden among regular blocks)
  map[5][107] = 6;
  map[5][319] = 6;

  // Star blocks
  map[7][55] = 7;
  map[7][200] = 7;

  // Section 8: Pre-boss area
  map[9][345] = 3;

  return map;
}

// ================================================================
// PHYSICS CONSTANTS (tuned to feel like NES Mario)
// ================================================================
const GRAVITY_UP_HOLD = 0.22;
const GRAVITY_UP_RELEASE = 0.50;
const GRAVITY_DOWN = 0.55;
const JUMP_VEL = -5.6;
const MAX_FALL = 6.0;
const WALK_ACCEL = 0.08;
const RUN_ACCEL = 0.14;
const MAX_WALK = 1.3;
const MAX_RUN = 2.3;
const FRICTION = 0.22;
const AIR_FRICTION = 0.02;
const SKID_DECEL = 0.22;
const COYOTE_FRAMES = 6;
const JUMP_BUFFER_FRAMES = 6;

const FLAGPOLE_X = 376;
const CASTLE_X = 381;
const CHECKPOINT_XS = [120, 240];

// ================================================================
// GAME STATE
// ================================================================
let levelMap;
let camera = { x: 0, rx: 0, targetX: 0 };
let prevState = { mx: 0, my: 0, cx: 0 };
let renderAlpha = 0;
let gameState = 'menu';
let paused = false;
let globalTick = 0;

const keys = {};
let jumpBufferTimer = 0;
let jumpPressed = false;
let jumpHeld = false;

window.addEventListener('keydown', e => {
  if (e.repeat) return;
  keys[e.code] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();

  if (e.code === 'Space' || e.code === 'ArrowUp') {
    jumpPressed = true;
    jumpHeld = true;
    jumpBufferTimer = JUMP_BUFFER_FRAMES;
  }

  if (e.code === 'KeyX' && gameState === 'playing' && mario.fire && !mario.dead && !paused) {
    if (fireballCooldown <= 0 && marioFireballs.length < 2) {
      marioFireballs.push({
        x: mario.x + (mario.facing === 1 ? mario.w : -8),
        y: mario.y + (mario.big ? 10 : 6),
        vx: mario.facing * 4,
        vy: -1,
        w: 8, h: 8,
        bounces: 0,
        life: 180,
      });
      fireballCooldown = 15;
      playSound('fireball');
    }
  }

  if (e.code === 'Escape') {
    if (gameState === 'playing') {
      if (paused) resumeGame();
      else pauseGame();
    }
  }

  if (e.code === 'Enter' && gameState === 'win' && !multiplayerMode) {
    lives = 3;
    checkpointIndex = -1;
    resetLevel();
    gameState = 'playing';
  }
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    jumpHeld = false;
  }
});

function setupMobileControls() {
  const mapping = { mLeft: 'ArrowLeft', mRight: 'ArrowRight', mA: 'Space', mB: 'KeyZ' };
  Object.entries(mapping).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', e => {
      e.preventDefault();
      keys[key] = true;
      if (key === 'Space') { jumpPressed = true; jumpHeld = true; jumpBufferTimer = JUMP_BUFFER_FRAMES; }
    });
    el.addEventListener('touchend', e => {
      e.preventDefault();
      keys[key] = false;
      if (key === 'Space') jumpHeld = false;
    });
  });
}
setupMobileControls();

// ================================================================
// MARIO & GAME OBJECTS
// ================================================================
let mario = {};
let entities = [];
let particles = [];
let coinAnims = [];
let items = [];
let scorePopups = [];
let score = 0;
let coins = 0;
let lives = 3;
let time = 400;
let timeTimer = 0;
let matchTimeRemaining = 300;
let deathTimer = 0;
let winTimer = 0;
let gameOverTimer = 0;
let flagDescending = false;
let flagY = 0;
let hitBlocks = new Set();
let emptyBlocks = new Set();
let dustParticles = [];
let eliminated = false;
let racePlayers = [];
let checkpointIndex = -1;
let mapCoins = [];
let enemiesKilled = 0;
let flagBonus = 0;
let timeBonus = 0;
let boss = null;
let bossFireballs = [];
let marioFireballs = [];
let fireballCooldown = 0;
let starMusicInterval = null;
const BOSS_ARENA_LEFT = 347;
const BOSS_GATE_X = 359;

function resetMario() {
  const spawnX = checkpointIndex >= 0 ? CHECKPOINT_XS[checkpointIndex] * TILE : 40;
  mario = {
    x: spawnX, y: 12 * TILE,
    vx: 0, vy: 0,
    w: 14, h: 16,
    onGround: true,
    facing: 1,
    frame: 0,
    frameTimer: 0,
    big: false,
    fire: false,
    starPower: 0,
    dead: false,
    invincible: checkpointIndex >= 0 ? 300 : 0,
    coyoteTimer: 0,
    wasOnGround: false,
    skidding: false,
    crouching: false,
  };
}

function resetLevel() {
  levelMap = buildLevel();
  camera.x = checkpointIndex >= 0 ? CHECKPOINT_XS[checkpointIndex] * TILE - VIEW_W / 2 : 0;
  if (camera.x < 0) camera.x = 0;
  camera.rx = camera.x;
  camera.targetX = camera.x;
  prevState.mx = 0;
  prevState.my = 0;
  prevState.cx = 0;
  entities = [];
  particles = [];
  coinAnims = [];
  items = [];
  scorePopups = [];
  dustParticles = [];
  marioFireballs = [];
  fireballCooldown = 0;
  eliminated = false;
  racePlayers = [];
  score = 0;
  coins = 0;
  enemiesKilled = 0;
  flagBonus = 0;
  timeBonus = 0;
  time = 400;
  timeTimer = 0;
  matchTimeRemaining = 300;
  deathTimer = 0;
  winTimer = 0;
  flagDescending = false;
  flagY = 0;
  hitBlocks = new Set();
  emptyBlocks = new Set();
  jumpBufferTimer = 0;
  jumpPressed = false;
  boss = null;
  bossFireballs = [];
  resetMario();
  spawnEnemies();
  spawnMapCoins();
  spawnBoss();
}

function spawnEnemies() {
  const goombaXs = [
    20, 30, 42, 50, 53, 56,
    60, 65, 72, 80, 82, 85, 95,
    108, 112, 114, 120, 122, 135, 140, 150,
    145, 148, 160, 168, 172, 188,
    195, 197, 215, 217, 222, 224, 228, 230, 234, 238, 240, 244, 250, 252,
    268, 277, 286, 295,
    308, 312, 316, 318, 324, 328, 330, 332,
    340, 342, 345,
  ];
  goombaXs.forEach(x => {
    let gy = 12 * TILE;
    if (x >= 265 && x <= 297) gy = 9 * TILE;
    if (x >= 165 && x <= 179) gy = 8 * TILE;
    entities.push(createGoomba(x * TILE, gy));
  });

  [45, 55, 75, 90, 125, 142, 160, 192, 220, 235, 248, 275, 300, 318, 325, 337].forEach(x => {
    entities.push(createKoopa(x * TILE, 12 * TILE));
  });

  [110, 155, 225, 310, 344].forEach(x => {
    entities.push(createBuzzyBeetle(x * TILE, 12 * TILE));
  });

  [[58, 11], [68, 10], [78, 10], [88, 9], [200, 11], [207, 10], [310, 11], [320, 10], [330, 11]].forEach(([px, topRow]) => {
    entities.push(createPiranha(px, topRow));
  });
}

function spawnMapCoins() {
  mapCoins = [];
  const coinPositions = [
    [18, 11], [19, 11], [20, 11],
    [34, 11], [36, 11], [38, 11],
    [62, 7], [63, 7], [64, 7],
    [73, 7], [74, 7],
    [105, 7], [106, 7], [107, 7], [108, 7], [109, 7],
    [135, 11], [136, 11], [137, 11],
    [166, 7], [167, 7], [168, 7], [169, 7],
    [174, 7], [175, 7], [176, 7], [177, 7],
    [185, 7], [186, 7], [187, 7],
    [213, 11], [214, 11],
    [220, 7], [221, 7], [222, 7],
    [230, 7], [231, 7], [232, 7],
    [266, 8], [267, 8], [268, 8],
    [275, 8], [276, 8], [277, 8],
    [284, 8], [285, 8], [286, 8],
    [293, 8], [294, 8], [295, 8],
    [314, 11], [315, 11],
    [326, 7], [327, 7],
    [341, 11], [343, 11], [345, 11],
  ];
  coinPositions.forEach(([tx, ty]) => {
    if (levelMap[ty] && levelMap[ty][tx]) ty--;
    mapCoins.push({ x: tx * TILE + 4, y: ty * TILE, collected: false });
  });
}

function spawnBoss() {
  boss = {
    x: 354 * TILE, y: 10 * TILE,
    vx: -0.5, vy: 0,
    w: 28, h: 32,
    hp: 3, alive: true, dying: false, deathTimer: 0,
    jumpTimer: 0, fireTimer: 0,
    frame: 0, frameTimer: 0,
    invincible: 0,
    arenaLeft: BOSS_ARENA_LEFT * TILE,
    arenaRight: (BOSS_GATE_X - 1) * TILE,
    onGround: false,
  };
}

function createGoomba(x, y) {
  return {
    type: 'goomba', x, y, vx: -0.35, vy: 0,
    w: 16, h: 16, alive: true, flat: false, flatTimer: 0,
    frame: 0, frameTimer: 0,
  };
}

function createKoopa(x, y) {
  return {
    type: 'koopa', x, y: y - 8, vx: -0.4, vy: 0,
    w: 16, h: 24, alive: true, shell: false, shellMoving: false,
    frame: 0, frameTimer: 0,
  };
}

function createBuzzyBeetle(x, y) {
  return {
    type: 'buzzy', x, y, vx: -0.6, vy: 0,
    w: 16, h: 16, alive: true, flat: false, flatTimer: 0,
    frame: 0, frameTimer: 0,
  };
}

function createPiranha(pipeX, pipeTopY) {
  return {
    type: 'piranha', x: pipeX * TILE + 6, y: pipeTopY * TILE,
    vx: 0, vy: 0, w: 18, h: 20,
    alive: true, frame: 0, frameTimer: 0,
    baseY: pipeTopY * TILE, emergeOffset: 0, emergeDir: -1,
    pipeX: pipeX, waitTimer: 0,
  };
}

function addScorePopup(x, y, pts) {
  scorePopups.push({ x, y, text: String(pts), life: 50, vy: -0.8 });
}

const ENEMY_POINTS = { goomba: 100, koopa: 200, buzzy: 300, piranha: 400, boss: 5000 };

// ================================================================
// COLLISION
// ================================================================
function getTile(tx, ty) {
  if (tx < 0 || tx >= LEVEL_WIDTH || ty < 0 || ty >= LEVEL_HEIGHT) return 0;
  return levelMap[ty][tx];
}

function isSolid(tile) {
  return tile >= 1 && tile <= 13;
}

function tileCollision(x, y, w, h) {
  const left = Math.floor(x / TILE);
  const right = Math.floor((x + w - 1) / TILE);
  const top = Math.floor(y / TILE);
  const bottom = Math.floor((y + h - 1) / TILE);

  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (isSolid(getTile(tx, ty))) {
        return { tx, ty, tile: getTile(tx, ty) };
      }
    }
  }
  return null;
}

function hitBlock(tx, ty) {
  const key = `${tx},${ty}`;
  const tile = getTile(tx, ty);

  if (tile === 3 || tile === 4 || tile === 6 || tile === 7) {
    if (emptyBlocks.has(key)) {
      playSound('bump');
      return;
    }
    emptyBlocks.add(key);
    if (tile === 3) {
      score += 200;
      coins++;
      coinAnims.push({ x: tx * TILE + 4, y: ty * TILE - 16, vy: -3.5, life: 35 });
      addScorePopup(tx * TILE, ty * TILE - 16, 200);
      playSound('coin');
    } else if (tile === 6) {
      lives++;
      addScorePopup(tx * TILE, ty * TILE - 16, '1UP');
      playSound('powerup');
    } else if (tile === 7) {
      items.push({
        type: 'star',
        x: tx * TILE, y: ty * TILE - TILE,
        vx: 1.2, vy: -2,
        w: 16, h: 16,
        emerging: true, emergeY: ty * TILE,
        active: true,
      });
    } else {
      items.push({
        type: mario.big ? 'flower' : 'mushroom',
        x: tx * TILE, y: ty * TILE - TILE,
        vx: mario.big ? 0 : 1.0, vy: 0,
        w: 16, h: 16,
        emerging: true, emergeY: ty * TILE,
        active: true,
      });
    }
    hitBlocks.add(key);
    particles.push({ x: tx * TILE, y: ty * TILE, type: 'bump', timer: 8, origY: ty * TILE });
    playSound('bump');
  } else if (tile === 2) {
    if (mario.big) {
      levelMap[ty][tx] = 0;
      playSound('brick');
      for (let i = 0; i < 4; i++) {
        particles.push({
          type: 'debris',
          x: tx * TILE + (i % 2) * 8,
          y: ty * TILE + Math.floor(i / 2) * 8,
          vx: (i % 2 === 0 ? -1.5 : 1.5) + (Math.random() - 0.5),
          vy: -3.5 - Math.random() * 1.5,
          life: 45,
        });
      }
      score += 50;
    } else {
      hitBlocks.add(key);
      particles.push({ x: tx * TILE, y: ty * TILE, type: 'bump', timer: 8, origY: ty * TILE });
      playSound('bump');
    }
  } else if (tile === 5) {
    playSound('bump');
  }
}

// ================================================================
// UPDATE: MARIO
// ================================================================
function updateMario() {
  if (eliminated) return;

  if (mario.dead) {
    deathTimer++;
    if (deathTimer < 18) mario.vy = -4.5;
    mario.vy += GRAVITY_DOWN * 0.6;
    mario.y += mario.vy;
    if (deathTimer > 100) {
      lives--;
      gameOverTimer = 0;
      if (lives <= 0) {
        if (multiplayerMode) {
          eliminated = true;
          writePlayerDied();
          checkpointIndex = -1;
        } else {
          checkpointIndex = -1;
          gameState = 'gameover';
        }
      } else {
        gameState = 'lifeLost';
      }
    }
    return;
  }

  if (flagDescending) {
    winTimer++;
    mario.vy = 1.8;
    mario.y += mario.vy;
    if (mario.y >= 12 * TILE) {
      mario.y = 12 * TILE;
      mario.vx = 1.5;
      mario.x += mario.vx;
      mario.facing = 1;
    }
    if (winTimer > 200) {
      if (!multiplayerMode && timeBonus === 0 && time > 0) {
        timeBonus = time * 50;
        score += timeBonus;
      }
      if (multiplayerMode) {
        writePlayerFinished();
      }
      gameState = 'win';
    }
    if (multiplayerMode) {
      writeProgress();
    }
    return;
  }

  // Crouch (Big Mario only)
  const wantCrouch = keys['ArrowDown'] && mario.big && mario.onGround;
  mario.crouching = wantCrouch;

  // Horizontal input
  const running = keys['KeyZ'] || keys['ShiftLeft'] || keys['ShiftRight'];
  const maxSpeed = running ? MAX_RUN : MAX_WALK;
  const accel = running ? RUN_ACCEL : WALK_ACCEL;

  if (mario.crouching) {
    // Slide with low friction — preserves momentum from running
    const slideFric = 0.06;
    if (mario.vx > 0) mario.vx = Math.max(0, mario.vx - slideFric);
    else if (mario.vx < 0) mario.vx = Math.min(0, mario.vx + slideFric);
    if (Math.abs(mario.vx) < 0.08) mario.vx = 0;
    mario.skidding = false;
  } else {
    const wantRight = keys['ArrowRight'];
    const wantLeft = keys['ArrowLeft'];

    mario.skidding = false;
    if (wantRight) {
      if (mario.vx < 0 && mario.onGround) {
        mario.vx += SKID_DECEL;
        mario.skidding = true;
      } else {
        mario.vx = Math.min(mario.vx + accel, maxSpeed);
      }
      mario.facing = 1;
    } else if (wantLeft) {
      if (mario.vx > 0 && mario.onGround) {
        mario.vx -= SKID_DECEL;
        mario.skidding = true;
      } else {
        mario.vx = Math.max(mario.vx - accel, -maxSpeed);
      }
      mario.facing = -1;
    } else {
      const fric = mario.onGround ? FRICTION : AIR_FRICTION;
      if (mario.vx > 0) mario.vx = Math.max(0, mario.vx - fric);
      else mario.vx = Math.min(0, mario.vx + fric);
      if (Math.abs(mario.vx) < 0.15) mario.vx = 0;
    }

    // Clamp to max speed (handles switching from run to walk)
    if (Math.abs(mario.vx) > maxSpeed && mario.onGround) {
      mario.vx = mario.vx > 0 ? Math.max(maxSpeed, mario.vx - FRICTION) : Math.min(-maxSpeed, mario.vx + FRICTION);
    }
  }

  // Coyote time tracking
  if (mario.onGround) {
    mario.coyoteTimer = COYOTE_FRAMES;
  } else if (mario.coyoteTimer > 0) {
    mario.coyoteTimer--;
  }

  // Jump buffer countdown
  if (jumpBufferTimer > 0) jumpBufferTimer--;

  // Jump
  const canJump = mario.onGround || mario.coyoteTimer > 0;
  const wantJump = jumpPressed || jumpBufferTimer > 0;

  if (wantJump && canJump && mario.vy >= 0) {
    mario.vy = JUMP_VEL;
    mario.onGround = false;
    mario.coyoteTimer = 0;
    jumpBufferTimer = 0;
    playSound('jump');
    dustParticles.push(
      { x: mario.x + 3, y: mario.y + mario.h, vx: -0.3, vy: -0.2, life: 10 },
      { x: mario.x + mario.w - 3, y: mario.y + mario.h, vx: 0.3, vy: -0.2, life: 10 },
    );
  }

  jumpPressed = false;

  // Gravity (dual system)
  if (mario.vy < 0) {
    mario.vy += jumpHeld ? GRAVITY_UP_HOLD : GRAVITY_UP_RELEASE;
  } else {
    mario.vy += GRAVITY_DOWN;
  }
  if (mario.vy > MAX_FALL) mario.vy = MAX_FALL;

  // Horizontal movement + collision
  mario.x += mario.vx;
  if (mario.x < 0) mario.x = 0;
  if (mario.x < camera.x) mario.x = camera.x;
  const mh = mario.big ? 24 : 16;

  let hCol = tileCollision(mario.x + 1, mario.y, mario.w - 2, mh);
  if (hCol) {
    if (mario.vx > 0) mario.x = hCol.tx * TILE - mario.w;
    else if (mario.vx < 0) mario.x = (hCol.tx + 1) * TILE;
    mario.vx = 0;
  }

  // Vertical movement + collision
  mario.wasOnGround = mario.onGround;
  mario.y += mario.vy;
  mario.onGround = false;

  let vCol = tileCollision(mario.x + 2, mario.y, mario.w - 4, mh);
  if (vCol) {
    if (mario.vy > 0) {
      mario.y = vCol.ty * TILE - mh;
      mario.vy = 0;
      mario.onGround = true;
      if (!mario.wasOnGround && Math.abs(mario.vx) > 0.5) {
        dustParticles.push(
          { x: mario.x + mario.w / 2, y: mario.y + mh, vx: -0.4, vy: -0.3, life: 8 },
          { x: mario.x + mario.w / 2, y: mario.y + mh, vx: 0.4, vy: -0.3, life: 8 },
        );
      }
    } else if (mario.vy < 0) {
      mario.y = (vCol.ty + 1) * TILE;
      mario.vy = 0;
      hitBlock(vCol.tx, vCol.ty);
    }
  }

  // Ground snap: prevent onGround flicker from sub-tile gravity
  if (!mario.onGround && mario.vy >= 0 && mario.vy < 2) {
    const feetTileY = Math.floor((mario.y + mh) / TILE);
    const leftTX = Math.floor((mario.x + 2) / TILE);
    const rightTX = Math.floor((mario.x + mario.w - 3) / TILE);
    for (let tx = leftTX; tx <= rightTX; tx++) {
      if (isSolid(getTile(tx, feetTileY))) {
        mario.y = feetTileY * TILE - mh;
        mario.vy = 0;
        mario.onGround = true;
        break;
      }
    }
  }

  // Pit death
  if (mario.y > LEVEL_HEIGHT * TILE) mariodie();

  // Animation (only animate when actually moving)
  if (!mario.onGround) {
    mario.frame = 0;
  } else if (mario.skidding) {
    mario.frame = 0;
  } else if (mario.vx !== 0 && Math.abs(mario.vx) > 0.3) {
    mario.frameTimer++;
    const animSpeed = Math.max(6, 14 - Math.abs(mario.vx) * 3);
    if (mario.frameTimer > animSpeed) {
      mario.frameTimer = 0;
      mario.frame = (mario.frame + 1) % 3;
    }
  } else {
    mario.frame = 0;
    mario.frameTimer = 0;
  }

  // Camera (smooth lerp, float precision kept for tracking)
  camera.targetX = mario.x - VIEW_W / 2 + 16;
  if (camera.targetX < camera.x) camera.targetX = camera.x;
  camera.x += (camera.targetX - camera.x) * 0.12;
  if (Math.abs(camera.targetX - camera.x) < 1.0) camera.x = camera.targetX;
  if (camera.x < 0) camera.x = 0;
  const maxCam = LEVEL_WIDTH * TILE - VIEW_W;
  if (camera.x > maxCam) camera.x = maxCam;

  // Invincibility
  if (mario.invincible > 0) mario.invincible--;
  if (mario.starPower > 0) {
    mario.starPower--;
    if (mario.starPower <= 0) stopStarMusic();
  }

  // Timer
  if (!multiplayerMode) {
    timeTimer++;
    if (timeTimer >= 36) {
      timeTimer = 0;
      time--;
      if (time <= 100 && time > 0 && time % 2 === 0) playSound('warning');
      if (time <= 0) mariodie();
    }
  }

  // Checkpoints
  for (let ci = 0; ci < CHECKPOINT_XS.length; ci++) {
    if (ci > checkpointIndex && mario.x >= CHECKPOINT_XS[ci] * TILE) {
      checkpointIndex = ci;
      playSound('powerup');
    }
  }

  // Map coin collection
  const mh2 = mario.big ? 24 : 16;
  mapCoins.forEach(c => {
    if (c.collected) return;
    if (mario.x + mario.w > c.x && mario.x < c.x + 8 &&
        mario.y + mh2 > c.y && mario.y < c.y + 8) {
      c.collected = true;
      coins++;
      score += 200;
      coinAnims.push({ x: c.x, y: c.y - 8, vy: -3, life: 25 });
      addScorePopup(c.x, c.y - 12, 200);
      playSound('coin');
    }
  });

  // Flagpole collision
  if (!flagDescending && mario.x >= (FLAGPOLE_X - 1) * TILE) {
    flagDescending = true;
    winTimer = 0;
    mario.vx = 0;
    mario.vy = 0;
    flagY = mario.y;
    flagBonus = Math.max(0, (12 * TILE - mario.y)) * 5;
    score += flagBonus;
    playSound('flagpole');
  }

  // Multiplayer progress
  if (multiplayerMode && gameState === 'playing') {
    writeProgress();
  }
}

function mariodie() {
  if (mario.invincible > 0) return;
  if (mario.fire) {
    mario.fire = false;
    mario.invincible = 120;
    playSound('shrink');
    return;
  }
  if (mario.big) {
    mario.crouching = false;
    mario.big = false;
    mario.invincible = 120;
    mario.h = 16;
    playSound('shrink');
    return;
  }
  mario.dead = true;
  mario.starPower = 0;
  stopStarMusic();
  mario.vy = -5;
  deathTimer = 0;
  playSound('die');
}

// ================================================================
// UPDATE: ENTITIES
// ================================================================
function updateEntities() {
  entities.forEach(e => {
    if (!e.alive && (e.type === 'goomba' || e.type === 'buzzy') && e.flat) {
      e.flatTimer--;
      if (e.flatTimer <= 0) e.remove = true;
      return;
    }
    if (!e.alive) return;

    // Piranha plants have special AI
    if (e.type === 'piranha') {
      if (e.x > camera.x + VIEW_W + 48 || e.x < camera.x - 80) return;
      e.frameTimer++;
      if (e.frameTimer > 12) { e.frameTimer = 0; e.frame = (e.frame + 1) % 2; }

      // Don't emerge if Mario is near the pipe
      const nearPipe = Math.abs(mario.x - e.pipeX * TILE) < 32;
      if (nearPipe && e.emergeOffset >= 0) {
        // stay hidden
      } else if (e.waitTimer > 0) {
        e.waitTimer--;
        if (e.waitTimer <= 0) {
          e.emergeDir = e.emergeOffset < -10 ? 1 : -1;
        }
      } else {
        e.emergeOffset += e.emergeDir * 0.8;
        if (e.emergeOffset < -20) { e.emergeOffset = -20; e.emergeDir = 0; e.waitTimer = 50; }
        if (e.emergeOffset >= 0) { e.emergeOffset = 0; e.emergeDir = 0; e.waitTimer = 60; }
      }
      e.y = e.baseY + e.emergeOffset;

      if (mario.dead || flagDescending) return;
      if (e.emergeOffset >= 0) return;
      const mx = mario.x + 2, mw = mario.w - 4;
      const mh = mario.big ? (mario.crouching ? 16 : 24) : 16;
      const my = mario.big && mario.crouching ? mario.y + 8 : mario.y;
      const visH = Math.abs(e.emergeOffset);
      if (mario.starPower > 0 && mx < e.x + e.w && mx + mw > e.x && my < e.y + visH && my + mh > e.y) {
        const pts = ENEMY_POINTS.piranha;
        e.alive = false; e.remove = true;
        score += pts; enemiesKilled++;
        addScorePopup(e.x, e.y - 8, pts);
        playSound('stomp');
        return;
      }
      if (mario.invincible > 0) return;
      if (mx < e.x + e.w && mx + mw > e.x && my < e.y + visH && my + mh > e.y) {
        if (mario.vy > 0 && my + mh - e.y < 10) {
          const pts = ENEMY_POINTS.piranha;
          e.alive = false;
          e.remove = true;
          score += pts;
          enemiesKilled++;
          addScorePopup(e.x, e.y - 8, pts);
          playSound('stomp');
          mario.vy = -4.5;
        } else {
          mariodie();
        }
      }
      return;
    }

    if (e.x > camera.x + VIEW_W + 48 || e.x < camera.x - 80) return;

    e.vy += GRAVITY_DOWN;
    if (e.vy > MAX_FALL) e.vy = MAX_FALL;

    e.x += e.vx;
    let hc = tileCollision(e.x + 2, e.y, e.w - 4, e.h);
    if (hc) {
      e.vx = -e.vx;
      e.x = e.vx > 0 ? (hc.tx + 1) * TILE : hc.tx * TILE - e.w;
    }

    e.y += e.vy;
    let vc = tileCollision(e.x + 2, e.y, e.w - 4, e.h);
    if (vc) {
      if (e.vy > 0) { e.y = vc.ty * TILE - e.h; e.vy = 0; }
      else { e.y = (vc.ty + 1) * TILE; e.vy = 0; }
    }

    if (e.y > LEVEL_HEIGHT * TILE + 32) e.remove = true;

    if (e.kickGrace > 0) e.kickGrace--;

    e.frameTimer++;
    if (e.frameTimer > 14) { e.frameTimer = 0; e.frame = (e.frame + 1) % 2; }

    if (mario.dead || flagDescending) return;

    const mx = mario.x + 2, mw = mario.w - 4;
    const mh = mario.big ? (mario.crouching ? 16 : 24) : 16;
    const my = mario.big && mario.crouching ? mario.y + 8 : mario.y;

    if (mario.starPower > 0 && mx < e.x + e.w && mx + mw > e.x && my < e.y + e.h && my + mh > e.y) {
      const pts = ENEMY_POINTS[e.type] || 100;
      e.alive = false;
      e.remove = true;
      score += pts;
      enemiesKilled++;
      addScorePopup(e.x, e.y - 8, pts);
      playSound('stomp');
      return;
    }

    if (mario.invincible > 0) return;
    if (mx < e.x + e.w && mx + mw > e.x && my < e.y + e.h && my + mh > e.y) {
      if (e.type === 'koopa' && e.shell && !e.shellMoving) {
        e.shellMoving = true;
        e.kickGrace = 12;
        e.vx = mario.x < e.x ? 3.5 : -3.5;
        score += 100;
        mario.vy = -3.5;
        addScorePopup(e.x, e.y - 8, 100);
        playSound('stomp');
        return;
      }
      if (e.type === 'koopa' && e.shell && e.shellMoving && e.kickGrace > 0) {
        return;
      }
      if (mario.vy > 0 && my + mh - e.y < 10) {
        const pts = ENEMY_POINTS[e.type] || 100;
        playSound('stomp');
        if (e.type === 'goomba' || e.type === 'buzzy') {
          e.alive = false;
          e.flat = true;
          e.flatTimer = 30;
          e.vx = 0;
          score += pts;
          enemiesKilled++;
          addScorePopup(e.x, e.y - 8, pts);
        } else if (e.type === 'koopa') {
          if (!e.shell) {
            e.shell = true;
            e.shellMoving = false;
            e.vx = 0;
            e.h = 16;
            e.y += 8;
            score += pts;
            enemiesKilled++;
            addScorePopup(e.x, e.y - 8, pts);
          } else if (e.shellMoving) {
            e.shellMoving = false;
            e.vx = 0;
          } else {
            e.shellMoving = true;
            e.vx = mario.x < e.x ? 3.5 : -3.5;
          }
        }
        mario.vy = -4.5;
      } else {
        mariodie();
      }
    }
  });

  entities.forEach(shell => {
    if (shell.type !== 'koopa' || !shell.shell || !shell.shellMoving || !shell.alive) return;
    entities.forEach(other => {
      if (other === shell || !other.alive) return;
      if (other.type === 'piranha') return;
      if (shell.x < other.x + other.w && shell.x + shell.w > other.x &&
          shell.y < other.y + other.h && shell.y + shell.h > other.y) {
        if (other.type === 'buzzy') {
          other.vx = shell.vx > 0 ? 1.5 : -1.5;
          other.vy = -3;
          shell.vx = -shell.vx;
          return;
        }
        const pts = ENEMY_POINTS[other.type] || 100;
        other.alive = false;
        other.remove = true;
        score += pts;
        enemiesKilled++;
        addScorePopup(other.x, other.y - 8, pts);
      }
    });
  });

  // Shell vs boss
  if (boss && boss.alive && boss.invincible <= 0) {
    entities.forEach(shell => {
      if (shell.type !== 'koopa' || !shell.shell || !shell.shellMoving || !shell.alive) return;
      if (shell.x < boss.x + boss.w && shell.x + shell.w > boss.x &&
          shell.y < boss.y + boss.h && shell.y + shell.h > boss.y) {
        boss.hp--;
        boss.invincible = 40;
        shell.alive = false;
        shell.remove = true;
        if (boss.hp <= 0) {
          boss.alive = false;
          boss.dying = true;
          boss.vy = -5;
          boss.deathTimer = 0;
          score += ENEMY_POINTS.boss;
          addScorePopup(boss.x, boss.y - 16, ENEMY_POINTS.boss);
          enemiesKilled++;
          playSound('bossdie');
          for (let gy = 6; gy <= 12; gy++) levelMap[gy][BOSS_GATE_X] = 0;
        } else {
          playSound('bosshit');
          addScorePopup(boss.x, boss.y - 8, 500);
          score += 500;
        }
      }
    });
  }

  entities = entities.filter(e => !e.remove);
}

// ================================================================
// UPDATE: BOSS
// ================================================================
function updateBoss() {
  // Update fireballs regardless of boss state
  bossFireballs = bossFireballs.filter(f => {
    f.x += f.vx;
    f.vy += 0.08;
    f.y += f.vy;
    const fc = tileCollision(f.x, f.y, 8, 8);
    if (fc && f.vy > 0) { f.y = fc.ty * TILE - 8; f.vy = -3; }
    f.life--;
    if (f.life <= 0 || f.x < camera.x - 32 || f.x > camera.x + VIEW_W + 32) return false;
    if (!mario.dead && mario.invincible <= 0) {
      const mh = mario.big ? 24 : 16;
      if (mario.x + mario.w > f.x && mario.x < f.x + 8 &&
          mario.y + mh > f.y && mario.y < f.y + 8) {
        mariodie();
      }
    }
    return true;
  });

  if (!boss) return;

  if (boss.dying) {
    boss.deathTimer++;
    boss.vy += GRAVITY_DOWN;
    boss.y += boss.vy;
    if (boss.deathTimer > 120) boss = null;
    return;
  }

  if (!boss.alive) return;

  // Only activate boss when Mario is near the arena
  if (Math.abs(mario.x - boss.x) > VIEW_W * 1.5) return;

  if (boss.invincible > 0) boss.invincible--;

  // Gravity
  boss.vy += GRAVITY_DOWN;
  if (boss.vy > MAX_FALL) boss.vy = MAX_FALL;

  // Horizontal movement
  boss.x += boss.vx;
  if (boss.x <= boss.arenaLeft) { boss.x = boss.arenaLeft; boss.vx = Math.abs(boss.vx); }
  if (boss.x + boss.w >= boss.arenaRight) { boss.x = boss.arenaRight - boss.w; boss.vx = -Math.abs(boss.vx); }

  // Vertical
  boss.y += boss.vy;
  boss.onGround = false;
  const bc = tileCollision(boss.x + 2, boss.y, boss.w - 4, boss.h);
  if (bc) {
    if (boss.vy > 0) { boss.y = bc.ty * TILE - boss.h; boss.vy = 0; boss.onGround = true; }
    else { boss.y = (bc.ty + 1) * TILE; boss.vy = 0; }
  }

  // Jump
  boss.jumpTimer++;
  if (boss.jumpTimer > 90 + Math.random() * 60 && boss.onGround) {
    boss.vy = -6.5;
    boss.jumpTimer = 0;
  }

  // Throw fireballs toward Mario
  boss.fireTimer++;
  if (boss.fireTimer > 80 + Math.random() * 40) {
    boss.fireTimer = 0;
    const dir = mario.x < boss.x ? -1 : 1;
    bossFireballs.push({
      x: boss.x + (dir > 0 ? boss.w : -8),
      y: boss.y + 10,
      vx: dir * 2.5,
      vy: -1.5,
      life: 200,
    });
    playSound('fireball');
  }

  // Animation
  boss.frameTimer++;
  if (boss.frameTimer > 16) { boss.frameTimer = 0; boss.frame = (boss.frame + 1) % 2; }

  // Collision with Mario
  if (mario.dead || flagDescending) return;
  const mx = mario.x + 2, mw = mario.w - 4;
  const mh = mario.big ? (mario.crouching ? 16 : 24) : 16;
  const my = mario.big && mario.crouching ? mario.y + 8 : mario.y;

  if (mario.starPower > 0 && boss.invincible <= 0 &&
      mx < boss.x + boss.w && mx + mw > boss.x && my < boss.y + boss.h && my + mh > boss.y) {
    boss.hp -= 3;
    boss.invincible = 40;
    if (boss.hp <= 0) {
      boss.alive = false; boss.dying = true; boss.vy = -5; boss.deathTimer = 0;
      score += ENEMY_POINTS.boss; addScorePopup(boss.x, boss.y - 16, ENEMY_POINTS.boss);
      enemiesKilled++; playSound('bossdie');
      for (let gy = 6; gy <= 12; gy++) levelMap[gy][BOSS_GATE_X] = 0;
    } else {
      playSound('bosshit'); addScorePopup(boss.x, boss.y - 8, 500); score += 500;
    }
    return;
  }

  if (mario.invincible > 0) return;
  if (mx < boss.x + boss.w && mx + mw > boss.x && my < boss.y + boss.h && my + mh > boss.y) {
    if (mario.vy > 0 && my + mh - boss.y < 12 && boss.invincible <= 0) {
      boss.hp--;
      boss.invincible = 40;
      mario.vy = -6;
      if (boss.hp <= 0) {
        boss.alive = false;
        boss.dying = true;
        boss.vy = -5;
        boss.deathTimer = 0;
        score += ENEMY_POINTS.boss;
        addScorePopup(boss.x, boss.y - 16, ENEMY_POINTS.boss);
        enemiesKilled++;
        playSound('bossdie');
        for (let gy = 6; gy <= 12; gy++) levelMap[gy][BOSS_GATE_X] = 0;
      } else {
        playSound('bosshit');
        addScorePopup(boss.x, boss.y - 8, 500);
        score += 500;
      }
    } else if (boss.invincible <= 0) {
      mariodie();
    }
  }
}

// ================================================================
// UPDATE: ITEMS
// ================================================================
function updateItems() {
  items.forEach(item => {
    if (!item.active) return;
    if (item.emerging) {
      item.y -= 0.8;
      if (item.y <= item.emergeY - TILE) item.emerging = false;
      return;
    }

    item.vy += GRAVITY_DOWN;
    if (item.vy > MAX_FALL) item.vy = MAX_FALL;
    item.x += item.vx;
    let hc = tileCollision(item.x, item.y, item.w, item.h);
    if (hc) item.vx = -item.vx;
    item.y += item.vy;
    let vc = tileCollision(item.x, item.y, item.w, item.h);
    if (vc && item.vy > 0) {
      item.y = vc.ty * TILE - item.h;
      item.vy = item.type === 'star' ? -4.5 : 0;
    }
    if (item.y > LEVEL_HEIGHT * TILE) { item.active = false; return; }

    if (mario.dead) return;
    const mh = mario.big ? 24 : 16;
    if (mario.x + mario.w > item.x && mario.x < item.x + item.w &&
        mario.y + mh > item.y && mario.y < item.y + item.h) {
      if (item.type === 'mushroom') {
        if (!mario.big) {
          mario.big = true;
          mario.h = 24;
          mario.y -= 8;
        }
        score += 1000;
        addScorePopup(item.x, item.y - 8, 1000);
        playSound('powerup');
      } else if (item.type === 'flower') {
        mario.fire = true;
        score += 1000;
        addScorePopup(item.x, item.y - 8, 1000);
        playSound('powerup');
      } else if (item.type === 'star') {
        mario.starPower = 480;
        mario.invincible = 480;
        score += 1000;
        addScorePopup(item.x, item.y - 8, 1000);
        startStarMusic();
      }
      item.active = false;
    }
  });
  items = items.filter(i => i.active);
}

// ================================================================
// UPDATE: MARIO FIREBALLS
// ================================================================
function updateMarioFireballs() {
  if (fireballCooldown > 0) fireballCooldown--;

  marioFireballs.forEach(fb => {
    fb.x += fb.vx;
    fb.vy += 0.25;
    fb.y += fb.vy;
    fb.life--;

    if (fb.life <= 0 || fb.x < camera.rx - 32 || fb.x > camera.rx + VIEW_W + 32) {
      fb.remove = true;
      return;
    }

    const tx = Math.floor((fb.x + 4) / TILE);
    const ty = Math.floor((fb.y + 8) / TILE);
    const tile = getTile(tx, ty);
    if (tile && tile !== 10) {
      fb.y = (ty - 1) * TILE;
      fb.vy = -3.5;
      fb.bounces++;
      if (fb.bounces > 5) fb.remove = true;
    }

    const wallTxR = Math.floor((fb.x + 8) / TILE);
    const wallTxL = Math.floor(fb.x / TILE);
    const wallTy = Math.floor((fb.y + 4) / TILE);
    const wallR = getTile(wallTxR, wallTy);
    const wallL = getTile(wallTxL, wallTy);
    if ((wallR && wallR !== 10 && fb.vx > 0) || (wallL && wallL !== 10 && fb.vx < 0)) {
      fb.remove = true;
      return;
    }

    entities.forEach(e => {
      if (!e.alive) return;
      if (e.type === 'piranha' && e.emergeOffset >= 0) return;
      if (fb.x + fb.w > e.x && fb.x < e.x + e.w &&
          fb.y + fb.h > e.y && fb.y < e.y + e.h) {
        if (e.type === 'buzzy') {
          fb.remove = true;
          return;
        }
        const pts = ENEMY_POINTS[e.type] || 100;
        e.alive = false;
        e.remove = true;
        score += pts;
        enemiesKilled++;
        addScorePopup(e.x, e.y - 8, pts);
        fb.remove = true;
      }
    });

    if (boss && boss.alive && boss.invincible <= 0 && !fb.remove) {
      if (fb.x + fb.w > boss.x && fb.x < boss.x + boss.w &&
          fb.y + fb.h > boss.y && fb.y < boss.y + boss.h) {
        boss.hp--;
        boss.invincible = 40;
        fb.remove = true;
        playSound('bosshit');
        if (boss.hp <= 0) {
          boss.alive = false;
          boss.dying = true;
          boss.dyingTimer = 60;
          score += ENEMY_POINTS.boss;
          addScorePopup(boss.x, boss.y - 16, ENEMY_POINTS.boss);
          playSound('bossdie');
        }
      }
    }
  });

  marioFireballs = marioFireballs.filter(fb => !fb.remove);
}

// ================================================================
// UPDATE: PARTICLES
// ================================================================
function updateParticles() {
  particles.forEach(p => {
    if (p.type === 'bump') { p.timer--; if (p.timer <= 0) p.remove = true; }
    if (p.type === 'debris') {
      p.x += p.vx; p.y += p.vy; p.vy += GRAVITY_DOWN;
      p.life--; if (p.life <= 0) p.remove = true;
    }
  });
  particles = particles.filter(p => !p.remove);

  coinAnims.forEach(c => { c.y += c.vy; c.vy += 0.25; c.life--; });
  coinAnims = coinAnims.filter(c => c.life > 0);

  scorePopups.forEach(p => { p.y += p.vy; p.life--; });
  scorePopups = scorePopups.filter(p => p.life > 0);

  dustParticles.forEach(d => {
    d.x += d.vx; d.y += d.vy; d.life--;
  });
  dustParticles = dustParticles.filter(d => d.life > 0);
}

// ================================================================
// MAIN UPDATE
// ================================================================
function update() {
  if (gameState === 'gameover') {
    gameOverTimer++;
    if (gameOverTimer > 180) {
      gameState = 'menu';
      showMenu();
    }
    return;
  }
  if (gameState === 'lifeLost') {
    gameOverTimer++;
    if (gameOverTimer > 120) {
      gameState = 'playing';
      resetLevel();
    }
    return;
  }
  if (gameState !== 'playing' || paused) return;
  globalTick++;
  if (multiplayerMode && roomStartTime > 0) {
    matchTimeRemaining = Math.max(0, Math.ceil(roomMatchDuration - (Date.now() - roomStartTime) / 1000));
    if (isHost && matchTimeRemaining <= 0 && !matchEnding) {
      matchEnding = true;
      roomRef && roomRef.get().then(function(snap) {
        if (snap.exists && snap.data().state === 'playing') {
          endMatch(snap.data());
        }
      });
    }
  }
  if (eliminated) return;
  updateMario();
  updateEntities();
  updateBoss();
  updateItems();
  updateMarioFireballs();
  updateParticles();
}

// ================================================================
// RENDERING
// ================================================================
function drawTile(x, y, tile) {
  const sx = x - camera.rx;
  if (sx < -TILE || sx > VIEW_W + TILE) return;
  const tileX = Math.floor(x / TILE);
  const tileY = Math.floor(y / TILE);
  const key = `${tileX},${tileY}`;

  switch(tile) {
    case 1:
      bx.fillStyle = COL.ground;
      bx.fillRect(sx, y, TILE, TILE);
      bx.fillStyle = COL.groundDark;
      bx.fillRect(sx, y, TILE, 1);
      bx.fillRect(sx + 7, y + 1, 2, 6);
      bx.fillRect(sx + 3, y + 7, 2, 2);
      bx.fillRect(sx + 11, y + 7, 2, 2);
      bx.fillRect(sx + 7, y + 9, 2, 7);
      bx.fillStyle = COL.groundLight;
      bx.fillRect(sx + 1, y + 1, 2, 1);
      bx.fillRect(sx + 9, y + 8, 2, 1);
      break;

    case 2:
      bx.fillStyle = COL.brick;
      bx.fillRect(sx, y, TILE, TILE);
      bx.fillStyle = COL.brickLine;
      bx.fillRect(sx, y, TILE, 1);
      bx.fillRect(sx, y + 7, TILE, 1);
      bx.fillRect(sx + 7, y, 1, 7);
      bx.fillRect(sx + 3, y + 7, 1, 9);
      bx.fillRect(sx + 11, y + 7, 1, 9);
      bx.fillRect(sx, y + 15, TILE, 1);
      break;

    case 3: case 4: case 6: case 7: {
      if (emptyBlocks.has(key)) {
        bx.fillStyle = COL.blockShade;
        bx.fillRect(sx, y, TILE, TILE);
        bx.fillStyle = '#a08060';
        bx.fillRect(sx + 1, y + 1, TILE - 2, TILE - 2);
        bx.fillStyle = COL.blockDark;
        bx.fillRect(sx + 2, y + 2, TILE - 4, TILE - 4);
        break;
      }
      const glow = Math.sin(globalTick * 0.08) * 0.3 + 0.7;
      const is1up = tile === 6;
      const isStar = tile === 7;
      const blockBg = is1up ? '#30b830' : isStar ? '#4080c0' : COL.block;
      const blockShd = is1up ? '#208020' : isStar ? '#2a5080' : COL.blockShade;
      const blockDk = is1up ? '#105010' : isStar ? '#1a3050' : COL.blockDark;
      bx.fillStyle = blockBg;
      bx.fillRect(sx, y, TILE, TILE);
      bx.fillStyle = blockShd;
      bx.fillRect(sx, y + TILE - 2, TILE, 2);
      bx.fillRect(sx + TILE - 2, y, 2, TILE);
      bx.fillStyle = `rgba(255,255,255,${glow * 0.15})`;
      bx.fillRect(sx + 1, y + 1, TILE - 3, TILE - 3);
      if (isStar) {
        bx.fillStyle = '#ffe000';
        bx.fillRect(sx + 7, y + 3, 2, 2);
        bx.fillRect(sx + 5, y + 5, 6, 2);
        bx.fillRect(sx + 3, y + 7, 10, 2);
        bx.fillRect(sx + 5, y + 9, 6, 2);
        bx.fillRect(sx + 4, y + 10, 3, 2);
        bx.fillRect(sx + 9, y + 10, 3, 2);
      } else {
        bx.fillStyle = blockDk;
        bx.fillRect(sx + 5, y + 3, 6, 2);
        bx.fillRect(sx + 9, y + 5, 2, 3);
        bx.fillRect(sx + 7, y + 7, 2, 2);
        bx.fillRect(sx + 7, y + 11, 2, 2);
      }
      break;
    }

    case 5:
      bx.fillStyle = COL.hardBlockDark;
      bx.fillRect(sx, y, TILE, TILE);
      bx.fillStyle = COL.hardBlockLight;
      bx.fillRect(sx + 1, y + 1, TILE - 2, TILE - 2);
      bx.fillStyle = COL.hardBlock;
      bx.fillRect(sx + 3, y + 3, TILE - 6, TILE - 6);
      break;

    case 10:
      bx.fillStyle = COL.pipe;
      bx.fillRect(sx, y, TILE, TILE);
      bx.fillStyle = COL.pipeHighlight;
      bx.fillRect(sx + 2, y, 4, TILE);
      bx.fillStyle = COL.pipeDark;
      bx.fillRect(sx + TILE - 2, y, 2, TILE);
      break;
    case 11:
      bx.fillStyle = COL.pipe;
      bx.fillRect(sx, y, TILE, TILE);
      bx.fillStyle = COL.pipeDark;
      bx.fillRect(sx, y, 2, TILE);
      break;
    case 12:
      bx.fillStyle = COL.pipe;
      bx.fillRect(sx - 2, y, TILE + 2, TILE);
      bx.fillStyle = COL.pipeHighlight;
      bx.fillRect(sx, y, 4, TILE);
      bx.fillStyle = COL.pipeDark;
      bx.fillRect(sx + TILE - 2, y, 2, TILE);
      bx.fillStyle = COL.pipeHighlight;
      bx.fillRect(sx - 2, y, TILE + 4, 2);
      break;
    case 13:
      bx.fillStyle = COL.pipe;
      bx.fillRect(sx, y, TILE + 2, TILE);
      bx.fillStyle = COL.pipeDark;
      bx.fillRect(sx, y, 2, TILE);
      bx.fillStyle = COL.pipeHighlight;
      bx.fillRect(sx, y, TILE + 2, 2);
      break;
  }
}

function drawBackground() {
  bx.fillStyle = COL.sky;
  bx.fillRect(0, 0, VIEW_W, VIEW_H);

  const GY = 13 * TILE;
  const T = TILE;
  const CYCLE = 48 * T;
  const totalLen = LEVEL_WIDTH * T;

  // --- Multi-bump shape (used for hills, bushes, and clouds) ---
  function drawBumps(sx, baseY, bumps, bumpR, fillCol, lightCol) {
    const spacing = bumpR * 1.5;
    const totalW = (bumps - 1) * spacing + bumpR * 2;
    if (sx + totalW < -60 || sx > VIEW_W + 60) return;
    bx.fillStyle = fillCol;
    bx.beginPath();
    for (let i = 0; i < bumps; i++) {
      const cx = sx + i * spacing + bumpR;
      bx.moveTo(cx + bumpR, baseY);
      bx.arc(cx, baseY, bumpR, 0, Math.PI, true);
    }
    bx.closePath();
    bx.fill();
    bx.fillStyle = fillCol;
    bx.fillRect(sx, baseY, totalW, 2);
    if (lightCol) {
      bx.fillStyle = lightCol;
      for (let i = 0; i < bumps; i++) {
        const cx = sx + i * spacing + bumpR;
        bx.beginPath();
        bx.arc(cx, baseY - bumpR * 0.15, bumpR * 0.5, 0, Math.PI, true);
        bx.fill();
      }
    }
  }

  // --- HILLS (behind everything, slow parallax) ---
  const hillDark = '#009000';
  const hillMid = '#00b800';
  const hillLight = '#80d010';
  function drawHill3(cx, outerR) {
    if (cx + outerR < -20 || cx - outerR > VIEW_W + 20) return;
    bx.fillStyle = hillDark;
    bx.beginPath();
    bx.arc(cx, GY, outerR, Math.PI, 0, false);
    bx.closePath();
    bx.fill();
    bx.fillStyle = hillMid;
    bx.beginPath();
    bx.arc(cx, GY, outerR * 0.7, Math.PI, 0, false);
    bx.closePath();
    bx.fill();
    bx.fillStyle = hillLight;
    bx.beginPath();
    bx.arc(cx, GY, outerR * 0.3, Math.PI, 0, false);
    bx.closePath();
    bx.fill();
  }
  for (let base = -CYCLE; base < totalLen + CYCLE; base += CYCLE) {
    drawHill3(Math.floor((base + 0) - camera.rx * 0.4), 5 * T);
    drawHill3(Math.floor((base + 16 * T) - camera.rx * 0.4), 2 * T);
    drawHill3(Math.floor((base + 25 * T) - camera.rx * 0.4), 3.5 * T);
    drawHill3(Math.floor((base + 40 * T) - camera.rx * 0.4), 1.5 * T);
  }

  // --- CLOUDS (slow parallax, high in sky, SMB1 pattern: 1,1,3,2,1 bumps) ---
  const cloudCol = '#fcfcfc';
  const cloudLight = '#d8f0fc';
  const cloudR = 10;
  const cloudPositions = [
    { tx: 8, ty: 3, bumps: 1 },
    { tx: 19, ty: 2, bumps: 1 },
    { tx: 27, ty: 4, bumps: 3 },
    { tx: 36, ty: 2, bumps: 2 },
    { tx: 44, ty: 3, bumps: 1 },
  ];
  for (let base = -CYCLE; base < totalLen + CYCLE; base += CYCLE) {
    for (const cp of cloudPositions) {
      const sx = Math.floor((base + cp.tx * T) - camera.rx * 0.2);
      const sy = cp.ty * T;
      drawBumps(sx, sy + cloudR, cp.bumps, cloudR, cloudCol, cloudLight);
    }
  }

  // --- BUSHES (at ground level, SMB1 pattern: 2,3,1 bumps per cycle) ---
  const bushDark = '#009000';
  const bushCol = '#00b800';
  const bushLt = '#80d010';
  const bushR = 10;
  const bushPositions = [
    { tx: 11, bumps: 3 },
    { tx: 23, bumps: 1 },
    { tx: 41, bumps: 2 },
  ];
  for (let base = -CYCLE; base < totalLen + CYCLE; base += CYCLE) {
    for (const bp of bushPositions) {
      const sx = Math.floor((base + bp.tx * T) - camera.rx);
      const spacing = bushR * 1.5;
      const totalW = (bp.bumps - 1) * spacing + bushR * 2;
      if (sx + totalW < -40 || sx > VIEW_W + 40) continue;
      bx.fillStyle = bushDark;
      for (let i = 0; i < bp.bumps; i++) {
        const cx = sx + i * spacing + bushR;
        bx.beginPath();
        bx.arc(cx, GY - 1, bushR + 1, Math.PI, 0, false);
        bx.fill();
      }
      bx.fillStyle = bushCol;
      for (let i = 0; i < bp.bumps; i++) {
        const cx = sx + i * spacing + bushR;
        bx.beginPath();
        bx.arc(cx, GY - 1, bushR, Math.PI, 0, false);
        bx.fill();
      }
      bx.fillRect(sx, GY - 1, totalW, 2);
      bx.fillStyle = bushLt;
      for (let i = 0; i < bp.bumps; i++) {
        const cx = sx + i * spacing + bushR;
        bx.beginPath();
        bx.arc(cx, GY - 1 - bushR * 0.15, bushR * 0.5, Math.PI, 0, false);
        bx.fill();
      }
    }
  }

  // --- TREES (scattered, not too many) ---
  const treePositions = [
    { tx: 6, s: 1.1 },
    { tx: 17, s: 0.8 },
    { tx: 35, s: 1.0 },
  ];
  for (let base = 0; base < totalLen + CYCLE; base += CYCLE) {
    for (const tp of treePositions) {
      const sx = Math.floor((base + tp.tx * T) - camera.rx);
      if (sx < -30 || sx > VIEW_W + 30) continue;
      const s = tp.s;
      const trunkW = Math.floor(4 * s);
      const trunkH = Math.floor(12 * s);
      bx.fillStyle = '#8b5e34';
      bx.fillRect(sx - Math.floor(trunkW / 2), GY - trunkH, trunkW, trunkH);
      bx.fillStyle = '#006800';
      bx.beginPath();
      bx.arc(sx, GY - trunkH - Math.floor(2 * s), Math.floor(9 * s), 0, Math.PI * 2);
      bx.fill();
      bx.fillStyle = '#00a800';
      bx.beginPath();
      bx.arc(sx, GY - trunkH - Math.floor(4 * s), Math.floor(7 * s), 0, Math.PI * 2);
      bx.fill();
      bx.fillStyle = '#80d010';
      bx.beginPath();
      bx.arc(sx - Math.floor(2 * s), GY - trunkH - Math.floor(6 * s), Math.floor(3.5 * s), 0, Math.PI * 2);
      bx.fill();
    }
  }

  // --- FENCES (a few per cycle) ---
  const fencePositions = [14, 30, 45];
  for (let base = 0; base < totalLen + CYCLE; base += CYCLE) {
    for (const ftx of fencePositions) {
      const sx = Math.floor((base + ftx * T) - camera.rx);
      if (sx < -40 || sx > VIEW_W + 40) continue;
      for (let p = 0; p < 4; p++) {
        const px = sx + p * 8;
        bx.fillStyle = '#d8b878';
        bx.fillRect(px, GY - 14, 3, 14);
        bx.fillStyle = '#f0e0c0';
        bx.fillRect(px, GY - 14, 3, 1);
      }
      bx.fillStyle = '#d8b878';
      bx.fillRect(sx - 1, GY - 12, 34, 2);
      bx.fillRect(sx - 1, GY - 6, 34, 2);
    }
  }
}

function drawMario() {
  if (mario.invincible > 0) {
    const blinkRate = mario.invincible > 120 ? 8 : 3;
    if (Math.floor(mario.invincible / blinkRate) % 3 === 0) return;
  }

  const sx = Math.floor(mario.x - camera.rx);
  const sy = Math.floor(mario.y);
  const flipped = mario.facing === -1;

  let sprite;
  if (mario.dead) {
    sprite = MARIO_DEAD;
  } else if (mario.big) {
    if (mario.crouching) {
      sprite = BIG_MARIO_CROUCH;
    } else if (!mario.onGround) {
      sprite = BIG_MARIO_JUMP;
    } else if (mario.vx !== 0 && Math.abs(mario.vx) > 0.3) {
      sprite = [BIG_MARIO_STAND, BIG_MARIO_RUN1, BIG_MARIO_RUN2][mario.frame % 3];
    } else {
      sprite = BIG_MARIO_STAND;
    }
  } else {
    if (!mario.onGround) {
      sprite = MARIO_JUMP;
    } else if (mario.skidding) {
      sprite = MARIO_SKID;
    } else if (mario.vx !== 0 && Math.abs(mario.vx) > 0.3) {
      sprite = [MARIO_STAND, MARIO_RUN1, MARIO_RUN2][mario.frame % 3];
    } else {
      sprite = MARIO_STAND;
    }
  }

  let pal;
  if (mario.starPower > 0) {
    const starCols = [
      { 1: '#e44030', 2: COL.marioSkin, 3: '#ffe000', 4: '#00a800' },
      { 1: '#ffe000', 2: COL.marioSkin, 3: '#fcfcfc', 4: '#e44030' },
      { 1: '#00a800', 2: COL.marioSkin, 3: '#e44030', 4: '#6b88ff' },
      { 1: '#fcfcfc', 2: COL.marioSkin, 3: '#00a800', 4: '#ffe000' },
    ];
    pal = starCols[Math.floor(globalTick / 2) % 4];
  } else {
    pal = mario.fire ? FIRE_MARIO_PALETTE : MARIO_PALETTE;
  }
  drawPixels(bx, sx, sy, sprite, pal, flipped);
}

function drawEntities() {
  entities.forEach(e => {
    if (!e.alive && e.type !== 'goomba' && e.type !== 'buzzy') return;
    const sx = Math.floor(e.x - camera.rx);
    if (sx < -TILE || sx > VIEW_W + TILE) return;

    if (e.type === 'goomba') {
      drawPixels(bx, sx, Math.floor(e.y), e.flat ? GOOMBA_FLAT : GOOMBA_SPRITE, GOOMBA_PALETTE, e.frame === 1);
    } else if (e.type === 'koopa') {
      if (e.shell) {
        drawPixels(bx, sx, Math.floor(e.y), KOOPA_SHELL, KOOPA_PALETTE, false);
      } else {
        drawPixels(bx, sx, Math.floor(e.y) - 8, KOOPA_SPRITE, KOOPA_PALETTE, e.vx > 0);
      }
    } else if (e.type === 'buzzy') {
      drawPixels(bx, sx, Math.floor(e.y), e.flat ? BUZZY_FLAT : BUZZY_SPRITE, BUZZY_PALETTE, e.frame === 1);
    } else if (e.type === 'piranha') {
      if (e.emergeOffset >= 0) return;
      const py = Math.floor(e.y);
      const pipeTopPx = Math.floor(e.baseY);
      const visibleH = pipeTopPx - py;
      if (visibleH <= 0) return;
      const pSprite = e.frame === 0 ? PIRANHA_SPRITE1 : PIRANHA_SPRITE2;
      bx.save();
      bx.beginPath();
      bx.rect(sx - 2, py, 24, visibleH);
      bx.clip();
      drawPixels(bx, sx, py, pSprite, PIRANHA_PALETTE, false, 1.25);
      bx.restore();
    }
  });
}

function drawItems() {
  items.forEach(item => {
    if (!item.active) return;
    const sx = Math.floor(item.x - camera.rx);
    if (sx < -TILE || sx > VIEW_W + TILE) return;
    const iy = Math.floor(item.y);
    if (item.type === 'mushroom') {
      bx.fillStyle = COL.mushroom;
      bx.fillRect(sx, iy, 16, 8);
      bx.beginPath(); bx.arc(sx + 8, iy, 8, Math.PI, 0); bx.fill();
      bx.fillStyle = COL.mushroomSpots;
      bx.fillRect(sx + 5, iy - 4, 6, 4);
      bx.fillStyle = COL.marioSkin;
      bx.fillRect(sx + 2, iy + 4, 12, 8);
      bx.fillRect(sx + 4, iy + 8, 3, 4);
      bx.fillRect(sx + 9, iy + 8, 3, 4);
    } else if (item.type === 'flower') {
      const t = Math.floor(Date.now() / 120) % 4;
      const flowerCols = ['#e44030', '#ff8000', '#fcfcfc', '#ff8000'];
      bx.fillStyle = '#00a800';
      bx.fillRect(sx + 6, iy + 8, 4, 8);
      bx.fillRect(sx + 2, iy + 10, 4, 3);
      bx.fillRect(sx + 10, iy + 10, 4, 3);
      bx.fillStyle = flowerCols[t];
      bx.beginPath(); bx.arc(sx + 8, iy + 4, 5, 0, Math.PI * 2); bx.fill();
      bx.beginPath(); bx.arc(sx + 3, iy + 4, 3, 0, Math.PI * 2); bx.fill();
      bx.beginPath(); bx.arc(sx + 13, iy + 4, 3, 0, Math.PI * 2); bx.fill();
      bx.beginPath(); bx.arc(sx + 8, iy - 1, 3, 0, Math.PI * 2); bx.fill();
      bx.beginPath(); bx.arc(sx + 8, iy + 9, 3, 0, Math.PI * 2); bx.fill();
      bx.fillStyle = '#ffe000';
      bx.beginPath(); bx.arc(sx + 8, iy + 4, 2, 0, Math.PI * 2); bx.fill();
    } else if (item.type === 'star') {
      const t = Math.floor(Date.now() / 100) % 3;
      const starCols = ['#ffe000', '#ff8000', '#fcfcfc'];
      bx.fillStyle = starCols[t];
      bx.beginPath();
      const cx = sx + 8, cy = iy + 8;
      for (let i = 0; i < 5; i++) {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI / 5);
        const innerAngle = angle + Math.PI / 5;
        const ox = cx + Math.cos(angle) * 7;
        const oy = cy + Math.sin(angle) * 7;
        const ix = cx + Math.cos(innerAngle) * 3;
        const iy2 = cy + Math.sin(innerAngle) * 3;
        if (i === 0) bx.moveTo(ox, oy); else bx.lineTo(ox, oy);
        bx.lineTo(ix, iy2);
      }
      bx.closePath();
      bx.fill();
      bx.fillStyle = '#000';
      bx.fillRect(sx + 5, iy + 5, 2, 2);
      bx.fillRect(sx + 9, iy + 5, 2, 2);
    }
  });
}

function drawParticles() {
  particles.forEach(p => {
    if (p.type === 'debris') {
      const sx = Math.floor(p.x - camera.rx);
      bx.fillStyle = COL.brick;
      bx.fillRect(sx, Math.floor(p.y), 6, 6);
      bx.fillStyle = COL.brickLine;
      bx.fillRect(sx, Math.floor(p.y), 6, 1);
    }
  });

  coinAnims.forEach(c => {
    const sx = Math.floor(c.x - camera.rx);
    bx.fillStyle = COL.coin;
    bx.fillRect(sx + 2, Math.floor(c.y), 4, 8);
    bx.fillStyle = COL.blockShade;
    bx.fillRect(sx + 3, Math.floor(c.y) + 1, 2, 6);
  });

  scorePopups.forEach(p => {
    const sx = Math.floor(p.x - camera.rx);
    drawPixelText(bx, p.text, sx, Math.floor(p.y), '#fff', '#000');
  });

  dustParticles.forEach(d => {
    const sx = Math.floor(d.x - camera.rx);
    const alpha = d.life / 10;
    bx.fillStyle = `rgba(255,255,255,${alpha * 0.5})`;
    bx.fillRect(sx, Math.floor(d.y), 2, 2);
  });
}

function drawBoss() {
  if (!boss) return;
  const sx = Math.floor(boss.x - camera.rx);
  if (sx < -48 || sx > VIEW_W + 48) return;
  const sy = Math.floor(boss.y);

  if (boss.dying) {
    drawPixels(bx, sx - 2, sy, BOWSER_SPRITE, BOWSER_PALETTE, true);
    return;
  }

  if (boss.invincible > 0 && (boss.invincible & 2)) return;

  drawPixels(bx, sx - 2, sy, BOWSER_SPRITE, BOWSER_PALETTE, boss.vx > 0);

  // HP bar above boss
  const barW = 24;
  const barY = sy - 6;
  bx.fillStyle = '#333';
  bx.fillRect(sx + 2, barY, barW, 3);
  bx.fillStyle = boss.hp === 1 ? '#ff3030' : boss.hp === 2 ? '#ffaa00' : '#00e000';
  bx.fillRect(sx + 2, barY, Math.ceil(barW * boss.hp / 3), 3);
}

function drawBossFireballs() {
  bossFireballs.forEach(f => {
    const sx = Math.floor(f.x - camera.rx);
    if (sx < -16 || sx > VIEW_W + 16) return;
    drawPixels(bx, sx, Math.floor(f.y), FIREBALL_SPRITE, FIREBALL_PALETTE, f.vx < 0);
  });
}

function drawMarioFireballs() {
  const MARIO_FB_PALETTE = { 1: '#ff8000', 2: '#ffe000', 3: '#fcfcfc' };
  marioFireballs.forEach(fb => {
    const sx = Math.floor(fb.x - camera.rx);
    if (sx < -16 || sx > VIEW_W + 16) return;
    drawPixels(bx, sx, Math.floor(fb.y), FIREBALL_SPRITE, MARIO_FB_PALETTE, fb.vx < 0);
  });
}

function drawBossGate() {
  if (!boss || !boss.alive) return;
  const gx = Math.floor(BOSS_GATE_X * TILE - camera.rx);
  if (gx < -TILE || gx > VIEW_W + TILE) return;
  for (let row = 6; row <= 12; row++) {
    const gy = row * TILE;
    bx.fillStyle = '#8b4513';
    bx.fillRect(gx, gy, TILE, TILE);
    bx.fillStyle = '#a0522d';
    bx.fillRect(gx + 2, gy + 2, TILE - 4, TILE - 4);
    bx.fillStyle = '#6b3410';
    bx.fillRect(gx, gy, TILE, 1);
    bx.fillRect(gx, gy, 1, TILE);
  }
}

function drawMapCoins() {
  mapCoins.forEach(c => {
    if (c.collected) return;
    const sx = Math.floor(c.x - camera.rx);
    if (sx < -TILE || sx > VIEW_W + TILE) return;
    const bob = Math.sin(globalTick * 0.08 + c.x * 0.1) * 1.5;
    const cy = Math.floor(c.y + bob);
    bx.fillStyle = COL.coin;
    bx.fillRect(sx + 2, cy, 4, 8);
    bx.fillStyle = COL.blockShade;
    bx.fillRect(sx + 3, cy + 1, 2, 6);
    bx.fillStyle = '#fff';
    bx.fillRect(sx + 2, cy, 1, 1);
  });
}

function drawCheckpoint() {
  CHECKPOINT_XS.forEach((cpx, ci) => {
    const fx = Math.floor(cpx * TILE - camera.rx);
    if (fx < -20 || fx > VIEW_W + 20) return;

    const poleTop = 11 * TILE;
    const poleH = 2 * TILE;

    bx.fillStyle = '#888';
    bx.fillRect(fx + 7, poleTop, 1, poleH);

    bx.fillStyle = '#ddd';
    bx.fillRect(fx + 7, poleTop - 1, 2, 2);

    if (ci <= checkpointIndex) {
      const pulse = Math.sin(globalTick * 0.12) * 0.3 + 0.7;
      bx.fillStyle = `rgba(0, 200, 0, ${pulse})`;
      bx.fillRect(fx + 1, poleTop + 1, 6, 5);
      bx.fillStyle = '#80ff80';
      bx.fillRect(fx + 2, poleTop + 2, 3, 3);
    } else {
      const wave = Math.floor(Math.sin(globalTick * 0.06) * 1);
      bx.fillStyle = '#fc7460';
      bx.fillRect(fx + 1 + wave, poleTop + 1, 6, 5);
      bx.fillStyle = '#fcb0a0';
      bx.fillRect(fx + 2 + wave, poleTop + 2, 3, 3);
    }
  });
}

function drawFlagPole() {
  const fx = Math.floor(FLAGPOLE_X * TILE - camera.rx);
  if (fx < -20 || fx > VIEW_W + 20) return;

  bx.fillStyle = COL.flagPole;
  bx.fillRect(fx + 7, 3 * TILE, 2, 10 * TILE);

  bx.fillStyle = '#00c800';
  bx.fillRect(fx + 5, 3 * TILE - 3, 6, 6);

  if (!flagDescending) {
    const wave = Math.floor(Math.sin(globalTick * 0.1));
    bx.fillStyle = '#00a800';
    bx.fillRect(fx - 8 + wave, 3 * TILE + 2, 14, 10);
    bx.fillStyle = '#80d010';
    bx.fillRect(fx - 6 + wave, 3 * TILE + 4, 6, 6);
  }
}

function drawCastle() {
  const cx = Math.floor(CASTLE_X * TILE - camera.rx);
  if (cx < -80 || cx > VIEW_W + 20) return;

  bx.fillStyle = COL.castle;
  bx.fillRect(cx, 8 * TILE, 5 * TILE, 5 * TILE);

  bx.fillStyle = COL.castleDark;
  bx.fillRect(cx + 2 * TILE, 11 * TILE, TILE, 2 * TILE);
  bx.fillRect(cx + 2 * TILE, 10 * TILE + 8, TILE, 4);

  // Battlements
  for (let i = 0; i < 5; i++) {
    bx.fillStyle = COL.castle;
    bx.fillRect(cx + i * TILE, 7 * TILE, TILE - 2, TILE);
  }
  bx.fillStyle = COL.castleLight;
  for (let i = 0; i < 5; i++) {
    bx.fillRect(cx + i * TILE + 1, 7 * TILE + 1, TILE - 4, 2);
  }

  // Windows
  bx.fillStyle = COL.black;
  bx.fillRect(cx + TILE + 2, 9 * TILE + 2, 6, 8);
  bx.fillRect(cx + 3 * TILE + 2, 9 * TILE + 2, 6, 8);

  // Tower
  bx.fillStyle = COL.castle;
  bx.fillRect(cx + 1.5 * TILE, 5 * TILE, 2 * TILE, 3 * TILE);
  bx.fillStyle = COL.castleDark;
  bx.fillRect(cx + 2 * TILE, 5 * TILE, 4, 6);
  bx.fillStyle = COL.castleLight;
  bx.fillRect(cx + 1.5 * TILE, 5 * TILE, 2 * TILE, 2);
}

function drawProgressBar() {
  if (!multiplayerMode || racePlayers.length === 0) return;

  if (!eliminated) {
    const me = racePlayers.find(p => p.id === myPlayerId);
    if (me && !me.finished && me.alive) {
      me.progress = Math.min(1, mario.x / ((LEVEL_WIDTH - 15) * TILE));
    }
  }

  const barX = 16;
  const barY = 29;
  const barW = VIEW_W - 32;
  const barH = 3;

  bx.fillStyle = 'rgba(0,0,0,0.5)';
  bx.fillRect(barX - 1, barY - 1, barW + 2, barH + 4);

  bx.fillStyle = '#555';
  bx.fillRect(barX, barY + 1, barW, 1);

  bx.fillStyle = '#888';
  bx.fillRect(barX, barY, 1, barH);

  bx.fillStyle = '#fff';
  bx.fillRect(barX + barW - 1, barY - 1, 1, barH + 2);
  bx.fillStyle = '#00c800';
  bx.fillRect(barX + barW - 5, barY - 1, 4, 3);

  racePlayers.forEach((p, i) => {
    const col = playerColors[i % playerColors.length];
    const progress = Math.max(0, Math.min(1, p.progress || 0));
    const px = barX + Math.round(progress * (barW - 4));
    const isMe = p.id === myPlayerId;

    if (!p.alive && !p.finished) {
      bx.fillStyle = '#666';
      bx.fillRect(px, barY, 2, barH);
    } else if (p.finished) {
      bx.fillStyle = col;
      bx.fillRect(px, barY - 1, 3, barH + 2);
    } else {
      bx.fillStyle = col;
      if (isMe) {
        bx.fillRect(px, barY - 1, 4, barH + 2);
      } else {
        bx.fillRect(px, barY, 3, barH);
      }
    }
  });
}

function drawHUD() {
  const sh = 'rgba(0,0,0,0.55)';

  drawPixelText(bx, 'MARIO', 24, 8, COL.text, sh);
  drawPixelText(bx, String(score).padStart(6, '0'), 24, 18, COL.text, sh);

  bx.fillStyle = '#000';
  bx.fillRect(73, 19, 6, 7);
  bx.fillStyle = COL.coin;
  bx.fillRect(72, 18, 6, 7);
  drawPixelText(bx, 'x' + String(coins).padStart(2, '0'), 82, 18, COL.text, sh);

  const livesStr = 'x' + (lives - 1);
  const livesColor = lives <= 1 ? '#e44030' : COL.text;
  drawPixelText(bx, 'LIVES', 108, 8, COL.text, sh);
  drawPixelText(bx, livesStr, 116, 18, livesColor, sh);

  drawPixelText(bx, 'WORLD', 148, 8, COL.text, sh);
  drawPixelText(bx, '1-1', 154, 18, COL.text, sh);

  if (multiplayerMode) {
    drawPixelText(bx, 'MATCH', 204, 8, COL.text, sh);
    const min = Math.floor(matchTimeRemaining / 60);
    const sec = matchTimeRemaining % 60;
    const timeStr = String(min) + ':' + String(sec).padStart(2, '0');
    const tColor = matchTimeRemaining <= 30 && matchTimeRemaining % 2 === 0 ? '#e44030' : COL.text;
    drawPixelText(bx, timeStr, 208, 18, tColor, sh);
  } else {
    drawPixelText(bx, 'TIME', 210, 8, COL.text, sh);
    const tColor = time <= 100 && time % 2 === 0 ? '#e44030' : COL.text;
    drawPixelText(bx, String(Math.max(0, time)).padStart(3, '0'), 214, 18, tColor, sh);
  }

  drawProgressBar();
}

function drawLevel() {
  const startTX = Math.max(0, Math.floor(camera.rx / TILE) - 1);
  const endTX = Math.min(LEVEL_WIDTH, Math.ceil((camera.rx + VIEW_W) / TILE) + 1);

  for (let ty = 0; ty < LEVEL_HEIGHT; ty++) {
    for (let tx = startTX; tx < endTX; tx++) {
      const tile = levelMap[ty][tx];
      if (tile !== 0) {
        let drawY = ty * TILE;
        const bump = particles.find(p => p.type === 'bump' && p.x === tx * TILE && p.origY === ty * TILE);
        if (bump) {
          const t = 8 - bump.timer;
          drawY -= t < 4 ? t * 2 : (8 - t) * 2;
        }
        drawTile(tx * TILE, drawY, tile);
      }
    }
  }
}

function render() {
  if (gameState === 'gameover') {
    bx.fillStyle = '#000';
    bx.fillRect(0, 0, VIEW_W, VIEW_H);
    const goText = 'GAME OVER';
    const goW = goText.length * 6;
    drawPixelText(bx, goText, ((VIEW_W - goW) / 2) | 0, (VIEW_H / 2 - 4) | 0, '#e44030', '#000');
    ctx.drawImage(buf, 0, 0, VIEW_W, VIEW_H, 0, 0, canvas.width, canvas.height);
    return;
  }
  if (gameState === 'lifeLost') {
    bx.fillStyle = '#000';
    bx.fillRect(0, 0, VIEW_W, VIEW_H);
    const wText = 'WORLD 1-1';
    const wW = wText.length * 6;
    drawPixelText(bx, wText, ((VIEW_W - wW) / 2) | 0, (VIEW_H / 2 - 24) | 0, '#fff', null);
    drawPixels(bx, (VIEW_W / 2 - 16) | 0, (VIEW_H / 2 - 4) | 0, MARIO_STAND, MARIO_PALETTE, false);
    drawPixelText(bx, 'x  ' + (lives - 1), (VIEW_W / 2 + 6) | 0, (VIEW_H / 2) | 0, '#fff', null);
    ctx.drawImage(buf, 0, 0, VIEW_W, VIEW_H, 0, 0, canvas.width, canvas.height);
    return;
  }

  camera.rx = Math.floor(camera.x);
  bx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawBackground();
  drawLevel();
  drawCheckpoint();
  drawFlagPole();
  drawCastle();
  drawMapCoins();
  drawBossGate();
  drawItems();
  drawEntities();
  drawBoss();
  drawBossFireballs();
  drawMarioFireballs();
  drawParticles();
  drawMario();
  drawHUD();

  if (eliminated && multiplayerMode) {
    bx.fillStyle = 'rgba(0,0,0,0.7)';
    bx.fillRect(0, VIEW_H / 2 - 48, VIEW_W, 96);

    const elText = 'OUT OF LIVES';
    const elW = elText.length * 6;
    drawPixelText(bx, elText, Math.round((VIEW_W - elW) / 2), VIEW_H / 2 - 40, '#e44030', '#000');

    drawPixelText(bx, 'YOUR SCORE', 32, VIEW_H / 2 - 24, '#f8d830', '#000');
    drawPixelText(bx, 'COINS: ' + coins, 32, VIEW_H / 2 - 12, '#fff', '#000');
    drawPixelText(bx, 'ENEMIES: ' + enemiesKilled, 32, VIEW_H / 2 - 2, '#fff', '#000');
    const totalText = 'TOTAL: ' + score;
    drawPixelText(bx, totalText, 32, VIEW_H / 2 + 12, '#f8d830', '#000');

    const waitText = 'WAITING FOR MATCH TO END...';
    const waitW = waitText.length * 6;
    drawPixelText(bx, waitText, Math.round((VIEW_W - waitW) / 2), VIEW_H / 2 + 30, '#aaa', '#000');
  }

  if (gameState === 'win' && !multiplayerMode) {
    bx.fillStyle = 'rgba(0,0,0,0.75)';
    bx.fillRect(0, VIEW_H / 2 - 52, VIEW_W, 104);
    const ccText = 'COURSE CLEAR!';
    const ccW = ccText.length * 6;
    drawPixelText(bx, ccText, Math.round((VIEW_W - ccW) / 2), VIEW_H / 2 - 44, '#f8d830', '#000');

    drawPixelText(bx, 'FLAG BONUS: ' + flagBonus, 32, VIEW_H / 2 - 28, '#fff', '#000');
    drawPixelText(bx, 'TIME BONUS: ' + timeBonus, 32, VIEW_H / 2 - 18, '#fff', '#000');
    drawPixelText(bx, 'COINS: ' + coins + ' x200 = ' + (coins * 200), 32, VIEW_H / 2 - 8, '#fff', '#000');
    drawPixelText(bx, 'ENEMIES: ' + enemiesKilled, 32, VIEW_H / 2 + 2, '#fff', '#000');

    const totalText = 'TOTAL: ' + score;
    drawPixelText(bx, totalText, 32, VIEW_H / 2 + 16, '#f8d830', '#000');

    const prText = 'PRESS ENTER TO PLAY AGAIN';
    const prW = prText.length * 6;
    drawPixelText(bx, prText, Math.round((VIEW_W - prW) / 2), VIEW_H / 2 + 34, '#aaa', '#000');
  }

  ctx.drawImage(buf, 0, 0, VIEW_W, VIEW_H, 0, 0, canvas.width, canvas.height);
}

// ================================================================
// GAME LOOP (fixed timestep at 60fps)
// ================================================================
const TARGET_FPS = 60;
const FIXED_DT = 1000 / TARGET_FPS;
let lastFrameTime = 0;
let accumulator = 0;

function gameLoop(timestamp) {
  if (lastFrameTime === 0) lastFrameTime = timestamp;
  const delta = Math.min(timestamp - lastFrameTime, 100);
  lastFrameTime = timestamp;
  accumulator += delta;

  let steps = 0;
  while (accumulator >= FIXED_DT && steps < 4) {
    prevState.mx = mario.x;
    prevState.my = mario.y;
    prevState.cx = camera.x;
    entities.forEach(e => { e.px = e.x; e.py = e.y; });
    update();
    accumulator -= FIXED_DT;
    steps++;
  }

  if (steps > 0 || gameState !== 'playing') {
    renderAlpha = accumulator / FIXED_DT;
    render();
  }
  requestAnimationFrame(gameLoop);
}

// ================================================================
// PAUSE MENU
// ================================================================
function pauseGame() {
  paused = true;
  document.getElementById('pauseOverlay').classList.remove('hidden');
}

function resumeGame() {
  paused = false;
  document.getElementById('pauseOverlay').classList.add('hidden');
}

function quitToMenu() {
  stopStarMusic();
  paused = false;
  document.getElementById('pauseOverlay').classList.add('hidden');
  gameState = 'menu';
  if (multiplayerMode) {
    cleanupRoom();
  }
  multiplayerMode = false;
  isHost = false;
  currentRoomCode = '';
  showMenu();
}

// ================================================================
// MULTIPLAYER (Firestore)
// ================================================================
const MATCH_DURATION = 300;
const myPlayerId = 'p_' + Math.random().toString(36).substring(2, 10);
let db = null;
let roomRef = null;
let roomUnsubscribe = null;
let multiplayerMode = false;
let isHost = false;
let currentRoomCode = '';
let roomStartTime = 0;
let roomMatchDuration = MATCH_DURATION;
let matchEnding = false;
let lastProgressWrite = 0;
const playerColors = ['#e44030','#6b88ff','#00a800','#f8d830','#fc74b4','#00e8d8','#a040a0','#fcfcfc'];

function initFirebase() {
  if (db) return;
  firebase.initializeApp({
    apiKey: "AIzaSyASjYKQub3EyQKminv4kMHngIjHbQyJwPg",
    authDomain: "mario-platformer-ead2f.firebaseapp.com",
    projectId: "mario-platformer-ead2f",
    storageBucket: "mario-platformer-ead2f.firebasestorage.app",
    messagingSenderId: "997684889443",
    appId: "1:997684889443:web:7aadf54bf890663aed7556"
  });
  db = firebase.firestore();
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function calcScore(player, rank) {
  let s = 0;
  const posBonus = [5000, 3000, 2000, 1500, 1000, 500, 250, 100];
  s += posBonus[rank] || 50;
  if (player.finished && player.finishTime) {
    s += Math.max(0, Math.floor((MATCH_DURATION * 1000 - player.finishTime) / 50));
  }
  s += (player.coins || 0) * 200;
  s += (player.gameScore || 0);
  if (!player.finished) {
    s += Math.floor((player.progress || 0) * 2000);
  }
  return s;
}

function endMatch(roomData) {
  if (!roomRef) return;
  const players = Object.values(roomData.players || {});
  const finished = players.filter(function(p) { return p.finished; }).sort(function(a, b) { return a.finishTime - b.finishTime; });
  const alive = players.filter(function(p) { return !p.finished && p.alive; }).sort(function(a, b) { return b.progress - a.progress; });
  const dead = players.filter(function(p) { return !p.finished && !p.alive; }).sort(function(a, b) { return b.progress - a.progress; });
  const rankings = [].concat(finished, alive, dead).map(function(p, i) {
    return {
      id: p.id, name: p.name, progress: p.progress,
      finished: p.finished, finishTime: p.finishTime,
      alive: p.alive, coins: p.coins, gameScore: p.gameScore,
      rank: i + 1, finalScore: calcScore(p, i),
    };
  });
  roomRef.update({ state: 'finished', rankings: rankings }).catch(function() {});
}

function checkMatchEnd(roomData) {
  if (!isHost || roomData.state !== 'playing') return;
  const players = Object.values(roomData.players || {});
  if (players.length === 0) return;
  if (players.some(function(p) { return p.finished; }) ||
      players.every(function(p) { return p.finished || !p.alive; })) {
    endMatch(roomData);
  }
}

function subscribeToRoom(code) {
  if (roomUnsubscribe) roomUnsubscribe();
  roomRef = db.collection('rooms').doc(code);
  var prevRoomState = null;

  roomUnsubscribe = roomRef.onSnapshot(function(snap) {
    if (!snap.exists) {
      leaveRoom();
      return;
    }
    var data = snap.data();
    var playersList = Object.values(data.players || {});

    if (data.players && data.hostId && !data.players[data.hostId]) {
      var playerIds = Object.keys(data.players).sort();
      if (playerIds.length > 0 && playerIds[0] === myPlayerId) {
        roomRef.update({ hostId: myPlayerId });
      }
    }

    isHost = data.hostId === myPlayerId;

    switch (data.state) {
      case 'waiting':
        updateLobbyPlayers(playersList);
        if (prevRoomState === 'finished' || prevRoomState === 'playing') {
          gameState = 'menu';
          document.getElementById('raceTimeline').classList.remove('visible');
          showLobby(currentRoomCode, playersList);
        }
        document.getElementById('startBtn').style.display = isHost ? '' : 'none';
        document.getElementById('waitMsg').style.display = isHost ? 'none' : '';
        break;

      case 'countdown':
        if (prevRoomState !== 'countdown') {
          showCountdown();
        }
        break;

      case 'playing':
        if (prevRoomState !== 'playing') {
          hideMenu();
          resumeGame();
          gameState = 'playing';
          checkpointIndex = -1;
          resetLevel();
          roomStartTime = data.startTime;
          roomMatchDuration = data.matchDuration || MATCH_DURATION;
          matchTimeRemaining = roomMatchDuration;
          matchEnding = false;
        }
        racePlayers = playersList;
        updateTimeline(playersList);
        checkMatchEnd(data);
        break;

      case 'finished':
        if (prevRoomState !== 'finished') {
          matchEnding = false;
          gameState = 'menu';
          if (data.rankings) {
            showResults(data.rankings);
          }
        }
        break;
    }

    prevRoomState = data.state;
  }, function(err) {
    console.error('Room listener error:', err);
  });
}

function writeProgress() {
  if (!roomRef || !multiplayerMode || gameState !== 'playing' || eliminated) return;
  var now = Date.now();
  if (now - lastProgressWrite < 500) return;
  lastProgressWrite = now;
  var progress = Math.min(1, mario.x / ((LEVEL_WIDTH - 15) * TILE));
  var updates = {};
  updates['players.' + myPlayerId + '.progress'] = progress;
  updates['players.' + myPlayerId + '.coins'] = coins;
  updates['players.' + myPlayerId + '.gameScore'] = score;
  roomRef.update(updates).catch(function() {});
}

function writePlayerFinished() {
  if (!roomRef) return;
  var updates = {};
  updates['players.' + myPlayerId + '.finished'] = true;
  updates['players.' + myPlayerId + '.finishTime'] = Date.now() - roomStartTime;
  updates['players.' + myPlayerId + '.progress'] = 1;
  updates['players.' + myPlayerId + '.coins'] = coins;
  updates['players.' + myPlayerId + '.gameScore'] = score;
  roomRef.update(updates).catch(function() {});
}

function writePlayerDied() {
  if (!roomRef) return;
  var updates = {};
  updates['players.' + myPlayerId + '.alive'] = false;
  updates['players.' + myPlayerId + '.coins'] = coins;
  updates['players.' + myPlayerId + '.gameScore'] = score;
  updates['players.' + myPlayerId + '.progress'] = Math.min(1, mario.x / ((LEVEL_WIDTH - 15) * TILE));
  roomRef.update(updates).catch(function() {});
}

function cleanupRoom() {
  if (roomUnsubscribe) {
    roomUnsubscribe();
    roomUnsubscribe = null;
  }
  if (roomRef) {
    var ref = roomRef;
    roomRef = null;
    ref.get().then(function(snap) {
      if (!snap.exists) return;
      var data = snap.data();
      var playerCount = Object.keys(data.players || {}).length;
      if (playerCount <= 1) {
        ref.delete().catch(function() {});
      } else {
        var updates = {};
        updates['players.' + myPlayerId] = firebase.firestore.FieldValue.delete();
        if (data.hostId === myPlayerId) {
          var otherIds = Object.keys(data.players).filter(function(id) { return id !== myPlayerId; }).sort();
          if (otherIds.length > 0) updates.hostId = otherIds[0];
        }
        ref.update(updates).catch(function() {});
      }
    }).catch(function() {});
  }
  roomStartTime = 0;
  matchEnding = false;
  lastProgressWrite = 0;
}

window.addEventListener('beforeunload', function() {
  if (roomRef && multiplayerMode) {
    var updates = {};
    updates['players.' + myPlayerId] = firebase.firestore.FieldValue.delete();
    roomRef.update(updates);
  }
});

function updateLobbyPlayers(players) {
  const div = document.getElementById('lobbyPlayers');
  div.innerHTML = players.map((p, i) =>
    `<div style="color:${playerColors[i % playerColors.length]}">${i === 0 ? '* ' : '  '}${p.name}${p.id === myPlayerId ? ' (You)' : ''}</div>`
  ).join('');
}

function updateTimeline(players) {
  const div = document.getElementById('timelinePlayers');
  div.innerHTML = players.map((p, i) => {
    const pct = Math.round((p.progress || 0) * 100);
    const col = playerColors[i % playerColors.length];
    let status = '';
    if (p.finished) status = ` ${(p.finishTime / 1000).toFixed(1)}s`;
    else if (!p.alive) status = ' DEAD';
    return `<div class="timeline-player">
      <div class="timeline-name" style="color:${col}">${p.name}${status}</div>
      <div class="timeline-bar-bg">
        <div class="timeline-bar-fill" style="width:${pct}%;background:${col};"></div>
      </div>
    </div>`;
  }).join('');
}

function showResults(rankings) {
  hideAllMenuPanels();
  document.getElementById('menuResults').style.display = '';
  document.getElementById('menuOverlay').classList.remove('hidden');
  document.getElementById('raceTimeline').classList.remove('visible');

  const div = document.getElementById('resultsPlayers');
  const medals = ['1st', '2nd', '3rd'];
  const winner = rankings[0];
  let headerHtml = '';
  if (winner && winner.finished) {
    headerHtml = `<div style="color:#f8d830; font-size:16px; margin-bottom:10px; text-align:center;">${winner.name} WINS!</div>`;
  }
  div.innerHTML = headerHtml + rankings.map((p, i) => {
    const medal = medals[i] || `${i + 1}th`;
    const col = playerColors[i % playerColors.length];
    let timeStr = '';
    if (p.finished) timeStr = `${(p.finishTime / 1000).toFixed(2)}s`;
    else if (!p.alive) timeStr = 'OUT OF LIVES';
    else timeStr = `${Math.round((p.progress || 0) * 100)}%`;
    const finalScore = p.finalScore || 0;
    const coinStr = p.coins ? ` Coins:${p.coins}` : '';
    return `<div style="color:${col}; font-size:13px; margin:4px 0; padding:4px 0; border-bottom:1px solid #333;">
      <span style="color:#f8d830;">${medal}</span> ${p.name} - ${timeStr}${coinStr}
      <span style="color:#aaa; font-size:11px;"> Score: ${finalScore}</span>
    </div>`;
  }).join('');

  if (isHost) {
    document.getElementById('replayBtn').style.display = '';
  } else {
    document.getElementById('replayBtn').style.display = 'none';
  }
}

function showCountdown() {
  const el = document.getElementById('countdown');
  el.style.display = 'block';
  let count = 3;
  el.textContent = count;
  const iv = setInterval(() => {
    count--;
    if (count > 0) el.textContent = count;
    else if (count === 0) el.textContent = 'GO!';
    else { el.style.display = 'none'; clearInterval(iv); }
  }, 1000);
}

// ================================================================
// MENU NAVIGATION
// ================================================================
function hideAllMenuPanels() {
  ['menuMain','menuCreate','menuJoin','menuLobby','menuResults'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
}

function showMenu() {
  hideAllMenuPanels();
  document.getElementById('menuMain').style.display = '';
  document.getElementById('menuOverlay').classList.remove('hidden');
  document.getElementById('raceTimeline').classList.remove('visible');
}

function hideMenu() {
  document.getElementById('menuOverlay').classList.add('hidden');
}

function showMainMenu() {
  hideAllMenuPanels();
  document.getElementById('menuMain').style.display = '';
}

function showCreateRoom() {
  initFirebase();
  hideAllMenuPanels();
  document.getElementById('menuCreate').style.display = '';
  document.getElementById('createError').textContent = '';
}

function showJoinRoom() {
  initFirebase();
  hideAllMenuPanels();
  document.getElementById('menuJoin').style.display = '';
  document.getElementById('joinError').textContent = '';
}

function showLobby(code, players) {
  hideAllMenuPanels();
  document.getElementById('menuLobby').style.display = '';
  document.getElementById('menuOverlay').classList.remove('hidden');
  document.getElementById('lobbyCode').textContent = code;
  updateLobbyPlayers(players);
  if (isHost) {
    document.getElementById('startBtn').style.display = '';
    document.getElementById('waitMsg').style.display = 'none';
  } else {
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('waitMsg').style.display = '';
  }
}

function startSinglePlayer() {
  multiplayerMode = false;
  hideMenu();
  gameState = 'playing';
  lives = 3;
  checkpointIndex = -1;
  resetLevel();
}

async function createRoom() {
  initFirebase();
  const btn = document.querySelector('#menuCreate .menu-btn');
  const name = document.getElementById('createName').value.trim() || 'Mario';
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>CREATING...';
  document.getElementById('createError').textContent = '';
  try {
    let code = generateRoomCode();
    let existing = await db.collection('rooms').doc(code).get();
    while (existing.exists) {
      code = generateRoomCode();
      existing = await db.collection('rooms').doc(code).get();
    }
    const playerData = {
      id: myPlayerId,
      name: name.substring(0, 12),
      progress: 0, finished: false, finishTime: null,
      alive: true, coins: 0, gameScore: 0,
    };
    await db.collection('rooms').doc(code).set({
      code: code,
      hostId: myPlayerId,
      state: 'waiting',
      startTime: null,
      matchDuration: MATCH_DURATION,
      createdAt: Date.now(),
      rankings: null,
      players: { [myPlayerId]: playerData },
    });
    isHost = true;
    multiplayerMode = true;
    currentRoomCode = code;
    subscribeToRoom(code);
    showLobby(code, [playerData]);
  } catch (err) {
    document.getElementById('createError').textContent = 'Failed to create room';
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'CREATE';
  }
}

async function joinRoom() {
  initFirebase();
  const btn = document.querySelector('#menuJoin .menu-btn');
  const code = document.getElementById('joinCode').value.trim().toUpperCase();
  const name = document.getElementById('joinName').value.trim() || 'Luigi';
  if (!code) { document.getElementById('joinError').textContent = 'Enter a room code'; return; }
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>JOINING...';
  document.getElementById('joinError').textContent = '';
  try {
    const snap = await db.collection('rooms').doc(code).get();
    if (!snap.exists) {
      document.getElementById('joinError').textContent = 'Room not found';
      return;
    }
    const data = snap.data();
    if (data.state !== 'waiting') {
      document.getElementById('joinError').textContent = 'Game already started';
      return;
    }
    if (Object.keys(data.players || {}).length >= 8) {
      document.getElementById('joinError').textContent = 'Room full (max 8)';
      return;
    }
    const playerData = {
      id: myPlayerId,
      name: name.substring(0, 12),
      progress: 0, finished: false, finishTime: null,
      alive: true, coins: 0, gameScore: 0,
    };
    await db.collection('rooms').doc(code).update({
      ['players.' + myPlayerId]: playerData,
    });
    isHost = false;
    multiplayerMode = true;
    currentRoomCode = code;
    subscribeToRoom(code);
    const merged = Object.assign({}, data.players);
    merged[myPlayerId] = playerData;
    showLobby(code, Object.values(merged));
  } catch (err) {
    document.getElementById('joinError').textContent = 'Failed to join room';
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'JOIN';
  }
}

function startMultiplayerGame() {
  if (!roomRef || !isHost) return;
  roomRef.update({ state: 'countdown' });
  setTimeout(function() {
    if (!roomRef) return;
    roomRef.update({ state: 'playing', startTime: Date.now() });
  }, 3000);
}

function returnToLobby() {
  if (!roomRef || !isHost) return;
  roomRef.get().then(function(snap) {
    if (!snap.exists) return;
    var data = snap.data();
    var resetPlayers = {};
    Object.keys(data.players || {}).forEach(function(pid) {
      resetPlayers[pid] = {
        id: data.players[pid].id,
        name: data.players[pid].name,
        progress: 0, finished: false, finishTime: null,
        alive: true, coins: 0, gameScore: 0,
      };
    });
    roomRef.update({ state: 'waiting', startTime: null, rankings: null, players: resetPlayers });
  });
}

function leaveRoom() {
  cleanupRoom();
  multiplayerMode = false;
  isHost = false;
  currentRoomCode = '';
  showMenu();
}

// ================================================================
// INIT
// ================================================================
resetLevel();
showMenu();
requestAnimationFrame(gameLoop);
