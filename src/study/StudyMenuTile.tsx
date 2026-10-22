/**
 * 스터디 허브 → 하위 화면 이동 타일
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';

export type StudyMenuTone = 'mint' | 'peach' | 'cream' | 'sky';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  tone?: StudyMenuTone;
  onPress: () => void;
};

const TONE_BG: Record<StudyMenuTone, (c: AppColors) => string> = {
  mint: (c) => c.mintSoft,
  peach: (c) => c.peachSoft,
  cream: (c) => c.cream,
  sky: (c) => c.sky,
};

export function StudyMenuTile({ icon, title, subtitle, tone = 'cream', onPress }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: TONE_BG[tone](colors) },
        pressed && { opacity: 0.82 },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color={colors.ink} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
    </Pressable>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    tile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radii.md,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textCol: {
      flex: 1,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.ink,
    },
    subtitle: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.inkMuted,
      marginTop: 2,
    },
  });
