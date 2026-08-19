# Rig-layer output contract

Read this reference before creating or validating a puppet-layer package. For a multi-yaw set from one image, also read [turnaround-contract.md](turnaround-contract.md).

## Registration and cropping

Use one canonical reference canvas for the whole character. Trim each PNG for efficient texture use, but preserve its position through `originPx` in the manifest. `originPx` is the trimmed image's top-left location on the canonical canvas.

Do not resize parts independently. If the output resolution differs from the source, apply one uniform scale to the entire package and record it.

Each PNG needs transparent safety padding. Use at least 8 physical pixels at final resolution, or about 1% of the longest canvas edge when that is larger. Padding is outside the part and must not replace concealed anatomical overlap.

## Concealed overlap

Extend artwork beneath joints far enough for the requested motion range:

- neck into torso: approximately 15–25% of neck width;
- head over neck: approximately 15–25% of the attachment diameter;
- wing into shoulder: approximately 20–35% of shoulder width;
- tail into pelvis: approximately 20–30% of tail-root width;
- legs into hips: approximately 20–30% of upper-limb width.

These are starting points, not fixed ratios. Increase overlap for large rotations or squash-and-stretch. The extension should continue local texture, shading, contour direction, and anatomy without adding a second visible outline under the covering layer.

## Layer order

Choose z-order from the canonical pose and record it explicitly. A common back-to-front order is:

1. back wing;
2. tail;
3. rear limbs;
4. neck and torso;
5. front wing;
6. front limbs;
7. head.

Do not force this order when the source pose requires another occlusion relationship.

## Pivots

Set each pivot at its anatomical attachment, not at the image center. Store `pivotNormalized` relative to the trimmed PNG, where `[0, 0]` is its top-left and `[1, 1]` is its bottom-right. Suggested attachments include skull base, shoulder socket, tail root, and hip center.

If a combined layer contains multiple independently moving parts, either split it or state that the layer supports only whole-layer movement.

## Manifest

Write valid JSON using this structure:

```json
{
  "schemaVersion": 2,
  "character": "ruby",
  "sourceImage": "source.png",
  "perspectiveConvention": "front/back are from the character's perspective",
  "referenceCanvas": { "width": 2048, "height": 2048 },
  "layers": [
    {
      "file": "layer_head.png",
      "name": "head",
      "parent": "neck_and_torso",
      "attachment": "skull_base",
      "zIndex": 60,
      "originPx": { "x": 640, "y": 120 },
      "pivotNormalized": { "x": 0.5, "y": 0.82 },
      "reconstructed": true,
      "reconstructedRegion": "concealed neck insertion only",
      "sourceTreatment": "visible source pixels preserved over generated hidden extension"
    }
  ]
}
```

Use `parent: null` for the rig root. Keep filenames and manifest entries synchronized. Every layer needs a unique `name`, filename, and `zIndex`; parents reference layer `name` values. Record reconstruction per layer; do not label an entire layer reconstructed when only its concealed root was generated. When `reconstructed` is true, `reconstructedRegion` and `sourceTreatment` are required.

For a turnaround, the ordered set of manifest layer `name` values must exactly match the root `requiredLayerNames` list in every view. The pixels, z-order, pivots, and origins vary per view; semantic names do not.

## QA acceptance criteria

- Files decode as RGBA PNGs and contain both visible and transparent pixels.
- No visible pixels touch a PNG boundary; safety padding remains on every side.
- Each image contains only its named body part.
- A visible part uses source pixels wherever clean extraction is possible; generated replacement is reserved for occluded or inseparable regions.
- Recomposition matches the source pose without gaps, duplicated contours, or color halos.
- Rotating each layer modestly around its pivot does not immediately reveal a hole.
- Visible source details are not needlessly regenerated.
- Contact sheet labels agree with actual filenames.
- Manifest dimensions, origins, pivots, parents, and z-order are valid.
- `assembled_preview.png` uses the reference-canvas dimensions, and `qa_metrics.json` identifies the compared source and layer count.
