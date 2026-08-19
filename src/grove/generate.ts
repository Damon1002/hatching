import { hslToHex } from './color';
import { climateFromTag, moodFromHour, seasonFromMinutes } from './palette';
import { chance, clamp, elemSeed, mulberry32, noiseField, rr } from './rng';
import type { TagKey } from '../theme';
import {
  GROVE_N,
  TERRACE_STEP,
  type GroveCreature,
  type GroveTier,
  type GroveTile,
  type GroveTree,
  type GroveTuft,
  type GroveWorld,
  type TileKind,
} from './types';

export function landQuota(minutes: number): GroveTier {
  if (minutes < 20) return 16;
  if (minutes < 45) return 25;
  if (minutes < 90) return 36;
  return 64;
}

function kindForRank(rank: number, quota: number): TileKind {
  const t = quota <= 1 ? 0 : rank / (quota - 1);
  if (t < 0.14) return 'rock';
  if (t < 0.42) return 'meadow';
  if (t < 0.88) return 'grass';
  return 'sand';
}

function heightForKind(kind: TileKind): number {
  if (kind === 'water') return 0;
  if (kind === 'sand') return 0;
  if (kind === 'grass') return TERRACE_STEP;
  if (kind === 'meadow') return TERRACE_STEP * 2;
  return TERRACE_STEP * 3;
}

function neighbors(x: number, y: number): [number, number][] {
  return [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];
}

function inGrid(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < GROVE_N && y < GROVE_N;
}

export function generateGrove(input: {
  seed: number;
  focusMinutes: number;
  sessionsCompleted: number;
  tag: TagKey;
  hour?: number;
}): GroveWorld {
  const { seed, focusMinutes, sessionsCompleted, tag } = input;
  const hour = input.hour ?? new Date().getHours();
  const quota = landQuota(focusMinutes);
  const n1 = noiseField(seed ^ 0x9e37);
  const n2 = noiseField(seed ^ 0x51ed);
  const n3 = noiseField(seed ^ 0x2b7f);
  const center = (GROVE_N - 1) / 2;

  // Square island geometry: size S x S based on tier quota (16->4x4, 25->5x5, 36->6x6, 64->8x8)
  const size = Math.round(Math.sqrt(quota));
  const xStart = Math.floor((GROVE_N - size) / 2);
  const yStart = Math.floor((GROVE_N - size) / 2);
  const xEnd = xStart + size - 1;
  const yEnd = yStart + size - 1;
  const sqCenter = (size - 1) / 2;

  const scored: { x: number; y: number; elevation: number }[] = [];
  for (let y = yStart; y <= yEnd; y += 1) {
    for (let x = xStart; x <= xEnd; x += 1) {
      const sqDx = Math.abs(x - (xStart + sqCenter)) / Math.max(1, sqCenter);
      const sqDy = Math.abs(y - (yStart + sqCenter)) / Math.max(1, sqCenter);
      const sqDist = Math.max(sqDx, sqDy);
      const centerElev = 1.25 - sqDist * 0.45;
      const nx = x / 6.5;
      const ny = y / 6.5;
      const noise = 0.52 * n1(nx, ny) + 0.32 * n2(x / 3.1, y / 3.1) + 0.16 * n3(x / 1.6, y / 1.6);
      const elevation = noise * centerElev;
      scored.push({ x, y, elevation });
    }
  }

  // Sort island tiles: highest elevation first
  scored.sort((a, b) => b.elevation - a.elevation || a.x + a.y - (b.x + b.y));
  const landIndex = new Map<string, number>();
  scored.forEach((cell, index) => landIndex.set(`${cell.x},${cell.y}`, index));

  const tiles: GroveTile[][] = [];
  for (let y = 0; y < GROVE_N; y += 1) {
    tiles[y] = [];
    for (let x = 0; x < GROVE_N; x += 1) {
      const isSquareLand = x >= xStart && x <= xEnd && y >= yStart && y <= yEnd;
      if (isSquareLand) {
        const rank = landIndex.get(`${x},${y}`) ?? 0;
        const kind = kindForRank(rank, quota);
        tiles[y][x] = {
          x,
          y,
          kind,
          height: heightForKind(kind),
          worn: 0,
          revealed: true,
        };
      } else {
        tiles[y][x] = {
          x,
          y,
          kind: 'water',
          height: 0,
          worn: 0,
          revealed: false,
        };
      }
    }
  }

  const landTiles = scored.map((cell) => tiles[cell.y][cell.x]);
  const coreTiles = scored.slice(0, Math.min(16, landTiles.length)).map((cell) => tiles[cell.y][cell.x]);
  const eggCandidates = coreTiles.filter((tile) => tile.kind !== 'sand');
  const eggPool = eggCandidates.length ? eggCandidates : coreTiles;
  let eggTile = eggPool[0];
  let eggScore = -Infinity;
  for (const tile of eggPool) {
    const score = tile.height * 2.2 - Math.hypot(tile.x - center, tile.y - center) * 0.7;
    if (score > eggScore) {
      eggScore = score;
      eggTile = tile;
    }
  }

  const blocked = new Set<string>([`${eggTile.x},${eggTile.y}`]);
  for (const [nx, ny] of neighbors(eggTile.x, eggTile.y)) {
    if (inGrid(nx, ny)) blocked.add(`${nx},${ny}`);
  }

  const trees: { x: number; y: number; scale: number; phase: number; growth: 1 | 2 | 3 }[] = [];
  const tufts = [];
  const density = clamp(0.16 + ((quota - 16) / 48) * 0.2, 0.16, 0.38);
  for (const tile of landTiles) {
    const key = `${tile.x},${tile.y}`;
    if (blocked.has(key) || tile.kind === 'sand') continue;
    const plantRand = mulberry32(elemSeed(seed, 0x2c1b + tile.y * GROVE_N + tile.x));
    if ((tile.kind === 'grass' || tile.kind === 'meadow') && plantRand() < density) {
      const distToEgg = Math.abs(tile.x - eggTile.x) + Math.abs(tile.y - eggTile.y);
      const maturity = sessionsCompleted * 0.5 - distToEgg * 0.8;
      const growth: 1 | 2 | 3 = maturity > 4 ? 3 : maturity > 1.5 ? 2 : 1;
      trees.push({
        x: tile.x,
        y: tile.y,
        scale: rr(plantRand, 0.82, 1.18),
        phase: plantRand() * Math.PI * 2,
        growth,
      });
    } else if (chance(plantRand, 0.28)) {
      const buds = ['#E88FA2', '#F2C96A', '#E8E2EA', '#C79BD6'];
      tufts.push({
        x: tile.x,
        y: tile.y,
        scale: rr(plantRand, 0.75, 1.1),
        phase: plantRand() * Math.PI * 2,
        bud: chance(plantRand, 0.4) ? buds[(plantRand() * buds.length) | 0] : null,
      });
    }
  }

  const coreWalkable = coreTiles.filter((tile) => tile.kind !== 'rock' && !blocked.has(`${tile.x},${tile.y}`));
  const walkable = coreWalkable.length ? coreWalkable : coreTiles;
  const home = walkable[elemSeed(seed, 0xc0de) % walkable.length] ?? eggTile;
  const destOptions = walkable.filter(
    (tile) => (tile.x !== home.x || tile.y !== home.y) && Math.abs(tile.x - home.x) + Math.abs(tile.y - home.y) === 1
  );
  const dest = destOptions.length ? destOptions[elemSeed(seed, 0x51ed) % destOptions.length] : home;
  const kinRand = mulberry32(elemSeed(seed, 0x51ed));
  const hue = kinRand();
  const creature: GroveCreature = {
    homeX: home.x,
    homeY: home.y,
    destX: dest.x,
    destY: dest.y,
    phase: kinRand() * Math.PI * 2,
    color: hslToHex(hue, 0.62, 0.72),
    dark: hslToHex(hue, 0.58, 0.42),
  };

  wearPath(tiles, landTiles, eggTile, sessionsCompleted);

  return {
    seed,
    n: GROVE_N,
    tiles,
    landCount: quota,
    tier: quota,
    egg: { x: eggTile.x, y: eggTile.y },
    trees,
    tufts,
    creature,
    climate: climateFromTag(tag),
    mood: moodFromHour(hour),
    season: seasonFromMinutes(focusMinutes),
  };
}

function wearPath(tiles: GroveTile[][], landTiles: GroveTile[], egg: GroveTile, sessions: number): void {
  if (sessions <= 0 || landTiles.length < 2) return;
  const start =
    landTiles
      .filter((tile) => tile.kind === 'sand' || tile.kind === 'grass')
      .sort((a, b) => a.height - b.height || Math.hypot(b.x - egg.x, b.y - egg.y) - Math.hypot(a.x - egg.x, a.y - egg.y))[0] ??
    landTiles[landTiles.length - 1];

  const path: GroveTile[] = [start];
  let current = start;
  const seen = new Set<string>([`${start.x},${start.y}`]);
  for (let guard = 0; guard < GROVE_N * GROVE_N && (current.x !== egg.x || current.y !== egg.y); guard += 1) {
    let next: GroveTile | null = null;
    let best = Infinity;
    for (const [nx, ny] of neighbors(current.x, current.y)) {
      if (!inGrid(nx, ny)) continue;
      const tile = tiles[ny][nx];
      if (!tile.revealed || tile.kind === 'water') continue;
      const key = `${nx},${ny}`;
      if (seen.has(key)) continue;
      const dist = Math.abs(nx - egg.x) + Math.abs(ny - egg.y);
      if (dist < best) {
        best = dist;
        next = tile;
      }
    }
    if (!next) break;
    path.push(next);
    seen.add(`${next.x},${next.y}`);
    current = next;
  }

  const wearCount = Math.min(path.length, sessions * 2);
  for (let i = 0; i < wearCount; i += 1) {
    path[i].worn = clamp(0.28 + i * 0.12, 0, 0.7);
  }
}

export function visibleTiles(world: GroveWorld): GroveTile[] {
  const out: GroveTile[] = [];
  for (let y = 0; y < world.n; y += 1) {
    for (let x = 0; x < world.n; x += 1) {
      const tile = world.tiles[y][x];
      if (tile.revealed) {
        out.push(tile);
        continue;
      }
      const nearLand = neighbors(x, y).some(([nx, ny]) => inGrid(nx, ny) && world.tiles[ny][nx].revealed);
      if (nearLand) out.push(tile);
    }
  }
  return out;
}

export function tileAt(world: GroveWorld, x: number, y: number): GroveTile | null {
  if (!inGrid(x, y)) return null;
  return world.tiles[y][x];
}

export function landBounds(tiles: GroveTile[]): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = GROVE_N;
  let y0 = GROVE_N;
  let x1 = -1;
  let y1 = -1;
  for (const tile of tiles) {
    if (tile.x < x0) x0 = tile.x;
    if (tile.y < y0) y0 = tile.y;
    if (tile.x > x1) x1 = tile.x;
    if (tile.y > y1) y1 = tile.y;
  }
  if (x1 < 0) return { x0: 0, y0: 0, x1: GROVE_N - 1, y1: GROVE_N - 1 };
  return { x0, y0, x1, y1 };
}

export interface MeadowWorld {
  trees: GroveTree[];
  tufts: GroveTuft[];
  dragonHome: { x: number; y: number };
  dragonDest: { x: number; y: number };
}

/**
 * Procedurally generates dynamic focus-time-driven trees and creature paths for a grid-based meadow land.
 */
export function generateMeadowWorld(input: {
  seed: number;
  focusMinutes: number;
  sessionsCompleted: number;
  tag: TagKey;
  gridSize?: number;
}): MeadowWorld {
  const { seed, focusMinutes, sessionsCompleted } = input;
  const gridSize = input.gridSize ?? 5;
  const rand = mulberry32(elemSeed(seed, 0x93b7));

  // Determine tree quota based on focusMinutes
  let treeCount = 0;
  if (focusMinutes >= 90) treeCount = 5;
  else if (focusMinutes >= 60) treeCount = 4;
  else if (focusMinutes >= 35) treeCount = 3;
  else if (focusMinutes >= 20) treeCount = 2;
  else if (focusMinutes >= 5) treeCount = 1;

  // Center tile is reserved for dragon / egg
  const center = Math.floor(gridSize / 2);
  const dragonHome = { x: center, y: center };
  const dragonDest = { x: center + 1, y: center };

  // Candidate tiles for trees (avoiding center and dragon walking path)
  const candidates: { x: number; y: number }[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if ((x === center && y === center) || (x === center + 1 && y === center)) continue;
      candidates.push({ x, y });
    }
  }

  // Deterministically shuffle candidate tiles using seed
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const trees: GroveTree[] = [];
  const selectedTiles = candidates.slice(0, treeCount);

  selectedTiles.forEach((tile, index) => {
    const treeRand = mulberry32(elemSeed(seed, 0x4a12 + tile.y * 31 + tile.x));
    // Determine growth stage based on index and focusMinutes
    let growth: 1 | 2 | 3 = 1;
    if (index === 0) {
      growth = focusMinutes >= 45 ? 3 : focusMinutes >= 20 ? 2 : 1;
    } else if (index === 1) {
      growth = focusMinutes >= 60 ? 3 : focusMinutes >= 35 ? 2 : 1;
    } else if (index === 2) {
      growth = focusMinutes >= 90 ? 3 : focusMinutes >= 50 ? 2 : 1;
    } else {
      growth = focusMinutes >= 90 ? 2 : 1;
    }

    trees.push({
      x: tile.x,
      y: tile.y,
      scale: rr(treeRand, 0.85, 1.15),
      phase: treeRand() * Math.PI * 2,
      growth,
    });
  });

  return {
    trees,
    tufts: [],
    dragonHome,
    dragonDest,
  };
}

