# Claude Code Project Guidelines for Hatching

This codebase uses the standardized `.agents/skills/` specification.

## Core Workflows:
- **Flora Growth (Forest Model)**: `.agents/skills/flora-3form-growth-workflow/SKILL.md` (3-form progression: Basic 10-59m, Advanced 60-119m, Majestic 120-180m max).
- **Isometric Land Biomes**: `.agents/skills/isometric-land-biome-workflow/SKILL.md` (Layer A: ground surface foundation, Layer B: depth-sorted upright actors).
- **Sprite Rendering**: `.agents/skills/grove-sprite-rendering/SKILL.md` (Skia coordinate math, Reanimated worklets).

## Verification:
- Always run `npx tsc --noEmit` to ensure TypeScript passes with 0 errors.
