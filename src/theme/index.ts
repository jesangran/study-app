/**
 * 테마 토큰 · 훅
 * - 색 전환: `useColors()` / `useTheme()` / `useThemedStyles()`
 * - 공통 서피스: `createSurfaceStyles`
 * - `colors`는 활성 팔레트와 동기화 (렌더 중 인라인 참조용)
 */

export type { AppColors, ThemeDef, ThemeId } from '@/src/theme/palettes';
export {
  DEFAULT_THEME_ID,
  getTheme,
  NAVY_COLORS,
  normalizeThemeId,
  ORIGINAL_COLORS,
  SAGE_COLORS,
  THEMES,
} from '@/src/theme/palettes';
export { colors, syncThemeColors } from '@/src/theme/activeColors';
export { ThemeProvider, useColors, useTheme } from '@/src/theme/ThemeContext';
export { useThemedStyles } from '@/src/theme/useThemedStyles';
export { createSurfaceStyles } from '@/src/theme/commonStyles';
export { fonts, radii, spacing } from '@/src/theme/tokens';
