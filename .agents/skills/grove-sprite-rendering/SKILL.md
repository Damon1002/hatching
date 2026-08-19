---
name: grove-sprite-rendering
description: >-
  Conventions and patterns for rendering grove sprites (trees, plants, creatures)
  in the 2D Skia isometric canvas. Use when adding, modifying, or debugging any
  sprite in GroveActors.tsx, IsometricLandView.tsx, or the grove generation pipeline.
---

# Grove Sprite Rendering Conventions

This skill documents the coordinate system, rendering patterns, and data flow for
grove sprites in the Hatching project. **Read this before adding or modifying any
sprite in `GroveActors.tsx`.**

---

## 1. Coordinate System — The Critical Rule

The grove renders on a 2D Skia `Canvas` using isometric projection.

### Screen position from grid position

```ts
// Grid → screen conversion (defined in src/grove/iso.ts)
const screenX = sx(gridX + 0.5, gridY + 0.5, camera);  // tile center
const screenY = sy(gridX + 0.5, gridY + 0.5, z, camera); // tile center at height z
```

`screenY` is the **ground-level anchor point** — the bottom of the sprite where it
touches the tile surface. All sprite parts are positioned **upward** from this point
(negative Y direction in screen space).

### ⚠️ Skia `Oval` vs `blobPath` — different coordinate origins

| Primitive | `x, y` means | Center is at |
|-----------|-------------|--------------|
| `<Oval x={x} y={y} width={w} height={h} />` | **Top-left corner** | `(x + w/2, y + h/2)` |
| `blobPath(cx, cy, rx, ry, seed)` | **Center** | `(cx, cy)` |
| `<Circle cx={cx} cy={cy} r={r} />` | **Center** | `(cx, cy)` |
| `<Path path="M... L..." />` (stroke) | **Endpoints** | N/A |

**This is the most common source of bugs.** When converting between `Oval` and
`blobPath`, remember:
- Oval at `y` with `height h` → center is at `y + h/2`
- blobPath at `cy` with `ry` → top edge is at `cy - ry`, bottom at `cy + ry`

---

## 2. Anchoring Foliage to Trunks

Every tree sprite has a trunk (vertical stroke) and a crown (filled blob). The
crown **must overlap** the trunk top by a visible margin so they look connected.

### Pattern

```ts
const originY = sy(tile center, z, camera);  // ground anchor
const trunkH = s * HEIGHT_FACTOR;            // trunk height in pixels
const crownY = originY - trunkH - s * 0.19;  // crown center sits above trunk

// darkCrown ry = s * 0.29, so bottom = crownY + 0.29s
// trunk top = originY - trunkH
// overlap = (crownY + 0.29s) - (originY - trunkH) = 0.10s ✓
```

### Rules

1. **Crown center Y** = `originY - trunkH - crownRy * 0.65` (approximately)
2. **Bottom of crown** must extend **below** trunk top by at least `0.08 × s`
3. **Shoulder blobs** sit at `crownY + positive_offset` (lower than crown center,
   near the trunk-crown junction)
4. **Snow caps** sit at `crownY - small_offset` (above crown center)

### Checklist when adding a new tree/plant

- [ ] Compute `trunkH` from a constant × `s` (tile-scaled size)
- [ ] Compute `crownY` = `originY - trunkH - verticalOffset`
- [ ] Verify: bottom of crown (`crownY + ry`) < trunk top (`originY - trunkH`)
  → if NOT, the crown is floating above the trunk
- [ ] All sub-parts (shoulders, caps, flowers) positioned relative to `crownY`,
  NOT from `originY` with hardcoded magic offsets

---

## 3. The `blobPath` API

Generates organic closed Skia path strings for lumpy foliage shapes.

```ts
function blobPath(
  cx: number,      // center X
  cy: number,      // center Y
  rx: number,      // horizontal radius
  ry: number,      // vertical radius
  seed: number,    // determines unique wobble shape
  segments?: number // smoothness (default: 12)
): string           // Skia path string "M... Q... Z"
```

### How it works

1. Places `segments` points around an ellipse (cx, cy, rx, ry)
2. Offsets each point's radius with 3 sine harmonics:
   - `0.12 × sin(3θ + p1)` — large bumps
   - `0.08 × sin(2θ + p2)` — medium bumps
   - `0.06 × sin(5θ + p3)` — small detail
3. Phase offsets `p1, p2, p3` are derived from `seed`
4. Points connected with quadratic bezier curves for smoothness

### Usage rules

- **Different seed → different shape.** Use `tree.phase` as base seed, add
  constants for each sub-blob (e.g., `phase + 1.7`, `phase + 3.1`)
- **Segments: 12** is good for crowns. Use **8** for snow caps or small accents.
- **Max wobble amplitude is ~26%** of radius. Account for this when checking overlap.

---

## 4. Growth Levels

Trees carry `growth: 1 | 2 | 3` (set in `generate.ts` based on sessions × distance
to egg).

| Growth | Trunk height | Crown parts | Colors used |
|--------|-------------|-------------|-------------|
| 1 | `s × 0.44` | 1 dark blob + 1 light blob | `leafDark`, `leaf` |
| 2 | `s × 0.52` | Same + 1 shoulder blob | + `leafAccent` |
| 3 | `s × 0.60` | Same + 2 shoulder blobs | + `leafAccent` |

### Growth assignment formula

```ts
const distToEgg = Math.abs(tile.x - eggTile.x) + Math.abs(tile.y - eggTile.y);
const maturity = sessionsCompleted * 0.5 - distToEgg * 0.8;
const growth = maturity > 4 ? 3 : maturity > 1.5 ? 2 : 1;
```

Central trees mature first → creates visible "age rings."

---

## 5. Palette Data Flow

```
Tag (work/study/code/creative/reading/rest)
  → Climate (temperate/desert/tropical/volcanic/tundra)
    → CLIMATE_TONES[climate] → base colors including bark

Hour → Mood (night/morning/noon/gold/dusk)
  → mood shifts (darken at night, warm at golden hour)

Focus minutes → Season (spring/summer/autumn/winter)
  → season shifts (snow mix in winter, golden in autumn)

Final palette includes:
  leaf       — dominant crown color
  leafDark   — shadow crown color (darker)
  leafAccent — shoulder blob color (brighter, shade(leaf, 0.28))
  bark       — trunk color (per-climate, season/mood shifted)
```

### When adding a new plant type

- Use `palette.leaf` / `palette.leafDark` for main foliage
- Use `palette.leafAccent` for accent blobs or highlights
- Use `palette.bark` for trunks/stems — **never hardcode a bark color**
- Pass new palette fields through `IsometricLandView.tsx` as props

---

## 6. Draw Order

Sprites are depth-sorted by `tile.x + tile.y` (isometric back-to-front). Within
the same tile, use `layer` to control z-order:

| Layer | Content |
|-------|---------|
| 0 | Tile columns (ground) |
| 1 | Trees, tufts (vegetation) |
| 2 | Ember particles |
| 3 | Egg |
| 4 | Creature / Dragon |

Within a sprite, draw order is painter's algorithm (first drawn = behind):
1. Trunk (stroke)
2. Shoulder blobs (behind main crown)
3. Dark crown (shadow)
4. Light crown (lit surface)
5. Snow cap / decorations (on top)
