import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CuteButton } from '@/src/components/CuteButton';
import { InteractiveCard, CardMeta, CardTitle } from '@/src/components/InteractiveCard';
import { NoticeFormModal } from '@/src/components/NoticeFormModal';
import { SoftBackground } from '@/src/components/SoftBackground';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, spacing, useColors, useThemedStyles } from '@/src/theme';
import { studyEmoji, studyName } from '@/src/utils/study';

export default function NoticesScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { studyId: studyIdParam } = useLocalSearchParams<{ studyId?: string }>();
  const studyId = typeof studyIdParam === 'string' ? studyIdParam : undefined;
  const { myNotices, managedStudies, adminStudyIds, addNotice } = useApp();
  const [writing, setWriting] = useState(false);

  const notices = useMemo(
    () => (studyId ? myNotices.filter((notice) => notice.studyId === studyId) : myNotices),
    [myNotices, studyId],
  );
  const canWrite = studyId ? adminStudyIds.includes(studyId) : managedStudies.length > 0;
  const studyOptions = useMemo(() => {
    const source = studyId
      ? managedStudies.filter((study) => study.id === studyId)
      : managedStudies;
    return source.map((study) => ({ id: study.id, name: study.name, emoji: study.emoji }));
  }, [managedStudies, studyId]);

  return (
    <SoftBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {studyId ? (
          <Text style={styles.hint}>
            {studyEmoji(studyId)} {studyName(studyId)} 공지
          </Text>
        ) : null}
        {canWrite ? (
          <CuteButton
            label="공지 쓰기"
            variant="mint"
            onPress={() => setWriting(true)}
            style={{ marginBottom: spacing.md }}
          />
        ) : null}
        {notices.length === 0 ? (
          <Text style={styles.empty}>
            {canWrite ? '아직 공지가 없어요. 위에서 첫 글을 올려 보세요' : '가입한 스터디 공지가 없어요'}
          </Text>
        ) : (
          notices.map((notice) => (
            <InteractiveCard
              key={notice.id}
              accent={notice.pinned ? colors.peach : colors.sky}
              onPress={() => router.push(`/notices/${notice.id}`)}
            >
              <View style={styles.row}>
                <Text style={styles.emoji}>{studyEmoji(notice.studyId)}</Text>
                <View style={{ flex: 1 }}>
                  {notice.pinned ? <Text style={styles.pin}>고정</Text> : null}
                  <CardTitle>{notice.title}</CardTitle>
                  <CardMeta>
                    {studyName(notice.studyId)} · {notice.date}
                  </CardMeta>
                </View>
              </View>
            </InteractiveCard>
          ))
        )}
      </ScrollView>
      <NoticeFormModal
        visible={writing}
        heading="공지 쓰기"
        studies={studyOptions}
        initial={studyId ? { studyId, title: '', body: '', pinned: false } : undefined}
        lockStudy={Boolean(studyId)}
        onClose={() => setWriting(false)}
        onSubmit={(draft) => addNotice(draft)}
      />
    </SoftBackground>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  hint: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.inkMuted,
    marginBottom: spacing.md,
  },
  empty: {
    fontFamily: fonts.medium,
    color: colors.inkMuted,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 24,
  },
  pin: {
    fontFamily: fonts.bold,
    color: colors.peach,
    fontSize: 12,
    marginBottom: 2,
  },
});
