import type { DataSourceParam } from '@shopify/react-native-skia';

export type DragonAnimationName = 'resting' | 'focusing' | 'interrupted' | 'celebrating';

export interface DragonAnimationClip {
  start: number;
  frameCount: number;
  frameDurationMs: number;
  loop: boolean;
}

export interface DragonAtlasDefinition {
  source: DataSourceParam;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  displayScale: number;
  clips: Record<DragonAnimationName, DragonAnimationClip>;
}

/**
 * Emberwing's runtime atlas is derived from canonical 2048×2048 source frames.
 *
 * Future asset exports must start from:
 * assets/dragon/emberwing/source-2048/
 *
 * Never enlarge runtime-512 frames or the atlas. See
 * assets/dragon/emberwing/README.md for the reproducible export contract.
 */
export const DRAGON_ATLAS: DragonAtlasDefinition = {
  source: require('../../assets/dragon/emberwing/runtime-512/emberwing-atlas.png'),
  frameWidth: 512,
  frameHeight: 512,
  columns: 8,
  displayScale: 0.45,
  clips: {
    resting: { start: 0, frameCount: 12, frameDurationMs: 100, loop: true },
    focusing: { start: 16, frameCount: 12, frameDurationMs: 111, loop: true },
    interrupted: { start: 32, frameCount: 8, frameDurationMs: 91, loop: false },
    celebrating: { start: 40, frameCount: 20, frameDurationMs: 71, loop: false },
  },
};

export function getClipForState(state: DragonAnimationName): DragonAnimationClip {
  return DRAGON_ATLAS.clips[state];
}
