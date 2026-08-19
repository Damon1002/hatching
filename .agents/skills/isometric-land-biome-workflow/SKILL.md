---
name: isometric-land-biome-workflow
description: Standard workflow and architecture for creating new scalable 2D/2.5D isometric land biomes in Hatching, including camera framing, depth-sorted Skia rendering, dynamic focus-time tree growth, and bottom sheet catalog registration.
---

# Isometric Land Biome Workflow

This skill defines the standard architecture and implementation workflow for adding any new **Floating Island / Land Biome** to Hatching.

---

## 🏛️ Land Biome Architecture Overview

In Hatching, a **Land Biome** serves as the 2.5D isometric world stage where dragons hatch, companions roam, and trees dynamically grow as users focus.

```
┌────────────────────────────────────────────────────────┐
│                   1. Data & Types                      │
│   - LandStyleKey in src/types.ts                       │
│   - LandBiome registered in LAND_CATALOG               │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               2. 3D Isometric Thumbnail                │
│   - Mini SVG in src/components/grove/LandThumbnails.tsx│
│   - Used in HatchingBottomSheet & settings             │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│          3. Focus-Time Growth Generator                │
│   - generate[Biome]World(focusMinutes, seed, tag)      │
│   - Spawns dynamic trees with growth: 1 | 2 | 3        │
│   - Allocates non-occupied slots around dragon         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             4. Skia Biome Component                    │
│   - Camera framing (fitCamera(bbox, w, h))             │
│   - Painter's Algorithm Depth-Sorted Draw List         │
│   - Organic cliffs, overhang turf lip, micro-flora     │
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ Step-by-Step Implementation Workflow

### Step 1: Register Types & Catalog Entry
1. In `src/types.ts`:
   ```ts
   export type LandStyleKey = 'sunny_meadow' | 'terraced_grove' | 'your_new_biome';
   ```
2. In `src/data/species.ts`:
   ```ts
   export const LAND_CATALOG: LandBiome[] = [
     {
       id: 'your_new_biome',
       name: '浮岛名称 Biome Name',
       subtitle: '特色副标题',
       element: '元素类型',
       description: '浮岛背景设定描述...',
       icon: '🌋',
       color: '#ThemeColor',
       unlocked: true,
     },
     // ...
   ];
   ```

---

### Step 2: Implement Miniature 3D Thumbnail
In `src/components/grove/LandThumbnails.tsx`, create an SVG preview component:
```tsx
export function YourNewBiomeThumbnail({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      {/* 1. Ground Shadow */}
      <Ellipse cx="22" cy="38" rx="17" ry="4" fill="rgba(0,0,0,0.2)" />
      {/* 2. Front-Left Face */}
      <Polygon points="5,17 22,25.5 22,34.5 5,26" fill="#SunlitCliffColor" />
      {/* 3. Front-Right Face */}
      <Polygon points="22,25.5 39,17 39,26 22,34.5" fill="#ShadowCliffColor" />
      {/* 4. Top Diamond Surface */}
      <Polygon points="22,8.5 39,17 22,25.5 5,17" fill="#TopGroundColor" />
      {/* 5. Biome Specific Accents (Mini tree, crystal, water) */}
    </Svg>
  );
}
```

---

### Step 3: Focus-Time Tree Growth Generator
In `src/grove/generate.ts`, implement the progression generator:
- **0–15 mins**: 1 Sprout / Sapling (`growth: 1`)
- **15–35 mins**: 2 Trees (`growth: 1–2`)
- **35–60 mins**: 3–4 Trees (`growth: 2–3`)
- **60+ mins**: 5–6 Mature Trees (`growth: 3`)

```ts
export function generateYourBiomeWorld(input: {
  seed: number;
  focusMinutes: number;
  sessionsCompleted: number;
  tag: TagKey;
  gridSize?: number;
}): BiomeWorld {
  // 1. Calculate tree quota from focusMinutes
  // 2. Reserve center for dragon / egg perch
  // 3. Deterministically shuffle candidate slots with seed
  // 4. Assign growth stages (1 = sapling, 2 = young, 3 = mature oak)
}
```

---

### Step 4: Skia Biome Component & Layering Architecture

#### ⚠️ Critical 2.5D Layering Rule:
1. **Layer A — Solid Ground Surface (Flat $z = z_{top}$)**:
   - Ground diamond tiles, grid seams, clipped moss patches, and micro-flora MUST be rendered as the base terrain plane **first**.
   - *Never interleave flat ground diamonds with walking actors*, or foreground tiles will slice across the actor's feet/body!
2. **Layer B — Upright Actors (Depth-Sorted)**:
   - Trees (`GroveTreeSprite`) and Creatures/Eggs (`GroveCreatureSprite`/`GroveEgg`) stand vertically upright into the 3D air.
   - Sort only upright actors against each other:
     $$\text{depth} = (x + y) \times 2 + \text{layerOffset}$$
   - This guarantees that actors walk in front of background trees and behind foreground trees, while standing 100% on top of the ground!

#### Camera Framing:
```ts
const bbox = useMemo(() => ({ x0: 0, y0: 0, x1: gridSize - 1, y1: gridSize - 1 }), [gridSize]);
const activeCamera = fitCamera(bbox, sceneWidth, sceneHeight);
```

#### Depth-Sorted Render List (Painter's Algorithm):
```ts
type BiomeDrawItem =
  | { key: string; depth: number; kind: 'tile_top'; x: number; y: number }
  | { key: string; depth: number; kind: 'flora'; index: number; x: number; y: number }
  | { key: string; depth: number; kind: 'tree'; index: number; x: number; y: number }
  | { key: string; depth: number; kind: 'creature'; x: number; y: number }
  | { key: string; depth: number; kind: 'egg'; x: number; y: number };

// Calculate depth: (x + y) * 2 + layerOffset
const drawItems = useMemo(() => {
  const items: BiomeDrawItem[] = [];
  tiles.forEach(t => items.push({ depth: (t.x + t.y) * 2 + 0.0, kind: 'tile_top', ...t }));
  trees.forEach(t => items.push({ depth: (t.x + t.y) * 2 + 1.2, kind: 'tree', ...t }));
  creature && items.push({ depth: (c.homeX + c.homeY) * 2 + 1.4, kind: 'creature', ...c });
  return items.sort((a, b) => a.depth - b.depth);
}, [...]);
```

#### Render in Order:
1. Base cliff walls (front-left sunlit, front-right shadow).
2. Wavy overhang turf lip.
3. Top surface patches (clipped with `<Group clip={topDiamondClipPath}>`).
4. Iterated sorted `drawItems` (tiles, trees, creature).

---

### Step 5: Connect in `IsometricLandView.tsx`
Add your biome condition to the renderer:
```tsx
{landStyle === 'your_new_biome' ? (
  <YourNewBiomeLand
    camera={activeCamera}
    seed={seed}
    time={time}
    focusMinutes={focusMinutes}
    sessionsCompleted={sessionsCompleted}
    tag={tag}
    speciesId={speciesId}
    dragonClip={dragonClip}
    dragonSize={dragonSize}
    palette={palette}
  />
) : ...}
```

---

## 🎨 Best Practice Checklist
- [ ] **No Rectangular Bleed**: Translucent grass/moss patches must be clipped with `<Group clip={topDiamondClipPath}>`.
- [ ] **Organic Cliffs**: Cliff walls must use multi-vertex rock facets (`buildOrganicRockFacetPath`) rather than straight box quads.
- [ ] **Depth Occlusion**: Trees and creatures must be depth-sorted so creatures walk behind/in front of trees naturally.
- [ ] **Wind Sway**: Pass `time` SharedValue to `<GroveTreeSprite>` for synchronized organic wind sway.
- [ ] **Small Dragon Scale**: Default `dragonSize = 0.25` for single-tile footprint.
