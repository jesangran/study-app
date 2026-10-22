/**
 * 홈·스터디 홈용 — 일정/과제 등록 (탭 이동 없이 독립 모달)
 */
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CuteButton } from '@/src/components/CuteButton';
import { CuteInput } from '@/src/components/CuteInput';
import {
  PlaceFormValue,
  SchedulePlaceFields,
} from '@/src/components/SchedulePlaceFields';
import { AssignmentSubmitMode } from '@/src/data/mock';
import { useUnsavedGuard } from '@/src/navigation/UnsavedGuard';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';
import { todayYmd } from '@/src/utils/studyRhythm';

export type RhythmCreateKind = 'schedule' | 'assignment';

type StudyOption = {
  id: string;
  name: string;
  emoji: string;
};

export type ScheduleCreateDraft = {
  studyId: string;
  title: string;
  date: string;
  time: string;
  placeType: 'online' | 'offline';
  place: string;
  address?: string;
  mapx?: string;
  mapy?: string;
};

export type AssignmentCreateDraft = {
  studyId: string;
  title: string;
  dueDate: string;
  description: string;
  submitMode: AssignmentSubmitMode;
};

type Props = {
  visible: boolean;
  study: StudyOption | null;
  presetDate?: string;
  onClose: () => void;
  onSaveSchedule: (draft: ScheduleCreateDraft) => Promise<string | null>;
  onSaveAssignment: (draft: AssignmentCreateDraft) => Promise<string | null>;
};

export function RhythmCreateModal(props: Props) {
  return (
    <Modal visible={props.visible} animationType="slide" transparent onRequestClose={props.onClose}>
      {props.visible && props.study ? <RhythmCreateBody {...props} study={props.study} /> : null}
    </Modal>
  );
}

function RhythmCreateBody({
  study,
  presetDate,
  onClose,
  onSaveSchedule,
  onSaveAssignment,
}: Props & { study: StudyOption }) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const today = todayYmd();

  const [kind, setKind] = useState<RhythmCreateKind>('schedule');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(presetDate ?? today);
  const [time, setTime] = useState('20:00');
  const [placeForm, setPlaceForm] = useState<PlaceFormValue>({ placeType: 'online', place: '' });
  const [description, setDescription] = useState('');
  const [submitMode, setSubmitMode] = useState<AssignmentSubmitMode>('memo');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty =
    title.trim().length > 0 ||
    description.trim().length > 0 ||
    placeForm.place.trim().length > 0 ||
    date !== (presetDate ?? today) ||
    time !== '20:00';
  useUnsavedGuard(dirty);

  const save = async () => {
    setSaving(true);
    setError(null);
    const message =
      kind === 'schedule'
        ? await onSaveSchedule({
            studyId: study.id,
            title,
            date,
            time,
            placeType: placeForm.placeType,
            place: placeForm.place,
            address: placeForm.address,
            mapx: placeForm.mapx,
            mapy: placeForm.mapy,
          })
        : await onSaveAssignment({
            studyId: study.id,
            title,
            dueDate: date,
            description,
            submitMode,
          });
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
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <Text style={styles.title}>{kind === 'assignment' ? '과제 등록' : '일정 등록'}</Text>
          <Text style={styles.hint}>
            {study.emoji} {study.name} · 일정인지 과제인지 고른 뒤 등록해요
          </Text>

          <View style={styles.kindToggle}>
            <Pressable
              onPress={() => setKind('schedule')}
              style={[styles.kindBtn, kind === 'schedule' && styles.kindBtnOn]}
            >
              <Text style={[styles.kindText, kind === 'schedule' && styles.kindTextOn]}>일정</Text>
            </Pressable>
            <Pressable
              onPress={() => setKind('assignment')}
              style={[styles.kindBtn, kind === 'assignment' && styles.kindBtnOn]}
            >
              <Text style={[styles.kindText, kind === 'assignment' && styles.kindTextOn]}>과제</Text>
            </Pressable>
          </View>

          <CuteInput
            label="제목"
            value={title}
            onChangeText={setTitle}
            placeholder={kind === 'assignment' ? '예: 백준 10문제' : '예: DP 기초 세션'}
          />
          <CuteInput
            label={kind === 'assignment' ? '마감일 (YYYY-MM-DD)' : '날짜 (YYYY-MM-DD)'}
            value={date}
            onChangeText={setDate}
            placeholder={today}
            autoCapitalize="none"
          />

          {kind === 'schedule' ? (
            <>
              <CuteInput
                label="시간 (HH:MM)"
                value={time}
                onChangeText={setTime}
                placeholder="20:00"
                autoCapitalize="none"
              />
              <SchedulePlaceFields value={placeForm} onChange={setPlaceForm} />
            </>
          ) : (
            <>
              <CuteInput
                label="설명"
                value={description}
                onChangeText={setDescription}
                placeholder="무엇을 제출하면 되는지 적어 주세요"
                multiline
                style={styles.bodyInput}
              />
              <Text style={styles.modeLabel}>제출 형식</Text>
              <View style={styles.kindToggle}>
                <Pressable
                  onPress={() => setSubmitMode('file')}
                  style={[styles.kindBtn, submitMode === 'file' && styles.kindBtnOn]}
                >
                  <Text style={[styles.kindText, submitMode === 'file' && styles.kindTextOn]}>파일</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSubmitMode('memo')}
                  style={[styles.kindBtn, submitMode === 'memo' && styles.kindBtnOn]}
                >
                  <Text style={[styles.kindText, submitMode === 'memo' && styles.kindTextOn]}>메모</Text>
                </Pressable>
              </View>
              <Text style={styles.modeHint}>
                {submitMode === 'file'
                  ? '이미지·워드·엑셀·PDF · 10MB 이내'
                  : '텍스트 메모 · 1,000자 이내'}
              </Text>
            </>
          )}

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
      backgroundColor: 'rgba(47, 42, 40, 0.35)',
      justifyContent: 'flex-end',
    },
    card: {
      backgroundColor: colors.white,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      maxHeight: '92%',
      paddingTop: spacing.md,
      paddingHorizontal: spacing.md,
    },
    scroll: {
      paddingBottom: spacing.md,
      gap: 2,
    },
    title: {
      fontFamily: fonts.extraBold,
      fontSize: 20,
      color: colors.ink,
      marginBottom: 4,
    },
    hint: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.inkMuted,
      marginBottom: spacing.sm,
    },
    kindToggle: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: spacing.sm,
    },
    kindBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radii.pill,
      borderWidth: 1.5,
      borderColor: colors.line,
      backgroundColor: colors.cream,
      alignItems: 'center',
    },
    kindBtnOn: {
      backgroundColor: colors.peach,
      borderColor: colors.peach,
    },
    kindText: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.inkMuted,
    },
    kindTextOn: {
      color: colors.white,
    },
    bodyInput: {
      minHeight: 88,
      textAlignVertical: 'top',
    },
    modeLabel: {
      fontFamily: fonts.bold,
      fontSize: 13,
      color: colors.inkMuted,
      marginBottom: spacing.xs,
      marginLeft: 4,
    },
    modeHint: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.inkMuted,
      marginBottom: spacing.sm,
      marginLeft: 4,
    },
    error: {
      fontFamily: fonts.bold,
      fontSize: 13,
      color: colors.danger,
      marginBottom: spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
  });
