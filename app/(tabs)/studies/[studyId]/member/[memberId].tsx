import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressBar } from '@/src/components/ProgressBar';
import { SoftBackground } from '@/src/components/SoftBackground';
import { StudyLeadMark } from '@/src/components/StudyLeadMark';
import { CuteButton } from '@/src/components/CuteButton';
import {
  SELF_MEMBER_ID,
  findStudy,
  getMemberStats,
  getSelfMemberStats,
  getStudySessions,
} from '@/src/data/studyMembers';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';

export default function StudyMemberDetailScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { studyId, memberId } = useLocalSearchParams<{
    studyId: string;
    memberId: string;
  }>();
  const {
    user,
    adminStudyIds,
    studyLeads,
    leadOffers,
    myAssignments,
    attendedIds,
    submittedAssignmentIds,
    respondLeadTransfer,
  } = useApp();

  const study = useMemo(() => (studyId ? findStudy(studyId) : null), [studyId]);
  const isAdmin = studyId ? adminStudyIds.includes(studyId) : false;
  const offer = leadOffers.find((item) => item.studyId === studyId && item.toMemberId === memberId);
  const stats = useMemo(() => {
    if (!studyId || !memberId || !isAdmin) return null;
    const assignments = myAssignments.filter((item) => item.studyId === studyId);
    if (memberId === SELF_MEMBER_ID) {
      return getSelfMemberStats(
        user?.nickname ?? '나',
        studyId,
        getStudySessions(studyId),
        assignments,
        attendedIds,
        submittedAssignmentIds,
      );
    }
    return getMemberStats(studyId, memberId, assignments);
  }, [studyId, memberId, isAdmin, myAssignments, user?.nickname, attendedIds, submittedAssignmentIds]);

  if (!study || !isAdmin || !stats) {
    return (
      <SoftBackground>
        <View style={[styles.center, { paddingTop: spacing.lg }]}>
          <Text style={styles.empty}>
            {!isAdmin ? '스터디장만 확인할 수 있어요' : '참여자 정보를 찾을 수 없어요'}
          </Text>
        </View>
      </SoftBackground>
    );
  }

  const { member, attendanceBySession, attendanceRate, attendedCount, sessions, assignmentByItem, assignmentRate, submittedCount, assignments } =
    stats;

  return (
    <SoftBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profile}>
          <Text style={styles.emoji}>{study.emoji}</Text>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.nickname}>{member.nickname}</Text>
              {(studyId && studyLeads[studyId] ? studyLeads[studyId] === member.id : member.id === SELF_MEMBER_ID) ? (
                <StudyLeadMark />
              ) : null}
            </View>
            <Text style={styles.meta}>
              {study.name} · 가입 {member.joinedAt}
            </Text>
          </View>
        </View>

        {offer ? (
          <View style={styles.offer}>
            <Text style={styles.offerTitle}>스터디장 위임 요청</Text>
            <Text style={styles.offerBody}>
              수락하면 이 멤버가 스터디장이 되고, 지금까지의 스터디장 권한은 넘어가요.
            </Text>
            <View style={styles.offerRow}>
              <CuteButton
                label="거절"
                variant="ghost"
                onPress={() => {
                  void respondLeadTransfer(study.id, false).then(() => router.back());
                }}
                style={{ flex: 1 }}
              />
              <CuteButton
                label="수락"
                onPress={() => {
                  void respondLeadTransfer(study.id, true).then(() => router.back());
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : null}

        <ProgressBar label="출석률" value={attendanceRate} tint={colors.mint} />
        <ProgressBar label="과제 제출률" value={assignmentRate} tint={colors.peach} />

        <Text style={styles.section}>
          일자별 출석 ({attendedCount}/{sessions.length})
        </Text>
        {attendanceBySession.length === 0 ? (
          <Text style={styles.emptyInline}>출석 세션이 아직 없어요</Text>
        ) : (
          attendanceBySession.map(({ session, attended }) => (
            <View
              key={session.id}
              style={[styles.rowCard, attended ? styles.rowOk : styles.rowMiss]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{session.title}</Text>
                <Text style={styles.rowMeta}>
                  {session.date} · {session.time}
                </Text>
              </View>
              <View style={[styles.chip, attended ? styles.chipOk : styles.chipMiss]}>
                <Text style={[styles.chipText, attended ? styles.chipTextOk : styles.chipTextMiss]}>
                  {attended ? '출석' : '결석'}
                </Text>
              </View>
            </View>
          ))
        )}

        <Text style={[styles.section, { marginTop: spacing.lg }]}>
          숙제 제출 ({submittedCount}/{assignments.length})
        </Text>
        {assignmentByItem.length === 0 ? (
          <Text style={styles.emptyInline}>등록된 과제가 없어요</Text>
        ) : (
          assignmentByItem.map(({ assignment, submitted, submittedAt }) => (
            <View
              key={assignment.id}
              style={[styles.rowCard, submitted ? styles.rowOk : styles.rowMiss]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{assignment.title}</Text>
                <Text style={styles.rowMeta}>마감 {assignment.dueDate}</Text>
                {submitted && submittedAt ? (
                  <Text style={styles.rowMeta}>제출 {submittedAt}</Text>
                ) : null}
                <Text style={styles.rowDesc}>{assignment.description}</Text>
              </View>
              <View style={[styles.chip, submitted ? styles.chipOk : styles.chipMiss]}>
                <Text
                  style={[styles.chipText, submitted ? styles.chipTextOk : styles.chipTextMiss]}
                >
                  {submitted ? '제출' : '미제출'}
                </Text>
              </View>
            </View>
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
    paddingTop: spacing.md,
  },
  center: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  empty: {
    fontFamily: fonts.medium,
    color: colors.inkMuted,
  },
  emptyInline: {
    fontFamily: fonts.medium,
    color: colors.inkMuted,
    marginBottom: spacing.md,
  },
  offer: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  offerTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: colors.ink,
  },
  offerBody: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 4,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  offerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  profile: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: 36,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  nickname: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  section: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowOk: {
    borderColor: colors.mintSoft,
  },
  rowMiss: {
    borderColor: colors.line,
  },
  rowTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  rowMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  rowDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 6,
    lineHeight: 17,
  },
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipOk: {
    backgroundColor: colors.mintSoft,
  },
  chipMiss: {
    backgroundColor: colors.peachSoft,
  },
  chipText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  chipTextOk: {
    color: colors.mint,
  },
  chipTextMiss: {
    color: colors.peach,
  },
});
