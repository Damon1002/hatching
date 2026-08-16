# Emberwing production assets

This package deliberately keeps two resolutions:

- `source-2048/` contains the canonical transparent `2048×2048` source frames.
- `runtime-512/` contains optimized `512×512` application frames and the `4096×4096` atlas used by Skia.

## Important future-export reminder

Always export future images, variants, promotional art, or alternative runtime sizes from `source-2048/`.

Do **not** enlarge files from `runtime-512/` or `emberwing-atlas.png`. Those are downsampled delivery assets. Enlarging them cannot recover the premium facet, lighting, membrane, or edge information stored in the 2048px masters.

## Runtime contract

- Frame canvas: `512×512`, straight alpha, sRGB
- Atlas: 8 columns × 8 rows, `4096×4096`
- Ground anchor: `(256, 430)`
- Display scale: `0.45`
- Resting: 12 frames at 10 fps
- Focusing: 12 frames at 9 fps
- Interrupted: 8 frames at 11 fps
- Celebrating: 20 frames at 14 fps

`manifest.json` records frame checksums, source/runtime lineage, anchors, clip layout and the premium-sheet provenance.

## Why the app does not use a single 8192px atlas

A decoded 8192×8192 RGBA atlas is about 256 MiB before GPU overhead. The 4096px runtime atlas is about 64 MiB and matches the app's authored mobile asset contract. Keeping full 2048px masters separately gives us future flexibility without imposing unsafe runtime memory costs.
