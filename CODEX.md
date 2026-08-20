# OpenAI Codex / Copilot Development Guide for Hatching

This repository follows strict modular architecture and standardized skills. Before modifying or implementing features, refer to the official skill guides in `.agents/skills/`:

## 🌿 1. Flora 3-Form Growth Workflow (`.agents/skills/flora-3form-growth-workflow/SKILL.md`)
- **Hybrid Architecture (WebP Sprite Base + Skia Parametric Overlays)**:
  - **Layer 1 (WebP Sprite Base)**: Compressed 1024x1024 WebP (~40 KB), 100% artist original fidelity, 1 GPU draw call.
  - **Layer 2 (Skia Parametric Overlays)**: Reanimated GPU wind sway, continuous live growth scaling (0.35x -> 1.0x), multi-layer alpha dissolve morphing, soft ground shadows, and floating golden fireflies.
- **Focus Tiers & Diamond Tile Proportions**:
  - **Form 1: Basic (10m - 59m focus)**: Scale $0.48\times$ relative to tile width `camera.tw`.
  - **Form 2: Advanced (60m - 119m focus)**: Scale $0.62\times$.
  - **Form 3: Majestic (120m - 180m max focus)**: Scale $0.76\times$.
- **Anchor Standard**: Trunk base at $(X = 50\%, Y = 90\%)$. Every plant item must support these 3 forms.
- Duration mapper: `durationToGrowthForm(focusMinutes): 1 | 2 | 3`.

## 🏝️ 2. Isometric Land Biome Architecture (`.agents/skills/isometric-land-biome-workflow/SKILL.md`)
- **2.5D Layering Rule**:
  - **Base Ground Foundation (Layer A)**: Render cliff walls, grass overhang lip, top diamond tiles, clipped moss patches, and micro-flora FIRST.
  - **Upright Actors (Layer B)**: Depth-sort only Trees and Creatures/Eggs against each other via `depth = (x + y) * 2 + layerOffset`. Never mix ground tiles into the actor depth-sort list.
- **Registration Checklist**: `src/types.ts` (`LandStyleKey`), `src/data/species.ts` (`LAND_CATALOG`), and `src/components/grove/LandThumbnails.tsx`.

## 📐 3. Isometric Math & Graphics (`.agents/skills/grove-sprite-rendering/SKILL.md`)
- Canvas: `@shopify/react-native-skia`
- Locomotion / Animation: `react-native-reanimated` UI worklets.
- Verification: Always run `npx tsc --noEmit` after code changes.
