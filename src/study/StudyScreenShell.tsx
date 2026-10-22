/**
 * 스터디 하위 화면 공통 레이아웃 (스크롤 · 미가입/미존재 안내)
 */
import { useRouter } from 'expo-router';
import React, { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SoftBackground } from '@/src/components/SoftBackground';
import type { AppColors } from '@/src/theme';
import { fonts, spacing, useThemedStyles } from '@/src/theme';

type Props = {
  available: boolean;
  unavailableMessage?: string;
  /** 허브처럼 커스텀 헤더를 넣을 때 */
  header?: ReactNode;
  children: ReactNode;
};

export function StudyScreenShell({
  available,
  unavailableMessage = '스터디를 찾을 수 없거나 가입되어 있지 않아요',
  header,
  children,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  if (!available) {
    return (
      <SoftBackground>
        <View style={[styles.center, { paddingTop: spacing.lg }]}>
          <Text style={styles.empty}>{unavailableMessage}</Text>
          <Pressable onPress={() => router.back()} style={styles.backLink} hitSlop={8}>
            <Text style={styles.backLinkText}>← 돌아가기</Text>
          </Pressable>
        </View>
      </SoftBackground>
    );
  }

  return (
    <SoftBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {header}
        {children}
      </ScrollView>
    </SoftBackground>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    center: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    empty: {
      fontFamily: fonts.medium,
      color: colors.inkMuted,
      marginBottom: spacing.sm,
    },
    backLink: {
      marginTop: spacing.md,
      alignSelf: 'flex-start',
    },
    backLinkText: {
      fontFamily: fonts.bold,
      color: colors.peach,
    },
  });
