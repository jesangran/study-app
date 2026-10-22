/**
 * 스터디 공지 하위 화면
 */
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CuteButton } from '@/src/components/CuteButton';
import { EmptyState } from '@/src/components/EmptyState';
import { InteractiveCard, CardMeta, CardTitle } from '@/src/components/InteractiveCard';
import { NoticeFormModal } from '@/src/components/NoticeFormModal';
import { StudyScreenShell, useStudyScope } from '@/src/study';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, spacing, useColors, useThemedStyles } from '@/src/theme';

export default function StudyNoticesScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { study, studyId, available, isAdmin } = useStudyScope();
  const { myNotices, addNotice } = useApp();
  const [writing, setWriting] = useState(false);

  const notices = useMemo(
    () => myNotices.filter((notice) => notice.studyId === studyId),
    [myNotices, studyId],
  );

  return (
    <StudyScreenShell available={available} unavailableMessage="공지를 볼 수 없어요">
      {study ? (
        <>
          <Text style={styles.hint}>
            {study.emoji} {study.name} 공지
          </Text>
          {isAdmin ? (
            <CuteButton
              label="공지 쓰기"
              variant="mint"
              onPress={() => setWriting(true)}
              style={{ marginBottom: spacing.md }}
            />
          ) : null}
          {notices.length === 0 ? (
            <EmptyState
              title="공지가 없어요"
              hint={isAdmin ? '위에서 첫 공지를 올려 보세요' : undefined}
              icon="megaphone-outline"
            />
          ) : (
            notices.map((notice) => (
              <InteractiveCard
                key={notice.id}
                accent={notice.pinned ? colors.peach : colors.sky}
                onPress={() => router.push(`/notices/${notice.id}`)}
              >
                <View>
                  {notice.pinned ? <Text style={styles.pin}>고정</Text> : null}
                  <CardTitle>{notice.title}</CardTitle>
                  <CardMeta>{notice.date}</CardMeta>
                </View>
              </InteractiveCard>
            ))
          )}
          <NoticeFormModal
            visible={writing}
            heading="공지 쓰기"
            studies={[{ id: study.id, name: study.name, emoji: study.emoji }]}
            initial={{ studyId: study.id, title: '', body: '', pinned: false }}
            lockStudy
            onClose={() => setWriting(false)}
            onSubmit={(draft) => addNotice(draft)}
          />
        </>
      ) : null}
    </StudyScreenShell>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    hint: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.inkMuted,
      marginBottom: spacing.md,
    },
    pin: {
      fontFamily: fonts.bold,
      fontSize: 11,
      color: colors.peach,
      marginBottom: 2,
    },
  });
