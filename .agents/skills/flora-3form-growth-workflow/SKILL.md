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
| **Form 1: Basic (基础幼态)** | **$10\text{m} - 59\text{m}$** | Single compact crown, slender young trunk, fresh green buds, minimal clutter. | $0.85\times - 1.0\times$ |
| **Form 2: Advanced (繁茂态)** | **$60\text{m} - 119\text{m}$** | Multi-tiered crown (2-3 canopy volumes), thicker branched trunk, blossom buds, wider shadow. | $1.2\times - 1.4\times$ |
| **Form 3: Majestic (极境神木态)** | **$120\text{m} - 180\text{m}$ (Max)** | Grand ancient canopy (4+ layered leaf clouds), exposed root flares, falling particles / fruit / magic glow. | $1.6\times - 1.9\times$ |

---

## 🎨 2. Asset Design Specification (for Artists & Designers)

When creating a new plant item (e.g. *Broadleaf Oak*, *Sakura Tree*, *Pine Cedar*, *Magic Shroom*, *Golden Ginkgo*):

```
┌────────────────────────────────────────────────────────┐
│                   Plant Item Package                   │
│                                                        │
│  ├── form_1_basic.png     (10m - 59m focus)            │
│  ├── form_2_advanced.png  (60m - 119m focus)           │
│  ├── form_3_majestic.png  (120m - 180m focus)          │
│  └── metadata.json        (Anchor, species element)    │
└────────────────────────────────────────────────────────┘
```

### Canvas & Anchor Standard:
* **Resolution**: $512 \times 512\text{ px}$ (or $1024 \times 1024\text{ px}$ for high-DPI).
* **Anchor Point (Ground Contact)**: Center bottom of trunk $(X = 50\%, Y = 92\%)$.
* **Transparency**: PNG with clean alpha cutout.

---

## 💻 3. Code & Data Architecture

### Data Schema (`src/types.ts` & `src/data/species.ts`):
```ts
export interface PlantSpecies extends DragonSpecies {
  category: 'plant';
  forms: {
    basic: { minMinutes: 10; maxMinutes: 59; image: any; label: '基础幼态' };
    advanced: { minMinutes: 60; maxMinutes: 119; image: any; label: '繁茂进阶' };
    majestic: { minMinutes: 120; maxMinutes: 180; image: any; label: '极境神木' };
  };
}
```

### Duration to Growth Form Helper (`src/grove/generate.ts`):
```ts
export function durationToGrowthForm(minutes: number): 1 | 2 | 3 {
  if (minutes >= 120) return 3; // Majestic Form (120m - 180m max)
  if (minutes >= 60) return 2;  // Advanced Form (60m - 119m)
  return 1;                     // Basic Form (10m - 59m)
}
```

---

## 📱 4. UI/UX Interaction Workflow (Bottom Sheet)
1. **Interactive Duration Scrubbing**:
   * As user scrolls duration pills ($25\text{m} \to 60\text{m} \to 120\text{m}$), the card preview image morphs between Form 1, Form 2, and Form 3.
2. **Status Badge**:
   * Displays target unlocked form: `🌱 基础形态 (25m)` $\to$ `🌳 繁茂形态 (60m)` $\to$ `👑 极境神木 (120m)`.
3. **Completion Planting**:
   * When session finishes, the plant is permanently planted on the land at its unlocked maturity level.
