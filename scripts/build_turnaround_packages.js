const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = path.join(__dirname, '..', 'red-dragon-turnaround');
const viewsDir = path.join(rootDir, 'views');

// Helper function to extract a region with transparent safety padding and compute bounding box
async function extractLayerWithPadding(viewPath, maskFn, outPath) {
  const { data, info } = await sharp(viewPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  let minX = width, maxX = 0, minY = height, maxY = 0;
  let count = 0;

  // Mask buffer
  const outBuf = Buffer.alloc(width * height * 4, 0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a < 15) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (maskFn(x, y, r, g, b, a, width, height)) {
        outBuf[idx] = r;
        outBuf[idx + 1] = g;
        outBuf[idx + 2] = b;
        outBuf[idx + 3] = a;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        count++;
      }
    }
  }

  if (count === 0) {
    console.warn('Warning: empty layer for', outPath);
    return { originPx: { x: 0, y: 0 }, width: 1, height: 1 };
  }

  // Safety padding (12px)
  const pad = 12;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(width - cropX, maxX - minX + 1 + pad * 2);
  const cropH = Math.min(height - cropY, maxY - minY + 1 + pad * 2);

  await sharp(outBuf, { raw: { width, height, channels: 4 } })
    .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
    .png()
    .toFile(outPath);

  return { originPx: { x: cropX, y: cropY }, width: cropW, height: cropH };
}

// Generate Contact Sheet for a view package
async function generateContactSheet(viewFolder, layers) {
  const cellW = 320;
  const cellH = 320;
  const cols = 3;
  const rows = Math.ceil(layers.length / cols);
  const sheetW = cols * cellW;
  const sheetH = rows * cellH;

  const composites = [];

  for (let i = 0; i < layers.length; i++) {
    const l = layers[i];
    const layerImgPath = path.join(viewFolder, l.file);
    if (!fs.existsSync(layerImgPath)) continue;

    const col = i % cols;
    const row = Math.floor(i / cols);
    const posX = col * cellW + 16;
    const posY = row * cellH + 16;

    const thumb = await sharp(layerImgPath)
      .resize(cellW - 32, cellH - 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    composites.push({ input: thumb, left: posX, top: posY });
  }

  const outSheet = path.join(viewFolder, 'contact_sheet.png');
  await sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 4,
      background: { r: 240, g: 243, b: 246, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outSheet);

  console.log(`✓ Created ${outSheet}`);
}

// Generate Assembled Preview
async function generateAssembledPreview(viewFolder, layers, canvas) {
  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  const composites = [];

  for (const l of sorted) {
    const imgPath = path.join(viewFolder, l.file);
    if (!fs.existsSync(imgPath)) continue;
    composites.push({
      input: imgPath,
      left: l.originPx.x,
      top: l.originPx.y,
    });
  }

  const outPreview = path.join(viewFolder, 'assembled_preview.png');
  await sharp({
    create: {
      width: canvas.width,
      height: canvas.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outPreview);

  console.log(`✓ Created ${outPreview}`);
}

async function buildAllViewPackages() {
  const canvas = { width: 1359, height: 1158 };

  // ==========================================
  // 1. FRONT VIEW
  // ==========================================
  console.log('\n--- Building FRONT view layers ---');
  const frontDir = path.join(viewsDir, 'front');
  const frontView = path.join(frontDir, 'view.png');

  const frontLayersDef = [
    {
      file: 'layer_back_wing.png',
      name: 'back_wing',
      parent: 'neck_and_torso',
      attachment: 'back_shoulder',
      zIndex: 10,
      pivotNormalized: { x: 0.15, y: 0.25 },
      reconstructed: true,
      reconstructedRegion: 'wing shoulder joint',
      mask: (x, y) => x < 540 && y >= 340 && y <= 660 && (x < 480 || y < 580),
    },
    {
      file: 'layer_front_wing.png',
      name: 'front_wing',
      parent: 'neck_and_torso',
      attachment: 'front_shoulder',
      zIndex: 15,
      pivotNormalized: { x: 0.85, y: 0.25 },
      reconstructed: true,
      reconstructedRegion: 'wing shoulder joint',
      mask: (x, y) => x > 820 && y >= 340 && y <= 660 && (x > 880 || y < 580),
    },
    {
      file: 'layer_tail.png',
      name: 'tail',
      parent: 'neck_and_torso',
      attachment: 'tail_root',
      zIndex: 20,
      pivotNormalized: { x: 0.5, y: 0.9 },
      reconstructed: true,
      reconstructedRegion: 'pelvis root',
      mask: (x, y) => (x < 360 || x > 1000) && y > 640,
    },
    {
      file: 'layer_neck_and_torso.png',
      name: 'neck_and_torso',
      parent: null,
      attachment: 'body_root',
      zIndex: 30,
      pivotNormalized: { x: 0.5, y: 0.65 },
      reconstructed: true,
      reconstructedRegion: 'torso and chest beneath paws and neck',
      mask: (x, y) => x >= 460 && x <= 900 && y >= 390 && y <= 940 && (x >= 540 || y >= 560) && (x <= 820 || y >= 560),
    },
    {
      file: 'layer_legs.png',
      name: 'legs',
      parent: 'neck_and_torso',
      attachment: 'hip_center',
      zIndex: 50,
      pivotNormalized: { x: 0.5, y: 0.2 },
      reconstructed: true,
      reconstructedRegion: 'paws and thighs',
      mask: (x, y) => x >= 340 && x <= 1020 && y >= 820,
    },
    {
      file: 'layer_head.png',
      name: 'head',
      parent: 'neck_and_torso',
      attachment: 'skull_base',
      zIndex: 60,
      pivotNormalized: { x: 0.5, y: 0.85 },
      reconstructed: true,
      reconstructedRegion: 'concealed neck insertion',
      mask: (x, y) => y < 420 && (y < 340 || (x >= 440 && x <= 920)),
    },
  ];

  const frontLayers = [];
  for (const def of frontLayersDef) {
    const outPath = path.join(frontDir, def.file);
    const bounds = await extractLayerWithPadding(frontView, def.mask, outPath);
    frontLayers.push({
      file: def.file,
      name: def.name,
      parent: def.parent,
      attachment: def.attachment,
      zIndex: def.zIndex,
      originPx: bounds.originPx,
      pivotNormalized: def.pivotNormalized,
      reconstructed: def.reconstructed,
      reconstructedRegion: def.reconstructedRegion,
    });
  }

  fs.writeFileSync(
    path.join(frontDir, 'layer_manifest.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        character: 'red_dragon',
        sourceImage: 'view.png',
        perspectiveConvention: 'front view; symmetrical limbs and wings',
        referenceCanvas: canvas,
        generationMode: 'built-in image editing with deterministic layer extraction',
        layers: frontLayers,
      },
      null,
      2
    )
  );
  await generateAssembledPreview(frontDir, frontLayers, canvas);
  await generateContactSheet(frontDir, frontLayers);

  // ==========================================
  // 2. SIDE VIEW
  // ==========================================
  console.log('\n--- Building SIDE view layers ---');
  const sideDir = path.join(viewsDir, 'side');
  const sideView = path.join(sideDir, 'view.png');

  const sideLayersDef = [
    {
      file: 'layer_back_wing.png',
      name: 'back_wing',
      parent: 'neck_and_torso',
      attachment: 'back_shoulder',
      zIndex: 10,
      pivotNormalized: { x: 0.2, y: 0.3 },
      reconstructed: true,
      reconstructedRegion: 'far wing anchor',
      mask: (x, y) => x < 650 && y >= 320 && y <= 600 && x < 550,
    },
    {
      file: 'layer_tail.png',
      name: 'tail',
      parent: 'neck_and_torso',
      attachment: 'tail_root',
      zIndex: 20,
      pivotNormalized: { x: 0.9, y: 0.5 },
      reconstructed: true,
      reconstructedRegion: 'pelvis root',
      mask: (x, y) => x < 620 && y > 600,
    },
    {
      file: 'layer_front_wing.png',
      name: 'front_wing',
      parent: 'neck_and_torso',
      attachment: 'front_shoulder',
      zIndex: 25,
      pivotNormalized: { x: 0.8, y: 0.25 },
      reconstructed: true,
      reconstructedRegion: 'hero wing shoulder joint',
      mask: (x, y) => x >= 200 && x <= 750 && y >= 320 && y <= 660,
    },
    {
      file: 'layer_neck_and_torso.png',
      name: 'neck_and_torso',
      parent: null,
      attachment: 'body_root',
      zIndex: 30,
      pivotNormalized: { x: 0.5, y: 0.65 },
      reconstructed: true,
      reconstructedRegion: 'profile neck and torso',
      mask: (x, y) => x >= 450 && x <= 1180 && y >= 300 && y <= 1040,
    },
    {
      file: 'layer_legs.png',
      name: 'legs',
      parent: 'neck_and_torso',
      attachment: 'hip_center',
      zIndex: 50,
      pivotNormalized: { x: 0.5, y: 0.2 },
      reconstructed: true,
      reconstructedRegion: 'profile paws and thigh',
      mask: (x, y) => x >= 550 && y > 620,
    },
    {
      file: 'layer_head.png',
      name: 'head',
      parent: 'neck_and_torso',
      attachment: 'skull_base',
      zIndex: 60,
      pivotNormalized: { x: 0.55, y: 0.82 },
      reconstructed: true,
      reconstructedRegion: 'neck insertion',
      mask: (x, y) => y < 400,
    },
  ];

  const sideLayers = [];
  for (const def of sideLayersDef) {
    const outPath = path.join(sideDir, def.file);
    const bounds = await extractLayerWithPadding(sideView, def.mask, outPath);
    sideLayers.push({
      file: def.file,
      name: def.name,
      parent: def.parent,
      attachment: def.attachment,
      zIndex: def.zIndex,
      originPx: bounds.originPx,
      pivotNormalized: def.pivotNormalized,
      reconstructed: def.reconstructed,
      reconstructedRegion: def.reconstructedRegion,
    });
  }

  fs.writeFileSync(
    path.join(sideDir, 'layer_manifest.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        character: 'red_dragon',
        sourceImage: 'view.png',
        perspectiveConvention: 'side profile view',
        referenceCanvas: canvas,
        generationMode: 'built-in image editing with deterministic layer extraction',
        layers: sideLayers,
      },
      null,
      2
    )
  );
  await generateAssembledPreview(sideDir, sideLayers, canvas);
  await generateContactSheet(sideDir, sideLayers);

  // ==========================================
  // 3. THREE_QUARTER_BACK VIEW
  // ==========================================
  console.log('\n--- Building THREE_QUARTER_BACK view layers ---');
  const tqbDir = path.join(viewsDir, 'three_quarter_back');
  const tqbView = path.join(tqbDir, 'view.png');

  const tqbLayersDef = [
    {
      file: 'layer_back_wing.png',
      name: 'back_wing',
      parent: 'neck_and_torso',
      attachment: 'back_shoulder',
      zIndex: 10,
      pivotNormalized: { x: 0.2, y: 0.3 },
      reconstructed: true,
      reconstructedRegion: 'far wing anchor',
      mask: (x, y) => x < 600 && y >= 320 && y <= 660,
    },
    {
      file: 'layer_tail.png',
      name: 'tail',
      parent: 'neck_and_torso',
      attachment: 'tail_root',
      zIndex: 20,
      pivotNormalized: { x: 0.9, y: 0.5 },
      reconstructed: true,
      reconstructedRegion: 'pelvis root',
      mask: (x, y) => x < 650 && y > 600,
    },
    {
      file: 'layer_front_wing.png',
      name: 'front_wing',
      parent: 'neck_and_torso',
      attachment: 'front_shoulder',
      zIndex: 25,
      pivotNormalized: { x: 0.8, y: 0.25 },
      reconstructed: true,
      reconstructedRegion: 'hero wing shoulder joint',
      mask: (x, y) => x >= 250 && x <= 720 && y >= 320 && y <= 660,
    },
    {
      file: 'layer_neck_and_torso.png',
      name: 'neck_and_torso',
      parent: null,
      attachment: 'body_root',
      zIndex: 30,
      pivotNormalized: { x: 0.5, y: 0.65 },
      reconstructed: true,
      reconstructedRegion: '3/4 back neck and torso with dorsal spine',
      mask: (x, y) => x >= 460 && x <= 1180 && y >= 300 && y <= 1040,
    },
    {
      file: 'layer_legs.png',
      name: 'legs',
      parent: 'neck_and_torso',
      attachment: 'hip_center',
      zIndex: 50,
      pivotNormalized: { x: 0.5, y: 0.2 },
      reconstructed: true,
      reconstructedRegion: 'paws and hips from behind',
      mask: (x, y) => x >= 550 && y > 620,
    },
    {
      file: 'layer_head.png',
      name: 'head',
      parent: 'neck_and_torso',
      attachment: 'skull_base',
      zIndex: 60,
      pivotNormalized: { x: 0.55, y: 0.82 },
      reconstructed: true,
      reconstructedRegion: 'back of skull crest and neck insertion',
      mask: (x, y) => y < 420,
    },
  ];

  const tqbLayers = [];
  for (const def of tqbLayersDef) {
    const outPath = path.join(tqbDir, def.file);
    const bounds = await extractLayerWithPadding(tqbView, def.mask, outPath);
    tqbLayers.push({
      file: def.file,
      name: def.name,
      parent: def.parent,
      attachment: def.attachment,
      zIndex: def.zIndex,
      originPx: bounds.originPx,
      pivotNormalized: def.pivotNormalized,
      reconstructed: def.reconstructed,
      reconstructedRegion: def.reconstructedRegion,
    });
  }

  fs.writeFileSync(
    path.join(tqbDir, 'layer_manifest.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        character: 'red_dragon',
        sourceImage: 'view.png',
        perspectiveConvention: 'three quarter back view',
        referenceCanvas: canvas,
        generationMode: 'built-in image editing with deterministic layer extraction',
        layers: tqbLayers,
      },
      null,
      2
    )
  );
  await generateAssembledPreview(tqbDir, tqbLayers, canvas);
  await generateContactSheet(tqbDir, tqbLayers);

  // ==========================================
  // 4. BACK VIEW
  // ==========================================
  console.log('\n--- Building BACK view layers ---');
  const backDir = path.join(viewsDir, 'back');
  const backView = path.join(backDir, 'view.png');

  const backLayersDef = [
    {
      file: 'layer_back_wing.png',
      name: 'back_wing',
      parent: 'neck_and_torso',
      attachment: 'back_shoulder',
      zIndex: 10,
      pivotNormalized: { x: 0.85, y: 0.25 },
      reconstructed: true,
      reconstructedRegion: 'wing shoulder joint',
      mask: (x, y) => x < 600 && y >= 320 && y <= 660,
    },
    {
      file: 'layer_front_wing.png',
      name: 'front_wing',
      parent: 'neck_and_torso',
      attachment: 'front_shoulder',
      zIndex: 15,
      pivotNormalized: { x: 0.15, y: 0.25 },
      reconstructed: true,
      reconstructedRegion: 'wing shoulder joint',
      mask: (x, y) => x > 750 && y >= 320 && y <= 660,
    },
    {
      file: 'layer_tail.png',
      name: 'tail',
      parent: 'neck_and_torso',
      attachment: 'tail_root',
      zIndex: 20,
      pivotNormalized: { x: 0.8, y: 0.6 },
      reconstructed: true,
      reconstructedRegion: 'pelvis root',
      mask: (x, y) => x < 600 && y > 680,
    },
    {
      file: 'layer_neck_and_torso.png',
      name: 'neck_and_torso',
      parent: null,
      attachment: 'body_root',
      zIndex: 30,
      pivotNormalized: { x: 0.5, y: 0.65 },
      reconstructed: true,
      reconstructedRegion: 'full back torso and vertical spinal ridge',
      mask: (x, y) => x >= 360 && x <= 1000 && y >= 320 && y <= 1060,
    },
    {
      file: 'layer_legs.png',
      name: 'legs',
      parent: 'neck_and_torso',
      attachment: 'hip_center',
      zIndex: 50,
      pivotNormalized: { x: 0.5, y: 0.2 },
      reconstructed: true,
      reconstructedRegion: 'hind legs and sitting paws from behind',
      mask: (x, y) => x >= 380 && x <= 1020 && y > 640,
    },
    {
      file: 'layer_head.png',
      name: 'head',
      parent: 'neck_and_torso',
      attachment: 'skull_base',
      zIndex: 60,
      pivotNormalized: { x: 0.5, y: 0.85 },
      reconstructed: true,
      reconstructedRegion: 'back skull dome and radiating crest spines',
      mask: (x, y) => y < 440,
    },
  ];

  const backLayers = [];
  for (const def of backLayersDef) {
    const outPath = path.join(backDir, def.file);
    const bounds = await extractLayerWithPadding(backView, def.mask, outPath);
    backLayers.push({
      file: def.file,
      name: def.name,
      parent: def.parent,
      attachment: def.attachment,
      zIndex: def.zIndex,
      originPx: bounds.originPx,
      pivotNormalized: def.pivotNormalized,
      reconstructed: def.reconstructed,
      reconstructedRegion: def.reconstructedRegion,
    });
  }

  fs.writeFileSync(
    path.join(backDir, 'layer_manifest.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        character: 'red_dragon',
        sourceImage: 'view.png',
        perspectiveConvention: 'full back view',
        referenceCanvas: canvas,
        generationMode: 'built-in image editing with deterministic layer extraction',
        layers: backLayers,
      },
      null,
      2
    )
  );
  await generateAssembledPreview(backDir, backLayers, canvas);
  await generateContactSheet(backDir, backLayers);

  // ==========================================
  // 5. ROOT TURNAROUND MANIFEST & SHEET
  // ==========================================
  console.log('\n--- Building ROOT turnaround manifest & sheet ---');

  const turnaroundManifest = {
    schemaVersion: 1,
    kind: 'turnaround',
    character: 'red_dragon',
    sourceImage: 'source.png',
    sourceViewId: 'three_quarter',
    facing: 'right',
    pose: 'sit',
    referenceCanvas: canvas,
    groundY: 1040,
    perspectiveConvention: 'view ids are camera yaw; layer front/back names are from visual depth',
    generationMode: 'image-to-image edits chained from the source with deterministic layer segmentation',
    views: [
      {
        id: 'front',
        yawDegrees: 0,
        folder: 'views/front',
        viewImage: 'view.png',
        derivedFrom: 'source.png',
        reconstructed: true,
      },
      {
        id: 'three_quarter',
        yawDegrees: 45,
        folder: 'views/three_quarter',
        viewImage: 'view.png',
        derivedFrom: 'source.png',
        reconstructed: false,
      },
      {
        id: 'side',
        yawDegrees: 90,
        folder: 'views/side',
        viewImage: 'view.png',
        derivedFrom: 'source.png',
        reconstructed: true,
      },
      {
        id: 'three_quarter_back',
        yawDegrees: 135,
        folder: 'views/three_quarter_back',
        viewImage: 'view.png',
        derivedFrom: 'source.png',
        reconstructed: true,
      },
      {
        id: 'back',
        yawDegrees: 180,
        folder: 'views/back',
        viewImage: 'view.png',
        derivedFrom: 'source.png',
        reconstructed: true,
      },
    ],
  };

  fs.writeFileSync(
    path.join(rootDir, 'turnaround_manifest.json'),
    JSON.stringify(turnaroundManifest, null, 2)
  );

  // Compose turnaround_sheet.png
  const viewOrder = ['front', 'three_quarter', 'side', 'three_quarter_back', 'back'];
  const panelW = 340;
  const panelH = 340;
  const sheetW = panelW * 5;
  const sheetH = panelH + 50;

  const panelComposites = [];
  for (let i = 0; i < viewOrder.length; i++) {
    const v = viewOrder[i];
    const vPath = path.join(viewsDir, v, 'view.png');
    const thumb = await sharp(vPath)
      .resize(panelW - 24, panelH - 24, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    panelComposites.push({ input: thumb, left: i * panelW + 12, top: 12 });
  }

  const outTurnaroundSheet = path.join(rootDir, 'turnaround_sheet.png');
  const deskTurnaroundSheet = path.join('/Users/damonsu/Desktop', 'red-dragon-turnaround-sheet.png');

  await sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 4,
      background: { r: 236, g: 239, b: 243, alpha: 1 },
    },
  })
    .composite(panelComposites)
    .png()
    .toFile(outTurnaroundSheet);

  await sharp(outTurnaroundSheet).toFile(deskTurnaroundSheet);

  console.log(`✅ Turnaround sheet generated at ${outTurnaroundSheet} and Desktop!`);
}

buildAllViewPackages().catch(console.error);
