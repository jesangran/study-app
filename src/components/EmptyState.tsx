/**
 * 목록·필터 결과 없음 공통 UI
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppColors } from '@/src/theme';
import { createSurfaceStyles, fonts, spacing, useColors, useThemedStyles } from '@/src/theme';

type Props = {
  title: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function EmptyState({ title, hint, icon = 'file-tray-outline' }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.emptyBox}>
      <Ionicons name={icon} size={28} color={colors.inkMuted} />
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const createStyles = (colors: AppColors) => {
  const surface = createSurfaceStyles(colors);
  return StyleSheet.create({
    emptyBox: {
      ...surface.emptyBox,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.ink,
    },
    hint: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.inkMuted,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
      lineHeight: 18,
    },
  });
};
