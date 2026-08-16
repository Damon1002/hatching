import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  // Exact Forest Sage / Teal Greens
  forestBg: '#519C88',
  forestBgTop: '#5BA591',
  forestBgBottom: '#468F7B',

  // Inner Island & Ring
  islandRing: '#DFD89F',
  islandRingGlow: 'rgba(239, 232, 189, 0.35)',
  islandDiscTop: '#E9F7C8',
  islandDiscBottom: '#A8D68F',
  islandGrass: '#7DB866',
  islandSoil: '#5D4336',

  // Forest UI Elements
  forestBtn: '#52C59F',
  forestBtnPressed: '#40B38D',
  forestBtnShadow: '#359374',
  tagPillBg: 'rgba(0, 0, 0, 0.12)',
  tagPillBorder: 'rgba(255, 255, 255, 0.18)',

  // Top Bar & Badges
  goldCoin: '#F7BF27',
  goldCoinBg: 'rgba(0, 0, 0, 0.14)',
  modePillBg: 'rgba(0, 0, 0, 0.14)',
  crownBorder: '#4EF0D2',

  // Text colors
  textWhite: '#FFFFFF',
  textSubtleWhite: 'rgba(255, 255, 255, 0.82)',
  textMutedWhite: 'rgba(255, 255, 255, 0.6)',

  // Tag Palette
  tags: {
    work: '#E06B6B',      // Forest Salmon/Red (as in screenshot "Work" red dot)
    study: '#4B88D6',     // Sky/Ocean Blue
    code: '#8B65D4',      // Mystic Purple
    creative: '#E8A33E',  // Amber Gold
    reading: '#5BA85F',   // Forest Green
    rest: '#3BBBA8',      // Sage Mint
  } as const,
};

export type TagKey = keyof typeof colors.tags;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 36,
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  full: 999,
};

export const type: Record<string, TextStyle> = {
  hero: { fontSize: 36, lineHeight: 42, fontWeight: '700', letterSpacing: -1.2 },
  display: { fontSize: 28, lineHeight: 34, fontWeight: '600', letterSpacing: -0.8 },
  title: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: -0.3 },
  subtitle: { fontSize: 16, lineHeight: 22, fontWeight: '500' },
  body: { fontSize: 14.5, lineHeight: 20, fontWeight: '400' },
  bodyStrong: { fontSize: 14.5, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  captionStrong: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  micro: { fontSize: 11, lineHeight: 15, fontWeight: '500', letterSpacing: 0.2 },
  eyebrow: { fontSize: 10, lineHeight: 13, fontWeight: '700', letterSpacing: 1.6 },
  timerDisplay: {
    fontSize: 58,
    lineHeight: 64,
    fontWeight: '200',
    letterSpacing: 1.2,
    fontVariant: ['tabular-nums'],
  },
};

export const shadows: Record<string, ViewStyle> = {
  btn: Platform.select({
    ios: { shadowColor: '#2B6E57', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 6 },
    default: { elevation: 4 },
  }) as ViewStyle,
  card: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 },
    default: { elevation: 6 },
  }) as ViewStyle,
};
