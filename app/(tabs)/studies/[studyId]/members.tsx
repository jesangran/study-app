/**
 * 스터디원 관리 하위 화면 (스터디장)
 */
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { CuteButton } from '@/src/components/CuteButton';
import { StudyLeadMark } from '@/src/components/StudyLeadMark';
import {
  SELF_MEMBER_ID,
  getMemberStats,
  getSelfMemberStats,
  getStudyMembers,
  getStudySessions,
  type MemberStudyStats,
} from '@/src/data/studyMembers';
import {
  StudyScreenShell,
  studyMemberHref,
  useStudyScope,
} from '@/src/study';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useThemedStyles } from '@/src/theme';

export default function StudyMembersScreen() {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { study, studyId, available, isAdmin } = useStudyScope();
  const {
    user,
    studyLeads,
    leadOffers,
    myAssignments,
    attendedIds,
    submittedAssignmentIds,
    requestLeadTransfer,
    cancelLeadTransfer,
  } = useApp();
  const [delegateId, setDelegateId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const offer = leadOffers.find((item) => item.studyId === studyId);
  const leadMemberId = studyId ? studyLeads[studyId] : undefined;
  const viewerIsLead =
    isAdmin && leadMemberId !== undefined ? leadMemberId === SELF_MEMBER_ID : isAdmin;

  const roster = useMemo(() => {
    if (!studyId || !isAdmin) return [] as MemberStudyStats[];
    const sessions = getStudySessions(studyId);
    const assignments = myAssignments.filter((item) => item.studyId === studyId);
    const self = getSelfMemberStats(
      user?.nickname ?? '나',
      studyId,
      sessions,
      assignments,
      attendedIds,
      submittedAssignmentIds,
    );
    const others = getStudyMembers(studyId)
      .map((member) => getMemberStats(studyId, member.id, assignments))
      .filter((item): item is MemberStudyStats => item !== null);
    return [self, ...others];
  }, [studyId, isAdmin, myAssignments, user?.nickname, attendedIds, submittedAssignmentIds]);

  if (available && !isAdmin) {
    return (
      <StudyScreenShell
        available={false}
        unavailableMessage="스터디장만 스터디원을 확인할 수 있어요"
      >
        {null}
      </StudyScreenShell>
    );
  }

  return (
    <StudyScreenShell available={available}>
      {study ? (
        <>
          <View style={styles.studyHead}>
            <Text style={styles.emoji}>{study.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.studyName}>{study.name}</Text>
              <Text style={styles.studyMeta}>
                참여자 {roster.length}명 · 코드 {study.inviteCode}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionHint}>
            출석과 과제 제출 여부를 바로 볼 수 있어요. 위임은 상대가 수락해야 넘어가요.
          </Text>
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {offer ? (
            <Text style={styles.notice}>
              {offer.toNickname}님의 수락을 기다리는 중이에요. 그 사람 화면에서 확인해요.
            </Text>
          ) : null}

          {roster.map((stats) => {
            const { member } = stats;
            const isLead = leadMemberId
              ? leadMemberId === member.id
              : member.id === SELF_MEMBER_ID && viewerIsLead;
            const waiting = offer?.toMemberId === member.id;
            return (
              <View key={member.id} style={styles.card}>
                <Pressable
                  onPress={() => router.push(studyMemberHref(study.id, member.id))}
                >
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.nickname}>
                          {member.nickname}
                          {member.id === SELF_MEMBER_ID ? ' (나)' : ''}
                        </Text>
                        {isLead ? <StudyLeadMark /> : null}
                      </View>
                      <Text style={styles.joined}>
                        {member.id === SELF_MEMBER_ID ? '내 기록' : `가입 ${member.joinedAt}`}
                      </Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </View>

                  <Text style={styles.blockLabel}>출석</Text>
                  {stats.attendanceBySession.length === 0 ? (
                    <Text style={styles.joined}>출석 세션이 없어요</Text>
                  ) : (
                    stats.attendanceBySession.map(({ session, attended }) => (
                      <View key={session.id} style={styles.statusRow}>
                        <Text style={styles.statusTitle} numberOfLines={1}>
                          {session.date} {session.title}
                        </Text>
                        <Text style={[styles.statusFlag, attended ? styles.ok : styles.miss]}>
                          {attended ? '출석' : '결석'}
                        </Text>
                      </View>
                    ))
                  )}

                  <Text style={styles.blockLabel}>과제</Text>
                  {stats.assignmentByItem.length === 0 ? (
                    <Text style={styles.joined}>과제가 없어요</Text>
                  ) : (
                    stats.assignmentByItem.map(({ assignment, submitted }) => (
                      <View key={assignment.id} style={styles.statusRow}>
                        <Text style={styles.statusTitle} numberOfLines={1}>
                          {assignment.title}
                        </Text>
                        <Text style={[styles.statusFlag, submitted ? styles.ok : styles.miss]}>
                          {submitted ? '제출' : '미제출'}
                        </Text>
                      </View>
                    ))
                  )}
                </Pressable>

                {viewerIsLead && member.id !== SELF_MEMBER_ID && !isLead ? (
                  waiting ? (
                    <CuteButton
                      label="위임 요청 취소"
                      variant="ghost"
                      onPress={() => {
                        void cancelLeadTransfer(study.id);
                        setNotice('위임 요청을 취소했어요.');
                      }}
                      style={{ marginTop: spacing.sm }}
                    />
                  ) : (
                    <CuteButton
                      label="위임하기"
                      variant="mint"
                      disabled={!!offer}
                      onPress={() => setDelegateId(member.id)}
                      style={{ marginTop: spacing.sm }}
                    />
                  )
                ) : null}
              </View>
            );
          })}
          <ConfirmDialog
            visible={!!delegateId}
            title="스터디장 위임"
            body={`${roster.find((item) => item.member.id === delegateId)?.member.nickname ?? '이 멤버'}님에게 스터디장을 위임할까요? 상대가 수락해야 바뀌어요.`}
            confirmLabel="요청 보내기"
            onCancel={() => setDelegateId(null)}
            onConfirm={() => {
              if (!delegateId) return;
              const nickname =
                roster.find((item) => item.member.id === delegateId)?.member.nickname ?? '멤버';
              const id = delegateId;
              setDelegateId(null);
              void requestLeadTransfer(study.id, id, nickname).then((err) => {
                setNotice(
                  err ?? `${nickname}님에게 요청을 보냈어요. 수락 전까지는 스터디장이 그대로예요.`,
                );
              });
            }}
          />
        </>
      ) : null}
    </StudyScreenShell>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    studyHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    emoji: { fontSize: 28 },
    studyName: {
      fontFamily: fonts.extraBold,
      fontSize: 18,
      color: colors.ink,
    },
    studyMeta: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.inkMuted,
      marginTop: 2,
    },
    sectionHint: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.inkMuted,
      lineHeight: 19,
      marginBottom: spacing.md,
    },
    notice: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.peach,
      marginBottom: spacing.sm,
      lineHeight: 18,
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    nickname: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.ink,
    },
    joined: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.inkMuted,
      marginTop: 2,
    },
    chevron: {
      fontFamily: fonts.bold,
      fontSize: 22,
      color: colors.inkMuted,
      lineHeight: 22,
    },
    blockLabel: {
      fontFamily: fonts.bold,
      fontSize: 12,
      color: colors.peach,
      marginTop: spacing.sm,
      marginBottom: 4,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    statusTitle: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.ink,
    },
    statusFlag: {
      fontFamily: fonts.bold,
      fontSize: 12,
    },
    ok: { color: colors.mint },
    miss: { color: '#D6453D' },
  });
