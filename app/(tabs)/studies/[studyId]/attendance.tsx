/**
 * 스터디 출석 하위 화면
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CuteButton } from '@/src/components/CuteButton';
import { EmptyState } from '@/src/components/EmptyState';
import { ProgressBar } from '@/src/components/ProgressBar';
import { StudyScreenShell, useStudyScope } from '@/src/study';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { createSurfaceStyles, fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';

export default function StudyAttendanceScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const { study, studyId, available } = useStudyScope();
  const { myAttendance, attendedIds, toggleAttendance } = useApp();

  const sessions = useMemo(
    () =>
      myAttendance
        .filter((s) => s.studyId === studyId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
    [myAttendance, studyId],
  );

  const doneCount = sessions.filter((s) => attendedIds.includes(s.id)).length;
  const rate = sessions.length === 0 ? 0 : Math.round((doneCount / sessions.length) * 100);

  return (
    <StudyScreenShell available={available} unavailableMessage="출석을 볼 수 없어요">
      {study ? (
        <>
          <Text style={styles.hint}>
            {study.emoji} {study.name} 출석
          </Text>
          <ProgressBar label="출석률" value={rate} tint={colors.mint} />

          {sessions.length === 0 ? (
            <EmptyState title="출석 세션이 아직 없어요" hint="스터디장이 일정을 등록하면 여기에 나타나요" />
          ) : (
            sessions.map((session) => {
              const done = attendedIds.includes(session.id);
              return (
                <View key={session.id} style={[styles.card, done && styles.cardDone]}>
                  <Text style={styles.title}>{session.title}</Text>
                  <Text style={styles.meta}>
                    {session.date} · {session.time}
                  </Text>
                  <CuteButton
                    label={done ? '출석 완료 ✓' : '출석하기'}
                    variant={done ? 'mint' : 'primary'}
                    onPress={() => toggleAttendance(session.id)}
                    style={{ marginTop: spacing.sm }}
                  />
                </View>
              );
            })
          )}
        </>
      ) : null}
    </StudyScreenShell>
  );
}

const createStyles = (colors: AppColors) => {
  const surface = createSurfaceStyles(colors);
  return StyleSheet.create({
    hint: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.inkMuted,
      marginBottom: spacing.md,
    },
    card: {
      ...surface.card,
      borderRadius: radii.md,
      marginBottom: spacing.sm,
    },
    cardDone: {
      borderColor: colors.mintSoft,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.ink,
    },
    meta: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.inkMuted,
      marginTop: 4,
    },
  });
};
