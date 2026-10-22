import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { SoftBackground } from '@/src/components/SoftBackground';
import type { AppColors } from '@/src/theme';
import { fonts, spacing, useColors, useThemedStyles } from '@/src/theme';

export default function NotFoundScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  return (
    <>
      <Stack.Screen options={{ title: '찾을 수 없음' }} />
      <SoftBackground>
        <View style={styles.container}>
          <Text style={styles.title}>화면을 찾을 수 없어요</Text>
          <Link href="/" style={styles.link}>
            홈으로 돌아가기
          </Link>
        </View>
      </SoftBackground>
    </>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
  },
  link: {
    marginTop: spacing.md,
    fontFamily: fonts.bold,
    color: colors.mint,
  },
});
