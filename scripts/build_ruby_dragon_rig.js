const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourcePath = '/Users/damonsu/.gemini/antigravity-ide/brain/a372c335-010d-47c0-97a4-d344c2392c51/.user_uploaded/media_1787040152561.png';
const outputDir = path.join(__dirname, '..', 'assets', 'dragon', 'ruby', 'rig');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

async function createLayeredRig() {
  console.log('Building layered skeletal rig assets from reference artwork...');

  // 1. Extract Isolated Wing Details (Left spread wing from WING DETAILS)
  await sharp(sourcePath)
    .extract({ left: 658, top: 395, width: 121, height: 104 })
    .trim({ threshold: 5 })
    .png()
    .toFile(path.join(outputDir, 'wing_hero.png'));

  // 2. Extract Idle Pose Body
  const idleRaw = await sharp(sourcePath)
    .extract({ left: 19, top: 528, width: 130, height: 115 })
    .png()
    .toBuffer();

  // Save idle base
  await sharp(idleRaw).toFile(path.join(outputDir, 'body_base.png'));

  // 3. Extract Front Wing from Idle Pose (x: 50..120, y: 40..100 within idle box)
  const idleImg = sharp(idleRaw);
  const idleMeta = await idleImg.metadata();

  // 4. Extract Jump Pose for flight animation
  await sharp(sourcePath)
    .extract({ left: 418, top: 515, width: 130, height: 107 })
    .trim({ threshold: 5 })
    .png()
    .toFile(path.join(outputDir, 'jump_flight.png'));

  // 5. Extract Wing Flap pose
  await sharp(sourcePath)
    .extract({ left: 567, top: 522, width: 179, height: 120 })
    .trim({ threshold: 5 })
    .png()
    .toFile(path.join(outputDir, 'wing_flap.png'));

  // 6. Extract Excited / Happy pose
  await sharp(sourcePath)
    .extract({ left: 700, top: 532, width: 107, height: 114 })
    .trim({ threshold: 5 })
    .png()
    .toFile(path.join(outputDir, 'happy.png'));

  console.log('✅ Layered rig assets created successfully!');
}

createLayeredRig().catch(console.error);
