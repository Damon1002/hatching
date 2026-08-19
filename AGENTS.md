# Hatching AI Agent & Editor Guide

This repository uses standard agent instructions and specialized skills located in [`.agents/skills/`](.agents/skills/). Any AI model or coding assistant (Codex, Cursor, Claude Code, Copilot, Antigravity, Gemini) must follow these core workflows and architecture principles.

---

## 📚 Core Skills & Workflows Reference

When adding or modifying features, always consult the corresponding skill document:

1. **[Flora 3-Form Growth Workflow (Forest App Mechanism)](.agents/skills/flora-3form-growth-workflow/SKILL.md)**
   - **Form 1 (Basic / 基础幼态)**: $10\text{m} - 59\text{m}$ focus time. Single crown, young sapling ($0.85\times - 1.0\times$ scale).
   - **Form 2 (Advanced / 繁茂态)**: $60\text{m} - 119\text{m}$ focus time. Multi-tier branched canopy ($1.2\times - 1.4\times$ scale).
   - **Form 3 (Majestic / 极境神木态)**: $120\text{m} - 180\text{m}$ maximum focus time. Grand ancient tree with root flairs and falling particles ($1.6\times - 1.9\times$ scale).
   - Every plant/tree item on the land must provide/support these 3 distinct visual forms.

2. **[Isometric Land Biome Workflow](.agents/skills/isometric-land-biome-workflow/SKILL.md)**
   - Standard pipeline for adding new floating island lands (e.g. *Sunny Meadow*, *Terraced Grove*, *Volcanic Peak*).
   - **Critical 2.5D Layering Rule**:
     - **Layer A (Solid Ground Plane Foundation)**: Cliff walls, grass overhang lips, 25 diamond tiles, grid seams, clipped moss patches, and micro-flora MUST render as the continuous ground plane **first**. Never interleave flat ground diamonds with walking actors.
     - **Layer B (Depth-Sorted Upright Actors)**: Trees (`GroveTreeSprite`) and Creatures/Eggs (`GroveCreatureSprite`/`GroveEgg`) stand vertically in the 3D air and are depth-sorted against each other:
       $$\text{depth} = (x + y) \times 2 + \text{layerOffset}$$
   - Camera framing via `fitCamera(bbox, sceneWidth, sceneHeight)`.
   - SVG isometric 3D thumbnails for `src/components/grove/LandThumbnails.tsx`.

3. **[Grove Sprite Rendering & Isometric Math](.agents/skills/grove-sprite-rendering/SKILL.md)**
   - Coordinate conversions: `sx(cx, cy, camera)` and `sy(cx, cy, z, camera)`.
   - Dynamic Reanimated UI worklets and Skia canvas GPU transform matrices.

---

## 🛠️ Technology Stack & Environment

- **Framework**: React Native + Expo (v57.0.0 — see [Expo Documentation](https://docs.expo.dev/versions/v57.0.0/)).
- **Graphics & Rendering**: `@shopify/react-native-skia` on hardware GPU.
- **Animation**: `react-native-reanimated` UI worklets running at 60/120 FPS.
- **Language**: TypeScript (Strict type checking — always verify with `npx tsc --noEmit`).
