const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourcePath = '/Users/damonsu/.gemini/antigravity-ide/brain/a372c335-010d-47c0-97a4-d344c2392c51/.user_uploaded/media_1787043294312.png';
const outputDir = path.join(__dirname, '..', 'assets', 'dragon', 'ruby', 'postures');
const desktopDir = path.join('/Users/damonsu/Desktop', 'ruby-dragon-postures');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(desktopDir)) fs.mkdirSync(desktopDir, { recursive: true });

const postures = [
  { id: 1, name: 'p1_standing_tail_up', label: '1. 挺胸扬尾 (Standing Tail Up)', minX: 38, maxX: 249, minY: 7, maxY: 237 },
  { id: 2, name: 'p2_standing_neck_high', label: '2. 昂首远眺 (Standing Neck High)', minX: 286, maxX: 499, minY: 9, maxY: 234 },
  { id: 3, name: 'p3_front_wings_spread', label: '3. 正面展翅 (Front Wings Spread)', minX: 538, maxX: 768, minY: 12, maxY: 234 },
  { id: 4, name: 'p4_standing_tail_arch', label: '4. 拱尾静立 (Standing Tail Arch)', minX: 798, maxX: 978, minY: 7, maxY: 234 },
  { id: 5, name: 'p5_happy_hop', label: '5. 欢快起跳 (Happy Hop / Jump)', minX: 26, maxX: 242, minY: 250, maxY: 454 },
  { id: 6, name: 'p6_relaxed_sit', label: '6. 乖巧端坐 (Relaxed Sit / Idle)', minX: 290, maxX: 493, minY: 250, maxY: 454 },
  { id: 7, name: 'p7_cute_wink', label: '7. 俏皮眨眼 (Cute Wink)', minX: 548, maxX: 743, minY: 257, maxY: 450 },
  { id: 8, name: 'p8_alert_stand', label: '8. 警觉指引 (Alert Stand)', minX: 802, maxX: 998, minY: 248, maxY: 453 },
  { id: 9, name: 'p9_sleeping_crawl', label: '9. 趴卧休憩 (Sleeping / Crawl)', minX: 21, maxX: 280, minY: 522, maxY: 644 },
  { id: 10, name: 'p10_excited_cheer', label: '10. 欢呼雀跃 (Excited Cheer / Roar)', minX: 290, maxX: 493, minY: 467, maxY: 661 },
  { id: 11, name: 'p11_attentive_stand', label: '11. 专注伫立 (Attentive Stand)', minX: 548, maxX: 718, minY: 460, maxY: 665 },
  { id: 12, name: 'p12_wings_fanned_sit', label: '12. 舒展大坐 (Wings Fanned Sit)', minX: 789, maxX: 1006, minY: 462, maxY: 663 },
];

async function extractAll() {
  console.log('Extracting all 12 postures from new reference sheet...');

  for (const p of postures) {
    const left = p.minX;
    const top = p.minY;
    const width = p.maxX - p.minX + 1;
    const height = p.maxY - p.minY + 1;

    const croppedBuf = await sharp(sourcePath)
      .extract({ left, top, width, height })
      .png({ quality: 100 })
      .toBuffer();

    const outAsset = path.join(outputDir, `${p.name}.png`);
    const outDesktop = path.join(desktopDir, `${p.id}_${p.name}.png`);

    fs.writeFileSync(outAsset, croppedBuf);

    await sharp(croppedBuf)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 100 })
      .toFile(outDesktop);

    const meta = await sharp(croppedBuf).metadata();
    console.log(`✓ Saved ${p.name}.png (${meta.width}x${meta.height})`);
  }

  // Update primary default assets for the game:
  // Default Idle: Posture 6 (Relaxed Sit)
  // Default Jump: Posture 5 (Happy Hop)
  // Default Happy / Cheer: Posture 10 (Excited Cheer)
  // Default Wink: Posture 7 (Cute Wink)
  // Default Sleep: Posture 9 (Sleeping Crawl)
  const idleBuf = fs.readFileSync(path.join(outputDir, 'p6_relaxed_sit.png'));
  fs.writeFileSync(path.join(__dirname, '..', 'assets', 'dragon', 'ruby-dragon.png'), idleBuf);
  await sharp(idleBuf)
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(path.join('/Users/damonsu/Desktop', 'ruby-dragon.png'));

  console.log('✅ All 12 postures extracted cleanly to assets/dragon/ruby/postures and /Users/damonsu/Desktop/ruby-dragon-postures!');
}

extractAll().catch(console.error);
