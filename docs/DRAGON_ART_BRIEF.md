# Aeris — Dragon Animation Asset Brief

This is the production handoff specification for replacing Dragon Grove's procedural placeholder with authored character animation.

## What to provide first

Before producing a full animation set, provide these three files:

1. `aeris-character-sheet.png` — front, three-quarter, side and curled sleeping views.
2. `aeris-style-frame.png` — one fully rendered 2048 × 2048 scene showing Aeris beside the hearth in the intended final style.
3. `aeris-idle-test.psd` or layered equivalent — one three-quarter resting pose with the layers listed below.

Do not begin with 50 finished animation frames. We should first validate silhouette, scale, palette, readability at phone size, and whether the character feels calm rather than childish.

## Visual direction

- Original cozy dark fantasy—not an existing film, game, or animation franchise.
- Soft painterly forms with a clear silhouette at 180–240 logical points tall.
- Natural desaturated green/charcoal body with restrained warm reflected firelight.
- Expressive through posture, eyes, ears, and tail rather than exaggerated facial acting.
- Mature enough for adults, gentle enough to feel safe.
- Light direction: hearth light from lower right; cool moon fill from upper right.

## Required layered master

Preferred master size: **2048 × 2048 px**, transparent background, wide-gamut RGB if your painting application supports it.

Keep these editable layers or groups:

```text
aeris
├── rear_wing
├── rear_horn
├── tail
├── body
│   ├── base_colour
│   ├── texture
│   ├── moon_light
│   └── fire_light
├── belly
├── front_leg_rear
├── front_leg_front
├── head
│   ├── base
│   ├── muzzle
│   ├── eye_left
│   ├── eye_right
│   ├── eyelids
│   ├── nostrils
│   └── mouth
├── ear_left
├── ear_right
├── front_horn
├── front_wing
├── contact_shadow
└── optional_fx
    ├── nose_smoke
    └── ember_glow
```

The contact shadow must be separate. Do not paint the hearth, floor, scenery, smoke, or particles into the character frames.

## Animation clips for the first release

| Clip | Frames | Playback | Loop | Purpose |
| --- | ---: | ---: | --- | --- |
| `resting` | 12 | 10 fps | yes | Slow breathing; tiny secondary movement |
| `focusing` | 12 | 9 fps | yes | More settled posture; eyes softly closed or reading/guarding |
| `interrupted` | 8 | 11 fps | no | Looks up gently, then returns—never disappointed |
| `celebrating` | 20 | 14 fps | no | Wakes, small wing lift, warm fire response; no confetti |

Recommended later clips:

| Clip | Frames | Notes |
| --- | ---: | --- |
| `blink` | 4 | Optional overlay if not included in idle |
| `ear_twitch` | 6 | Sparse random secondary action |
| `tail_sweep` | 10 | Sparse random secondary action |
| `sleeping` | 12 | Longer sessions/night ambience |
| `hatching` | 30–48 | Produce only after the base dragon style is approved |

## Frame and atlas requirements

> **Future export reminder:** Emberwing's canonical transparent source frames are `2048 × 2048` and live in `assets/dragon/emberwing/source-2048/`. Always create future exports or variants from those files. Never upscale the `runtime-512` frames or atlas.

- Each exported frame: **512 × 512 px**, transparent PNG.
- Atlas: **8 columns × 8 rows**, 4096 × 4096 px maximum.
- Every frame uses the same 512 × 512 canvas.
- Feet/contact point stays at **(256, 430)** in every grounded frame.
- Keep at least **24 px transparent padding** around visible artwork.
- Never crop each frame independently; that causes visible jitter.
- Straight alpha, sRGB final export.
- No baked background or UI.
- No GIF as the master delivery format.

Atlas frame order already expected by the app:

```text
frames 00–11  resting
frames 16–27  focusing
frames 32–39  interrupted
frames 40–59  celebrating
```

Unused cells must remain transparent. The implementation is defined in `src/dragon/dragonAtlas.ts`.

## Motion direction

### Resting

- Chest rises approximately 1–2%.
- Head counter-moves slightly so it does not look mechanically scaled.
- Tail follows the body by two or three frames.
- Ear movement is occasional, not present in every cycle.
- The loop seam must be invisible.

### Focusing

- Less visual movement than resting.
- Slower breathing, stable silhouette.
- Avoid attention-grabbing eye contact with the user.
- This animation will remain visible for long sessions, so restraint matters more than spectacle.

### Interrupted

- Aeris looks up with curiosity or recognition.
- No frown, recoil, sadness, or punishment language.
- The final frame should transition cleanly into `resting`.

### Celebrating

- One readable action: wake → small wing lift → warm fire response → settle.
- Peak pose around 55–65% of the clip.
- No continuous bounce and no large full-screen movement.
- Must still read with sound disabled.

## Review exports

For every clip, provide:

- Layered source file.
- Individual transparent PNG frames.
- One contact sheet with frame numbers.
- One MP4 preview on both a mid-green and checkerboard background.
- Final atlas PNG only after frame review.

## Acceptance checklist

- Character reads clearly when displayed at 220 × 220 pt.
- No frame-to-frame anchor jitter.
- No halo/fringing around transparent edges.
- Loop seam is not visible at 0.5× playback speed.
- Fire-light layer stays spatially consistent.
- Animation remains calm after watching for two minutes.
- Silhouette remains distinct in grayscale.
- Reduced Motion can use the first frame of every clip as a meaningful static pose.
