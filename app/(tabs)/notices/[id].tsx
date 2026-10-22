import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CuteButton } from '@/src/components/CuteButton';
import { NoticeFormModal } from '@/src/components/NoticeFormModal';
import { SoftBackground } from '@/src/components/SoftBackground';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';
import { studyEmoji, studyName } from '@/src/utils/study';

export default function NoticeDetailScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notices, adminStudyIds, managedStudies, updateNotice, deleteNotice } = useApp();
  const notice = useMemo(() => notices.find((item) => item.id === id), [notices, id]);
  const isAdmin = notice ? adminStudyIds.includes(notice.studyId) : false;
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!notice) {
    return (
      <SoftBackground>
        <Text style={styles.empty}>공지를 찾을 수 없어요</Text>
      </SoftBackground>
    );
  }

  const onDelete = async () => {
    setSaving(true);
    setError(null);
    const message = await deleteNotice(notice.id);
    setSaving(false);
    if (message) {
      setError(message);
      return;
    }
    router.back();
  };

  return (
    <SoftBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.meta}>
          {studyEmoji(notice.studyId)} {studyName(notice.studyId)} · {notice.date}
          {notice.pinned ? ' · 고정' : ''}
        </Text>
        <Text style={styles.title}>{notice.title}</Text>
        <Text style={styles.body}>{notice.body}</Text>
        {isAdmin ? (
          <View style={styles.actions}>
            {confirmDelete ? (
              <>
                <Text style={styles.confirm}>이 공지를 삭제할까요?</Text>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <CuteButton label="삭제" onPress={onDelete} loading={saving} />
                <CuteButton label="취소" variant="ghost" onPress={() => setConfirmDelete(false)} />
              </>
            ) : (
              <>
                <CuteButton label="수정" variant="mint" onPress={() => setEditing(true)} />
                <CuteButton label="삭제" variant="ghost" onPress={() => setConfirmDelete(true)} />
              </>
            )}
          </View>
        ) : null}
      </ScrollView>
      <NoticeFormModal
        visible={editing}
        heading="공지 수정"
        studies={managedStudies
          .filter((study) => study.id === notice.studyId)
          .map((study) => ({ id: study.id, name: study.name, emoji: study.emoji }))}
        lockStudy
        initial={{
          studyId: notice.studyId,
          title: notice.title,
          body: notice.body,
          pinned: Boolean(notice.pinned),
        }}
        onClose={() => setEditing(false)}
        onSubmit={(draft) => updateNotice(notice.id, draft)}
      />
    </SoftBackground>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  content: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    margin: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  empty: {
    fontFamily: fonts.medium,
    color: colors.inkMuted,
    padding: spacing.lg,
  },
  meta: {
    fontFamily: fonts.medium,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  confirm: {
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  error: {
    fontFamily: fonts.bold,
    color: '#D6453D',
  },
});
