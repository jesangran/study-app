/**
 * 헤더 종 아이콘 → 최근 N개 미리보기
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppNotification,
  NOTIFICATION_PREVIEW_COUNT,
  previewNotifications,
} from '@/src/data/notifications';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';
import { formatDateTimeShort } from '@/src/utils/datetime';
import { notificationKindIcon } from '@/src/utils/notificationUi';

type Props = {
  visible: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onMore: () => void;
  onPressItem: (item: AppNotification) => void;
};

export function NotificationPreviewModal({
  visible,
  notifications,
  onClose,
  onMore,
  onPressItem,
}: Props) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const preview = useMemo(
    () => previewNotifications(notifications, NOTIFICATION_PREVIEW_COUNT),
    [notifications],
  );
  const hasMore = notifications.length > preview.length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) + 56 }]}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>알림</Text>
            <Text style={styles.sheetSub}>최근 {NOTIFICATION_PREVIEW_COUNT}개</Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.inkMuted} />
            </Pressable>
          </View>

          {preview.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={24} color={colors.inkMuted} />
              <Text style={styles.emptyText}>새 알림이 없어요</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {preview.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => onPressItem(item)}
                  style={({ pressed }) => [
                    styles.row,
                    !item.read && styles.rowUnread,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread]}>
                    <Ionicons
                      name={notificationKindIcon(item.kind)}
                      size={16}
                      color={!item.read ? colors.peach : colors.inkMuted}
                    />
                  </View>
                  <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.rowTime}>{formatDateTimeShort(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.rowText} numberOfLines={2}>
                      {item.body}
                    </Text>
                  </View>
                  {!item.read ? <View style={styles.dot} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          )}

          <Pressable
            onPress={onMore}
            style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.88 }]}
          >
            <Text style={styles.moreText}>{hasMore ? '더보기 · 알림함' : '알림함 보기'}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.peach} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-start',
      paddingHorizontal: spacing.md,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(47, 42, 40, 0.28)',
    },
    sheet: {
      backgroundColor: colors.white,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      maxHeight: '70%',
      overflow: 'hidden',
      zIndex: 1,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    sheetTitle: {
      fontFamily: fonts.extraBold,
      fontSize: 16,
      color: colors.ink,
    },
    sheetSub: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.inkMuted,
    },
    closeBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.creamDeep,
    },
    list: {
      maxHeight: 420,
    },
    listContent: {
      padding: spacing.sm,
      gap: 6,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      padding: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: colors.white,
      borderWidth: 1.5,
      borderColor: colors.line,
      shadowColor: colors.ink,
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    rowUnread: {
      backgroundColor: colors.white,
      borderColor: colors.peach,
      borderLeftWidth: 3,
    },
    iconWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.creamDeep,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapUnread: {
      backgroundColor: colors.peachSoft,
      borderWidth: 1,
      borderColor: colors.peach,
    },
    rowBody: {
      flex: 1,
      gap: 2,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    rowTitle: {
      flex: 1,
      fontFamily: fonts.bold,
      fontSize: 13,
      color: colors.ink,
    },
    rowTime: {
      fontFamily: fonts.medium,
      fontSize: 10,
      color: colors.inkMuted,
    },
    rowText: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.inkMuted,
      lineHeight: 16,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.peach,
      marginTop: 6,
    },
    empty: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: spacing.xl,
    },
    emptyText: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.inkMuted,
    },
    moreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    moreText: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.peach,
    },
  });
