/**
 * 스터디 만들기
 */
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CuteButton } from '@/src/components/CuteButton';
import { CuteInput } from '@/src/components/CuteInput';
import { SoftBackground } from '@/src/components/SoftBackground';
import { useUnsavedGuard } from '@/src/navigation/UnsavedGuard';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';
import { StudyVisibility } from '@/src/data/mock';
import {
  INVITE_CODE_MAX,
  INVITE_CODE_MIN,
  STUDY_COLOR_OPTIONS,
  STUDY_EMOJI_OPTIONS,
  makeInviteCode,
  normalizeInviteCode,
  visibilityLabel,
} from '@/src/utils/study';

export default function CreateStudyScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { studies, createStudy } = useApp();

  const existingCodes = useMemo(() => studies.map((s) => s.inviteCode), [studies]);

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [emoji, setEmoji] = useState<string>(STUDY_EMOJI_OPTIONS[0]);
  const [color, setColor] = useState<string>(STUDY_COLOR_OPTIONS[0]);
  const [visibility, setVisibility] = useState<StudyVisibility>('public');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useUnsavedGuard(
    name.trim().length > 0 ||
      topic.trim().length > 0 ||
      inviteCode.trim().length > 0 ||
      visibility !== 'public' ||
      emoji !== STUDY_EMOJI_OPTIONS[0] ||
      color !== STUDY_COLOR_OPTIONS[0],
  );

  const onGenerateCode = () => {
    setInviteCode(makeInviteCode(existingCodes));
    setError(null);
  };

  const onSubmit = async () => {
    setSaving(true);
    setError(null);
    const result = await createStudy({ name, topic, emoji, color, inviteCode, visibility });
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace({
      pathname: '/studies/[studyId]',
      params: { studyId: result.study.id },
    });
  };

  return (
    <SoftBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </Pressable>

        <Text style={styles.title}>스터디 만들기</Text>
        <Text style={styles.subtitle}>새 스터디를 만들면 내가 스터디장이 돼요</Text>

        <View style={[styles.preview, { borderLeftColor: color }]}>
          <Text style={styles.previewEmoji}>{emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewName}>{name.trim() || '스터디 이름'}</Text>
            <Text style={styles.previewMeta}>
              {(topic.trim() || '주제') +
                ' · ' +
                visibilityLabel(visibility) +
                ' · 코드 ' +
                (inviteCode || '------')}
            </Text>
          </View>
        </View>

        <CuteInput
          label="스터디 이름"
          value={name}
          onChangeText={setName}
          placeholder="예: 주말 알고리즘 모임"
          maxLength={24}
        />
        <CuteInput
          label="주제"
          value={topic}
          onChangeText={setTopic}
          placeholder="예: 코딩 테스트 / 영어 / 디자인"
          maxLength={20}
        />

        <Text style={styles.label}>공개 설정</Text>
        <View style={styles.visibilityRow}>
          <Pressable
            onPress={() => setVisibility('public')}
            style={[
              styles.visibilityBtn,
              visibility === 'public' && styles.visibilityBtnPublic,
            ]}
          >
            <Text
              style={[
                styles.visibilityBtnText,
                visibility === 'public' && styles.visibilityBtnTextActive,
              ]}
            >
              공개
            </Text>
            <Text
              style={[
                styles.visibilityBtnHint,
                visibility === 'public' && styles.visibilityBtnHintActive,
              ]}
            >
              바로 가입 가능
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setVisibility('private')}
            style={[
              styles.visibilityBtn,
              visibility === 'private' && styles.visibilityBtnPrivate,
            ]}
          >
            <Text
              style={[
                styles.visibilityBtnText,
                visibility === 'private' && styles.visibilityBtnTextActive,
              ]}
            >
              비공개
            </Text>
            <Text
              style={[
                styles.visibilityBtnHint,
                visibility === 'private' && styles.visibilityBtnHintActive,
              ]}
            >
              초대코드로만 가입
            </Text>
          </Pressable>
        </View>
        <Text style={styles.codeRule}>검색은 공개·비공개 모두 가능해요.</Text>

        <Text style={styles.label}>이모지</Text>
        <View style={styles.chipRow}>
          {STUDY_EMOJI_OPTIONS.map((item) => {
            const active = item === emoji;
            return (
              <Pressable
                key={item}
                onPress={() => setEmoji(item)}
                style={[styles.emojiChip, active && styles.emojiChipActive]}
              >
                <Text style={styles.emojiText}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>테마 색</Text>
        <View style={styles.chipRow}>
          {STUDY_COLOR_OPTIONS.map((item) => {
            const active = item === color;
            return (
              <Pressable
                key={item}
                onPress={() => setColor(item)}
                style={[
                  styles.colorChip,
                  { backgroundColor: item },
                  active && styles.colorChipActive,
                ]}
              />
            );
          })}
        </View>

        <CuteInput
          label="초대코드 (직접 입력 또는 자동 생성)"
          value={inviteCode}
          onChangeText={(t) => setInviteCode(normalizeInviteCode(t))}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder={`예: STUDY26 (${INVITE_CODE_MIN}~${INVITE_CODE_MAX}자)`}
          maxLength={INVITE_CODE_MAX}
        />
        <Text style={styles.codeRule}>
          {INVITE_CODE_MIN}~{INVITE_CODE_MAX}자 · 영문 대문자+숫자 포함 · 특수문자 불가 · 소문자는 자동 대문자 변환
        </Text>
        <CuteButton
          label="앱에서 초대코드 만들기"
          variant="ghost"
          onPress={onGenerateCode}
          style={{ marginBottom: spacing.md }}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <CuteButton label="스터디 만들기" onPress={onSubmit} loading={saving} />
        <Text style={styles.hint}>
          만들면 바로 가입하고 스터디장이 돼요. 초대코드로 친구를 초대할 수 있어요.
        </Text>
      </ScrollView>
    </SoftBackground>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  backText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.inkMuted,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  preview: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderLeftWidth: 5,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  previewEmoji: {
    fontSize: 32,
  },
  previewName: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: colors.ink,
  },
  previewMeta: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.inkMuted,
    marginBottom: spacing.xs,
    marginLeft: 4,
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm,
  },
  visibilityBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  visibilityBtnPublic: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  visibilityBtnPrivate: {
    backgroundColor: colors.peach,
    borderColor: colors.peach,
  },
  visibilityBtnText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: colors.ink,
  },
  visibilityBtnTextActive: {
    color: colors.white,
  },
  visibilityBtnHint: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 2,
  },
  visibilityBtnHintActive: {
    color: colors.white,
    opacity: 0.9,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  emojiChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  emojiChipActive: {
    borderColor: colors.peach,
    backgroundColor: colors.peachSoft,
  },
  emojiText: {
    fontSize: 22,
  },
  colorChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorChipActive: {
    borderColor: colors.ink,
  },
  codeRule: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: -4,
    marginBottom: spacing.sm,
    marginLeft: 4,
    lineHeight: 17,
  },
  error: {
    fontFamily: fonts.bold,
    color: '#D6453D',
    marginBottom: spacing.sm,
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
});
