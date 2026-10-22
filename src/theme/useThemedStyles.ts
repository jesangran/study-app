import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import type { AppColors } from '@/src/theme/palettes';
import { useColors } from '@/src/theme/ThemeContext';

/**
 * 테마가 바뀌면 StyleSheet를 다시 만든다.
 * factory는 모듈 스코프에 두고 참조를 안정적으로 유지하세요.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: AppColors) => T,
): T {
  const colors = useColors();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors, factory]);
}
