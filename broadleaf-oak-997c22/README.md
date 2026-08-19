# Broadleaf Oak

https://polyfork.dev/asset/broadleaf-oak-997c22

A parametric low-poly model for three.js. One import, no loader, no textures,
one draw call. `createAsset()` returns a ready `THREE.Group`.

## What is in this folder

| file | what it is |
| --- | --- |
| `index.html` | a complete working page: **double-click it** |
| `broadleaf-oak-997c22.mjs` | the model as an ES module, with every option below |
| `broadleaf-oak-997c22.glb` | the same model baked, for Unity, Godot, Blender and glTF loaders |
| `LICENSE.txt` | the terms, in short: use it commercially, do not resell it, do not build a commercial asset generator from it |

## Run it

Double-click `index.html`. It needs an internet connection the first time,
because three.js is pulled from unpkg.com.

It carries its own copy of the model code so that it works from a `file://`
URL, where browsers refuse to load ES modules. If you would rather edit
`broadleaf-oak-997c22.mjs` and see the page pick up your changes, serve the folder
and it will import the file instead of the copy:

```
python3 -m http.server     # then open http://localhost:8000
```

## Use it in your own scene

```js
import { createAsset } from './broadleaf-oak-997c22.mjs';
scene.add(createAsset());
```

The bare `three` specifiers resolve through any bundler (Vite, webpack, esbuild),
or through an importmap in your page:

```html
<script type="importmap">
{ "imports": { "three": "https://unpkg.com/three@0.180.0/build/three.module.js",
               "three/addons/": "https://unpkg.com/three@0.180.0/examples/jsm/" } }
</script>
```

Prefer the GLB? `new GLTFLoader().load('broadleaf-oak-997c22.glb', g => scene.add(g.scene))`.
The module is the smaller and more flexible of the two: it carries the options
below, the GLB is one frozen configuration of them.

## Options

```js
createAsset({
  colorway: 'summer-oak',
  leaf: '#4c8140',
  leafLight: '#77b258',
  bark: '#4a3527',
  foot: '#75563b',
  tallness: 1,
  limbs: 3,
  canopy: 1,
});
```

| option | type | default | accepts | what it does |
| --- | --- | --- | --- | --- |
| `colorway` | choice | `'summer-oak'` | `'summer-oak'`, `'spring-oak'`, `'deep-forest'`, `'autumn-oak'` | Curated kit-palette scheme; sets all four zone colours at once. summer-oak is the shipped build: dark brown limbs over a lighter warm brown foot, a mid-green main canopy lump and a step-lighter green on the satellite lumps. spring-oak lifts the whole canopy to fresh acid green and warms the bark. deep-forest drops the foliage to heavy dark green over near-black bark, an old oak standing in shade. autumn-oak turns the crown amber and gold over unchanged bark. Every scheme keeps the canopy one hue family with the main lump dominant and the trunk clearly darker than the foliage. |
| `leaf` | color | `'#4c8140'` | any hex or `THREE.Color` | The DOMINANT canopy tone — the one big rounded lump that is the tree, about two thirds of all foliage, and the colour the oak is named by at a distance. One uniform mid green on every facet: the lump is real faceted geometry and the scene lights shade it. This should always be the tone that wins. |
| `leafLight` | color | `'#77b258'` | any hex or `THREE.Color` | The lighter green: every satellite and shoulder lump clustered around the main mass, plus two hand-aimed patches inside the main mass (one up-facing, one down-facing, so it is structured foliage variation and never baked shading). Must sit a clear value step above the main canopy tone or the lumps fuse into the big mass and the crown reads as one flat ball. |
| `bark` | color | `'#4a3527'` | any hex or `THREE.Color` | Albedo of the trunk above the bark line at 1.15 m and of all three limbs — one uniform dark brown on every facet, because the taper, the bow and the six flat columns are real geometry. Clearly darker than the foot and far darker than any foliage tone, so the fork reads as a dark Y against the green. |
| `foot` | color | `'#75563b'` | any hex or `THREE.Color` | The lower 1.15 m of the trunk plus its root flare, in a lighter warm brown that ends on a real bark line rather than fading. Lighter than the upper bark — this is deliberate albedo and the inverse of a light-from-above gradient. At parity with the upper bark the trunk loses its footing and reads as a plain stick; pushed too pale it reads as stone. |
| `tallness` | range | `1` | `0.82` to `1.06` | How tall this oak has grown, about 6.1 m at 0.82 to 7.3 m at 1.06 (7.0 m at the shipped default). REBUILT, not scaled: the trunk gains RINGS at a constant 0.55 m pitch — four above the bark line at 0.82, six at 1.06 — so the triangle count moves with the knob, and the limbs re-solve their tips against the crown at its new height. The trunk girth, the root flare, the bark line at 1.15 m and every foliage mass are untouched: a tall one is a leggier tree carrying the same head. |
| `limbs` | range | `3` | `2` to `5` | How many limbs the trunk splits into, counting the leader that carries on up into the crown. Each extra limb is a real lofted branch plus its own satellite foliage lump, so the triangle count moves. At 2 a spare tree — one leader and one side limb, with a lot of sky under the crown; at 3 (shipped) the reference oak, a clear Y with a big lump left and a smaller one right; at 5 a dense four-way fork with a lump in every quadrant. The limbs are hand-placed at fixed azimuths and heights so extra ones fill the empty quarters rather than widening the tree, and the spread stays inside 4.3 m at every value. |
| `canopy` | range | `1` | `0.84` to `1.16` | The size of every foliage mass together — the big lump, the satellite lumps and the shoulder lumps — from 0.84 (a thin, see-through crown with a lot of limb showing and a deeply scalloped outline) to 1.16 (a heavy nearly closed head where the satellites merge into the main mass). A foliage blob has no repeating structure inside it, so this knob honestly resizes the masses instead of pretending to rebuild them; the limbs re-solve their tips against the new surface so no branch is ever left stopping in open air, and the trunk is untouched. The two rebuilding size knobs are tallness and limbs. |

## Specs

457 triangles, 1 material, 4.5 × 6.98 × 3.57 m, real-world scale.

## Building this with an AI agent?

Point it at https://polyfork.dev/prompt.txt: the whole catalogue as working
instructions, no key needed to browse. There is an MCP server too, at https://polyfork.dev/mcp.

## License

Personal and commercial use: games, apps, websites, client work.
Modify freely, no attribution required. Do not resell or redistribute the files
themselves as assets, or use them to build or train a COMMERCIAL asset
generator: a model, service or pipeline that produces 3D assets and that you
sell or offer to others. Personal experiments, research and learning are fine.
Breaking these terms can end your license and your access, without a refund.

Full terms: https://polyfork.dev/licensing
