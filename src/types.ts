import { TagKey } from './theme';

export type FocusMode = 'gentle' | 'deep';

export interface TagInfo {
  key: TagKey;
  label: string;
  emoji: string;
  colorKey: TagKey;
}

export interface SessionRecord {
  id: string;
  timestamp: number;
  durationMinutes: number;
  tag: TagKey;
  speciesId: string;
  mode: FocusMode;
  dateStr: string;
}

export interface PlantFormData {
  key: 'basic' | 'advanced' | 'majestic';
  label: string;
  minMinutes: number;
  maxMinutes: number;
  image: any;
  scale?: number;
}

export interface DragonSpecies {
  id: string;
  name: string;
  subtitle: string;
  element: string;
  description: string;
  icon: string;
  requiredMinutes: number;
  color: string;
  unlocked: boolean;
  isVip?: boolean;
  category?: 'dragon' | 'plant' | 'land' | 'special';
  badge?: string;
  image?: any;
  forms?: {
    1: PlantFormData;
    2: PlantFormData;
    3: PlantFormData;
  };
}

export interface DailyGroveItem {
  id: string;
  timeStr: string;
  minutes: number;
  tag: TagKey;
  speciesName: string;
  speciesEmoji: string;
}

export type LandStyleKey = 'sunny_meadow' | 'terraced_grove';

export interface LandBiome {
  id: LandStyleKey;
  name: string;
  subtitle: string;
  element: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  isVip?: boolean;
}
