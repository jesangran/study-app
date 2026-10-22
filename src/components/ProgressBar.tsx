import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';

type Props = {
  label: string;
  value: number;
  tint?: string;
};

function mixWithWhite(hex: string, amount: number) {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return hex;
  const n = Number.parseInt(raw, 16);
  if (Number.isNaN(n)) return hex;
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  const toHex = (channel: number) => channel.toString(16).padStart(2, '0');
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function ProgressBar({ label, value, tint }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const barTint = tint ?? colors.mint;
  const clamped = Math.max(0, Math.min(100, value));
  const soft = mixWithWhite(barTint, 0.55);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: barTint }]}>{clamped}%</Text>
      </View>
      <View style={styles.track}>
        {clamped > 0 ? (
          <View style={[styles.fill, { width: `${clamped}%` }]}>
            <LinearGradient
              colors={[soft, barTint]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    wrap: {
      marginBottom: spacing.md,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    label: {
      fontFamily: fonts.bold,
      color: colors.ink,
      fontSize: 14,
    },
    value: {
      fontFamily: fonts.extraBold,
      fontSize: 14,
    },
    track: {
      height: 14,
      borderRadius: radii.pill,
      backgroundColor: colors.creamDeep,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.line,
    },
    fill: {
      height: '100%',
      borderRadius: radii.pill,
      overflow: 'hidden',
    },
  });
