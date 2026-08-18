import type { TagKey } from '../theme';
import { mix, shade } from './color';
import type { Climate, HourMood, SeasonName } from './types';

export interface GrovePalette {
  water: string;
  sand: string;
  grass: string;
  grassLight: string;
  meadow: string;
  rock: string;
  dirtLeft: string;
  dirtRight: string;
  stone: string;
  leaf: string;
  leafDark: string;
  bark: string;
  skyGlow: string;
  shadow: string;
  haze: string;
}

const CLIMATE_FROM_TAG: Record<TagKey, Climate> = {
  work: 'temperate',
  study: 'tundra',
  code: 'volcanic',
  creative: 'tropical',
  reading: 'temperate',
  rest: 'tundra',
};

const CLIMATE_TONES: Record<Climate, Pick<GrovePalette, 'water' | 'sand' | 'grass' | 'meadow' | 'rock'>> = {
  temperate: { water: '#6EB8B0', sand: '#E6D8AE', grass: '#7DB866', meadow: '#8FBE4A', rock: '#C4B7A0' },
  desert: { water: '#7FC3C4', sand: '#F0DCAE', grass: '#E2C489', meadow: '#D0A86A', rock: '#C99A70' },
  tropical: { water: '#5FCFD4', sand: '#F4EAD2', grass: '#8FC47A', meadow: '#6FAE66', rock: '#C3BDA8' },
  volcanic: { water: '#5C7788', sand: '#8E8378', grass: '#6D6A63', meadow: '#575551', rock: '#4A4744' },
  tundra: { water: '#A9C4CD', sand: '#DCD8CC', grass: '#B6BFAE', meadow: '#A3AC9C', rock: '#B0B2AE' },
};

export function climateFromTag(tag: TagKey): Climate {
  return CLIMATE_FROM_TAG[tag];
}

export function moodFromHour(hour: number): HourMood {
  if (hour < 6 || hour >= 20) return 'night';
  if (hour < 10) return 'morning';
  if (hour < 16) return 'noon';
  if (hour < 18) return 'gold';
  return 'dusk';
}

export function seasonFromMinutes(minutes: number): SeasonName {
  if (minutes < 30) return 'spring';
  if (minutes < 80) return 'summer';
  if (minutes < 150) return 'autumn';
  return 'winter';
}

export function grovePalette(climate: Climate, mood: HourMood, season: SeasonName): GrovePalette {
  const base = CLIMATE_TONES[climate];
  let water = base.water;
  let sand = base.sand;
  let grass = base.grass;
  let meadow = base.meadow;
  let rock = base.rock;

  if (season === 'autumn') {
    grass = mix(grass, '#C6A95E', 0.32);
    meadow = mix(meadow, '#D4A24A', 0.36);
  } else if (season === 'winter') {
    sand = mix(sand, '#EFF5F8', 0.55);
    grass = mix(grass, '#EFF5F8', 0.72);
    meadow = mix(meadow, '#EFF5F8', 0.78);
    rock = mix(rock, '#EFF5F8', 0.48);
    water = mix(water, '#C9DDE6', 0.5);
  } else if (season === 'spring') {
    grass = mix(grass, '#B5DC84', 0.18);
    meadow = mix(meadow, '#C5E48C', 0.16);
  }

  if (mood === 'night') {
    water = shade(water, -0.28);
    sand = shade(sand, -0.22);
    grass = shade(grass, -0.24);
    meadow = shade(meadow, -0.22);
    rock = shade(rock, -0.2);
  } else if (mood === 'gold') {
    sand = mix(sand, '#F6C9A4', 0.18);
    grass = mix(grass, '#E0C36A', 0.12);
  } else if (mood === 'dusk') {
    grass = mix(grass, '#B8A8D2', 0.08);
    water = mix(water, '#8A7CB0', 0.12);
  }

  const dirtLeft = mood === 'night' ? '#3A2A22' : '#6E513E';
  const dirtRight = mood === 'night' ? '#2A1C16' : '#563E2F';

  return {
    water,
    sand,
    grass,
    grassLight: shade(grass, 0.16),
    meadow,
    rock,
    dirtLeft,
    dirtRight,
    stone: mood === 'night' ? '#4C5C54' : '#7A8B82',
    leaf: season === 'autumn' ? '#D4A24A' : season === 'winter' ? '#D8E2E6' : season === 'spring' ? '#F2B8C8' : '#5BA665',
    leafDark: season === 'autumn' ? '#B08C3E' : season === 'winter' ? '#B7C4CA' : season === 'spring' ? '#D98CA6' : '#3D7A46',
    bark: '#8A6F52',
    skyGlow:
      mood === 'night'
        ? 'rgba(188,208,255,0.16)'
        : mood === 'gold'
          ? 'rgba(255,222,150,0.22)'
          : mood === 'dusk'
            ? 'rgba(255,186,150,0.18)'
            : 'rgba(235,245,195,0.16)',
    shadow: mood === 'night' ? 'rgba(10,16,38,0.34)' : 'rgba(15,45,35,0.30)',
    haze: mood === 'night' ? '#0B1226' : '#D8E4E2',
  };
}

export function lidColor(kind: 'water' | 'sand' | 'grass' | 'meadow' | 'rock', palette: GrovePalette): string {
  switch (kind) {
    case 'water':
      return palette.water;
    case 'sand':
      return palette.sand;
    case 'grass':
      return palette.grass;
    case 'meadow':
      return palette.meadow;
    case 'rock':
      return palette.rock;
  }
}
