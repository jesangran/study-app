import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppColors } from '@/src/theme';
import { radii, useColors, useThemedStyles } from '@/src/theme';

/** 스터디장 표시. 글자 대신 따봉으로 보여 줍니다. */
export function StudyLeadMark() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.mark} accessibilityLabel="스터디장">
      <Text style={styles.emoji}>👍</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  mark: {
    backgroundColor: colors.mintSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.mint,
  },
  emoji: {
    fontSize: 13,
    lineHeight: 18,
  },
});
