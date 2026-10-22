import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import type { AppColors } from '@/src/theme';
import { createSurfaceStyles, useThemedStyles } from '@/src/theme';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accent?: string;
};

export function InteractiveCard({ children, onPress, style, accent }: Props) {
  const styles = useThemedStyles(createStyles);
  const content = (
    <View style={[styles.card, accent ? { borderLeftColor: accent, borderLeftWidth: 5 } : null, style]}>
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
    >
      {content}
    </Pressable>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  const styles = useThemedStyles(createStyles);
  return <Text style={styles.cardTitle}>{children}</Text>;
}

export function CardMeta({ children }: { children: React.ReactNode }) {
  const styles = useThemedStyles(createStyles);
  return <Text style={styles.cardMeta}>{children}</Text>;
}

const createStyles = (colors: AppColors) => StyleSheet.create(createSurfaceStyles(colors));
