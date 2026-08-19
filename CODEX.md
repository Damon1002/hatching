# OpenAI Codex / Copilot Development Guide for Hatching

This repository follows strict modular architecture and standardized skills. Before modifying or implementing features, refer to the official skill guides in `.agents/skills/`:

## 🌿 1. Flora 3-Form Growth Workflow (`.agents/skills/flora-3form-growth-workflow/SKILL.md`)
- **Forest Focus Mechanism**: Every plant/tree item that grows on land supports 3 forms:
  - **Form 1: Basic (10m - 59m focus)**: Young sapling, single crown ($0.85\times - 1.0\times$).
  - **Form 2: Advanced (60m - 119m focus)**: Multi-tiered lush canopy ($1.2\times - 1.4\times$).
  - **Form 3: Majestic (120m - 180m max focus)**: Grand ancient tree, root flairs, falling particles ($1.6\times - 1.9\times$).
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
