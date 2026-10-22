import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { OAuthProvider } from '@/src/auth/social';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';

type Props = {
  provider: OAuthProvider;
  onPress: () => void;
  loading?: boolean;
  recent?: boolean;
  style?: ViewStyle;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COPY: Record<OAuthProvider, { label: string; badge: string }> = {
  kakao: { label: '카카오로 시작하기', badge: 'K' },
  google: { label: 'Google로 시작하기', badge: 'G' },
};

export function SocialLoginButton({ provider, onPress, loading, recent, style }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const copy = COPY[provider];
  const spinnerColor = provider === 'kakao' ? '#191600' : colors.ink;

  return (
    <View style={style}>
      {recent ? (
        <View style={styles.recentTag}>
          <Text style={styles.recentTagText}>최근 로그인</Text>
        </View>
      ) : null}
      <AnimatedPressable
        disabled={loading}
        onPressIn={() => {
          scale.value = withSpring(0.97);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={onPress}
        style={[
          styles.base,
          provider === 'kakao' ? styles.kakao : styles.google,
          recent ? styles.recentBorder : null,
          loading ? { opacity: 0.7 } : null,
          animatedStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={spinnerColor} />
        ) : (
          <View style={styles.row}>
            <View style={[styles.badge, provider === 'kakao' ? styles.kakaoBadge : styles.googleBadge]}>
              <Text
                style={[
                  styles.badgeText,
                  provider === 'kakao' ? styles.kakaoBadgeText : styles.googleBadgeText,
                ]}
              >
                {copy.badge}
              </Text>
            </View>
            <Text style={[styles.label, provider === 'kakao' ? styles.kakaoLabel : styles.googleLabel]}>
              {copy.label}
            </Text>
          </View>
        )}
      </AnimatedPressable>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    base: {
      minHeight: 56,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    recentBorder: {
      borderWidth: 2,
      borderColor: colors.peach,
    },
    recentTag: {
      alignSelf: 'flex-end',
      backgroundColor: colors.peach,
      borderRadius: radii.pill,
      paddingHorizontal: 10,
      paddingVertical: 3,
      marginBottom: 6,
    },
    recentTagText: {
      fontFamily: fonts.bold,
      fontSize: 11,
      color: colors.white,
    },
    kakao: {
      backgroundColor: '#FEE500',
    },
    google: {
      backgroundColor: colors.white,
      borderWidth: 1.5,
      borderColor: colors.line,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    badge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kakaoBadge: {
      backgroundColor: '#191600',
    },
    googleBadge: {
      backgroundColor: '#F2F4F7',
    },
    badgeText: {
      fontFamily: fonts.extraBold,
      fontSize: 14,
    },
    kakaoBadgeText: {
      color: '#FEE500',
    },
    googleBadgeText: {
      color: '#4285F4',
    },
    label: {
      fontFamily: fonts.bold,
      fontSize: 16,
    },
    kakaoLabel: {
      color: '#191600',
    },
    googleLabel: {
      color: colors.ink,
    },
  });
