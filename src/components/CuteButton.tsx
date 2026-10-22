import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'mint' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CuteButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  textStyle,
}: Props) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bg =
    variant === 'primary'
      ? colors.peach
      : variant === 'mint'
        ? colors.mint
        : colors.white;
  const textColor = variant === 'ghost' ? colors.ink : colors.white;
  const borderColor =
    variant === 'primary' ? colors.danger : variant === 'mint' ? colors.success : colors.inkMuted;

  return (
    <AnimatedPressable
      disabled={disabled || loading}
      onPressIn={() => {
        scale.value = withSpring(0.96);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      onPress={onPress}
      style={[
        styles.base,
        { backgroundColor: bg, borderColor, opacity: disabled ? 0.5 : 1 },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }, textStyle]}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
});
