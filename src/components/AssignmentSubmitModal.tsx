import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CuteButton } from '@/src/components/CuteButton';
import { CuteInput } from '@/src/components/CuteInput';
import { Assignment } from '@/src/data/mock';
import { useUnsavedGuard } from '@/src/navigation/UnsavedGuard';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';
import {
  ASSIGNMENT_FILE_MAX_BYTES,
  ASSIGNMENT_MEMO_MAX,
  validateAssignmentFile,
} from '@/src/utils/studyRhythm';

type Props = {
  visible: boolean;
  assignment: Assignment | null;
  onClose: () => void;
  onSubmit: (
    input:
      | { mode: 'memo'; memo: string }
      | { mode: 'file'; fileName: string; fileUri: string; fileMime?: string; fileSize?: number },
  ) => Promise<string | null>;
};

export function AssignmentSubmitModal(props: Props) {
  return (
    <Modal visible={props.visible} animationType="slide" transparent onRequestClose={props.onClose}>
      {props.visible && props.assignment ? <Body {...props} assignment={props.assignment} /> : null}
    </Modal>
  );
}

function Body({
  assignment,
  onClose,
  onSubmit,
}: Props & { assignment: Assignment }) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [memo, setMemo] = useState('');
  const [file, setFile] = useState<{
    name: string;
    uri: string;
    mimeType?: string;
    size?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = assignment.submitMode === 'memo' ? memo.trim().length > 0 : !!file;
  useUnsavedGuard(dirty);

  const pickFile = async () => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'image/*',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const checked = validateAssignmentFile({
      name: asset.name,
      size: asset.size,
      mimeType: asset.mimeType,
    });
    if (!checked.ok) {
      setError(checked.message);
      setFile(null);
      return;
    }
    setFile({
      name: asset.name,
      uri: asset.uri,
      mimeType: asset.mimeType,
      size: asset.size,
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const message =
      assignment.submitMode === 'memo'
        ? await onSubmit({ mode: 'memo', memo })
        : file
          ? await onSubmit({
              mode: 'file',
              fileName: file.name,
              fileUri: file.uri,
              fileMime: file.mimeType,
              fileSize: file.size,
            })
          : '파일을 선택해 주세요.';
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
          <Text style={styles.title}>과제 제출</Text>
          <Text style={styles.hint}>{assignment.title}</Text>
          {assignment.submitMode === 'memo' ? (
            <>
              <Text style={styles.rule}>메모로 제출 · {ASSIGNMENT_MEMO_MAX}자 이내</Text>
              <CuteInput
                label={`메모 (${memo.trim().length}/${ASSIGNMENT_MEMO_MAX})`}
                value={memo}
                onChangeText={setMemo}
                placeholder="제출 내용을 적어 주세요"
                multiline
                style={styles.memo}
              />
            </>
          ) : (
            <>
              <Text style={styles.rule}>
                파일 제출 · 이미지 / 워드 / 엑셀 / PDF · 10MB 이내
              </Text>
              <Pressable
                onPress={pickFile}
                style={({ pressed }) => [styles.fileBox, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.fileTitle}>{file ? file.name : '파일 선택하기'}</Text>
                <Text style={styles.fileMeta}>
                  {file
                    ? file.size
                      ? `${(file.size / (1024 * 1024)).toFixed(2)}MB`
                      : '선택됨'
                    : `최대 ${(ASSIGNMENT_FILE_MAX_BYTES / (1024 * 1024)).toFixed(0)}MB`}
                </Text>
              </Pressable>
            </>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <CuteButton label="취소" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <CuteButton label="제출하기" onPress={save} loading={saving} style={{ flex: 1 }} />
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
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    marginTop: 4,
  },
  rule: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 6,
    marginBottom: spacing.md,
  },
  memo: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  fileBox: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  fileTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  fileMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 4,
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
