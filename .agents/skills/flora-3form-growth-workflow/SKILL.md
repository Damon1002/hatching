---
name: flora-3form-growth-workflow
description: Standard 3-form hybrid flora growth workflow (WebP Sprite Base + Skia Parametric Vector Overlays) for all plant items on isometric lands based on focus time (0-60m, 60-90/120m, 120-180m max), modeled after the Forest focus app.
---

# Flora 3-Form Growth Workflow (Hybrid Architecture)

This skill defines the standardized mechanism, asset pipeline, and rendering workflow for all plant/tree items that grow on Hatching isometric lands.

---

## 👑 1. Core Architecture: WebP Sprite Base + Skia Parametric Overlays

All flora entities on Hatching floating islands follow the **Hybrid Layered Architecture**:

```
                  ┌─────────────────────────────────────┐
                  │       1. WebP Tree Sprite           │
                  │   • 100% 保留美术原画细节             │
                  │   • 超轻量 (~40 KB, 极速加载)        │
                  │   • GPU 1个 Draw Call (极致流畅)     │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │ 2. Skia Parametric Vector Overlay   │
                  │   • 物理摇摆 (Reanimated GPU Sway)  │
                  │   • 连续生长 (0.35x → 1.0x Scale)   │
                  │   • 阶段渐变 (Alpha Dissolve Morph) │
                  │   • 动态萤火虫粒子 (Form 3)          │
                  │   • 地面柔和动态阴影 (Oval)          │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │            最终完美画面              │
                  │  100% 美术还原度 + 100% 动态生命力    │
                  └─────────────────────────────────────┘
```

---

## 🌳 2. Focus Time Growth Tiers (3-Form Progression)

| Growth Form | Focus Duration Range | Scale Multiplier | Visual Structure |
| :--- | :--- | :--- | :--- |
| **Form 1: Basic (基础幼态)** | **$10\text{m} - 59\text{m}$** | **$0.48\times$** | Compact sapling, slender trunk, initial crown frills. |
| **Form 2: Advanced (繁茂成态)** | **$60\text{m} - 119\text{m}$** | **$0.62\times$** | Mature canopy, multi-tiered cascading frills, wider base. |
| **Form 3: Majestic (极境神木态)** | **$120\text{m} - 180\text{m}$ (Max)** | **$0.76\times$** | Grand divine landmark tree, full cascading umbrella skirt, 5 root feet, floating golden fairy fireflies. |

---

## 🎨 3. Asset Creation & Export Specification

When generating or drawing a new plant item (e.g. *Golden Pagoda*, *Broadleaf Oak*, *Sakura Tree*, *Pine Cedar*):

```
assets/plants/{species_id}/
├── form_1_basic.webp      # 10m–59m focus (~30-50 KB)
├── form_2_advanced.webp   # 60m–119m focus (~40-60 KB)
├── form_3_majestic.webp   # 120m–180m max focus (~50-70 KB)
└── manifest.json          # Anchor & scale metadata
```

### Canvas & Anchor Contract:
* **Resolution**: $1024 \times 1024\text{ px}$ square transparent WebP.
* **Anchor Point (Ground Contact Pivot)**: Center bottom of trunk base at **$X = 50\%, Y = 90\%$**.
* **Footprint Scale**: Form 1 ($0.48\times$), Form 2 ($0.62\times$), Form 3 ($0.76\times$) relative to tile width `camera.tw`, fitting perfectly on a single $1\times 1$ diamond tile without overcrowding.

---

## 💻 4. Skia GPU Tree Sprite Implementation (`GroveActors.tsx`)

```tsx
const PAGODA_FORM_1 = require('../../../assets/plants/golden_pagoda/form_1_basic.webp');
const PAGODA_FORM_2 = require('../../../assets/plants/golden_pagoda/form_2_advanced.webp');
const PAGODA_FORM_3 = require('../../../assets/plants/golden_pagoda/form_3_majestic.webp');

export function GroveTreeSprite({
  tree,
  z,
  camera,
  time,
  progress,
  focusing,
}: {
  tree: GroveTree;
  z: number;
  camera: IsoCamera;
  time: SharedValue<number>;
  progress?: SharedValue<number>;
  focusing?: SharedValue<number>;
}) {
  const imgForm1 = useImage(PAGODA_FORM_1);
  const imgForm2 = useImage(PAGODA_FORM_2);
  const imgForm3 = useImage(PAGODA_FORM_3);

  const originX = sx(tree.x + 0.5, tree.y + 0.5, camera);
  const originY = sy(tree.x + 0.5, tree.y + 0.5, z, camera);
  const s = camera.tw * tree.scale;
  const targetGrowth = tree.growth; // 1, 2, or 3

  // 1. Continuous Live Growth Scale (Sprouts 0.35x -> 1.0x)
  const liveGrowthScale = useDerivedValue(() => {
    if (!focusing || focusing.value < 0.05 || !progress) return 1.0;
    return 0.35 + progress.value * 0.65;
  });

  // 2. Continuous Multi-Layer Alpha Dissolve Morphing
  const opacityForm1 = useDerivedValue(() => {
    if (!focusing || focusing.value < 0.05 || !progress) return targetGrowth === 1 ? 1.0 : 0.0;
    const p = progress.value;
    if (targetGrowth === 1) return 1.0;
    if (p < 0.25) return 1.0;
    if (p > 0.45) return 0.0;
    const t = (p - 0.25) / 0.20;
    return 1.0 - t * t * (3 - 2 * t);
  });

  const opacityForm2 = useDerivedValue(() => {
    if (!focusing || focusing.value < 0.05 || !progress) return targetGrowth === 2 ? 1.0 : 0.0;
    const p = progress.value;
    if (targetGrowth === 1) return 0.0;
    if (targetGrowth === 2) {
      if (p < 0.35) return 0.0;
      if (p > 0.60) return 1.0;
      const t = (p - 0.35) / 0.25;
      return t * t * (3 - 2 * t);
    }
    if (p < 0.25) return 0.0;
    if (p < 0.45) {
      const t = (p - 0.25) / 0.20;
      return t * t * (3 - 2 * t);
    }
    if (p <= 0.65) return 1.0;
    if (p > 0.85) return 0.0;
    const t = (p - 0.65) / 0.20;
    return 1.0 - t * t * (3 - 2 * t);
  });

  const opacityForm3 = useDerivedValue(() => {
    if (!focusing || focusing.value < 0.05 || !progress) return targetGrowth === 3 ? 1.0 : 0.0;
    const p = progress.value;
    if (targetGrowth !== 3 || p < 0.65) return 0.0;
    if (p > 0.85) return 1.0;
    const t = (p - 0.65) / 0.20;
    return t * t * (3 - 2 * t);
  });

  const formScale = targetGrowth === 3 ? 0.76 : targetGrowth === 2 ? 0.62 : 0.48;
  const treeSize = s * formScale;
  const spriteW = treeSize;
  const spriteH = treeSize;
  const spriteX = originX - spriteW * 0.50;
  const spriteY = originY - spriteH * 0.90;
  const shadowRadius = treeSize * 0.28;

  // Reanimated GPU Wind Sway
  const transform = useDerivedValue(() => [
    { scaleX: liveGrowthScale.value },
    { scaleY: liveGrowthScale.value },
    { rotate: Math.sin((time.value / GROVE_LOOP_MS) * TAU + tree.phase) * 0.028 },
  ]);

  // Floating Golden Fairy Fireflies for Form 3
  const mote1Y = useDerivedValue(() => originY - spriteH * 0.65 + Math.sin((time.value / GROVE_LOOP_MS) * TAU * 1.5 + tree.phase) * 6);
  const mote2Y = useDerivedValue(() => originY - spriteH * 0.45 + Math.cos((time.value / GROVE_LOOP_MS) * TAU * 1.2 + tree.phase + 1.5) * 7);
  const moteOpacity = useDerivedValue(() => opacityForm3.value * (0.75 + Math.sin((time.value / GROVE_LOOP_MS) * TAU * 2) * 0.25));

  return (
    <Group>
      {/* 1. Ground Shadow */}
      <Oval x={originX - shadowRadius} y={originY - shadowRadius * 0.30} width={shadowRadius * 2.0} height={shadowRadius * 0.60} color="rgba(25, 40, 10, 0.28)" />

      {/* 2. WebP Sprite Base with GPU Sway & Continuous Morphing */}
      <Group transform={transform} origin={{ x: originX, y: originY }}>
        {imgForm1 && <Group opacity={opacityForm1}><SkiaImage image={imgForm1} x={spriteX} y={spriteY} width={spriteW} height={spriteH} fit="contain" /></Group>}
        {imgForm2 && <Group opacity={opacityForm2}><SkiaImage image={imgForm2} x={spriteX} y={spriteY} width={spriteW} height={spriteH} fit="contain" /></Group>}
        {imgForm3 && <Group opacity={opacityForm3}><SkiaImage image={imgForm3} x={spriteX} y={spriteY} width={spriteW} height={spriteH} fit="contain" /></Group>}
      </Group>

      {/* 3. Skia Vector Overlays (Fireflies) */}
      <Group opacity={moteOpacity}>
        <Circle cx={originX - spriteW * 0.26} cy={mote1Y} r={s * 0.035} color="#FFE66D" />
        <Circle cx={originX + spriteW * 0.28} cy={mote2Y} r={s * 0.028} color="#FFD166" />
      </Group>
    </Group>
  );
}
```

---

## 📱 5. Depth Sorting & Layering Contract
All trees are depth sorted in Layer B against walking creatures:
$$\text{depth} = (tree.x + tree.y) \times 2 + 1.0$$
* Always rendered after solid ground foundation (Layer A).
