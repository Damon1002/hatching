---
name: flora-3form-growth-workflow
description: Standard 3-form growth progression workflow (Basic, Advanced, Majestic) for all plant items on isometric lands based on focus time (0-60m, 60-90/120m, 120-180m max), modeled after the Forest focus app.
---

# Flora 3-Form Growth Workflow (Forest App Mechanism)

This skill defines the standardized mechanism, asset specification, and rendering workflow for all plant/tree items that grow on Hatching isometric lands.

---

## 🌳 1. Focus Time Growth Tiers (3-Form Progression)

| Growth Form | Focus Duration Range | Visual Characteristics | Scale Multiplier |
| :--- | :--- | :--- | :--- |
| **Form 1: Basic (基础幼态)** | **$10\text{m} - 59\text{m}$** | Single compact crown, slender young trunk, fresh green buds, minimal clutter. | $0.95\times$ |
| **Form 2: Advanced (繁茂成态)** | **$60\text{m} - 119\text{m}$** | Multi-tiered crown (2-3 canopy volumes), thicker branched trunk, blossom buds, wider shadow. | $1.35\times$ |
| **Form 3: Majestic (极境神木态)** | **$120\text{m} - 180\text{m}$ (Max)** | Grand ancient canopy (4+ layered leaf clouds), exposed root flares, falling particles / fruit / magic glow. | $1.75\times$ |

---

## 🎨 2. Asset Design Specification (for Artists & Designers)

When creating a new plant item (e.g. *Broadleaf Oak*, *Sakura Tree*, *Pine Cedar*, *Magic Shroom*, *Golden Ginkgo*):

```
assets/plants/{species_id}/
├── form_1_basic.png      # 10m–59m (compact, young)
├── form_2_advanced.png   # 60m–119m (lush, branched)
├── form_3_majestic.png   # 120m–180m (magnificent, radiant)
└── manifest.json         # Anchor, scales, metadata
```

### Canvas & Anchor Standard:
* **Resolution**: $1024 \times 1024\text{ px}$ (PNG with transparent alpha cutout).
* **Anchor Point (Ground Contact)**: Center bottom of trunk base at **$X = 50\%, Y = 90\%$**.
* **Footprint**: Fits comfortably on a single $1\times 1$ isometric diamond tile.

---

## 💻 3. Code & Skia GPU Rendering Engine

### A. Data Schema (`src/types.ts` & `src/data/species.ts`):
```ts
export interface PlantFormData {
  key: 'basic' | 'advanced' | 'majestic';
  label: string;
  minMinutes: number;
  maxMinutes: number;
  image: any;
  scale?: number;
}

export interface DragonSpecies {
  // ...
  forms?: {
    1: PlantFormData; // Form 1: Basic (10-59m)
    2: PlantFormData; // Form 2: Advanced (60-119m)
    3: PlantFormData; // Form 3: Majestic (120-180m)
  };
}
```

### B. Duration to Growth Form Helper (`src/grove/generate.ts`):
```ts
export function durationToGrowthForm(minutes: number): 1 | 2 | 3 {
  if (minutes >= 120) return 3; // Majestic Form (120m - 180m max)
  if (minutes >= 60) return 2;  // Advanced Form (60m - 119m)
  return 1;                     // Basic Form (10m - 59m)
}
```

### C. Skia Tree Sprite Component (`src/components/grove/GroveActors.tsx`):
```tsx
const originX = sx(tree.x + 0.5, tree.y + 0.5, camera);
const originY = sy(tree.x + 0.5, tree.y + 0.5, z, camera);
const s = camera.tw * tree.scale;
const formScale = tree.growth === 3 ? 1.75 : tree.growth === 2 ? 1.35 : 0.95;
const spriteW = s * formScale;
const spriteH = spriteW;

// Ground anchor (X: 50%, Y: 90%)
const spriteX = originX - spriteW * 0.50;
const spriteY = originY - spriteH * 0.90;

// GPU Wind Sway
const transform = useDerivedValue(() => [
  { rotate: Math.sin((time.value / GROVE_LOOP_MS) * TAU + tree.phase) * 0.038 },
]);

<Group>
  {/* Ground Shadow */}
  <Oval x={originX - s * formScale * 0.26} y={originY - s * formScale * 0.08} width={s * formScale * 0.52} height={s * formScale * 0.16} color="rgba(30,48,12,0.26)" />
  {/* Sprite with trunk base pivot */}
  <Group transform={transform} origin={{ x: originX, y: originY }}>
    <SkiaImage image={activeFormImage} x={spriteX} y={spriteY} width={spriteW} height={spriteH} fit="contain" />
  </Group>
</Group>
```

### D. 2.5D Depth Sorting Rule:
```ts
depth = (tree.x + tree.y) * 2 + 1.0;
```
* Ensures trees depth-sort properly with creatures (`(dragon.x + dragon.y) * 2 + 1.0`) and remain above the solid ground surface.

---

## 📱 4. UI/UX Interaction Workflow (Bottom Sheet)
1. **Interactive Duration Scrubbing**:
   * As user scrolls duration pills ($25\text{m} \to 60\text{m} \to 120\text{m}$), the card preview image morphs between Form 1, Form 2, and Form 3.
2. **Status Badge**:
   * Displays target unlocked form: `🌱 基础幼态 (10-59m)` $\to$ `🌳 繁茂成态 (60-119m)` $\to$ `👑 极境神木 (120m+)`.
3. **Completion Planting**:
   * When session finishes, the plant is permanently planted on the land at its unlocked maturity level.
