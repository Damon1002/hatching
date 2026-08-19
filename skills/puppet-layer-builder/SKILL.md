---
name: puppet-layer-builder
description: Build rig-ready transparent PNG puppet layers from character or creature artwork, including concealed anatomy, pivots, and recomposition QA. From one reference, generate a pose-locked five-view turnaround (front, 3/4, side, 3/4 back, back) and a complete matching layer package for every view. Use for puppet parts, Skia or FK rigs, camera yaws, turnarounds, or facing views. Do not use for posture-sheet extraction or pure vector redraws unless explicitly requested.
---

# Puppet Layer Builder

Turn supplied character artwork into isolated, animation-ready raster layers. Preserve visible source pixels exactly where practical. Reconstruct only concealed, contaminated, or missing regions, and label every reconstruction honestly.

From one image, this skill can orbit the camera around the frozen pose and build a full, independently usable layer package for every yaw.

Use the environment's image-edit tools (the installed `imagegen` or `imagine` skill). Prefer image-to-image editing with the source as the visual reference. Follow that skill's built-in-tool workflow unless the user explicitly chooses a CLI fallback. Do not generate derived yaws from text alone.

When image generation is required, read [references/image-edit-prompts.md](references/image-edit-prompts.md) and adapt its structured prompt blocks to the figure.

## Source assessment

Inspect every source image before editing. Record:

- the canonical reference pose, canvas size, and nearest yaw id from the turnaround contract;
- visible anatomy, occlusions, and ambiguous boundaries;
- which pixels can be extracted deterministically and which parts require reconstruction;
- intended motions and the joints that need concealed overlap.

If a layered source exists, prefer its layers. For a flat image, retain visible pixels through deterministic extraction when clean segmentation is possible. Use image generation only to complete concealed anatomy, repair contaminated edges, create a part absent from the source, or derive a yaw absent from the source. When a part cannot be cut cleanly, generate a matching complete replacement from the current accepted view, then restore any clean visible source pixels over it when feasible. Never claim reconstructed pixels are identical to unseen original artwork.

Proceed with reasonable anatomical assumptions unless ambiguity would materially change the layer plan. Explain any significant split that differs from the user's requested list.

## Layer plan

Default to this contract when it fits the figure:

- `layer_head.png` — head and crest, with neck insertion overlap;
- `layer_neck_and_torso.png` — continuous neck, chest, and body;
- `layer_front_wing.png` — foreground or hero-side wing with full shoulder anchor;
- `layer_back_wing.png` — background wing with full shoulder anchor;
- `layer_tail.png` — complete curved tail, including dorsal spines and a hidden root;
- `layer_legs.png` — thighs, feet, and paws with concealed hip overlap.

Adapt the anatomy rather than inventing structures. Split combined limbs or appendages when independent movement requires it, using descriptive lowercase snake-case filenames such as `layer_front_leg.png`. Keep left/right naming from the character's perspective. Use `front`/`back` for render depth only when that is the established package convention, and state the convention in every manifest.

Before producing assets, read [references/layer-contract.md](references/layer-contract.md).

## Production

For every generated or reconstructed part, issue a separate image edit with the current accepted view master as the visual reference. Never ask one edit to return a grid or several parts. Require:

- genuine alpha transparency, not a checkerboard or solid-color background;
- unchanged character identity, palette, texture, linework, lighting, and rendering style;
- the complete named part only, with no fragments, shadows, outlines, or color bleed from adjacent parts;
- a naturally extended hidden joint/root beneath the neighboring layer;
- neutral geometry suitable for rotation or modest deformation;
- no text, guides, shadows cast onto a background, or watermark.

Preserve the view master's orientation, scale, lighting direction, and pixel registration. Do not independently recenter, rotate, or rescale a layer. Give every layer transparent safety padding beyond both the visible silhouette and concealed overlap. Record the trimmed layer's canonical-canvas position as `originPx`.

When generation alters visible details, composite preserved source pixels over the reconstructed hidden extension where feasible. Source-faithful visible regions outrank a plausible redraw.

Save final assets in a single user-named folder. Do not overwrite an existing package unless explicitly requested; create a versioned sibling instead.

## Turnaround mode

Use this mode when the user asks for front, 3/4, side, 3/4 back, back, a turnaround, extra yaws, or heading-dependent facing. Otherwise produce one layer package from the source.

Read [references/turnaround-contract.md](references/turnaround-contract.md) before generating any yaw. Then:

1. Normalize the source onto a transparent canonical canvas without changing the figure, classify its nearest yaw, and copy it to that view's `source.png`.
2. Write the required view ids, exact layer inventory, identity freeze-list, and viewer-relative asymmetry map before generation.
3. Generate each missing yaw one adjacent step at a time with image-to-image editing from the source and nearest accepted neighbor. Verify identity, pose lock, genuine rotation, scale, silhouette, and ground line before accepting it or generating the next yaw.
4. Write `turnaround_sheet.png` with `scripts/compose_turnaround_sheet.py`.
5. Only then run **Layer plan**, **Production**, and **Verification** on every accepted `source.png`. Use the same layer `name` inventory in every view; reconstruct a complete hidden part when a yaw conceals it. Recompute z-order, origins, and pivots per view.

## Verification

For each package, run `scripts/render_layer_package.py <view-folder>` to create its assembled preview, contact sheet, recomposition difference, and numerical QA summary. Visually compare the recomposition against that package's source master; metrics assist review but do not replace it.

For a turnaround, compare every yaw master against the original and adjacent views using the turnaround QA gates. Then review each view's isolated parts and recomposition. A plausible turnaround with mismatched anatomy is a failure, as is a perfect full figure with unusable layers.

Iterate on visible seams, halos, duplicated outlines, scale drift, missing texture, incorrect occlusion, or color mismatch.

Single-package delivery:

- all final `layer_*.png` files;
- `assembled_preview.png` on transparency or a neutral QA background;
- `layer_manifest.json` following the layer-contract schema;
- `contact_sheet.png` showing every isolated layer with its filename;
- `recomposition_diff.png` and `qa_metrics.json` from the renderer.

Turnaround delivery adds:

- root `source.png`, `turnaround_manifest.json`, and `turnaround_sheet.png`;
- a complete layer package under `views/<id>/` for each produced yaw.

Run `scripts/validate_puppet_layers.py <output-folder>` with a Python environment containing Pillow. It detects a turnaround versus a single package. In turnaround schema v2 it treats absent required yaws, inconsistent layer inventories, wrong yaw metadata, invalid alpha, scale drift, and ground drift as errors. Resolve every error before delivery and disclose unavoidable warnings.

Report the saved folder, view list when applicable, layer list per package, which regions or yaws were reconstructed, the image-generation mode used, and any rigging limitation caused by the source pose.
