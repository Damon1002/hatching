---
name: flora-3form-growth-workflow
description: Standard 3-form procedural vector growth workflow (Basic, Advanced, Majestic) for all plant items on isometric lands based on focus time (0-60m, 60-90/120m, 120-180m max), modeled after the Forest focus app.
---

# Flora 3-Form Growth Workflow (Procedural Vector Engine)

This skill defines the standardized mechanism, mathematical geometry, and rendering workflow for all plant/tree items that grow on Hatching isometric lands.

---

## 🌟 Core Architecture Principle: Procedural Vector Flora Engine

All plant and tree entities on Hatching floating islands are generated via the **Skia Procedural Vector Flora Engine**.

### Why Procedural Vectors:
1. **100% Continuous Physical Morphing**: The trunk physically extrudes upward from the soil, branches split, and shoulder canopy lobes dynamically bud out and inflate with harmonic wave math.
2. **Dynamic Climate & Seasonal Adaptation**: Foliage colors automatically adapt to land biomes, seasonal transitions (*Spring Blossom, Summer Emerald, Autumn Amber, Winter Snow Cap*), and focus tags (*Work, Study, Rest, Code*) without requiring separate static image files.
3. **Infinite Crisp Resolution & Zero Overhead**: 100% vector paths rendered directly on the GPU via `@shopify/react-native-skia` running at 60/120 FPS with 0 KB asset footprint.

---

## 🌳 1. Focus Time Growth Tiers (3-Form Progression)

| Growth Form | Focus Duration Range | Physical Geometry & Structure | Scale Multiplier |
| :--- | :--- | :--- | :--- |
| **Form 1: Basic (基础幼态)** | **$10\text{m} - 59\text{m}$** | Slender trunk ($0.44H$), primary dual-volume canopy (`darkCrown` shadow base + `lightCrown` sunlit highlight). | $0.95\times$ |
| **Form 2: Advanced (繁茂成态)** | **$60\text{m} - 119\text{m}$** | Thickened branched trunk ($0.54H$), side shoulder canopy lobes (`shoulderLeft`, `shoulderRight`) bud out from branches and inflate. | $1.30\times$ |
| **Form 3: Majestic (极境神木态)** | **$120\text{m} - 180\text{m}$ (Max)** | Grand ancient trunk ($0.62H$), spreading root flares (`rootFlareLeft`, `rootFlareRight`) grasping the ground tile, crowning top canopy tier (`crownTop`), and floating fairy firefly motes. | $1.65\times$ |

---

## 📐 2. Procedural Geometry & Mathematical Specifications

### A. Harmonic Organic Blob Generator (`blobPath`):
Canopy volumes are generated using multi-frequency sine wave harmonics deformed across an ellipse, connected by smooth quadratic bezier midpoints:
$$r(\theta) = 1 + 0.12\sin(3\theta + p_1) + 0.08\sin(2\theta + p_2) + 0.06\sin(5\theta + p_3)$$

### B. Anchor Point Standard:
* **Ground Contact Point**: Center bottom of trunk base at $(originX, originY) = (\text{sx}(x+0.5, y+0.5), \text{sy}(x+0.5, y+0.5, z))$.
* All scaling, wind sway rotation, and inflation operations use `origin={{ x: originX, y: originY }}`.

---

## 💻 3. Skia GPU Tree Sprite Implementation (`GroveActors.tsx`)

```tsx
export function GroveTreeSprite({
  tree,
  z,
  camera,
  time,
  leaf,
  leafDark,
  leafAccent,
  bark,
  snowy,
  progress,
  focusing,
}: {
  tree: GroveTree;
  z: number;
  camera: IsoCamera;
  time: SharedValue<number>;
  leaf: string;
  leafDark: string;
  leafAccent: string;
  bark: string;
  snowy: boolean;
  progress?: SharedValue<number>;
  focusing?: SharedValue<number>;
}) {
  const originX = sx(tree.x + 0.5, tree.y + 0.5, camera);
  const originY = sy(tree.x + 0.5, tree.y + 0.5, z, camera);
  const s = camera.tw * tree.scale;
  const phase = tree.phase;
  const targetGrowth = tree.growth; // 1, 2, or 3

  // 1. Continuous Live Growth Scale (Sprout 0.35x -> 1.0x)
  const liveGrowthScale = useDerivedValue(() => {
    if (!focusing || focusing.value < 0.05 || !progress) return 1.0;
    return 0.35 + progress.value * 0.65;
  });

  // 2. Physical Branch & Shoulder Lobe Inflation Curves
  const shoulderInflation = useDerivedValue(() => {
    if (!focusing || focusing.value < 0.05 || !progress) return targetGrowth >= 2 ? 1.0 : 0.0;
    const p = progress.value;
    if (targetGrowth === 1) return 0.0;
    if (targetGrowth === 2) {
      if (p < 0.35) return 0.0;
      const t = Math.min(1.0, (p - 0.35) / 0.35);
      return t * t * (3 - 2 * t);
    }
    if (p < 0.25) return 0.0;
    if (p < 0.55) {
      const t = (p - 0.25) / 0.30;
      return t * t * (3 - 2 * t);
    }
    return 1.0;
  });

  const majesticTierInflation = useDerivedValue(() => {
    if (!focusing || focusing.value < 0.05 || !progress) return targetGrowth === 3 ? 1.0 : 0.0;
    const p = progress.value;
    if (targetGrowth !== 3 || p < 0.65) return 0.0;
    const t = Math.min(1.0, (p - 0.65) / 0.30);
    return t * t * (3 - 2 * t);
  });

  const formScale = targetGrowth === 3 ? 1.65 : targetGrowth === 2 ? 1.30 : 0.95;
  const treeSize = s * formScale;
  const trunkH = treeSize * (targetGrowth === 3 ? 0.62 : targetGrowth === 2 ? 0.54 : 0.44);
  const crownY = originY - trunkH - treeSize * 0.18;

  // Canopy Paths
  const darkCrown = blobPath(originX, crownY, treeSize * 0.34, treeSize * 0.30, phase);
  const lightCrown = blobPath(originX, crownY - treeSize * 0.07, treeSize * 0.27, treeSize * 0.23, phase + 1.7);
  const crownTop = blobPath(originX, crownY - treeSize * 0.18, treeSize * 0.22, treeSize * 0.18, phase + 4.2);
  const shoulderRight = blobPath(originX + treeSize * 0.24, crownY + treeSize * 0.12, treeSize * 0.21, treeSize * 0.17, phase + 3.1);
  const shoulderLeft = blobPath(originX - treeSize * 0.25, crownY + treeSize * 0.10, treeSize * 0.19, treeSize * 0.16, phase + 5.3);

  // Root Flares (Form 3)
  const rootFlareLeft = `M ${originX} ${originY - trunkH * 0.25} Q ${originX - treeSize * 0.18} ${originY - trunkH * 0.05} ${originX - treeSize * 0.28} ${originY}`;
  const rootFlareRight = `M ${originX} ${originY - trunkH * 0.25} Q ${originX + treeSize * 0.18} ${originY - trunkH * 0.05} ${originX + treeSize * 0.28} ${originY}`;

  // GPU Wind Sway
  const transform = useDerivedValue(() => [
    { scaleX: liveGrowthScale.value },
    { scaleY: liveGrowthScale.value },
    { rotate: Math.sin((time.value / GROVE_LOOP_MS) * TAU + phase) * 0.035 },
  ]);

  return (
    <Group>
      <Oval x={originX - treeSize * 0.28} y={originY - treeSize * 0.09} width={treeSize * 0.56} height={treeSize * 0.18} color="rgba(25, 45, 12, 0.25)" />
      <Group transform={transform} origin={{ x: originX, y: originY }}>
        {targetGrowth === 3 ? (
          <Group opacity={majesticTierInflation}>
            <Path path={rootFlareLeft} color={bark} style="stroke" strokeWidth={Math.max(2.5, treeSize * 0.07)} strokeCap="round" />
            <Path path={rootFlareRight} color={bark} style="stroke" strokeWidth={Math.max(2.5, treeSize * 0.07)} strokeCap="round" />
          </Group>
        ) : null}
        <Path path={`M${originX} ${originY} L${originX} ${originY - trunkH}`} color={bark} style="stroke" strokeWidth={Math.max(2.5, treeSize * 0.082)} strokeCap="round" />
        <Group opacity={shoulderInflation}>
          <Path path={shoulderLeft} color={leafAccent} />
          <Path path={shoulderRight} color={leafAccent} />
        </Group>
        <Path path={darkCrown} color={leafDark} />
        <Path path={lightCrown} color={leaf} />
        {targetGrowth === 3 ? (
          <Group opacity={majesticTierInflation}>
            <Path path={crownTop} color={leafAccent} />
          </Group>
        ) : null}
        {snowy ? <Path path={blobPath(originX, crownY - treeSize * 0.12, treeSize * 0.20, treeSize * 0.09, phase + 7.2, 8)} color="#F4F8FA" /> : null}
      </Group>
    </Group>
  );
}
```

---

## 🎨 4. Climate & Tag Color Mapping

| Tag / Biome | Leaf (`leaf`) | Shadow Leaf (`leafDark`) | Highlight (`leafAccent`) | Bark (`bark`) |
| :--- | :--- | :--- | :--- | :--- |
| **Meadow / Work** | `#65A947` | `#4E8934` | `#82C25D` | `#6B4C33` |
| **Autumn / Maple**| `#D46A4A` | `#A84A30` | `#F4A261` | `#5C3A21` |
| **Sakura / Bloom**| `#F4A6B8` | `#D97993` | `#FFC2D1` | `#594139` |
| **Bioluminescent**| `#38B2AC` | `#234E52` | `#81E6D9` | `#2D3748` |
| **Winter Pine**   | `#3A6B4E` | `#2A4F38` | `#528A6B` | `#4A3525` |

---

## 📱 5. Depth Sorting & Layering Contract
All procedural trees are depth sorted in Layer B against walking creatures:
$$\text{depth} = (tree.x + tree.y) \times 2 + 1.0$$
* Always rendered after solid ground foundation (Layer A).
