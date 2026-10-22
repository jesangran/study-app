import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CuteButton } from '@/src/components/CuteButton';
import { MenuHeader } from '@/src/components/MenuHeader';
import { ProgressBar } from '@/src/components/ProgressBar';
import { SoftBackground } from '@/src/components/SoftBackground';
import { StudyLeadMark } from '@/src/components/StudyLeadMark';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';
import { visibilityLabel } from '@/src/utils/study';

export default function StudyTabScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const {
    myStudies,
    adminStudyIds,
    myAssignments,
    submittedAssignmentIds,
    myAttendance,
    attendedIds,
    assignmentRate,
    attendanceRate,
  } = useApp();

  const cards = useMemo(
    () =>
      myStudies.map((study) => {
        const assignments = myAssignments.filter((a) => a.studyId === study.id);
        const sessions = myAttendance.filter((a) => a.studyId === study.id);
        const hwDone = assignments.filter((a) => submittedAssignmentIds.includes(a.id)).length;
        const attDone = sessions.filter((s) => attendedIds.includes(s.id)).length;
        return {
          study,
          isAdmin: adminStudyIds.includes(study.id),
          hwDone,
          hwTotal: assignments.length,
          attDone,
          attTotal: sessions.length,
        };
      }),
    [
      myStudies,
      adminStudyIds,
      myAssignments,
      submittedAssignmentIds,
      myAttendance,
      attendedIds,
    ],
  );

  return (
    <SoftBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <MenuHeader
          title="스터디"
          caption="내 스터디를 고르면 출석·과제·공지를 한곳에서 봐요"
        />

        <View style={styles.actions}>
          <CuteButton
            label="스터디 만들기"
            onPress={() => router.push('/studies/create')}
            style={{ flex: 1 }}
          />
          <CuteButton
            label="가입하기"
            variant="mint"
            onPress={() => router.push('/studies/join')}
            style={{ flex: 1 }}
          />
        </View>

        {myStudies.length > 0 ? (
          <View style={styles.paceBox}>
            <ProgressBar label="전체 출석률" value={attendanceRate} tint={colors.mint} />
            <ProgressBar label="전체 과제 완료율" value={assignmentRate} tint={colors.peach} />
          </View>
        ) : null}

        <Text style={styles.section}>내 스터디</Text>

        {cards.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.empty}>아직 가입한 스터디가 없어요</Text>
            <Text style={styles.emptyHint}>만들거나 가입하면 여기에 모여요</Text>
          </View>
        ) : (
          cards.map(({ study, isAdmin, hwDone, hwTotal, attDone, attTotal }) => (
            <Pressable
              key={study.id}
              onPress={() =>
                router.push({
                  pathname: '/studies/[studyId]',
                  params: { studyId: study.id },
                })
              }
              style={({ pressed }) => [styles.groupCard, pressed && { opacity: 0.92 }]}
            >
              <View style={[styles.groupAccent, { backgroundColor: study.color }]} />
              <View style={styles.groupBody}>
                <View style={styles.groupHead}>
                  <Text style={styles.emoji}>{study.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.groupTitle}>{study.name}</Text>
                      {isAdmin ? (
                        <StudyLeadMark />
                      ) : null}
                    </View>
                    <Text style={styles.groupMeta}>
                      {study.topic} · {visibilityLabel(study.visibility)} · {study.inviteCode}
                    </Text>
                    <Text style={styles.groupSummary}>
                      출석 {attDone}/{attTotal} · 과제 {hwDone}/{hwTotal}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SoftBackground>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  paceBox: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  section: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  emptyBox: {
    marginBottom: spacing.md,
  },
  empty: {
    fontFamily: fonts.bold,
    color: colors.ink,
    marginBottom: 4,
  },
  emptyHint: {
    fontFamily: fonts.medium,
    color: colors.inkMuted,
    fontSize: 13,
  },
  groupCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  groupAccent: {
    width: 6,
  },
  groupBody: {
    flex: 1,
    padding: spacing.md,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 28,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: colors.ink,
  },
  groupMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  groupSummary: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.peach,
    marginTop: 4,
  },
  chevron: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: colors.inkMuted,
  },
});
