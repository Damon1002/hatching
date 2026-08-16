import { DragonSpecies, TagInfo } from '../types';

export const FOCUS_TAGS: TagInfo[] = [
  { key: 'work', label: '工作', emoji: '🌿', colorKey: 'work' },
  { key: 'study', label: '学习', emoji: '📚', colorKey: 'study' },
  { key: 'code', label: '编程', emoji: '💻', colorKey: 'code' },
  { key: 'creative', label: '创作', emoji: '🎨', colorKey: 'creative' },
  { key: 'reading', label: '阅读', emoji: '📖', colorKey: 'reading' },
  { key: 'rest', label: '冥想', emoji: '☕', colorKey: 'rest' },
];

export const SPECIES_CATALOG: DragonSpecies[] = [
  {
    id: 'emberwing',
    name: '炽翼幼龙 Aeris',
    subtitle: '原初炉火守护者',
    element: '火系 · 晨曦',
    description: '在温暖的炉火中诞生，最喜欢陪伴守护者在静谧中专注。随着专注时间的累积，尾翼会泛起金灿的星火。',
    icon: '🐉',
    requiredMinutes: 0,
    color: '#E09F3E',
    unlocked: true,
  },
  {
    id: 'jade_sprout',
    name: '翠影雏龙 Jade',
    subtitle: '深林萌芽守护者',
    element: '木系 · 苍翠',
    description: '栖息于林海深处，羽鳞如同初春嫩芽。只有在长时间平静的阅读与思考中，它才会缓缓展开翠绿的翼膜。',
    icon: '🌱',
    requiredMinutes: 120,
    color: '#5EA679',
    unlocked: true,
  },
  {
    id: 'astral_drake',
    name: '星穹幼龙 Celestia',
    subtitle: '极夜星光漫步者',
    element: '星系 · 幽夜',
    description: '吸收星辰微光成长的稀有龙种。深夜专注时，它身旁的星云粒子会随着呼吸起伏缓缓流转。',
    icon: '✨',
    requiredMinutes: 300,
    color: '#7D5FA6',
    unlocked: true,
  },
  {
    id: 'ginkgo_wyrm',
    name: '金杏灵龙 Aureus',
    subtitle: '秋林丰饶守护者',
    element: '地系 · 璀璨',
    description: '通体如金黄银杏叶般优雅，据说能在守护者完成连续7天专注时降下金色的好运雨露。',
    icon: '🍂',
    requiredMinutes: 600,
    color: '#F3C766',
    unlocked: false,
  },
];
