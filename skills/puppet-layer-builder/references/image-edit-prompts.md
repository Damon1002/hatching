# Image-edit prompt blocks

Read this only when generating a missing yaw or reconstructing a part. Replace bracketed fields with observations from the accepted images. Always attach the original reference; for a derived yaw also attach the nearest accepted adjacent yaw.

## Full-figure yaw edit

```text
TASK: Rotate the camera to [VIEW_ID / YAW] around the exact same character in the exact same frozen [POSE]. Change camera yaw only.

IDENTITY FREEZE:
- Palette: [PALETTE]
- Markings and countable anatomy: [MARKINGS]
- Proportions and silhouette: [PROPORTIONS]
- Expression and pose contacts: [POSE LOCK]
- Rendering style: [STYLE]
- Viewer-relative asymmetries: [ASYMMETRY MAP]

ANGLE GATE: [FRONT / STRICT PROFILE / BACK 3/4 / BACK definition from turnaround contract]. This must be a genuine new camera angle, not a horizontal flip, warped duplicate, or posture change.

OUTPUT: One complete isolated figure, same canonical scale and ground line, genuine alpha transparency. No checkerboard, floor, cast shadow, text, labels, guides, props, crop, or extra anatomy.
```

Reject the output if any frozen trait drifts. Do not proceed to the next yaw until the current one passes.

## Isolated-part edit

Run one request per part.

```text
TASK: From the attached accepted [VIEW_ID] master, return only the complete [PART_NAME] in the identical orientation, pose, pixel scale, palette, linework, lighting, and rendering style.

BOUNDARY: Include [EXACT ANATOMICAL SCOPE]. Exclude every adjacent body part and exclude its outline, shadow, reflected color, or fragment.

HIDDEN COMPLETION: Reconstruct [HIDDEN REGION / JOINT ROOT] beneath the covering layer, continuing the local anatomy, texture, shading, and contour naturally. Provide [OVERLAP TARGET] of concealed overlap for rig motion. Do not add a second visible seam at the hidden root.

REGISTRATION: Preserve the part's location relative to the accepted full-figure canvas. Do not independently recenter, rotate, reshape, or resize it.

OUTPUT: One isolated RGBA PNG with genuine alpha and safety padding. No checkerboard, background, cast shadow, text, labels, guides, watermark, or other body fragments.
```

If clean source pixels exist, composite them back over the generated hidden completion. Use a wholly generated replacement only when extraction cannot separate the visible part without contamination, and record that choice in `sourceTreatment`.

## Repair edit

When QA finds a defect, name only the defect and frozen areas:

```text
Repair only [SEAM / HALO / MISSING ROOT / CONTAMINATION] on [PART_NAME]. Preserve all other pixels, registration, proportions, palette, and alpha. Return the same isolated part only.
```
