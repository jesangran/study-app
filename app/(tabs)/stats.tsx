/**
 * 통계 — 출석률 · 과제 완료율 · 연속 출석
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MenuHeader } from '@/src/components/MenuHeader';
import { ProgressBar } from '@/src/components/ProgressBar';
import { SoftBackground } from '@/src/components/SoftBackground';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';
import { attendanceStreak, todayYmd } from '@/src/utils/studyRhythm';

export default function StatsScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const {
    attendanceRate,
    assignmentRate,
    myAttendance,
    attendedIds,
    myAssignments,
    submittedAssignmentIds,
    myStudies,
  } = useApp();

  const attendedCount = myAttendance.filter((s) => attendedIds.includes(s.id)).length;
  const submittedCount = myAssignments.filter((a) => submittedAssignmentIds.includes(a.id)).length;
  const streak = attendanceStreak(myAttendance, attendedIds, todayYmd());

  return (
    <SoftBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <MenuHeader title="통계" caption="출석과 과제를 한눈에 봐요" />
        <View style={styles.card}>
          <Text style={styles.title}>이번 주 요약</Text>
          <ProgressBar label="출석률" value={attendanceRate} tint={colors.mint} />
          <ProgressBar label="과제 완료율" value={assignmentRate} tint={colors.peach} />
        </View>

        <View style={styles.streak}>
          <Text style={styles.streakValue}>{streak}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakTitle}>연속 출석</Text>
            <Text style={styles.streakHint}>최근 세션부터 이어서 출석한 횟수예요</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={[styles.stat, { backgroundColor: colors.mintSoft }]}>
            <Text style={styles.statValue}>{myStudies.length}</Text>
            <Text style={styles.statLabel}>가입 스터디</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.peachSoft }]}>
            <Text style={styles.statValue}>
              {attendedCount}/{myAttendance.length || 0}
            </Text>
            <Text style={styles.statLabel}>출석</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.creamDeep }]}>
            <Text style={styles.statValue}>
              {submittedCount}/{myAssignments.length || 0}
            </Text>
            <Text style={styles.statLabel}>과제 제출</Text>
          </View>
        </View>

        <Text style={styles.hint}>프로토타입: 로컬에 저장된 더미 데이터 기준이에요.</Text>
      </ScrollView>
    </SoftBackground>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.lg,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.mintSoft,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  streakValue: {
    fontFamily: fonts.extraBold,
    fontSize: 36,
    color: colors.ink,
    minWidth: 48,
    textAlign: 'center',
  },
  streakTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.ink,
  },
  streakHint: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stat: {
    width: '31%',
    minWidth: 100,
    flexGrow: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  statValue: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 4,
  },
  hint: {
    marginTop: spacing.lg,
    fontFamily: fonts.medium,
    color: colors.inkMuted,
    fontSize: 13,
  },
});
