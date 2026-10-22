import { NAVY_COLORS, type AppColors } from '@/src/theme/palettes';

/** 모듈 로드 시점 기본값 — ThemeProvider가 syncThemeColors로 덮어씀 */
export const colors: AppColors = { ...NAVY_COLORS };

export function syncThemeColors(next: AppColors) {
  Object.assign(colors, next);
}
