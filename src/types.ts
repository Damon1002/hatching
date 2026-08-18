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
  category?: 'dragon' | 'plant' | 'special';
  badge?: string;
  image?: any;
}

export interface DailyGroveItem {
  id: string;
  timeStr: string;
  minutes: number;
  tag: TagKey;
  speciesName: string;
  speciesEmoji: string;
}
