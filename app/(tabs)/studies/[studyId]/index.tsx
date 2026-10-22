/**
 * 스터디 허브 — 요약 + 하위 화면 진입
 */
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { CuteButton } from '@/src/components/CuteButton';
import { NoticeFormModal } from '@/src/components/NoticeFormModal';
import { ProgressBar } from '@/src/components/ProgressBar';
import { RhythmCreateModal } from '@/src/components/RhythmCreateModal';
import {
  StudyHeroCard,
  StudyMenuTile,
  StudyScreenShell,
  studyAttendanceHref,
  studyAssignmentsHref,
  studyMembersHref,
  studyNoticesHref,
  useStudyHubData,
  useStudyScope,
} from '@/src/study';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';

export default function StudyHubScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { study, studyId, available, isAdmin } = useStudyScope();
  const {
    attendanceRate,
    assignmentRate,
    openAttendanceCount,
    openAssignmentCount,
    noticeCount,
    upcoming,
  } = useStudyHubData(studyId);
  const {
    updateStudyName,
    setStudyAdmin,
    leaveStudy,
    deleteStudy,
    addSchedule,
    addAssignment,
    addNotice,
  } = useApp();

  const [confirmLeave, setConfirmLeave] = useState(false);
  const [rhythmOpen, setRhythmOpen] = useState(false);
  const [writingNotice, setWritingNotice] = useState(false);

  return (
    <StudyScreenShell
      available={available}
      header={
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backText}>← 홈</Text>
        </Pressable>
      }
    >
      {study ? (
        <>
          <StudyHeroCard
            study={study}
            isAdmin={isAdmin}
            onRename={(name) => updateStudyName(study.id, name)}
          />

          {!isAdmin ? (
            <CuteButton
              label="스터디장으로 설정"
              variant="ghost"
              onPress={() => setStudyAdmin(study.id, true)}
              style={{ marginBottom: spacing.md }}
            />
          ) : null}

          <View style={styles.pace}>
            <ProgressBar label="출석률" value={attendanceRate} tint={colors.mint} />
            <ProgressBar label="과제 제출률" value={assignmentRate} tint={colors.peach} />
          </View>

          {upcoming.length > 0 ? (
            <View style={styles.upcomingBox}>
              <Text style={styles.upcomingLabel}>다가오는 일정</Text>
              <Text style={styles.upcomingTitle}>{upcoming[0].title}</Text>
              <Text style={styles.upcomingMeta}>
                {upcoming[0].date} · {upcoming[0].time}
              </Text>
            </View>
          ) : null}

          <Text style={styles.section}>바로가기</Text>

          <StudyMenuTile
            icon="checkbox-outline"
            title="출석"
            subtitle={
              openAttendanceCount > 0
                ? `미출석 ${openAttendanceCount}건`
                : '출석 세션 확인'
            }
            tone="mint"
            onPress={() => router.push(studyAttendanceHref(study.id))}
          />
          <StudyMenuTile
            icon="document-text-outline"
            title="과제"
            subtitle={
              openAssignmentCount > 0
                ? `미제출 ${openAssignmentCount}건`
                : '과제 목록 · 제출'
            }
            tone="peach"
            onPress={() => router.push(studyAssignmentsHref(study.id))}
          />
          <StudyMenuTile
            icon="megaphone-outline"
            title="공지"
            subtitle={noticeCount > 0 ? `${noticeCount}건` : '공지 확인'}
            tone="cream"
            onPress={() => router.push(studyNoticesHref(study.id))}
          />
          <StudyMenuTile
            icon="calendar-outline"
            title="일정"
            subtitle="달력 · 목록으로 이동"
            tone="cream"
            onPress={() => router.push('/(tabs)/schedule')}
          />
          {isAdmin ? (
            <StudyMenuTile
              icon="people-outline"
              title="스터디원"
              subtitle="현황 · 위임"
              tone="cream"
              onPress={() => router.push(studyMembersHref(study.id))}
            />
          ) : null}

          {isAdmin ? (
            <>
              <Text style={styles.section}>관리</Text>
              <View style={styles.adminRow}>
                <Pressable
                  onPress={() => setRhythmOpen(true)}
                  style={({ pressed }) => [
                    styles.adminChip,
                    styles.adminMint,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.adminChipText}>일정·과제 등록</Text>
                </Pressable>
                <Pressable
                  onPress={() => setWritingNotice(true)}
                  style={({ pressed }) => [
                    styles.adminChip,
                    styles.adminPeach,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.adminChipText}>공지 등록</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          <Pressable
            onPress={() => setConfirmLeave(true)}
            style={({ pressed }) => [styles.leaveBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.leaveText}>스터디 나가기</Text>
          </Pressable>

          <ConfirmDialog
            visible={confirmLeave}
            title={isAdmin ? '스터디 삭제' : '스터디 나가기'}
            body={
              isAdmin
                ? `스터디장이 나가면 ${study.name} 스터디 그룹이 삭제돼요.`
                : `${study.name}에서 나갈까요?`
            }
            confirmLabel={isAdmin ? '삭제' : '나가기'}
            onCancel={() => setConfirmLeave(false)}
            onConfirm={() => {
              setConfirmLeave(false);
              const run = isAdmin ? deleteStudy(study.id) : leaveStudy(study.id);
              void run.then(() => router.replace('/(tabs)'));
            }}
          />

          <RhythmCreateModal
            visible={rhythmOpen}
            study={{ id: study.id, name: study.name, emoji: study.emoji }}
            onClose={() => setRhythmOpen(false)}
            onSaveSchedule={(draft) => addSchedule(draft)}
            onSaveAssignment={(draft) => addAssignment(draft)}
          />
          <NoticeFormModal
            visible={writingNotice}
            heading="공지 등록"
            studies={[{ id: study.id, name: study.name, emoji: study.emoji }]}
            initial={{ studyId: study.id, title: '', body: '', pinned: false }}
            lockStudy
            onClose={() => setWritingNotice(false)}
            onSubmit={(draft) => addNotice(draft)}
          />
        </>
      ) : null}
    </StudyScreenShell>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    backBtn: {
      alignSelf: 'flex-start',
      marginBottom: spacing.sm,
    },
    backText: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.inkMuted,
    },
    pace: {
      backgroundColor: colors.white,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    upcomingBox: {
      backgroundColor: colors.cream,
      borderRadius: radii.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    upcomingLabel: {
      fontFamily: fonts.bold,
      fontSize: 12,
      color: colors.peach,
      marginBottom: 2,
    },
    upcomingTitle: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.ink,
    },
    upcomingMeta: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.inkMuted,
      marginTop: 2,
    },
    section: {
      fontFamily: fonts.extraBold,
      fontSize: 16,
      color: colors.ink,
      marginBottom: spacing.sm,
      marginTop: spacing.xs,
    },
    adminRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: spacing.md,
    },
    adminChip: {
      flexGrow: 1,
      flexBasis: '40%',
      borderRadius: radii.pill,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
    },
    adminMint: { backgroundColor: colors.mintSoft },
    adminPeach: { backgroundColor: colors.peachSoft },
    adminChipText: {
      fontFamily: fonts.bold,
      fontSize: 13,
      color: colors.ink,
    },
    leaveBtn: {
      marginTop: spacing.lg,
      alignSelf: 'center',
      paddingVertical: spacing.sm,
    },
    leaveText: {
      fontFamily: fonts.bold,
      fontSize: 13,
      color: '#D6453D',
    },
  });
