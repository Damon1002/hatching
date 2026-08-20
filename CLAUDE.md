# Claude Code Project Guidelines for Hatching

This codebase uses the standardized `.agents/skills/` specification.

## Core Workflows:
- **Flora Growth (Hybrid Architecture)**: `.agents/skills/flora-3form-growth-workflow/SKILL.md` (WebP Sprite Base + Skia Parametric Overlays; 3-form progression: Basic 10-59m [0.48x], Advanced 60-119m [0.62x], Majestic 120-180m max [0.76x]; Anchor at X: 50%, Y: 90%).
- **Isometric Land Biomes**: `.agents/skills/isometric-land-biome-workflow/SKILL.md` (Layer A: ground surface foundation, Layer B: depth-sorted upright actors).
- **Sprite Rendering**: `.agents/skills/grove-sprite-rendering/SKILL.md` (Skia coordinate math, Reanimated worklets).

## Verification:
- Always run `npx tsc --noEmit` to ensure TypeScript passes with 0 errors.
