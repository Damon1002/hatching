const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const tilesDir = path.join(__dirname, '..', 'assets', 'tiles');
const tile = PNG.sync.read(fs.readFileSync(path.join(tilesDir, 'tile-single.png')));

// Measure the top diamond facet accurately
let topPt = { x: 0, y: tile.height };
let leftPt = { x: tile.width, y: 0 };
let rightPt = { x: 0, y: 0 };

for (let y = 0; y < tile.height; y++) {
  for (let x = 0; x < tile.width; x++) {
    const idx = (tile.width * y + x) * 4;
    const a = tile.data[idx + 3];
    if (a > 180) {
      if (y < topPt.y) topPt = { x, y };
      if (x < leftPt.x && y < 150) leftPt = { x, y };
      if (x > rightPt.x && y < 150) rightPt = { x, y };
    }
  }
}

console.log('Top point:', topPt);
console.log('Left point:', leftPt);
console.log('Right point:', rightPt);

// Scale tile
function resizePng(img, scale) {
  const nw = Math.round(img.width * scale);
  const nh = Math.round(img.height * scale);
  const dst = new PNG({ width: nw, height: nh });
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const sx = Math.min(img.width - 1, Math.floor(x / scale));
      const sy = Math.min(img.height - 1, Math.floor(y / scale));
      const sIdx = (img.width * sy + sx) << 2;
      const dIdx = (nw * y + x) << 2;
      dst.data[dIdx] = img.data[sIdx];
      dst.data[dIdx + 1] = img.data[sIdx + 1];
      dst.data[dIdx + 2] = img.data[sIdx + 2];
      dst.data[dIdx + 3] = img.data[sIdx + 3];
    }
  }
  return dst;
}

const SCALE = 0.52;
const scaled = resizePng(tile, SCALE);

const CANVAS_W = 800;
const CANVAS_H = 800;
const canvas = new PNG({ width: CANVAS_W, height: CANVAS_H });
canvas.data.fill(0);

// Seamless blend function
function blit(srcImg, dstImg, dstX, dstY) {
  for (let sy = 0; sy < srcImg.height; sy++) {
    for (let sx = 0; sx < srcImg.width; sx++) {
      const sIdx = (srcImg.width * sy + sx) << 2;
      const sa = srcImg.data[sIdx + 3];
      if (sa === 0) continue;

      const dx = Math.round(dstX + sx);
      const dy = Math.round(dstY + sy);
      if (dx < 0 || dx >= dstImg.width || dy < 0 || dy >= dstImg.height) continue;

      const dIdx = (dstImg.width * dy + dx) << 2;
      const da = dstImg.data[dIdx + 3];

      if (da === 0) {
        dstImg.data[dIdx] = srcImg.data[sIdx];
        dstImg.data[dIdx + 1] = srcImg.data[sIdx + 1];
        dstImg.data[dIdx + 2] = srcImg.data[sIdx + 2];
        dstImg.data[dIdx + 3] = sa;
      } else {
        const a = sa / 255;
        const inv = 1 - a;
        dstImg.data[dIdx] = Math.round(srcImg.data[sIdx] * a + dstImg.data[dIdx] * inv);
        dstImg.data[dIdx + 1] = Math.round(srcImg.data[sIdx + 1] * a + dstImg.data[dIdx + 1] * inv);
        dstImg.data[dIdx + 2] = Math.round(srcImg.data[sIdx + 2] * a + dstImg.data[dIdx + 2] * inv);
        dstImg.data[dIdx + 3] = Math.max(da, sa);
      }
    }
  }
}

// 4x4 Grid
const GRID_SIZE = 4;
const positions = [];
for (let x = 0; x < GRID_SIZE; x++) {
  for (let y = 0; y < GRID_SIZE; y++) {
    positions.push({ x, y, order: x + y });
  }
}
// Sort back-to-front
positions.sort((a, b) => a.order - b.order);

const ORIGIN_X = 400 - scaled.width / 2;
const ORIGIN_Y = 120;

// Perfectly calibrated isometric step vectors (1px seamless overlap to prevent subpixel hairline gaps)
const DX_SE = (rightPt.x - topPt.x) * SCALE * 0.97;
const DY_SE = (rightPt.y - topPt.y) * SCALE * 0.97;
const DX_SW = (leftPt.x - topPt.x) * SCALE * 0.97;
const DY_SW = (leftPt.y - topPt.y) * SCALE * 0.97;

positions.forEach(pos => {
  const posX = ORIGIN_X + pos.x * DX_SE + pos.y * DX_SW;
  const posY = ORIGIN_Y + pos.x * DY_SE + pos.y * DY_SW;
  blit(scaled, canvas, posX, posY);
});

// Trim transparent bounds
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
console.log(`Saved seamless, defringed island-16-grid.png (${trimW}x${trimH}) to ${outPath}`);
