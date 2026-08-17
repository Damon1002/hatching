const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const atlasPath = path.join(__dirname, '..', 'assets', 'tiles', 'top-atlas.png');
const img = PNG.sync.read(fs.readFileSync(atlasPath));

// Inspect stitch style on bottom/left border to replicate it exactly on top/right
// Stitch pattern: dotted dark dots (size ~ 6x6, spacing ~ 16px, distance from edge ~ 14px)
// Stitch color: RGBA(52, 45, 24, 255) with slight highlight RGBA(195, 185, 120, 180)

const DOT_COLOR = [48, 42, 22, 255];
const HIGHLIGHT_COLOR = [185, 175, 110, 160];
const OFFSET = 15; // px from edge
const SPACING = 16; // px between dots
const DOT_SIZE = 5;

function drawDot(cx, cy) {
  for (let dy = -DOT_SIZE; dy <= DOT_SIZE; dy++) {
    for (let dx = -DOT_SIZE; dx <= DOT_SIZE; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= DOT_SIZE * 0.7) {
        const px = Math.round(cx + dx);
        const py = Math.round(cy + dy);
        if (px >= 0 && px < img.width && py >= 0 && py < img.height) {
          const idx = (img.width * py + px) << 2;
          img.data[idx] = DOT_COLOR[0];
          img.data[idx + 1] = DOT_COLOR[1];
          img.data[idx + 2] = DOT_COLOR[2];
          img.data[idx + 3] = DOT_COLOR[3];
        }
      }
    }
  }
}

// 1. Draw dotted border on Top edge (y = OFFSET)
for (let x = OFFSET; x < img.width - OFFSET; x += SPACING) {
  drawDot(x, OFFSET);
}

// 2. Draw dotted border on Right edge (x = img.width - OFFSET)
for (let y = OFFSET; y < img.height - OFFSET; y += SPACING) {
  drawDot(img.width - OFFSET, y);
}

// 3. Draw dotted border on Bottom edge (y = img.height - OFFSET)
for (let x = OFFSET; x < img.width - OFFSET; x += SPACING) {
  drawDot(x, img.height - OFFSET);
}

// 4. Draw dotted border on Left edge (x = OFFSET)
for (let y = OFFSET; y < img.height - OFFSET; y += SPACING) {
  drawDot(OFFSET, y);
}

fs.writeFileSync(atlasPath, PNG.sync.write(img));
console.log('Successfully added symmetrical dotted stitches to all 4 borders of top-atlas.png');
