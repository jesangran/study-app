import { TextStyle, ViewStyle } from 'react-native';

import type { AppColors } from '@/src/theme/palettes';
import { fonts, radii, spacing } from '@/src/theme/tokens';

/**
 * 화면에서 반복되는 서피스 스타일.
 * `useThemedStyles((c) => StyleSheet.create({ ...createSurfaceStyles(c), ... }))`
 */
export function createSurfaceStyles(colors: AppColors): {
  card: ViewStyle;
  cardTitle: TextStyle;
  cardMeta: TextStyle;
  chip: ViewStyle;
  chipActive: ViewStyle;
  emptyBox: ViewStyle;
  hint: TextStyle;
} {
  return {
    card: {
      backgroundColor: colors.white,
      borderRadius: radii.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.line,
    },
    cardTitle: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.ink,
      marginBottom: 4,
    },
    cardMeta: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.inkMuted,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: radii.pill,
      backgroundColor: colors.white,
      borderWidth: 1.5,
      borderColor: colors.line,
    },
    chipActive: {
      backgroundColor: colors.peach,
      borderColor: colors.peach,
    },
    emptyBox: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: spacing.xl,
      backgroundColor: colors.white,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
    },
    hint: {
      marginTop: spacing.md,
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.inkMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
  };
}
