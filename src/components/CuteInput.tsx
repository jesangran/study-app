import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';

type Props = TextInputProps & {
  label: string;
};

export function CuteInput({ label, style, ...rest }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.inkMuted}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.inkMuted,
    marginBottom: spacing.xs,
    marginLeft: 4,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
  },
});
