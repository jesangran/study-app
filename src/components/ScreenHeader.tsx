import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppColors } from '@/src/theme';
import { fonts, spacing, useColors, useThemedStyles } from '@/src/theme';

type Props = {
  title: string;
  subtitle?: string;
  subtitleNode?: React.ReactNode;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, subtitleNode, right }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitleNode ??
          (subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null)}
      </View>
      {right}
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 4,
  },
});
