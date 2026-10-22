/**
 * 홈 — 다가오는 일정 · 빠른 출석 · 내 스터디
 */
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { getGreeting, getPlatformLabel } from '@/modules/device-greeting';
import { AssignmentSubmitModal } from '@/src/components/AssignmentSubmitModal';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { CuteButton } from '@/src/components/CuteButton';
import { Assignment } from '@/src/data/mock';
import { InteractiveCard, CardMeta, CardTitle } from '@/src/components/InteractiveCard';
import { MenuHeader } from '@/src/components/MenuHeader';
import { ProgressBar } from '@/src/components/ProgressBar';
import { SoftBackground } from '@/src/components/SoftBackground';
import { StudyLeadMark } from '@/src/components/StudyLeadMark';
import { DEMO_MODE, demoInviteCodesLabel } from '@/src/config/demo';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';
import { formatPlaceLabel } from '@/src/utils/schedulePlace';
import { dueBadge, pickOpenAssignments, pickUpcomingSchedule, todayYmd } from '@/src/utils/studyRhythm';

export default function HomeScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const {
    user,
    myStudies,
    mySchedule,
    myAttendance,
    attendedIds,
    myAssignments,
    submittedAssignmentIds,
    adminStudyIds,
    leaveStudy,
    deleteStudy,
    toggleAttendance,
    submitAssignment,
    clearAssignmentSubmission,
    attendanceRate,
    assignmentRate,
  } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [submitTarget, setSubmitTarget] = useState<Assignment | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<{ id: string; name: string; isAdmin: boolean } | null>(
    null,
  );

  const nativeHello = user
    ? `${getGreeting(user.nickname)} · ${getPlatformLabel()}`
    : '';

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  const today = todayYmd();
  const studyCards = useMemo(
    () =>
      myStudies.map((study) => {
        const schedule = pickUpcomingSchedule(
          mySchedule.filter((item) => item.studyId === study.id),
          today,
        );
        const attendance =
          myAttendance
            .filter((session) => session.studyId === study.id && session.date <= today && !attendedIds.includes(session.id))
            .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))[0] ?? null;
        const assignment =
          pickOpenAssignments(
            myAssignments.filter((item) => item.studyId === study.id),
            submittedAssignmentIds,
            today,
            1,
          )[0] ?? null;
        return {
          study,
          schedule,
          attendance,
          assignment,
          isAdmin: adminStudyIds.includes(study.id),
        };
      }),
    [myStudies, mySchedule, myAttendance, attendedIds, myAssignments, submittedAssignmentIds, adminStudyIds, today],
  );

  return (
    <SoftBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: spacing.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.peach}
            colors={[colors.peach]}
          />
        }
      >
        <Animated.View entering={FadeInUp.duration(450)}>
          <MenuHeader title="홈" caption="오늘 할 일과 출석을 한눈에 봐요" />
        </Animated.View>

        {nativeHello ? (
          <View style={styles.nativeChip}>
            <Text style={styles.nativeText}>{nativeHello}</Text>
            {DEMO_MODE ? (
              <Text style={styles.nativeDemo}>Kotlin 네이티브 모듈 데모 · device-greeting</Text>
            ) : null}
          </View>
        ) : null}

        {DEMO_MODE && studyCards.length === 0 ? (
          <View style={styles.onboardCard}>
            <Text style={styles.onboardTitle}>시작하기</Text>
            <Text style={styles.onboardBody}>
              스터디를 만들거나 가입해 보세요. 데모 초대코드: {demoInviteCodesLabel()}
            </Text>
          </View>
        ) : null}

        <View style={styles.statsBox}>
          <Text style={styles.section}>나의 페이스</Text>
          <ProgressBar label="출석률" value={attendanceRate} tint={colors.mint} />
          <ProgressBar label="과제 완료율" value={assignmentRate} tint={colors.peach} />
        </View>

        <View style={styles.createRow}>
          <CuteButton
            label="스터디 만들기"
            onPress={() => router.push('/studies/create')}
            style={styles.createBtn}
            textStyle={styles.actionBtnText}
          />
          <CuteButton
            label="가입하기"
            variant="mint"
            onPress={() => router.push('/studies/join')}
            style={styles.createBtn}
            textStyle={styles.actionBtnText}
          />
        </View>

        <Text style={styles.section}>내 스터디</Text>
        {studyCards.length === 0 ? (
          <CardMeta>아직 가입한 스터디가 없어요</CardMeta>
        ) : (
          studyCards.map(({ study, schedule, attendance, assignment, isAdmin }) => (
            <InteractiveCard key={study.id} accent={study.color}>
              {isAdmin ? (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/studies/[studyId]',
                      params: { studyId: study.id },
                    })
                  }
                  style={({ pressed }) => [styles.manageBtn, pressed && styles.cornerPressed]}
                >
                  <Text style={styles.manageBtnText}>스터디관리하기</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/studies/[studyId]',
                    params: { studyId: study.id },
                  })
                }
              >
                <Text style={styles.emoji}>{study.emoji}</Text>
                <View style={styles.nameRow}>
                  <CardTitle>{study.name}</CardTitle>
                    {isAdmin ? <StudyLeadMark /> : null}
                </View>
                <CardMeta>
                  {study.topic} · 멤버 {study.memberCount}명
                </CardMeta>
              </Pressable>

              <Pressable onPress={() => router.push('/(tabs)/schedule')} style={styles.scheduleBox}>
                <Text style={styles.blockLabel}>다가오는 일정</Text>
                {schedule ? (
                  <>
                    <Text style={styles.itemTitle}>{schedule.title}</Text>
                    <CardMeta>
                      {schedule.date === today ? '오늘' : schedule.date} · {schedule.time} · {formatPlaceLabel(schedule)}
                    </CardMeta>
                  </>
                ) : (
                  <CardMeta>잡힌 일정이 없어요</CardMeta>
                )}
              </Pressable>

              <View style={styles.actionRow}>
                <View style={styles.actionCol}>
                  <CuteButton
                    label="출석하기"
                    variant="mint"
                    disabled={!attendance}
                    onPress={() => attendance && toggleAttendance(attendance.id)}
                    style={styles.actionBtn}
                    textStyle={styles.actionBtnText}
                  />
                  <Text style={styles.actionHint} numberOfLines={2}>
                    {attendance ? `${attendance.title} · ${attendance.date}` : '출석할 세션이 없어요'}
                  </Text>
                </View>
                <View style={styles.actionCol}>
                  <CuteButton
                    label={
                      assignment && submittedAssignmentIds.includes(assignment.id)
                        ? '제출 취소'
                        : '과제 제출하기'
                    }
                    disabled={!assignment}
                    variant={
                      assignment && submittedAssignmentIds.includes(assignment.id) ? 'ghost' : 'primary'
                    }
                    onPress={() => {
                      if (!assignment) return;
                      if (submittedAssignmentIds.includes(assignment.id)) {
                        void clearAssignmentSubmission(assignment.id);
                        return;
                      }
                      setSubmitTarget(assignment);
                    }}
                    style={styles.actionBtn}
                    textStyle={styles.actionBtnText}
                  />
                  <Text style={styles.actionHint} numberOfLines={2}>
                    {assignment
                      ? `${assignment.title} · ${dueBadge(assignment.dueDate, today)} · ${assignment.submitMode === 'file' ? '파일' : '메모'}`
                      : '낼 과제가 없어요'}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setLeaveTarget({ id: study.id, name: study.name, isAdmin })}
                style={({ pressed }) => [styles.leaveBtn, pressed && { opacity: 0.75 }]}
              >
                <Text style={styles.leaveText}>스터디 나가기</Text>
              </Pressable>
            </InteractiveCard>
          ))
        )}
        <AssignmentSubmitModal
          visible={!!submitTarget}
          assignment={submitTarget}
          onClose={() => setSubmitTarget(null)}
          onSubmit={(input) =>
            submitTarget ? submitAssignment(submitTarget.id, input) : Promise.resolve('과제를 찾을 수 없어요.')
          }
        />
        <ConfirmDialog
          visible={!!leaveTarget}
          title={leaveTarget?.isAdmin ? '스터디 삭제' : '스터디 나가기'}
          body={
            leaveTarget?.isAdmin
              ? `스터디장이 나가면 ${leaveTarget.name} 스터디 그룹이 삭제돼요.`
              : `${leaveTarget?.name ?? '이 스터디'}에서 나갈까요?`
          }
          confirmLabel={leaveTarget?.isAdmin ? '삭제' : '나가기'}
          onCancel={() => setLeaveTarget(null)}
          onConfirm={() => {
            if (!leaveTarget) return;
            const target = leaveTarget;
            setLeaveTarget(null);
            if (target.isAdmin) void deleteStudy(target.id);
            else void leaveStudy(target.id);
          }}
        />
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
  nativeChip: {
    backgroundColor: colors.mintSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  nativeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.ink,
  },
  nativeDemo: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 2,
  },
  onboardCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.peach,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  onboardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 4,
  },
  onboardBody: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    lineHeight: 19,
  },
  scheduleBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  blockLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.peach,
    marginBottom: 2,
  },
  itemTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionCol: {
    flex: 1,
  },
  actionBtn: {
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  actionBtnText: {
    fontSize: 13,
  },
  actionHint: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 4,
    lineHeight: 15,
  },
  statsBox: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  section: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  createRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  createBtn: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  manageBtn: {
    alignSelf: 'stretch',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.mintSoft,
    marginBottom: spacing.sm,
  },
  manageBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  cornerPressed: { opacity: 0.75 },
  leaveBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  leaveText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#D6453D',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
});
