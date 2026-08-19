const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rigDir = path.join(__dirname, '..', 'assets', 'dragon', 'ruby', 'rig_parts');
const refPath = path.join(__dirname, '..', 'assets', 'dragon', 'ruby', 'reference_assembled.png');
const outTestPath = path.join(__dirname, '..', 'assets', 'dragon', 'ruby', 'test_assembled_rig.png');

async function testAssemble() {
  // Let's get reference metadata
  const refMeta = await sharp(refPath).metadata();
  const W = 500;
  const H = 500;

  // Let's create an empty 500x500 transparent canvas and composite each extracted part at exact calibrated offsets:
  const compositeList = [
    // 1. Left Wing (Back Wing)
    {
      input: await sharp(path.join(rigDir, 'wing_left_membrane.png')).resize(210, 150, { fit: 'contain' }).toBuffer(),
      left: 15,
      top: 155,
    },
    {
      input: await sharp(path.join(rigDir, 'wing_left_bone.png')).resize(170, 120, { fit: 'contain' }).toBuffer(),
      left: 35,
      top: 155,
    },

    // 2. Tail Chain
    {
      input: await sharp(path.join(rigDir, 'tail_0.png')).resize(140, 110, { fit: 'contain' }).toBuffer(),
      left: 20,
      top: 310,
    },

    // 3. Back Thigh & Paw
    {
      input: await sharp(path.join(rigDir, 'back_thigh.png')).resize(110, 140, { fit: 'contain' }).toBuffer(),
      left: 175,
      top: 315,
    },
    {
      input: await sharp(path.join(rigDir, 'paw_back.png')).resize(75, 55, { fit: 'contain' }).toBuffer(),
      left: 185,
      top: 405,
    },

    // 4. Torso Body
    {
      input: await sharp(path.join(rigDir, 'torso.png')).resize(185, 200, { fit: 'contain' }).toBuffer(),
      left: 175,
      top: 250,
    },

    // 5. Neck Vertebrae
    {
      input: await sharp(path.join(rigDir, 'neck_0.png')).resize(75, 120, { fit: 'contain' }).toBuffer(),
      left: 265,
      top: 215,
    },
    {
      input: await sharp(path.join(rigDir, 'neck_1.png')).resize(75, 120, { fit: 'contain' }).toBuffer(),
      left: 275,
      top: 175,
    },
    {
      input: await sharp(path.join(rigDir, 'neck_2.png')).resize(75, 125, { fit: 'contain' }).toBuffer(),
      left: 285,
      top: 135,
    },
    {
      input: await sharp(path.join(rigDir, 'neck_3.png')).resize(75, 125, { fit: 'contain' }).toBuffer(),
      left: 295,
      top: 95,
    },

    // 6. Head
    {
      input: await sharp(path.join(rigDir, 'head_idle.png')).resize(185, 145, { fit: 'contain' }).toBuffer(),
      left: 245,
      top: 15,
    },

    // 7. Right Wing (Hero Front Wing)
    {
      input: await sharp(path.join(rigDir, 'wing_right_membrane.png')).resize(210, 160, { fit: 'contain' }).toBuffer(),
      left: 290,
      top: 130,
    },
    {
      input: await sharp(path.join(rigDir, 'wing_right_bone.png')).resize(180, 120, { fit: 'contain' }).toBuffer(),
      left: 310,
      top: 130,
    },

    // 8. Front Paw
    {
      input: await sharp(path.join(rigDir, 'paw_front.png')).resize(65, 65, { fit: 'contain' }).toBuffer(),
      left: 310,
      top: 405,
    },
  ];

  await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(compositeList)
    .png()
    .toFile(outTestPath);

  console.log('✅ Generated test_assembled_rig.png');
}

testAssemble().catch(console.error);
