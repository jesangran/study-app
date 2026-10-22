import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CuteButton } from '@/src/components/CuteButton';
import { CuteInput } from '@/src/components/CuteInput';
import { AssignmentSubmitMode } from '@/src/data/mock';
import { useUnsavedGuard } from '@/src/navigation/UnsavedGuard';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';

export type AssignmentFormDraft = {
  studyId: string;
  title: string;
  dueDate: string;
  description: string;
  submitMode: AssignmentSubmitMode;
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
  initial?: AssignmentFormDraft;
  lockStudy?: boolean;
  onClose: () => void;
  onSubmit: (draft: AssignmentFormDraft) => Promise<string | null>;
};

export function AssignmentFormModal(props: Props) {
  return (
    <Modal visible={props.visible} animationType="slide" transparent onRequestClose={props.onClose}>
      {props.visible ? <AssignmentFormBody {...props} /> : null}
    </Modal>
  );
}

function AssignmentFormBody({ heading, studies, initial, lockStudy, onClose, onSubmit }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [studyId, setStudyId] = useState(initial?.studyId || studies[0]?.id || '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [submitMode, setSubmitMode] = useState<AssignmentSubmitMode>(initial?.submitMode ?? 'memo');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty =
    title !== (initial?.title ?? '') ||
    dueDate !== (initial?.dueDate ?? '') ||
    description !== (initial?.description ?? '') ||
    submitMode !== (initial?.submitMode ?? 'memo') ||
    studyId !== (initial?.studyId || studies[0]?.id || '');
  useUnsavedGuard(dirty);

  const save = async () => {
    setSaving(true);
    setError(null);
    const message = await onSubmit({ studyId, title, dueDate, description, submitMode });
    setSaving(false);
    if (message) {
      setError(message);
      return;
    }
    onClose();
  };

  const study = studies.find((item) => item.id === studyId);

  return (
    <View style={styles.backdrop}>
      <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{heading}</Text>
          <Text style={styles.hint}>
            {lockStudy && study ? `${study.emoji} ${study.name}` : '마감일과 제출 형식을 정해 주세요'}
          </Text>
          {!lockStudy && studies.length > 1 ? (
            <View style={styles.chips}>
              {studies.map((item) => {
                const selected = item.id === studyId;
                return (
                  <Text
                    key={item.id}
                    onPress={() => setStudyId(item.id)}
                    style={[styles.chip, selected && styles.chipOn]}
                  >
                    {item.emoji} {item.name}
                  </Text>
                );
              })}
            </View>
          ) : null}
          <CuteInput label="제목" value={title} onChangeText={setTitle} placeholder="예: 백준 10문제" />
          <CuteInput
            label="마감일 (YYYY-MM-DD)"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2026-10-24"
            autoCapitalize="none"
          />
          <CuteInput
            label="설명"
            value={description}
            onChangeText={setDescription}
            placeholder="무엇을 제출하면 되는지 적어 주세요"
            multiline
            style={styles.body}
          />
          <Text style={styles.modeLabel}>제출 형식</Text>
          <View style={styles.modeRow}>
            <Pressable
              onPress={() => setSubmitMode('file')}
              style={[styles.modeBtn, submitMode === 'file' && styles.modeBtnOn]}
            >
              <Text style={[styles.modeText, submitMode === 'file' && styles.modeTextOn]}>파일</Text>
              <Text style={styles.modeSub}>이미지·워드·엑셀·PDF · 10MB</Text>
            </Pressable>
            <Pressable
              onPress={() => setSubmitMode('memo')}
              style={[styles.modeBtn, submitMode === 'memo' && styles.modeBtnOn]}
            >
              <Text style={[styles.modeText, submitMode === 'memo' && styles.modeTextOn]}>메모</Text>
              <Text style={styles.modeSub}>텍스트 1,000자 이내</Text>
            </Pressable>
          </View>
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
    overflow: 'hidden',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  chipOn: {
    backgroundColor: colors.peach,
    borderColor: '#E06A48',
    color: colors.white,
  },
  body: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modeLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeBtn: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: spacing.sm,
  },
  modeBtnOn: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft,
  },
  modeText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: colors.inkMuted,
  },
  modeTextOn: {
    color: colors.ink,
  },
  modeSub: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 4,
    lineHeight: 15,
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
