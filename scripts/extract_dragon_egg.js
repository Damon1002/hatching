const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputPath = '/Users/damonsu/.gemini/antigravity-ide/brain/2d94d889-3a7c-40d3-be91-47668dbfdf26/.user_uploaded/media_1787029315220.jpg';
const outputDir = path.join(__dirname, '..', 'assets', 'eggs');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processEgg() {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const outBuffer = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const maxVal = Math.max(r, g, b);
      const brightness = (r + g + b) / 3;

      let alpha = 255;
      if (maxVal < 6) {
        alpha = 0;
      } else if (maxVal < 32) {
        // Smooth anti-aliased edge falloff
        const t = (maxVal - 6) / 26;
        alpha = Math.round(t * 255);
        // Un-premultiply black background bleed
        const normA = alpha / 255;
        if (normA > 0.05) {
          outBuffer[idx] = Math.min(255, Math.round(r / normA));
          outBuffer[idx + 1] = Math.min(255, Math.round(g / normA));
          outBuffer[idx + 2] = Math.min(255, Math.round(b / normA));
          outBuffer[idx + 3] = alpha;
          continue;
        }
      }

      outBuffer[idx] = r;
      outBuffer[idx + 1] = g;
      outBuffer[idx + 2] = b;
      outBuffer[idx + 3] = alpha;
    }
  }

  const outPath = path.join(outputDir, 'dragon-egg-red.png');

  await sharp(outBuffer, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 5 })
    .png({ quality: 100 })
    .toFile(outPath);

  const finalMeta = await sharp(outPath).metadata();
  console.log(`Saved clean dragon egg to ${outPath} (${finalMeta.width}x${finalMeta.height})`);
}

processEgg().catch(console.error);
