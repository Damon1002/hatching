# Dragon export reminder

Emberwing has canonical **2048×2048 transparent source assets** at:

```text
assets/dragon/emberwing/source-2048/
```

Whenever a future request asks to export, resize, restyle, package or create a new atlas, start with those 2048px files. Never upscale the 512px runtime frames or the atlas.

The runtime set is intentionally derived from the masters:

```text
source-2048 → high-quality downsample → runtime-512 → 4096×4096 atlas
```

See `assets/dragon/emberwing/manifest.json` for checksums and provenance.
