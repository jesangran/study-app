import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CuteButton } from '@/src/components/CuteButton';
import { CuteInput } from '@/src/components/CuteInput';
import { useUnsavedGuard } from '@/src/navigation/UnsavedGuard';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';

export type NoticeDraft = {
  studyId: string;
  title: string;
  body: string;
  pinned: boolean;
};

type StudyOption = {
  id: string;
  name: string;
  emoji: string;
};

type Props = {
  visible: boolean;
  heading: string;
  studies: StudyOption[];
  initial?: NoticeDraft;
  lockStudy?: boolean;
  onClose: () => void;
  onSubmit: (draft: NoticeDraft) => Promise<string | null>;
};

export function NoticeFormModal(props: Props) {
  return (
    <Modal visible={props.visible} animationType="slide" transparent onRequestClose={props.onClose}>
      {props.visible ? <NoticeFormBody {...props} /> : null}
    </Modal>
  );
}

function NoticeFormBody({
  heading,
  studies,
  initial,
  lockStudy,
  onClose,
  onSubmit,
}: Props) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [studyId, setStudyId] = useState(initial?.studyId || studies[0]?.id || '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty =
    title !== (initial?.title ?? '') ||
    body !== (initial?.body ?? '') ||
    pinned !== (initial?.pinned ?? false) ||
    studyId !== (initial?.studyId || studies[0]?.id || '');
  useUnsavedGuard(dirty);

  const save = async () => {
    setSaving(true);
    setError(null);
    const message = await onSubmit({ studyId, title, body, pinned });
    setSaving(false);
    if (message) {
      setError(message);
      return;
    }
    onClose();
  };

  return (
    <View style={styles.backdrop}>
      <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{heading}</Text>
          <Text style={styles.hint}>스터디장인 스터디에만 올릴 수 있어요</Text>

          {studies.length > 1 && !lockStudy ? (
            <View style={styles.chips}>
              {studies.map((study) => {
                const selected = study.id === studyId;
                return (
                  <Pressable
                    key={study.id}
                    onPress={() => setStudyId(study.id)}
                    style={[styles.chip, selected && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextOn]}>
                      {study.emoji} {study.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.hint}>
              {studies.find((study) => study.id === studyId)?.emoji}{' '}
              {studies.find((study) => study.id === studyId)?.name}
            </Text>
          )}

          <CuteInput label="제목" value={title} onChangeText={setTitle} placeholder="예: 이번 주 장소 안내" />
          <CuteInput
            label="내용"
            value={body}
            onChangeText={setBody}
            placeholder="멤버에게 전할 내용을 적어 주세요"
            multiline
            style={styles.body}
          />
          <Pressable onPress={() => setPinned((value) => !value)} style={styles.pinRow}>
            <View style={[styles.pinBox, pinned && styles.pinBoxOn]} />
            <Text style={styles.pinLabel}>목록 위에 고정</Text>
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <CuteButton label="취소" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <CuteButton label="저장" onPress={save} loading={saving} style={{ flex: 1 }} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(47, 42, 40, 0.35)',
  },
  card: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    maxHeight: '92%',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.ink,
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: {
    backgroundColor: colors.peach,
    borderColor: '#E06A48',
  },
  chipText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  chipTextOn: {
    color: colors.white,
  },
  body: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pinBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.inkMuted,
    backgroundColor: colors.white,
  },
  pinBoxOn: {
    backgroundColor: colors.peach,
    borderColor: '#E06A48',
  },
  pinLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  error: {
    fontFamily: fonts.bold,
    color: '#D6453D',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
