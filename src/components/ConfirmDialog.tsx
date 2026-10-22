import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useThemedStyles } from '@/src/theme';

type Props = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ visible, title, body, confirmLabel, onConfirm, onCancel }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <View style={styles.row}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [styles.btn, styles.cancelBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [styles.btn, styles.okBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.okText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(47, 42, 40, 0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.white,
      borderRadius: radii.lg,
      padding: spacing.lg,
    },
    title: {
      fontFamily: fonts.extraBold,
      fontSize: 18,
      color: colors.ink,
      marginBottom: spacing.sm,
    },
    body: {
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
      color: colors.inkMuted,
      marginBottom: spacing.lg,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    btn: {
      flex: 1,
      minHeight: 44,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtn: {
      backgroundColor: colors.creamDeep,
    },
    okBtn: {
      backgroundColor: colors.danger,
    },
    cancelText: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.ink,
    },
    okText: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.white,
    },
  });
