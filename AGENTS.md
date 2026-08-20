# Hatching AI Agent & Editor Guide

This repository uses standard agent instructions and specialized skills located in [`.agents/skills/`](.agents/skills/). Any AI model or coding assistant (Codex, Cursor, Claude Code, Copilot, Antigravity, Gemini) must follow these core workflows and architecture principles.

---

## 📚 Core Skills & Workflows Reference

When adding or modifying features, always consult the corresponding skill document:

1. **[Flora 3-Form Growth Workflow (Hybrid Architecture)](.agents/skills/flora-3form-growth-workflow/SKILL.md)**
   - **Hybrid Layered Architecture**:
     - **Layer 1 (WebP Sprite Base)**: Compressed 1024x1024 WebP (~40 KB), 100% artist original fidelity, 1 GPU draw call.
     - **Layer 2 (Skia Parametric Overlays)**: Reanimated GPU wind sway, continuous live growth scaling (0.35x -> 1.0x), multi-layer alpha dissolve morphing, soft ground shadows, and floating golden fireflies.
   - **Focus Tiers & Diamond Tile Proportions**:
     - **Form 1 (Basic / 基础幼态)**: $10\text{m} - 59\text{m}$ focus time. Scale $0.48\times$ relative to tile width `camera.tw`.
     - **Form 2 (Advanced / 繁茂态)**: $60\text{m} - 119\text{m}$ focus time. Scale $0.62\times$.
     - **Form 3 (Majestic / 极境神木态)**: $120\text{m} - 180\text{m}$ maximum focus time. Scale $0.76\times$.
   - **Anchor Standard**: Trunk base at $(X = 50\%, Y = 90\%)$. Every plant item must support these 3 forms.

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
