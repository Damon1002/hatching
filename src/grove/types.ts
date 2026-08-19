export const GROVE_N = 8;
export const GROVE_LOOP_MS = 13920;
export const TERRACE_STEP = 0.17;
export const WATER_Z = -0.1;
export const CRUST = 0.55;

export type TileKind = 'water' | 'sand' | 'grass' | 'meadow' | 'rock';
export type GroveTier = 16 | 25 | 36 | 64;
export type Climate = 'temperate' | 'desert' | 'tropical' | 'volcanic' | 'tundra';
export type HourMood = 'night' | 'morning' | 'noon' | 'gold' | 'dusk';
export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter';

export interface GroveTile {
  x: number;
  y: number;
  kind: TileKind;
  height: number;
  worn: number;
  revealed: boolean;
}

export interface GroveTree {
  x: number;
  y: number;
  scale: number;
  phase: number;
  /** Visual maturity: 1 = sapling, 2 = young (1 shoulder blob), 3 = mature (2 shoulder blobs). */
  growth: 1 | 2 | 3;
}

export interface GroveTuft {
  x: number;
  y: number;
  scale: number;
  phase: number;
  bud: string | null;
}

export interface GroveCreature {
  homeX: number;
  homeY: number;
  destX: number;
  destY: number;
  phase: number;
  color: string;
  dark: string;
}

export interface GroveWorld {
  seed: number;
  n: number;
  tiles: GroveTile[][];
  landCount: number;
  tier: GroveTier;
  egg: { x: number; y: number };
  trees: GroveTree[];
  tufts: GroveTuft[];
  creature: GroveCreature;
  climate: Climate;
  mood: HourMood;
  season: SeasonName;
}
