const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const refPath = path.join(__dirname, '..', 'assets', 'dragon', 'ruby', 'reference_assembled.png');
const outDir = path.join(__dirname, '..', 'assets', 'dragon', 'ruby', 'clean_layers');
const desktopDir = path.join('/Users/damonsu/Desktop', 'ruby-dragon-clean-layers');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
if (!fs.existsSync(desktopDir)) fs.mkdirSync(desktopDir, { recursive: true });

async function extractCleanLayers() {
  const { data, info } = await sharp(refPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // Let's create layered masks from the clean reference image:
  // 1. Back Wing (Left Wing)
  const wingLBuf = Buffer.alloc(width * height * 4, 0);
  // 2. Front Hero Wing (Right Wing)
  const wingRBuf = Buffer.alloc(width * height * 4, 0);
  // 3. Tail
  const tailBuf = Buffer.alloc(width * height * 4, 0);
  // 4. Head & Crest
  const headBuf = Buffer.alloc(width * height * 4, 0);
  // 5. Body Torso & Neck
  const bodyBuf = Buffer.alloc(width * height * 4, 0);
  // 6. Front Paw
  const pawFBuf = Buffer.alloc(width * height * 4, 0);
  // 7. Back Thigh & Paw
  const thighBuf = Buffer.alloc(width * height * 4, 0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a < 15) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Left Wing Region (x < 115, y between 65 and 150)
      if (x < 115 && y >= 65 && y <= 150) {
        wingLBuf[idx] = r; wingLBuf[idx + 1] = g; wingLBuf[idx + 2] = b; wingLBuf[idx + 3] = a;
      }
      // Right Wing Region (x > 140, y between 55 and 150)
      if (x >= 145 && y >= 55 && y <= 150) {
        wingRBuf[idx] = r; wingRBuf[idx + 1] = g; wingRBuf[idx + 2] = b; wingRBuf[idx + 3] = a;
      }
      // Tail Region (x < 100, y > 135)
      if (x < 100 && y > 135) {
        tailBuf[idx] = r; tailBuf[idx + 1] = g; tailBuf[idx + 2] = b; tailBuf[idx + 3] = a;
      }
      // Head & Crest Region (y < 85)
      if (y < 85 && (x >= 60 && x <= 215)) {
        headBuf[idx] = r; headBuf[idx + 1] = g; headBuf[idx + 2] = b; headBuf[idx + 3] = a;
      }
      // Front Paw Region (x > 145, y > 175)
      if (x > 145 && y > 175) {
        pawFBuf[idx] = r; pawFBuf[idx + 1] = g; pawFBuf[idx + 2] = b; pawFBuf[idx + 3] = a;
      }
      // Back Thigh Region (x >= 90 && x <= 145, y > 130)
      if (x >= 90 && x <= 145 && y > 130) {
        thighBuf[idx] = r; thighBuf[idx + 1] = g; thighBuf[idx + 2] = b; thighBuf[idx + 3] = a;
      }
      // Main Body & Neck (core)
      if (x >= 80 && x <= 180 && y >= 55 && y <= 215) {
        bodyBuf[idx] = r; bodyBuf[idx + 1] = g; bodyBuf[idx + 2] = b; bodyBuf[idx + 3] = a;
      }
    }
  }

  const layers = [
    { name: 'layer_wing_left', buf: wingLBuf },
    { name: 'layer_wing_right', buf: wingRBuf },
    { name: 'layer_tail', buf: tailBuf },
    { name: 'layer_head', buf: headBuf },
    { name: 'layer_body_neck', buf: bodyBuf },
    { name: 'layer_front_paw', buf: pawFBuf },
    { name: 'layer_back_thigh', buf: thighBuf },
  ];

  for (const l of layers) {
    const png = await sharp(l.buf, { raw: { width, height, channels: 4 } }).trim().png().toBuffer();
    fs.writeFileSync(path.join(outDir, `${l.name}.png`), png);
    await sharp(png).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile(path.join(desktopDir, `${l.name}.png`));
    console.log(`✓ Generated ${l.name}.png`);
  }

  console.log('✅ Clean layers generated in assets/dragon/ruby/clean_layers and Desktop!');
}

extractCleanLayers().catch(console.error);
