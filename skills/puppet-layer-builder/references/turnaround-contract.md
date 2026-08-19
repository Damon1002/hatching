# Five-view turnaround contract

Read this before deriving camera angles from one source. Each view is also a complete package governed by [layer-contract.md](layer-contract.md).

A turnaround is a camera orbit around one frozen pose, not a posture sheet. Sitting stays sitting; limb placement, expression, proportions, accessories, and ground contact stay fixed unless perspective genuinely hides them.

## Required views

Produce all five by default. A subset is valid only when the user explicitly requests it; record that subset in `requiredViewIds`.

| `id` | `yawDegrees` | Acceptance gate |
|---|---:|---|
| `front` | 0 | Face and chest centered toward camera; bilateral structures read symmetrically unless the design is asymmetric. |
| `three_quarter` | 45 | Front 3/4; one eye dominant, snout toward a frame corner, near-side parts larger. |
| `side` | 90 | Strict profile; snout, chest, and paws point to one edge; far eye hidden. |
| `three_quarter_back` | 135 | Back 3/4; back of skull and torso dominate; only a perspective-correct sliver of cheek or snout may show. |
| `back` | 180 | Face hidden; dorsal crest, paired wings, back, legs, and tail read from behind. |

`yawDegrees` is camera yaw, with 0 at the front. The 3/4 and profile views point in the same image-space direction as the source snout; record it as `facing: "right"` or `"left"`. A horizontal flip is not a new yaw.

## Identity and pose lock

Before generation, write these fields in the turnaround manifest:

- `identityFreeze.palette`: named colors and where they occur;
- `identityFreeze.markings`: eyes, claws, belly plates, horns, spines, membranes, and other countable features;
- `identityFreeze.proportions`: head/body ratio, limb lengths, wing size, tail length, and silhouette notes;
- `identityFreeze.pose`: exact pose and ground contacts;
- `identityFreeze.style`: linework, shading, texture, and rendering language;
- `asymmetryMap`: each asymmetric feature described with viewer-left/viewer-right wording;
- `requiredLayerNames`: the exact semantic part inventory shared by every view.

Use image-to-image editing. The original remains a reference for every yaw. Generate one adjacent step at a time along `front → three_quarter → side → three_quarter_back → back`, using the nearest accepted neighbor as an additional reference. Do not produce the set from text alone or accept a mildly warped copy as a new angle.

Each edit changes camera yaw only. Require an isolated full figure, genuine alpha transparency, no ground shadow, no text, no guides, and no checkerboard. Reject and retry when pose, expression, part count, markings, palette, scale, style, or ground contact drifts.

The supplied source yaw is normalized to the shared canvas and copied byte-for-byte into its matching `views/<id>/source.png`; do not regenerate it.

## Shared registration

All view masters use one RGBA `referenceCanvas`. Keep character height consistent and the lowest opaque foot row aligned to `groundY`. Horizontal centering may follow the silhouette. Apply any resolution change uniformly across the entire set.

Across required views:

- opaque-bounding-box height may differ by no more than 8% of canvas height;
- the lowest opaque row may differ from `groundY` by no more than 2% of canvas height;
- no opaque master pixels may touch the canvas edge;
- the source view master must exactly match root `source.png` after normalization.

## Per-view layers

Do not layer a yaw until its full-figure master passes the turnaround gates.

Every `views/<id>/` folder contains the same ordered semantic layer inventory. For each layer:

1. Extract clean visible source pixels when separable.
2. Reconstruct concealed joint overlap, contaminated borders, or the complete part when it is hidden or inseparable.
3. Generate one isolated part per edit, using that yaw's accepted `source.png` plus the original reference.
4. Preserve registration; never independently pose, center, rotate, or resize the part.
5. Record reconstructed regions and source treatment in the layer manifest.

A back view still requires complete head, front/back wings, torso, tail, and legs even when overlap hides most of one part. Recompute z-order, origins, and pivots per view; keep semantic names stable.

## Folder layout

```text
<output>/
  source.png
  turnaround_manifest.json
  turnaround_sheet.png
  views/
    front/
      source.png
      layer_*.png
      layer_manifest.json
      assembled_preview.png
      contact_sheet.png
      recomposition_diff.png
      qa_metrics.json
    three_quarter/
    side/
    three_quarter_back/
    back/
```

Every required view folder has the same file types. Its `layer_manifest.json` uses `source.png` as `sourceImage` and the shared canvas.

## Turnaround manifest schema

Use schema version 2:

```json
{
  "schemaVersion": 2,
  "kind": "turnaround",
  "character": "ruby",
  "sourceImage": "source.png",
  "sourceViewId": "three_quarter",
  "facing": "right",
  "pose": "seated",
  "referenceCanvas": { "width": 2048, "height": 2048 },
  "groundY": 1900,
  "requiredViewIds": ["front", "three_quarter", "side", "three_quarter_back", "back"],
  "requiredLayerNames": ["back_wing", "tail", "neck_and_torso", "front_wing", "legs", "head"],
  "identityFreeze": {
    "palette": ["ruby-pink body", "cream belly", "burgundy wing ribs"],
    "markings": ["single row of dorsal spines", "three claws per visible foot"],
    "proportions": ["large baby head", "short seated torso", "long curled tail"],
    "pose": ["seated", "both feet grounded", "wings raised"],
    "style": ["clean rounded vector illustration", "soft gradient shading"]
  },
  "asymmetryMap": [],
  "perspectiveConvention": "view ids are camera yaw; layer side names use the character's perspective",
  "generationMode": "image-to-image edits chained through accepted adjacent views",
  "views": [
    {
      "id": "three_quarter",
      "yawDegrees": 45,
      "folder": "views/three_quarter",
      "viewImage": "source.png",
      "derivedFrom": "root source.png",
      "reconstructed": false,
      "qaStatus": "accepted"
    }
  ]
}
```

`views` contains exactly the ids in `requiredViewIds`. `reconstructed` is false only for the copied source yaw. `qaStatus` must be `accepted` before layer production.

## Required QA sequence

1. Inspect the five full-figure masters together and reject identity, pose, scale, yaw, or alpha failures.
2. Run `scripts/compose_turnaround_sheet.py <output-folder>` and inspect the labeled sheet.
3. For every view, inspect each isolated layer at large scale, then run `scripts/render_layer_package.py <view-folder>`.
4. Compare `assembled_preview.png` and `recomposition_diff.png` against that view's `source.png`; repair seams, halos, missing pixels, duplicated outlines, or contamination.
5. Run `scripts/validate_puppet_layers.py <output-folder>`. Deliver only with zero errors.

Automated checks cannot prove anatomy or identity. Visual acceptance remains mandatory.
