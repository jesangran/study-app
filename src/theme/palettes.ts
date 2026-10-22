export type AppColors = {
  peach: string;
  peachSoft: string;
  mint: string;
  mintSoft: string;
  cream: string;
  creamDeep: string;
  ink: string;
  inkMuted: string;
  white: string;
  line: string;
  success: string;
  warn: string;
  sky: string;
  danger: string;
  dangerSoft: string;
  dangerLine: string;
  /** SoftBackground 블롭 */
  blobPeach: string;
  blobMint: string;
};

export type ThemeId = 'original' | 'navy' | 'sage';

export type ThemeDef = {
  id: ThemeId;
  label: string;
  caption: string;
  /** 미리보기 스와치 4색 */
  swatches: [string, string, string, string];
  /** SoftBackground 그라데이션 (테마별로 확연히 다르게) */
  bgGradient: [string, string, string];
  colors: AppColors;
};

/** 처음 쓰던 피치·민트 */
export const ORIGINAL_COLORS: AppColors = {
  peach: '#FF8B6A',
  peachSoft: '#FFD4C8',
  mint: '#5EC8B0',
  mintSoft: '#D4F3EB',
  cream: '#FFF8F3',
  creamDeep: '#FFEFE4',
  ink: '#2F2A28',
  inkMuted: '#7A6F69',
  white: '#FFFFFF',
  line: '#F0E4DC',
  success: '#4CB38A',
  warn: '#F0A04B',
  sky: '#7EC8E3',
  danger: '#D6453D',
  dangerSoft: '#FDE8E6',
  dangerLine: '#F5B7B1',
  blobPeach: 'rgba(255,139,106,0.28)',
  blobMint: 'rgba(94,200,176,0.28)',
};

/** 네이비 · 크림 (#010736 · #0D1C42 · #22396F · #FCF1D0) */
export const NAVY_COLORS: AppColors = {
  peach: '#22396F',
  peachSoft: '#D2D8EC',
  mint: '#0D1C42',
  mintSoft: '#A8B4D4',
  cream: '#FCF1D0',
  creamDeep: '#F3E4B0',
  ink: '#010736',
  inkMuted: '#4A5578',
  white: '#FFFFFF',
  line: '#E6DCC0',
  success: '#3D7A68',
  warn: '#C4A35A',
  sky: '#6B7FA8',
  danger: '#B84A4A',
  dangerSoft: '#F8E8E0',
  dangerLine: '#E0B8B0',
  blobPeach: 'rgba(34,57,111,0.28)',
  blobMint: 'rgba(13,28,66,0.22)',
};

/** 라벤더 · 크림 · 세이지 · 올리브 */
export const SAGE_COLORS: AppColors = {
  peach: '#84A282',
  peachSoft: '#F0D6E0',
  mint: '#6B8F6A',
  mintSoft: '#B8CFB3',
  cream: '#FEFAF3',
  creamDeep: '#F0E8F0',
  ink: '#2F3A2E',
  inkMuted: '#6B7A68',
  white: '#FFFFFF',
  line: '#E5EBE3',
  success: '#84A282',
  warn: '#B8CFB3',
  sky: '#B8CFB3',
  danger: '#A86B6B',
  dangerSoft: '#F6E2E9',
  dangerLine: '#E0C4CC',
  blobPeach: 'rgba(246,226,233,0.7)',
  blobMint: 'rgba(132,162,130,0.35)',
};

export const THEMES: ThemeDef[] = [
  {
    id: 'original',
    label: '피치 민트',
    caption: '처음 쓰던 따뜻한 피치·민트',
    swatches: ['#FF8B6A', '#FFD4C8', '#FFF8F3', '#5EC8B0'],
    bgGradient: ['#FFE8DF', '#FFD4C8', '#B8EDE0'],
    colors: ORIGINAL_COLORS,
  },
  {
    id: 'navy',
    label: '네이비 크림',
    caption: '딥 네이비·크림 대비',
    swatches: ['#010736', '#0D1C42', '#22396F', '#FCF1D0'],
    bgGradient: ['#FCF1D0', '#C5CEE5', '#7A8BB8'],
    colors: NAVY_COLORS,
  },
  {
    id: 'sage',
    label: '세이지 라벤더',
    caption: '라벤더·크림·세이지·올리브',
    swatches: ['#F6E2E9', '#FEFAF3', '#B8CFB3', '#84A282'],
    bgGradient: ['#F5E8EE', '#E4F0DC', '#9BB894'],
    colors: SAGE_COLORS,
  },
];

export const DEFAULT_THEME_ID: ThemeId = 'navy';

/** 이전 저장값(coral) → navy 마이그레이션 */
export function normalizeThemeId(raw: string | null): ThemeId | null {
  if (raw === 'coral') return 'navy';
  if (raw === 'original' || raw === 'navy' || raw === 'sage') return raw;
  return null;
}

export function getTheme(id: ThemeId): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[1];
}
