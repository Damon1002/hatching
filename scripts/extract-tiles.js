const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputPath = '/Users/damonsu/.gemini/antigravity-ide/brain/2d94d889-3a7c-40d3-be91-47668dbfdf26/.user_uploaded/media_1786877557909.png';
const outputDir = path.join(__dirname, '..', 'assets', 'tiles');

const data = fs.readFileSync(inputPath);
const srcPng = PNG.sync.read(data);

function cropAndMatte(bounds, filename) {
  const { minX, maxX, minY, maxY } = bounds;
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const dstPng = new PNG({ width, height });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcX = minX + x;
      const srcY = minY + y;
      const srcIdx = (srcPng.width * srcY + srcX) << 2;
      const dstIdx = (width * y + x) << 2;

      const r = srcPng.data[srcIdx];
      const g = srcPng.data[srcIdx + 1];
      const b = srcPng.data[srcIdx + 2];

      const brightness = (r + g + b) / 3;
      const colorDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

      let alpha = 255;
      if (brightness > 244 && colorDiff < 14) {
        alpha = 0;
      } else if (brightness > 225 && colorDiff < 20) {
        const t = (244 - brightness) / 19;
        alpha = Math.round(Math.max(0, Math.min(255, t * 255)));
      }

      dstPng.data[dstIdx] = r;
      dstPng.data[dstIdx + 1] = g;
      dstPng.data[dstIdx + 2] = b;
      dstPng.data[dstIdx + 3] = alpha;
    }
  }

  const outPath = path.join(outputDir, filename);
  fs.writeFileSync(outPath, PNG.sync.write(dstPng));
  console.log(`Saved ${filename} (${width}x${height})`);
}

// Clean tight crops
cropAndMatte({ minX: 25, maxX: 315, minY: 158, maxY: 510 }, 'tile-single.png');
cropAndMatte({ minX: 352, maxX: 656, minY: 158, maxY: 510 }, 'tile-cliff.png');
cropAndMatte({ minX: 662, maxX: 978, minY: 178, maxY: 510 }, 'tile-corner.png');
