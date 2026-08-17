const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputPath = '/Users/damonsu/.gemini/antigravity-ide/brain/2d94d889-3a7c-40d3-be91-47668dbfdf26/.user_uploaded/media_1786877557909.png';
const tilesDir = path.join(__dirname, '..', 'assets', 'tiles');

const data = fs.readFileSync(inputPath);
const srcPng = PNG.sync.read(data);

// Single block bounds
const bounds = { minX: 25, maxX: 315, minY: 158, maxY: 510 };
const width = bounds.maxX - bounds.minX + 1;
const height = bounds.maxY - bounds.minY + 1;
const tile = new PNG({ width, height });

// 1. Extract raw pixels
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const sx = bounds.minX + x;
    const sy = bounds.minY + y;
    const sIdx = (srcPng.width * sy + sx) << 2;
    const dIdx = (width * y + x) << 2;

    tile.data[dIdx] = srcPng.data[sIdx];
    tile.data[dIdx + 1] = srcPng.data[sIdx + 1];
    tile.data[dIdx + 2] = srcPng.data[sIdx + 2];
    tile.data[dIdx + 3] = srcPng.data[sIdx + 3];
  }
}

// 2. Color De-fringing (Remove white halo from edge pixels)
// White background threshold
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (width * y + x) << 2;
    const r = tile.data[idx];
    const g = tile.data[idx + 1];
    const b = tile.data[idx + 2];

    const brightness = (r + g + b) / 3;
    const colorDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

    // If pure white background
    if (brightness >= 242 && colorDiff <= 14) {
      tile.data[idx + 3] = 0;
    } else if (brightness > 220 && colorDiff <= 25) {
      // Semi-transparent edge pixel with white contamination
      // Un-blend white from RGB: C_true = (C_blend - (1-a)*255) / a
      const alphaNorm = (242 - brightness) / 22;
      const a = Math.max(0.1, Math.min(1.0, alphaNorm));

      // Remove the white 255 component to recover true green/brown
      const trueR = Math.max(0, Math.min(255, Math.round((r - (1 - a) * 255) / a)));
      const trueG = Math.max(0, Math.min(255, Math.round((g - (1 - a) * 255) / a)));
      const trueB = Math.max(0, Math.min(255, Math.round((b - (1 - a) * 255) / a)));

      tile.data[idx] = trueR;
      tile.data[idx + 1] = trueG;
      tile.data[idx + 2] = trueB;
      tile.data[idx + 3] = Math.round(a * 255);
    }
  }
}

// 3. Morphological Edge Erosion & Clamping on Grass Diamond
// Remove any 1px white border residue around outer edges
const defringed = new PNG({ width, height });
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (width * y + x) << 2;
    const a = tile.data[idx + 3];

    if (a < 60) {
      defringed.data[idx + 3] = 0;
      continue;
    }

    // Check neighbor alphas
    let transparentNeighbors = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          transparentNeighbors++;
        } else {
          const nIdx = (width * ny + nx) << 2;
          if (tile.data[nIdx + 3] < 30) transparentNeighbors++;
        }
      }
    }

    // If on the extreme edge and has high brightness (white bleed)
    const r = tile.data[idx];
    const g = tile.data[idx + 1];
    const b = tile.data[idx + 2];
    const brightness = (r + g + b) / 3;

    if (transparentNeighbors >= 3 && brightness > 210) {
      defringed.data[idx + 3] = 0;
    } else {
      defringed.data[idx] = r;
      defringed.data[idx + 1] = g;
      defringed.data[idx + 2] = b;
      defringed.data[idx + 3] = a;
    }
  }
}

fs.writeFileSync(path.join(tilesDir, 'tile-single.png'), PNG.sync.write(defringed));
console.log('Saved defringed tile-single.png');
