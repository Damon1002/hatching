const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourcePath = '/Users/damonsu/.gemini/antigravity-ide/brain/a372c335-010d-47c0-97a4-d344c2392c51/.user_uploaded/media_1787040152561.png';
const outputDir = path.join(__dirname, '..', 'assets', 'dragon', 'ruby');
const desktopDir = '/Users/damonsu/Desktop';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const poses = [
  { name: 'idle', minX: 19, maxX: 148, minY: 528, maxY: 642 },
  { name: 'sit', minX: 163, maxX: 257, minY: 531, maxY: 645 },
  { name: 'sleep', minX: 276, maxX: 409, minY: 562, maxY: 643 },
  { name: 'jump', minX: 418, maxX: 548, minY: 513, maxY: 621 },
  { name: 'flap', minX: 567, maxX: 745, minY: 522, maxY: 641 },
  { name: 'happy', minX: 700, maxX: 806, minY: 532, maxY: 645 },
  { name: 'front_left', minX: 384, maxX: 600, minY: 188, maxY: 347 },
  { name: 'front_right', minX: 612, maxX: 794, minY: 195, maxY: 350 },
  { name: 'left_side', minX: 72, maxX: 488, minY: 6, maxY: 174 },
  { name: 'right_side', minX: 536, maxX: 933, minY: 6, maxY: 175 },
];

async function extractPoses() {
  console.log('Extracting exact reference dragon poses...');

  for (const pose of poses) {
    const pad = 4;
    const left = Math.max(0, pose.minX - pad);
    const top = Math.max(0, pose.minY - pad);
    const width = pose.maxX - pose.minX + 1 + pad * 2;
    const height = pose.maxY - pose.minY + 1 + pad * 2;

    const outPath = path.join(outputDir, `${pose.name}.png`);

    await sharp(sourcePath)
      .extract({ left, top, width, height })
      .trim({ threshold: 10 })
      .png({ quality: 100 })
      .toFile(outPath);

    const meta = await sharp(outPath).metadata();
    console.log(`Saved ${pose.name}.png (${meta.width}x${meta.height})`);
  }

  // Also create a large high-res desktop preview of the primary idle and jump poses
  const primaryIdle = path.join(outputDir, 'idle.png');
  const primaryJump = path.join(outputDir, 'jump.png');
  const primaryHappy = path.join(outputDir, 'happy.png');

  await sharp(primaryIdle).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile(path.join(desktopDir, 'ruby-dragon-idle.png'));
  await sharp(primaryJump).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile(path.join(desktopDir, 'ruby-dragon-jump.png'));
  await sharp(primaryHappy).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile(path.join(desktopDir, 'ruby-dragon-happy.png'));

  // Also copy main idle to assets/dragon/ruby-dragon.png and /Users/damonsu/Desktop/ruby-dragon.png
  await sharp(primaryIdle).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile(path.join(desktopDir, 'ruby-dragon.png'));
  await sharp(primaryIdle).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFile(path.join(__dirname, '..', 'assets', 'dragon', 'ruby-dragon.png'));

  console.log('✅ All reference dragon poses extracted with 100% fidelity!');
}

extractPoses().catch(console.error);
