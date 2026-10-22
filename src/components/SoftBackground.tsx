import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '@/src/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function SoftBackground({ children, style }: Props) {
  const { theme, colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.cream,
        },
        blobPeach: {
          position: 'absolute',
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: colors.blobPeach,
          top: -50,
          right: -60,
        },
        blobMint: {
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: colors.blobMint,
          bottom: 70,
          left: -70,
        },
      }),
    [colors],
  );

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={theme.bgGradient}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.blobPeach} />
      <View style={styles.blobMint} />
      {children}
    </View>
  );
}
