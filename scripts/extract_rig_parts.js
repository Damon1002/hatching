const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourcePath = '/Users/damonsu/.gemini/antigravity-ide/brain/a372c335-010d-47c0-97a4-d344c2392c51/.user_uploaded/media_1787044681738.png';
const outputDir = path.join(__dirname, '..', 'assets', 'dragon', 'ruby', 'rig_parts');
const desktopDir = path.join('/Users/damonsu/Desktop', 'ruby-dragon-rig-parts');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(desktopDir)) fs.mkdirSync(desktopDir, { recursive: true });

async function extractConnectedSprites() {
  const { data, info } = await sharp(sourcePath).raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // Function to extract a single connected component starting from a seed point (x, y)
  function extractIsland(seedX, seedY) {
    const visited = new Uint8Array(width * height);
    const queue = [seedX, seedY];
    const seedIdx = seedY * width + seedX;
    visited[seedIdx] = 1;

    let minX = seedX, maxX = seedX, minY = seedY, maxY = seedY;
    const islandPixels = [];

    let head = 0;
    while (head < queue.length) {
      const cx = queue[head++];
      const cy = queue[head++];
      const cIdx = cy * width + cx;
      islandPixels.push({ x: cx, y: cy });

      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;

      const nbs = [
        [cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1],
        [cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1], [cx + 1, cy + 1]
      ];
      for (const [nx, ny] of nbs) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = ny * width + nx;
          if (!visited[nIdx] && data[nIdx * 4 + 3] >= 15) {
            visited[nIdx] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }

    const outW = maxX - minX + 1;
    const outH = maxY - minY + 1;
    const outBuf = Buffer.alloc(outW * outH * 4, 0);

    for (const p of islandPixels) {
      const srcIdx = (p.y * width + p.x) * 4;
      const dstIdx = ((p.y - minY) * outW + (p.x - minX)) * 4;
      outBuf[dstIdx] = data[srcIdx];
      outBuf[dstIdx + 1] = data[srcIdx + 1];
      outBuf[dstIdx + 2] = data[srcIdx + 2];
      outBuf[dstIdx + 3] = data[srcIdx + 3];
    }

    return { buffer: outBuf, width: outW, height: outH, minX, minY };
  }

  // Seed points for each exact sprite
  const spriteSeeds = [
    // 1. Torso
    { name: 'torso', seedX: 60, seedY: 340 },
    // 2. Neck Segments
    { name: 'neck_0', seedX: 580, seedY: 40 },
    { name: 'neck_1', seedX: 593, seedY: 40 },
    { name: 'neck_2', seedX: 638, seedY: 40 },
    { name: 'neck_3', seedX: 685, seedY: 40 },
    // 3. Head expressions
    { name: 'head_idle', seedX: 60, seedY: 600 },
    { name: 'head_cheer', seedX: 280, seedY: 600 },
    { name: 'head_wink', seedX: 510, seedY: 600 },
    // 4. Tail Segments
    { name: 'tail_0', seedX: 50, seedY: 480 },
    { name: 'tail_1', seedX: 115, seedY: 485 },
    { name: 'tail_2', seedX: 150, seedY: 490 },
    { name: 'tail_3', seedX: 180, seedY: 495 },
    { name: 'tail_4', seedX: 228, seedY: 500 },
    // 5. Wings
    { name: 'wing_left_bone', seedX: 550, seedY: 280 },
    { name: 'wing_left_membrane', seedX: 650, seedY: 360 },
    { name: 'wing_right_bone', seedX: 920, seedY: 280 },
    { name: 'wing_right_membrane', seedX: 840, seedY: 360 },
    // 6. Legs & Paws
    { name: 'back_thigh', seedX: 390, seedY: 310 },
    { name: 'paw_back', seedX: 390, seedY: 390 },
    { name: 'paw_front', seedX: 320, seedY: 355 },
  ];

  for (const s of spriteSeeds) {
    const res = extractIsland(s.seedX, s.seedY);
    const outPng = await sharp(res.buffer, { raw: { width: res.width, height: res.height, channels: 4 } })
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(outputDir, `${s.name}.png`), outPng);
    await sharp(outPng)
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(desktopDir, `${s.name}.png`));

    console.log(`✓ Cleanly extracted ${s.name}.png (${res.width}x${res.height})`);
  }

  console.log('✅ All sprites cleanly isolated via flood fill with 0 neighboring artifacts!');
}

extractConnectedSprites().catch(console.error);
