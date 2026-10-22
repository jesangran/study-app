/**
 * 스터디 가입 — 검색 · 초대코드
 */
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CuteButton } from '@/src/components/CuteButton';
import { CuteInput } from '@/src/components/CuteInput';
import { EmptyState } from '@/src/components/EmptyState';
import { InteractiveCard, CardMeta, CardTitle } from '@/src/components/InteractiveCard';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SoftBackground } from '@/src/components/SoftBackground';
import { DEMO_MODE, demoInviteCodesLabel } from '@/src/config/demo';
import { useUnsavedGuard } from '@/src/navigation/UnsavedGuard';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';
import { normalizeInviteCode, visibilityLabel } from '@/src/utils/study';

export default function JoinStudyScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    studies,
    joinedStudyIds,
    joinStudy,
    joinByInvite,
  } = useApp();
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  useUnsavedGuard(query.trim().length > 0);

  const matches = (name: string, topic: string, inviteCode: string, q: string) => {
    const text = q.trim().toLowerCase();
    const code = normalizeInviteCode(q);
    return (
      name.toLowerCase().includes(text) ||
      topic.toLowerCase().includes(text) ||
      inviteCode.toLowerCase().includes(text) ||
      inviteCode === code
    );
  };

  const filtered = useMemo(() => {
    const open = studies.filter((study) => !joinedStudyIds.includes(study.id));
    const q = query.trim();
    if (!q) return open;
    return open.filter((study) => matches(study.name, study.topic, study.inviteCode, q));
  }, [studies, joinedStudyIds, query]);

  const joinedMatch = useMemo(() => {
    const q = query.trim();
    if (!q) return false;
    return studies.some(
      (study) => joinedStudyIds.includes(study.id) && matches(study.name, study.topic, study.inviteCode, q),
    );
  }, [studies, joinedStudyIds, query]);

  const onJoinPress = async (studyId: string, isPrivate: boolean) => {
    if (isPrivate) {
      setMessage('비공개 스터디는 위쪽 초대코드를 입력해 가입해 주세요.');
      return;
    }
    const err = await joinStudy(studyId);
    if (err) {
      setMessage(err);
      return;
    }
    setMessage('가입 완료!');
  };

  const goHome = () => {
    if (joinedStudyIds.length === 0) {
      setMessage('하나 이상 가입해 주세요!');
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <SoftBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: spacing.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: spacing.sm }}>
          <Text style={{ fontFamily: fonts.bold, color: colors.inkMuted }}>← 홈</Text>
        </Pressable>

        <ScreenHeader
          title="스터디 가입"
          subtitle="이름, 주제, 초대코드를 한 칸에서 찾아요"
        />

        <CuteInput
          label="검색 · 초대코드"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          placeholder={
            DEMO_MODE ? `이름, 주제 또는 ${demoInviteCodesLabel().split(' · ')[0]}` : '이름, 주제 또는 초대코드'
          }
        />
        {DEMO_MODE ? (
          <Text style={styles.demoHint}>데모 초대코드: {demoInviteCodesLabel()}</Text>
        ) : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Text style={styles.section}>가입할 수 있는 스터디</Text>
        <Text style={styles.sectionHint}>
          이미 가입한 스터디는 숨겨요. 초대코드를 입력하면 그 스터디가 검색돼요.
        </Text>
        {joinedMatch && filtered.length === 0 ? (
          <EmptyState title="이미 가입한 스터디예요" icon="checkmark-circle-outline" />
        ) : null}
        {filtered.length === 0 && !joinedMatch ? (
          <EmptyState title="찾을 수 있는 스터디가 없어요" hint="검색어나 초대코드를 바꿔 보세요." />
        ) : null}
        {filtered.map((study) => {
          const isPrivate = study.visibility === 'private';
          const codeHit = study.inviteCode === normalizeInviteCode(query);
          return (
            <InteractiveCard key={study.id} accent={study.color}>
              <View style={styles.cardHead}>
                <Text style={styles.emoji}>{study.emoji}</Text>
                <View
                  style={[
                    styles.visibilityBadge,
                    isPrivate ? styles.visibilityPrivate : styles.visibilityPublic,
                  ]}
                >
                  <Text
                    style={[
                      styles.visibilityText,
                      isPrivate ? styles.visibilityTextPrivate : styles.visibilityTextPublic,
                    ]}
                  >
                    {visibilityLabel(study.visibility)}
                  </Text>
                </View>
              </View>
              <CardTitle>{study.name}</CardTitle>
              <CardMeta>
                {study.topic} · {study.memberCount}명
                {!isPrivate || codeHit ? ` · 코드 ${study.inviteCode}` : ' · 초대코드 필요'}
              </CardMeta>
              <CuteButton
                label={isPrivate && !codeHit ? '초대코드를 입력해 찾기' : '가입하기'}
                variant={isPrivate && !codeHit ? 'mint' : 'primary'}
                onPress={() => {
                  if (isPrivate && !codeHit) {
                    setMessage('검색창에 초대코드를 입력하면 가입할 수 있어요.');
                    return;
                  }
                  if (isPrivate) {
                    void joinByInvite(query).then((err) => {
                      setMessage(err ?? '가입 완료!');
                      if (!err) setQuery('');
                    });
                    return;
                  }
                  void onJoinPress(study.id, false);
                }}
                style={{ marginTop: spacing.sm }}
              />
            </InteractiveCard>
          );
        })}

        <CuteButton
          label="홈으로"
          onPress={goHome}
          style={{ marginTop: spacing.md, marginBottom: spacing.xl }}
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
  message: {
    fontFamily: fonts.bold,
    color: colors.mint,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  demoHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.peach,
    marginBottom: spacing.sm,
  },
  section: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.ink,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  empty: {
    fontFamily: fonts.medium,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
  },
  sectionHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  emoji: {
    fontSize: 28,
  },
  visibilityBadge: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
  },
  visibilityPublic: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.mint,
  },
  visibilityPrivate: {
    backgroundColor: colors.peachSoft,
    borderColor: colors.peach,
  },
  visibilityText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  visibilityTextPublic: {
    color: colors.mint,
  },
  visibilityTextPrivate: {
    color: colors.peach,
  },
});
