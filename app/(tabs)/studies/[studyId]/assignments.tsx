/**
 * 스터디 과제 하위 화면
 */
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AssignmentFormModal } from '@/src/components/AssignmentFormModal';
import { AssignmentSubmitModal } from '@/src/components/AssignmentSubmitModal';
import { CuteButton } from '@/src/components/CuteButton';
import { EmptyState } from '@/src/components/EmptyState';
import { Assignment } from '@/src/data/mock';
import { StudyScreenShell, useStudyScope } from '@/src/study';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { createSurfaceStyles, fonts, radii, spacing, useThemedStyles } from '@/src/theme';
import { todayYmd } from '@/src/utils/studyRhythm';

export default function StudyAssignmentsScreen() {
  const styles = useThemedStyles(createStyles);
  const { study, studyId, available, isAdmin } = useStudyScope();
  const {
    myAssignments,
    submittedAssignmentIds,
    assignmentSubmissions,
    submitAssignment,
    clearAssignmentSubmission,
    addAssignment,
    updateAssignment,
    deleteAssignment,
  } = useApp();
  const [target, setTarget] = useState<string | 'new' | null>(null);
  const [submitTarget, setSubmitTarget] = useState<Assignment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assignments = useMemo(
    () =>
      myAssignments
        .filter((a) => a.studyId === studyId)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [myAssignments, studyId],
  );

  return (
    <StudyScreenShell available={available} unavailableMessage="과제를 볼 수 없어요">
      {study ? (
        <>
          <Text style={styles.hint}>
            {study.emoji} {study.name} 과제
          </Text>
          {isAdmin ? (
            <CuteButton
              label="과제 등록"
              onPress={() => setTarget('new')}
              style={{ marginBottom: spacing.md }}
            />
          ) : null}
          {assignments.length === 0 ? (
            <EmptyState
              title="등록된 과제가 없어요"
              hint={isAdmin ? '위에서 첫 과제를 올려 보세요' : undefined}
            />
          ) : (
            assignments.map((hw) => {
              const done = submittedAssignmentIds.includes(hw.id);
              return (
                <View key={hw.id} style={[styles.card, done && styles.cardDone]}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title}>{hw.title}</Text>
                    <View style={[styles.badge, done ? styles.badgeDone : styles.badgeTodo]}>
                      <Text
                        style={[styles.badgeText, done ? styles.badgeTextDone : styles.badgeTextTodo]}
                      >
                        {done ? '완료' : '미제출'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>
                    마감 {hw.dueDate} · {hw.submitMode === 'file' ? '파일 제출' : '메모 제출'}
                  </Text>
                  <Text style={styles.desc}>{hw.description}</Text>
                  {done && assignmentSubmissions[hw.id] ? (
                    <Text style={styles.meta}>
                      {assignmentSubmissions[hw.id].mode === 'file'
                        ? `제출: ${assignmentSubmissions[hw.id].fileName}`
                        : `제출: ${assignmentSubmissions[hw.id].memo}`}
                    </Text>
                  ) : null}
                  <CuteButton
                    label={done ? '제출 취소' : '제출하기'}
                    variant={done ? 'ghost' : 'primary'}
                    onPress={() => {
                      if (done) {
                        void clearAssignmentSubmission(hw.id);
                        return;
                      }
                      setSubmitTarget(hw);
                    }}
                    style={{ marginTop: spacing.sm }}
                  />
                  {isAdmin ? (
                    deleteId === hw.id ? (
                      <View style={styles.adminRow}>
                        <Text style={styles.meta}>{error ?? '삭제할까요?'}</Text>
                        <Pressable
                          onPress={async () => {
                            const message = await deleteAssignment(hw.id);
                            if (message) {
                              setError(message);
                              return;
                            }
                            setDeleteId(null);
                          }}
                        >
                          <Text style={styles.danger}>삭제</Text>
                        </Pressable>
                        <Pressable onPress={() => setDeleteId(null)}>
                          <Text style={styles.link}>취소</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.adminRow}>
                        <Pressable onPress={() => setTarget(hw.id)}>
                          <Text style={styles.link}>수정</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setError(null);
                            setDeleteId(hw.id);
                          }}
                        >
                          <Text style={styles.danger}>삭제</Text>
                        </Pressable>
                      </View>
                    )
                  ) : null}
                </View>
              );
            })
          )}
          <AssignmentFormModal
            visible={target !== null}
            heading={target && target !== 'new' ? '과제 수정' : '과제 등록'}
            studies={[{ id: study.id, name: study.name, emoji: study.emoji }]}
            lockStudy
            initial={(() => {
              const current =
                target && target !== 'new' ? assignments.find((item) => item.id === target) : null;
              return {
                studyId: study.id,
                title: current?.title ?? '',
                dueDate: current?.dueDate ?? todayYmd(),
                description: current?.description ?? '',
                submitMode: current?.submitMode ?? 'memo',
              };
            })()}
            onClose={() => setTarget(null)}
            onSubmit={(draft) =>
              target && target !== 'new' ? updateAssignment(target, draft) : addAssignment(draft)
            }
          />
          <AssignmentSubmitModal
            visible={!!submitTarget}
            assignment={submitTarget}
            onClose={() => setSubmitTarget(null)}
            onSubmit={(input) =>
              submitTarget
                ? submitAssignment(submitTarget.id, input)
                : Promise.resolve('과제를 찾을 수 없어요.')
            }
          />
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
    titleRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-start',
    },
    title: {
      flex: 1,
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.ink,
    },
    badge: {
      borderRadius: radii.pill,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeDone: { backgroundColor: colors.mintSoft },
    badgeTodo: { backgroundColor: colors.peachSoft },
    badgeText: { fontFamily: fonts.bold, fontSize: 10 },
    badgeTextDone: { color: colors.mint },
    badgeTextTodo: { color: colors.peach },
    adminRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: spacing.sm,
    },
    link: {
      fontFamily: fonts.bold,
      fontSize: 13,
      color: colors.mint,
    },
    danger: {
      fontFamily: fonts.bold,
      fontSize: 13,
      color: '#D6453D',
    },
    meta: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.inkMuted,
      marginTop: 4,
    },
    desc: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.ink,
      marginTop: 6,
      lineHeight: 18,
    },
  });
};
