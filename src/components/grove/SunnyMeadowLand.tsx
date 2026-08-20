import React, { useMemo } from 'react';
import { Circle, Group, Oval, Path, Skia } from '@shopify/react-native-skia';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import { shade } from '../../grove/color';
import { generateMeadowWorld } from '../../grove/generate';
import { diamondPath, facePath, sx, sy, type IsoCamera } from '../../grove/iso';
import { elemSeed, mulberry32, rr } from '../../grove/rng';
import type { TagKey } from '../../theme';
import {
  EmberMote,
  GroveCreatureSprite,
  GroveEgg,
  GroveTreeSprite,
  type RubyClipControl,
} from './GroveActors';

const TAU = Math.PI * 2;

export interface SunnyMeadowLandProps {
  camera: IsoCamera;
  seed: number;
  time: SharedValue<number>;
  focusMinutes?: number;
  sessionsCompleted?: number;
  tag?: TagKey;
  speciesId?: string;
  dragonClip?: RubyClipControl;
  dragonSize?: number;
  gridSize?: number; // default 5 (5x5 = 25 cube lands)
  isFocusing?: boolean;
  progress?: number;
  progressSV?: SharedValue<number>;
  focusingSV?: SharedValue<number>;
  palette?: {
    leaf: string;
    leafDark: string;
    leafAccent?: string;
    bark: string;
  };
}

interface DappledPatch {
  key: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
}

interface MicroFlower {
  key: string;
  type: 'daisy' | 'dandelion' | 'grass_tuft' | 'blossom_dot';
  x: number;
  y: number;
  scale: number;
}

interface BrickDarkPatch {
  key: string;
  path: string;
  color: string;
  opacity: number;
}

interface BrickInfo {
  tileKey: string;
  face: 'left' | 'right';
  x: number;
  y: number;
  basePath: string;
  baseColor: string;
  crevicePath: string;
  creviceColor: string;
  patches: BrickDarkPatch[];
  lipPath: string;
  lipColor: string;
}

type MeadowActorItem =
  | { key: string; depth: number; kind: 'tree'; index: number }
  | { key: string; depth: number; kind: 'creature' }
  | { key: string; depth: number; kind: 'egg' };

// Visual color palette matching the reference Sunny Meadow 25-cube island
const MEADOW_COLORS = {
  // Top Meadow surface (Vibrant lime-green / chartreuse)
  grassTop: '#BCE024',
  grassTopLit: '#C6E62C',
  gridLine: 'rgba(92, 136, 12, 0.38)',
  patchLight: 'rgba(235, 252, 115, 0.45)',
  patchWarm: 'rgba(215, 240, 80, 0.36)',

  // Micro-flora
  daisyPetal: '#FFFFFF',
  daisyCenter: '#F8B818',
  daisyStem: '#4E720E',
  dandelionBud: '#F6CA34',
  dandelionLight: '#FFE875',
  grassBlade: '#466C0C',
  blossomPink: '#F68FA8',

  // Grass Overhang Rim
  overhangLipLeft: '#9BC218',
  overhangLipRight: '#86AA12',

  // Earth / Clay Cliff faces
  dirtLeftBase: '#B87914',
  dirtRightBase: '#925A0A',

  // Default Tree Palette
  leaf: '#569E2E',
  leafDark: '#3A741C',
  leafAccent: '#7EC832',
  bark: '#5C3818',
};

/**
 * Generate organic, irregular wavy grass overhang lip with varying scallop counts and depths.
 */
function buildIrregularOverhangLipPath(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  zTop: number,
  camera: IsoCamera,
  edgeSeed: number
): string {
  const p0x = sx(ax, ay, camera);
  const p0y = sy(ax, ay, zTop, camera);
  const p1x = sx(bx, by, camera);
  const p1y = sy(bx, by, zTop, camera);

  const rand = mulberry32(edgeSeed);
  const scallops = Math.floor(rr(rand, 2, 4.5));
  const rawWeights = Array.from({ length: scallops }, () => rr(rand, 0.65, 1.45));
  const totalWeight = rawWeights.reduce((a, b) => a + b, 0);
  const segmentWidths = rawWeights.map((w) => w / totalWeight);

  let d = `M ${p0x.toFixed(1)} ${p0y.toFixed(1)} L ${p1x.toFixed(1)} ${p1y.toFixed(1)}`;

  let curT = 1.0;
  for (let i = scallops - 1; i >= 0; i--) {
    const prevT = curT;
    const nextT = Math.max(0, curT - segmentWidths[i]);
    const midT = (prevT + nextT) / 2 + rr(rand, -0.035, 0.035);
    const dipPx = camera.tw * rr(rand, 0.035, 0.078);

    const endX = p0x + (p1x - p0x) * nextT;
    const endY = p0y + (p1y - p0y) * nextT;
    const midX = p0x + (p1x - p0x) * midT;
    const midY = p0y + (p1y - p0y) * midT + dipPx;

    d += ` Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
    curT = nextT;
  }

  d += ' Z';
  return d;
}

/**
 * Generate an authentic irregular polygonal rock facet on the cliff face (5 to 7 vertices).
 */
function buildOrganicRockFacetPath(
  face: 'left' | 'right',
  fixedCoord: number,
  u0: number,
  z0: number,
  ru: number,
  rz: number,
  camera: IsoCamera,
  patchSeed: number,
  numVertices: number = 6
): string {
  const rand = mulberry32(patchSeed);
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * TAU + rr(rand, -0.25, 0.25);
    const wobble = rr(rand, 0.70, 1.35);
    const u = u0 + Math.cos(angle) * ru * wobble;
    const z = z0 + Math.sin(angle) * rz * wobble;

    const screenX = face === 'left' ? sx(u, fixedCoord, camera) : sx(fixedCoord, u, camera);
    const screenY = face === 'left' ? sy(u, fixedCoord, z, camera) : sy(fixedCoord, u, z, camera);

    pts.push({ x: screenX, y: screenY });
  }

  if (pts.length < 3) return '';

  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  d += ' Z';
  return d;
}

/**
 * Generate a smooth organic boulder / clay blob on the cliff face using quadratic beziers.
 */
function buildOrganicBoulderBlobPath(
  face: 'left' | 'right',
  fixedCoord: number,
  u0: number,
  z0: number,
  ru: number,
  rz: number,
  camera: IsoCamera,
  patchSeed: number
): string {
  const rand = mulberry32(patchSeed);
  const segments = 8;
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * TAU;
    const wobble = 1 + 0.18 * Math.sin(3 * theta + rand() * TAU) + 0.12 * Math.sin(2 * theta);
    const u = u0 + Math.cos(theta) * ru * wobble;
    const z = z0 + Math.sin(theta) * rz * wobble;

    const screenX = face === 'left' ? sx(u, fixedCoord, camera) : sx(fixedCoord, u, camera);
    const screenY = face === 'left' ? sy(u, fixedCoord, z, camera) : sy(fixedCoord, u, z, camera);
    pts.push({ x: screenX, y: screenY });
  }

  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });

  const first = mid(pts[pts.length - 1], pts[0]);
  let d = `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) {
    const next = mid(pts[i], pts[(i + 1) % pts.length]);
    d += ` Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }
  d += ' Z';
  return d;
}

/**
 * Sunny Meadow Plateau Land Component (25-cube 5x5 Plateau).
 * Features solid meadow terrain foundation and depth-sorted 2.5D upright actors (Trees & Dragon).
 */
export function SunnyMeadowLand({
  camera,
  seed,
  time,
  focusMinutes = 10,
  sessionsCompleted = 0,
  tag = 'work',
  speciesId = 'emberwing',
  dragonClip = 'auto',
  dragonSize = 0.25,
  gridSize = 5,
  progressSV,
  focusingSV,
  palette,
}: SunnyMeadowLandProps) {
  // Proportional slab thickness matching reference image
  const zTop = 0.12;
  const zBot = -0.14; // Total height = 0.26 (clean tablet slab)

  const defaultZeroSV = useSharedValue(0);
  const activeProgressSV = progressSV ?? defaultZeroSV;
  const activeFocusingSV = focusingSV ?? defaultZeroSV;

  // 1. Procedural focus-driven meadow trees & creature paths
  const meadowWorld = useMemo(() => {
    return generateMeadowWorld({
      seed,
      focusMinutes,
      sessionsCompleted,
      tag,
      gridSize,
    });
  }, [focusMinutes, gridSize, seed, sessionsCompleted, tag]);

  // Generate 5x5 = 25 tiles list
  const tiles = useMemo(() => {
    const list: { x: number; y: number }[] = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        list.push({ x, y });
      }
    }
    return list;
  }, [gridSize]);

  // 2. Exact 5x5 plateau top boundary diamond clip path
  const meadowTopClipPath = useMemo(() => {
    const pNorthX = sx(0, 0, camera);
    const pNorthY = sy(0, 0, zTop, camera);
    const pEastX = sx(gridSize, 0, camera);
    const pEastY = sy(gridSize, 0, zTop, camera);
    const pSouthX = sx(gridSize, gridSize, camera);
    const pSouthY = sy(gridSize, gridSize, zTop, camera);
    const pWestX = sx(0, gridSize, camera);
    const pWestY = sy(0, gridSize, zTop, camera);

    const d = `M ${pNorthX.toFixed(1)} ${pNorthY.toFixed(1)} L ${pEastX.toFixed(1)} ${pEastY.toFixed(1)} L ${pSouthX.toFixed(1)} ${pSouthY.toFixed(1)} L ${pWestX.toFixed(1)} ${pWestY.toFixed(1)} Z`;
    return Skia.Path.MakeFromSVGString(d) ?? undefined;
  }, [camera, gridSize, zTop]);

  // 3. Dappled Sun / Moss Patches (Contained within safe margins)
  const dappledPatches = useMemo(() => {
    const patches: DappledPatch[] = [];
    tiles.forEach((tile) => {
      const rand = mulberry32(elemSeed(seed, 0x73a1 + tile.y * 13 + tile.x));
      const patchCount = rand() > 0.4 ? 2 : 1;
      for (let i = 0; i < patchCount; i++) {
        const u = tile.x + rr(rand, 0.25, 0.75);
        const v = tile.y + rr(rand, 0.25, 0.75);
        const px = sx(u, v, camera);
        const py = sy(u, v, zTop, camera);
        const rad = camera.tw * rr(rand, 0.08, 0.15);
        patches.push({
          key: `dp-${tile.x}-${tile.y}-${i}`,
          cx: px,
          cy: py,
          rx: rad,
          ry: rad * 0.5,
          color: rand() > 0.5 ? MEADOW_COLORS.patchLight : MEADOW_COLORS.patchWarm,
        });
      }
    });
    return patches;
  }, [camera, seed, tiles, zTop]);

  // 4. Micro-Flora Scatter (Daisies, Grass Tufts, Dandelions, Blossom dots)
  const microFlora = useMemo(() => {
    const flora: MicroFlower[] = [];
    tiles.forEach((tile) => {
      const rand = mulberry32(elemSeed(seed, 0x89c2 + tile.y * 19 + tile.x));
      const count = Math.floor(rr(rand, 2, 4));
      for (let i = 0; i < count; i++) {
        const u = tile.x + rr(rand, 0.18, 0.82);
        const v = tile.y + rr(rand, 0.18, 0.82);
        const px = sx(u, v, camera);
        const py = sy(u, v, zTop, camera);
        const typeRoll = rand();
        const flowerType: MicroFlower['type'] =
          typeRoll < 0.30
            ? 'daisy'
            : typeRoll < 0.62
              ? 'grass_tuft'
              : typeRoll < 0.84
                ? 'dandelion'
                : 'blossom_dot';

        flora.push({
          key: `fl-${tile.x}-${tile.y}-${i}`,
          type: flowerType,
          x: px,
          y: py,
          scale: rr(rand, 0.75, 1.15),
        });
      }
    });
    return flora;
  }, [camera, seed, tiles, zTop]);

  // 5. Generate Cliff Bricks with Authentic Rock-Pattern Facets & Organic Grass Lips
  const cliffBricks = useMemo(() => {
    const bricks: BrickInfo[] = [];

    tiles.forEach((tile) => {
      const isFrontLeft = tile.y === gridSize - 1;
      const isFrontRight = tile.x === gridSize - 1;

      // Front-Left Brick (facing South-West / Sunlit)
      if (isFrontLeft) {
        const brickSeed = elemSeed(seed, 0x4f21 + tile.x * 37);
        const rand = mulberry32(brickSeed);

        const baseColor = shade(MEADOW_COLORS.dirtLeftBase, rr(rand, -0.10, 0.08));
        const basePath = facePath(tile.x, tile.y + 1, tile.x + 1, tile.y + 1, zTop, zBot, camera);
        const crevicePath = facePath(tile.x + 0.94, tile.y + 1, tile.x + 1, tile.y + 1, zTop, zBot, camera);

        const lipPath = buildIrregularOverhangLipPath(
          tile.x,
          tile.y + 1,
          tile.x + 1,
          tile.y + 1,
          zTop,
          camera,
          brickSeed ^ 0x9e37
        );

        const patches: BrickDarkPatch[] = [];

        // Rock 1: Chipped polygonal rock facet on lower-left
        const rock1U = tile.x + rr(rand, 0.25, 0.45);
        const rock1Z = zBot + (zTop - zBot) * rr(rand, 0.30, 0.50);
        const rock1Path = buildOrganicRockFacetPath(
          'left',
          tile.y + 1,
          rock1U,
          rock1Z,
          rr(rand, 0.18, 0.28),
          (zTop - zBot) * rr(rand, 0.22, 0.35),
          camera,
          brickSeed ^ 0x1a2b,
          Math.floor(rr(rand, 5, 7.5))
        );
        if (rock1Path) {
          patches.push({
            key: `rf-1-${tile.x}`,
            path: rock1Path,
            color: shade(baseColor, rr(rand, -0.22, -0.32)),
            opacity: rr(rand, 0.55, 0.75),
          });
        }

        // Rock 2: Smooth boulder / clay blob on right side
        if (rand() > 0.25) {
          const rock2U = tile.x + rr(rand, 0.65, 0.82);
          const rock2Z = zBot + (zTop - zBot) * rr(rand, 0.40, 0.65);
          const rock2Path = buildOrganicBoulderBlobPath(
            'left',
            tile.y + 1,
            rock2U,
            rock2Z,
            rr(rand, 0.14, 0.22),
            (zTop - zBot) * rr(rand, 0.18, 0.28),
            camera,
            brickSeed ^ 0x3c4d
          );
          if (rock2Path) {
            patches.push({
              key: `rf-2-${tile.x}`,
              path: rock2Path,
              color: shade(baseColor, rr(rand, -0.16, -0.26)),
              opacity: rr(rand, 0.45, 0.65),
            });
          }
        }

        // Top shadow under grass overhang
        patches.push({
          key: `lp-top-${tile.x}`,
          path: facePath(tile.x, tile.y + 1, tile.x + 1, tile.y + 1, zTop, zTop - 0.045, camera),
          color: shade(baseColor, -0.24),
          opacity: 0.45,
        });

        bricks.push({
          tileKey: `left-${tile.x}`,
          face: 'left',
          x: tile.x,
          y: tile.y,
          basePath,
          baseColor,
          crevicePath,
          creviceColor: '#623604',
          patches,
          lipPath,
          lipColor: MEADOW_COLORS.overhangLipLeft,
        });
      }

      // Front-Right Brick (facing South-East / Shadow)
      if (isFrontRight) {
        const brickSeed = elemSeed(seed, 0x5b29 + tile.y * 43);
        const rand = mulberry32(brickSeed);

        const baseColor = shade(MEADOW_COLORS.dirtRightBase, rr(rand, -0.10, 0.08));
        const basePath = facePath(tile.x + 1, tile.y, tile.x + 1, tile.y + 1, zTop, zBot, camera);
        const crevicePath = facePath(tile.x + 1, tile.y + 0.94, tile.x + 1, tile.y + 1, zTop, zBot, camera);

        const lipPath = buildIrregularOverhangLipPath(
          tile.x + 1,
          tile.y,
          tile.x + 1,
          tile.y + 1,
          zTop,
          camera,
          brickSeed ^ 0x9e37
        );

        const patches: BrickDarkPatch[] = [];

        // Rock 1: Chipped polygonal rock facet
        const rock1V = tile.y + rr(rand, 0.25, 0.50);
        const rock1Z = zBot + (zTop - zBot) * rr(rand, 0.30, 0.50);
        const rock1Path = buildOrganicRockFacetPath(
          'right',
          tile.x + 1,
          rock1V,
          rock1Z,
          rr(rand, 0.18, 0.28),
          (zTop - zBot) * rr(rand, 0.22, 0.35),
          camera,
          brickSeed ^ 0x1a2b,
          Math.floor(rr(rand, 5, 7.5))
        );
        if (rock1Path) {
          patches.push({
            key: `rf-1-${tile.y}`,
            path: rock1Path,
            color: shade(baseColor, rr(rand, -0.22, -0.32)),
            opacity: rr(rand, 0.55, 0.75),
          });
        }

        // Rock 2: Smooth boulder / clay blob
        if (rand() > 0.25) {
          const rock2V = tile.y + rr(rand, 0.65, 0.85);
          const rock2Z = zBot + (zTop - zBot) * rr(rand, 0.40, 0.65);
          const rock2Path = buildOrganicBoulderBlobPath(
            'right',
            tile.x + 1,
            rock2V,
            rock2Z,
            rr(rand, 0.14, 0.22),
            (zTop - zBot) * rr(rand, 0.18, 0.28),
            camera,
            brickSeed ^ 0x3c4d
          );
          if (rock2Path) {
            patches.push({
              key: `rf-2-${tile.y}`,
              path: rock2Path,
              color: shade(baseColor, rr(rand, -0.16, -0.26)),
              opacity: rr(rand, 0.45, 0.65),
            });
          }
        }

        // Top shadow under grass overhang
        patches.push({
          key: `rp-top-${tile.y}`,
          path: facePath(tile.x + 1, tile.y, tile.x + 1, tile.y + 1, zTop, zTop - 0.045, camera),
          color: shade(baseColor, -0.24),
          opacity: 0.45,
        });

        bricks.push({
          tileKey: `right-${tile.y}`,
          face: 'right',
          x: tile.x,
          y: tile.y,
          basePath,
          baseColor,
          crevicePath,
          creviceColor: '#4A2402',
          patches,
          lipPath,
          lipColor: MEADOW_COLORS.overhangLipRight,
        });
      }
    });

    return bricks;
  }, [camera, gridSize, seed, tiles, zBot, zTop]);

  // 6. Upright 2.5D Actors List (Trees, Creature, Egg) Depth-Sorted Against Each Other
  const actorItems = useMemo(() => {
    const items: MeadowActorItem[] = [];

    // Dynamic Focus Trees
    meadowWorld.trees.forEach((tree, idx) => {
      items.push({
        key: `tree-${tree.x}-${tree.y}-${idx}`,
        depth: (tree.x + tree.y) * 2 + 1.0,
        kind: 'tree',
        index: idx,
      });
    });

    // Dragon Creature or Egg (Placed at midpoint between home and dest for smooth depth sorting)
    const dragonMidX = (meadowWorld.dragonHome.x + meadowWorld.dragonDest.x) / 2;
    const dragonMidY = (meadowWorld.dragonHome.y + meadowWorld.dragonDest.y) / 2;
    const dragonDepth = (dragonMidX + dragonMidY) * 2 + 1.0;

    if (speciesId === 'dragon_egg') {
      items.push({
        key: 'egg',
        depth: dragonDepth,
        kind: 'egg',
      });
    } else {
      items.push({
        key: 'creature',
        depth: dragonDepth,
        kind: 'creature',
      });
    }

    return items.sort((a, b) => a.depth - b.depth);
  }, [meadowWorld.dragonDest.x, meadowWorld.dragonDest.y, meadowWorld.dragonHome.x, meadowWorld.dragonHome.y, meadowWorld.trees, speciesId]);

  const s = camera.tw;
  const activePalette = palette ?? MEADOW_COLORS;

  return (
    <Group>
      {/* ----------------------------------------------------
          1. GOLDEN-OCHRE CLAY CLIFF SIDES (Base Perimeter)
         ---------------------------------------------------- */}
      {cliffBricks.map((brick) => (
        <Group key={`brick-${brick.tileKey}`}>
          <Path path={brick.basePath} color={brick.baseColor} />
          {brick.patches.map((patch) => (
            <Path
              key={patch.key}
              path={patch.path}
              color={patch.color}
              opacity={patch.opacity}
            />
          ))}
          <Path
            path={brick.crevicePath}
            color={brick.creviceColor}
            opacity={0.42}
          />
        </Group>
      ))}

      {/* ----------------------------------------------------
          2. IRREGULAR ORGANIC GRASS OVERHANG LIP (Front Rim)
         ---------------------------------------------------- */}
      {cliffBricks.map((brick) => (
        <Path
          key={`lip-${brick.tileKey}`}
          path={brick.lipPath}
          color={brick.lipColor}
        />
      ))}

      {/* ----------------------------------------------------
          3. 25 LIME MEADOW TOP TILES WITH CRISP GRID SEAMS (Solid Ground Plane)
         ---------------------------------------------------- */}
      {tiles.map((tile) => {
        const diamond = diamondPath(tile.x, tile.y, zTop, camera);
        const tileColor =
          (tile.x + tile.y) % 2 === 0
            ? MEADOW_COLORS.grassTopLit
            : MEADOW_COLORS.grassTop;

        return (
          <Group key={`top-${tile.x}-${tile.y}`}>
            <Path path={diamond} color={tileColor} />
            <Path
              path={diamond}
              color={MEADOW_COLORS.gridLine}
              style="stroke"
              strokeWidth={Math.max(1, s * 0.012)}
            />
          </Group>
        );
      })}

      {/* ----------------------------------------------------
          4. DAPPLED SUN & MOSS (Strictly Clipped to Plateau Top)
         ---------------------------------------------------- */}
      <Group clip={meadowTopClipPath}>
        {dappledPatches.map((p) => (
          <Oval
            key={p.key}
            x={p.cx - p.rx}
            y={p.cy - p.ry}
            width={p.rx * 2}
            height={p.ry * 2}
            color={p.color}
          />
        ))}
      </Group>

      {/* ----------------------------------------------------
          5. SCATTERED MICRO-FLORA (Daisies, Grass Tufts, Dandelions)
         ---------------------------------------------------- */}
      {microFlora.map((fl) => {
        const sz = s * 0.045 * fl.scale;

        if (fl.type === 'daisy') {
          const stemPath = `M ${fl.x} ${fl.y} L ${fl.x} ${fl.y - sz * 1.6}`;
          const flowerCy = fl.y - sz * 1.8;
          return (
            <Group key={fl.key}>
              <Path
                path={stemPath}
                color={MEADOW_COLORS.daisyStem}
                style="stroke"
                strokeWidth={Math.max(1, sz * 0.22)}
                strokeCap="round"
              />
              <Oval
                x={fl.x - sz * 1.1}
                y={flowerCy - sz * 0.65}
                width={sz * 2.2}
                height={sz * 1.3}
                color={MEADOW_COLORS.daisyPetal}
              />
              <Oval
                x={fl.x - sz * 0.65}
                y={flowerCy - sz * 1.1}
                width={sz * 1.3}
                height={sz * 2.2}
                color={MEADOW_COLORS.daisyPetal}
              />
              <Circle cx={fl.x} cy={flowerCy} r={sz * 0.5} color={MEADOW_COLORS.daisyCenter} />
            </Group>
          );
        }

        if (fl.type === 'grass_tuft') {
          const w = sz * 2.0;
          const h = sz * 1.4;
          const archPath =
            `M ${fl.x - w / 2} ${fl.y} ` +
            `Q ${fl.x - w / 4} ${fl.y - h} ${fl.x} ${fl.y} ` +
            `Q ${fl.x + w / 4} ${fl.y - h * 1.05} ${fl.x + w / 2} ${fl.y}`;

          return (
            <Path
              key={fl.key}
              path={archPath}
              color={MEADOW_COLORS.grassBlade}
              style="stroke"
              strokeWidth={Math.max(1.1, sz * 0.28)}
              strokeCap="round"
            />
          );
        }

        if (fl.type === 'dandelion') {
          const budY = fl.y - sz * 1.1;
          const stemPath = `M ${fl.x} ${fl.y} L ${fl.x} ${budY}`;
          return (
            <Group key={fl.key}>
              <Path
                path={stemPath}
                color={MEADOW_COLORS.daisyStem}
                style="stroke"
                strokeWidth={Math.max(1, sz * 0.2)}
                strokeCap="round"
              />
              <Circle cx={fl.x} cy={budY} r={sz * 0.75} color={MEADOW_COLORS.dandelionBud} />
              <Circle cx={fl.x - sz * 0.15} cy={budY - sz * 0.15} r={sz * 0.35} color={MEADOW_COLORS.dandelionLight} />
            </Group>
          );
        }

        return (
          <Circle
            key={fl.key}
            cx={fl.x}
            cy={fl.y}
            r={sz * 0.55}
            color={MEADOW_COLORS.blossomPink}
          />
        );
      })}

      {/* ----------------------------------------------------
          6. DEPTH-SORTED UPRIGHT ACTORS: DYNAMIC TREES & DRAGON
         ---------------------------------------------------- */}
      {actorItems.map((item) => {
        if (item.kind === 'tree') {
          const tree = meadowWorld.trees[item.index];
          return (
            <GroveTreeSprite
              key={item.key}
              tree={tree}
              z={zTop}
              camera={camera}
              time={time}
              leaf={activePalette.leaf ?? MEADOW_COLORS.leaf}
              leafDark={activePalette.leafDark ?? MEADOW_COLORS.leafDark}
              leafAccent={activePalette.leafAccent ?? MEADOW_COLORS.leafAccent}
              bark={activePalette.bark ?? MEADOW_COLORS.bark}
              snowy={false}
              progress={activeProgressSV}
              focusing={activeFocusingSV}
            />
          );
        }

        if (item.kind === 'egg') {
          return (
            <Group key={item.key}>
              <EmberMote
                x={meadowWorld.dragonHome.x}
                y={meadowWorld.dragonHome.y}
                z={zTop}
                camera={camera}
                progress={activeProgressSV}
                focusing={activeFocusingSV}
                time={time}
              />
              <GroveEgg
                x={meadowWorld.dragonHome.x}
                y={meadowWorld.dragonHome.y}
                z={zTop}
                camera={camera}
                time={time}
                progress={activeProgressSV}
                focusing={activeFocusingSV}
              />
            </Group>
          );
        }

        if (item.kind === 'creature') {
          return (
            <GroveCreatureSprite
              key={item.key}
              creature={{
                homeX: meadowWorld.dragonHome.x,
                homeY: meadowWorld.dragonHome.y,
                destX: meadowWorld.dragonDest.x,
                destY: meadowWorld.dragonDest.y,
                phase: 0,
                color: '#E0485C',
                dark: '#9A2434',
              }}
              homeZ={zTop}
              destZ={zTop}
              camera={camera}
              time={time}
              speciesId={speciesId}
              dragonClip={dragonClip}
              dragonSize={dragonSize}
            />
          );
        }

        return null;
      })}
    </Group>
  );
}
