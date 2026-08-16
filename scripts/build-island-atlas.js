const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const tilesDir = path.join(__dirname, '..', 'assets', 'tiles');
const singleTile = PNG.sync.read(fs.readFileSync(path.join(tilesDir, 'tile-single.png')));
const cliffTile = PNG.sync.read(fs.readFileSync(path.join(tilesDir, 'tile-cliff.png')));
const cornerTile = PNG.sync.read(fs.readFileSync(path.join(tilesDir, 'tile-corner.png')));

// 1. Build an assembled 4x4 (16-cube) Island Composite
// Grid coordinates (x, y) where x goes down-right, y goes down-left
const GRID_SIZE = 4;
const STEP_X = { dx: 68, dy: 50 };   // Screen vector for +1 gridX
const STEP_Y = { dx: -68, dy: 50 };  // Screen vector for +1 gridY

// Canvas dimensions for 16-cube island
const CANVAS_W = 750;
const CANVAS_H = 750;
const canvas = new PNG({ width: CANVAS_W, height: CANVAS_H });

// Initialize canvas with transparent pixels
canvas.data.fill(0);

// Scale tile function
function blit(src, dst, dstX, dstY) {
  for (let sy = 0; sy < src.height; sy++) {
    for (let sx = 0; sx < src.width; sx++) {
      const sIdx = (src.width * sy + sx) << 2;
      const sa = src.data[sIdx + 3];
      if (sa === 0) continue;

      const dx = Math.round(dstX + sx);
      const dy = Math.round(dstY + sy);
      if (dx < 0 || dx >= dst.width || dy < 0 || dy >= dst.height) continue;

      const dIdx = (dst.width * dy + dx) << 2;
      const da = dst.data[dIdx + 3];

      if (da === 0) {
        dst.data[dIdx] = src.data[sIdx];
        dst.data[dIdx + 1] = src.data[sIdx + 1];
        dst.data[dIdx + 2] = src.data[sIdx + 2];
        dst.data[dIdx + 3] = sa;
      } else {
        // Alpha blend
        const srcAlpha = sa / 255;
        const invAlpha = 1 - srcAlpha;
        dst.data[dIdx] = Math.round(src.data[sIdx] * srcAlpha + dst.data[dIdx] * invAlpha);
        dst.data[dIdx + 1] = Math.round(src.data[sIdx + 1] * srcAlpha + dst.data[dIdx + 1] * invAlpha);
        dst.data[dIdx + 2] = Math.round(src.data[sIdx + 2] * srcAlpha + dst.data[dIdx + 2] * invAlpha);
        dst.data[dIdx + 3] = Math.max(da, sa);
      }
    }
  }
}

// Render 16 tiles back-to-front (sorted by x + y)
const tilePositions = [];
for (let x = 0; x < GRID_SIZE; x++) {
  for (let y = 0; y < GRID_SIZE; y++) {
    tilePositions.push({ x, y, order: x + y });
  }
}
tilePositions.sort((a, b) => a.order - b.order);

const ORIGIN_X = 375 - 150;
const ORIGIN_Y = 120;

// Resize helper
function resizePng(src, scale) {
  const nw = Math.round(src.width * scale);
  const nh = Math.round(src.height * scale);
  const dst = new PNG({ width: nw, height: nh });
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const sx = Math.min(src.width - 1, Math.floor(x / scale));
      const sy = Math.min(src.height - 1, Math.floor(y / scale));
      const sIdx = (src.width * sy + sx) << 2;
      const dIdx = (nw * y + x) << 2;
      dst.data[dIdx] = src.data[sIdx];
      dst.data[dIdx + 1] = src.data[sIdx + 1];
      dst.data[dIdx + 2] = src.data[sIdx + 2];
      dst.data[dIdx + 3] = src.data[sIdx + 3];
    }
  }
  return dst;
}

const scaledSingle = resizePng(singleTile, 0.58);
const scaledCliff = resizePng(cliffTile, 0.58);
const scaledCorner = resizePng(cornerTile, 0.58);

tilePositions.forEach(pos => {
  const posX = ORIGIN_X + pos.x * STEP_X.dx + pos.y * STEP_Y.dx;
  const posY = ORIGIN_Y + pos.x * STEP_X.dy + pos.y * STEP_Y.dy;

  // Pick tile type based on edge
  const isSouthEdge = pos.x === GRID_SIZE - 1;
  const isEastEdge = pos.y === GRID_SIZE - 1;

  let sprite = scaledSingle;
  if (isSouthEdge && isEastEdge) {
    sprite = scaledCorner;
  } else if (isSouthEdge || isEastEdge) {
    sprite = scaledCliff;
  }

  blit(sprite, canvas, posX, posY);
});

// Trim transparent margins
let minX = CANVAS_W, maxX = 0, minY = CANVAS_H, maxY = 0;
for (let y = 0; y < CANVAS_H; y++) {
  for (let x = 0; x < CANVAS_W; x++) {
    const a = canvas.data[(CANVAS_W * y + x) * 4 + 3];
    if (a > 10) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

const trimW = maxX - minX + 1;
const trimH = maxY - minY + 1;
const trimmed = new PNG({ width: trimW, height: trimH });

for (let y = 0; y < trimH; y++) {
  for (let x = 0; x < trimW; x++) {
    const sIdx = (CANVAS_W * (minY + y) + (minX + x)) << 2;
    const dIdx = (trimW * y + x) << 2;
    trimmed.data[dIdx] = canvas.data[sIdx];
    trimmed.data[dIdx + 1] = canvas.data[sIdx + 1];
    trimmed.data[dIdx + 2] = canvas.data[sIdx + 2];
    trimmed.data[dIdx + 3] = canvas.data[sIdx + 3];
  }
}

const outPath = path.join(tilesDir, 'island-16-grid.png');
fs.writeFileSync(outPath, PNG.sync.write(trimmed));
console.log(`Saved assembled island-16-grid.png (${trimW}x${trimH}) to ${outPath}`);
