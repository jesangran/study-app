/**
 * 스터디 허브 상단 카드 (이름 · 메타 · 스터디명 변경)
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CuteButton } from '@/src/components/CuteButton';
import { CuteInput } from '@/src/components/CuteInput';
import { StudyLeadMark } from '@/src/components/StudyLeadMark';
import type { Study } from '@/src/data/mock';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useThemedStyles } from '@/src/theme';
import { visibilityLabel } from '@/src/utils/study';

type Props = {
  study: Study;
  isAdmin: boolean;
  onRename: (name: string) => Promise<string | null>;
};

export function StudyHeroCard({ study, isAdmin, onRename }: Props) {
  const styles = useThemedStyles(createStyles);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(study.name);
  const [nameError, setNameError] = useState<string | null>(null);

  return (
    <>
      <View style={styles.hero}>
        <View style={[styles.heroAccent, { backgroundColor: study.color }]} />
        <View style={styles.heroBody}>
          <Text style={styles.emoji}>{study.emoji}</Text>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.name}>{study.name}</Text>
              {isAdmin ? <StudyLeadMark /> : null}
            </View>
            <Text style={styles.meta}>
              {study.topic} · {visibilityLabel(study.visibility)} · 코드 {study.inviteCode}
            </Text>
            {isAdmin && !renaming ? (
              <Pressable
                onPress={() => {
                  setNameDraft(study.name);
                  setNameError(null);
                  setRenaming(true);
                }}
                hitSlop={8}
                style={styles.renameLink}
              >
                <Text style={styles.renameLinkText}>스터디명 변경</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      {isAdmin && renaming ? (
        <View style={styles.renameBox}>
          <CuteInput
            label="스터디명"
            value={nameDraft}
            onChangeText={(text) => {
              setNameDraft(text);
              if (nameError) setNameError(null);
            }}
            maxLength={24}
            placeholder="새 스터디 이름"
            autoFocus
          />
          {nameError ? <Text style={styles.nameError}>{nameError}</Text> : null}
          <View style={styles.renameActions}>
            <CuteButton
              label="취소"
              variant="ghost"
              onPress={() => {
                setRenaming(false);
                setNameError(null);
              }}
              style={styles.renameActionBtn}
            />
            <CuteButton
              label="저장"
              onPress={async () => {
                const err = await onRename(nameDraft);
                if (err) {
                  setNameError(err);
                  return;
                }
                setRenaming(false);
                setNameError(null);
              }}
              style={styles.renameActionBtn}
            />
          </View>
        </View>
      ) : null}
    </>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    hero: {
      backgroundColor: colors.white,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      overflow: 'hidden',
      flexDirection: 'row',
      marginBottom: spacing.md,
    },
    heroAccent: {
      width: 6,
    },
    heroBody: {
      flex: 1,
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.md,
      alignItems: 'center',
    },
    emoji: {
      fontSize: 36,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    name: {
      fontFamily: fonts.extraBold,
      fontSize: 20,
      color: colors.ink,
    },
    meta: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.inkMuted,
      marginTop: 4,
    },
    renameLink: {
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    renameLinkText: {
      fontFamily: fonts.bold,
      fontSize: 13,
      color: colors.peach,
    },
    renameBox: {
      backgroundColor: colors.white,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    nameError: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: '#D6453D',
      marginTop: -spacing.sm,
      marginBottom: spacing.sm,
    },
    renameActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    renameActionBtn: {
      flex: 1,
      minHeight: 44,
    },
  });
