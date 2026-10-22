/**
 * 알림함 — 필터 · 읽음/삭제 · 스와이프 · 탭 시 관련 화면 이동
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { EmptyState } from '@/src/components/EmptyState';
import { MenuHeader } from '@/src/components/MenuHeader';
import { SoftBackground } from '@/src/components/SoftBackground';
import {
  AppNotification,
  countNotificationsByCategory,
  countNotificationsByRead,
  filterNotificationsForInbox,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_MONTH_DAYS,
  NOTIFICATION_READ_FILTERS,
  NotificationCategory,
  NotificationReadFilter,
} from '@/src/data/notifications';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';
import { formatDateTimeShort } from '@/src/utils/datetime';
import { hrefForNotification } from '@/src/utils/notificationNav';
import {
  NOTIFICATION_SWIPE_DELETE_THRESHOLD,
  notificationCategoryIcon,
  notificationKindIcon,
} from '@/src/utils/notificationUi';

function SwipeableNotificationRow({
  item,
  selecting,
  selected,
  onToggleSelect,
  onPress,
  onDelete,
  onToggleRead,
}: {
  item: AppNotification;
  selecting: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onPress: () => void;
  onDelete: () => void;
  onToggleRead: () => void;
}) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          !selecting && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: () => {
          translateX.stopAnimation((value) => {
            startX.current = value;
          });
        },
        onPanResponderMove: (_, g) => {
          const next = Math.min(0, Math.max(-120, startX.current + g.dx));
          translateX.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          const next = startX.current + g.dx;
          if (next < NOTIFICATION_SWIPE_DELETE_THRESHOLD || g.vx < -0.6) {
            Animated.timing(translateX, {
              toValue: -120,
              duration: 120,
              useNativeDriver: true,
            }).start(() => {
              onDelete();
              translateX.setValue(0);
            });
            return;
          }
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        },
      }),
    [onDelete, selecting, translateX],
  );

  return (
    <View style={styles.swipeWrap}>
      <View style={styles.deleteReveal}>
        <Ionicons name="trash-outline" size={20} color={colors.white} />
        <Text style={styles.deleteRevealText}>삭제</Text>
      </View>
      <Animated.View
        style={[styles.rowSlide, { transform: [{ translateX }] }]}
        {...(selecting ? {} : panResponder.panHandlers)}
      >
        <Pressable
          onPress={selecting ? onToggleSelect : onPress}
          onLongPress={selecting ? undefined : onToggleSelect}
          style={({ pressed }) => [
            styles.row,
            !item.read && styles.rowUnread,
            selected && styles.rowSelected,
            pressed && { opacity: 0.92 },
          ]}
        >
          {selecting ? (
            <View style={[styles.check, selected && styles.checkOn]}>
              {selected ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
            </View>
          ) : (
            <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread]}>
              <Ionicons
                name={notificationKindIcon(item.kind)}
                size={18}
                color={!item.read ? colors.peach : colors.inkMuted}
              />
            </View>
          )}
          <View style={styles.rowBody}>
            <View style={styles.rowTop}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.rowTime}>{formatDateTimeShort(item.createdAt)}</Text>
            </View>
            <Text style={styles.rowText} numberOfLines={3}>
              {item.body}
            </Text>
            <View style={styles.rowFooter}>
              {item.studyName ? (
                <Text style={styles.rowStudy} numberOfLines={1}>
                  {item.studyName}
                </Text>
              ) : (
                <View />
              )}
              {!selecting ? (
                <Pressable
                  onPress={onToggleRead}
                  hitSlop={8}
                  style={({ pressed }) => [styles.readBtn, pressed && { opacity: 0.75 }]}
                >
                  <Text style={styles.readBtnText}>
                    {item.read ? '안읽음 처리' : '읽음처리'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          {!item.read && !selecting ? <View style={styles.dot} /> : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const {
    notifications,
    unreadNotificationCount,
    markNotificationsRead,
    markNotificationsUnread,
    deleteNotifications,
    clearAllNotifications,
  } = useApp();
  const [category, setCategory] = useState<NotificationCategory>('all');
  const [readFilter, setReadFilter] = useState<NotificationReadFilter>('all');
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteSelected, setConfirmDeleteSelected] = useState(false);

  const categoryCounts = useMemo(
    () => countNotificationsByCategory(notifications),
    [notifications],
  );

  const readCounts = useMemo(
    () => countNotificationsByRead(notifications, category),
    [notifications, category],
  );

  const visible = useMemo(
    () =>
      filterNotificationsForInbox(notifications, {
        expanded: true,
        category,
        readFilter,
        now: new Date(),
      }),
    [notifications, category, readFilter],
  );

  const resetListState = useCallback(() => {
    setSelecting(false);
    setSelectedIds([]);
  }, []);

  const onChangeCategory = useCallback(
    (next: NotificationCategory) => {
      setCategory(next);
      resetListState();
    },
    [resetListState],
  );

  const onChangeReadFilter = useCallback(
    (next: NotificationReadFilter) => {
      setReadFilter(next);
      resetListState();
    },
    [resetListState],
  );

  const selectedCount = selectedIds.length;
  const allVisibleSelected =
    visible.length > 0 && visible.every((item) => selectedIds.includes(item.id));

  const exitSelect = useCallback(() => {
    setSelecting(false);
    setSelectedIds([]);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelecting(true);
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleSelectAllVisible = useCallback(() => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visible.some((item) => item.id === id)));
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      visible.forEach((item) => next.add(item.id));
      return [...next];
    });
  }, [allVisibleSelected, visible]);

  const onPressItem = useCallback(
    (item: AppNotification) => {
      if (!item.read) void markNotificationsRead([item.id]);
      router.push(hrefForNotification(item));
    },
    [markNotificationsRead, router],
  );

  const onToggleRead = useCallback(
    (item: AppNotification) => {
      if (item.read) void markNotificationsUnread([item.id]);
      else void markNotificationsRead([item.id]);
    },
    [markNotificationsRead, markNotificationsUnread],
  );

  const onDeleteOne = useCallback(
    (id: string) => {
      void deleteNotifications([id]);
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    },
    [deleteNotifications],
  );

  const onMarkSelectedRead = useCallback(() => {
    if (selectedIds.length === 0) return;
    void markNotificationsRead(selectedIds);
  }, [markNotificationsRead, selectedIds]);

  const onMarkSelectedUnread = useCallback(() => {
    if (selectedIds.length === 0) return;
    void markNotificationsUnread(selectedIds);
  }, [markNotificationsUnread, selectedIds]);

  return (
    <SoftBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <MenuHeader title="알림함" caption="최근 알림을 모아 봐요" />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {NOTIFICATION_CATEGORIES.map((item) => {
            const active = category === item.id;
            const count = categoryCounts[item.id];
            return (
              <Pressable
                key={item.id}
                onPress={() => onChangeCategory(item.id)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  active && styles.categoryChipOn,
                  pressed && { opacity: 0.88 },
                ]}
              >
                <Ionicons
                  name={notificationCategoryIcon(item.id)}
                  size={14}
                  color={active ? colors.white : colors.inkMuted}
                />
                <Text style={[styles.categoryLabel, active && styles.categoryLabelOn]}>
                  {item.label}
                </Text>
                <View style={[styles.categoryCount, active && styles.categoryCountOn]}>
                  <Text style={[styles.categoryCountText, active && styles.categoryCountTextOn]}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.readFilterRow}>
          {NOTIFICATION_READ_FILTERS.map((item) => {
            const active = readFilter === item.id;
            const count = readCounts[item.id];
            return (
              <Pressable
                key={item.id}
                onPress={() => onChangeReadFilter(item.id)}
                style={({ pressed }) => [
                  styles.readChip,
                  active && styles.readChipOn,
                  pressed && { opacity: 0.88 },
                ]}
              >
                <Text style={[styles.readChipLabel, active && styles.readChipLabelOn]}>
                  {item.label}
                </Text>
                <Text style={[styles.readChipCount, active && styles.readChipCountOn]}>{count}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.toolbar}>
          <Text style={styles.metaText}>
            최근 {NOTIFICATION_MONTH_DAYS}일 · {visible.length}건
            {unreadNotificationCount > 0 ? ` · 안읽음 ${unreadNotificationCount}` : ''}
          </Text>
          <View style={styles.toolbarActions}>
            {selecting ? (
              <>
                <Pressable onPress={toggleSelectAllVisible} hitSlop={6}>
                  <Text style={styles.toolLink}>{allVisibleSelected ? '선택해제' : '전체선택'}</Text>
                </Pressable>
                <Pressable onPress={exitSelect} hitSlop={6}>
                  <Text style={styles.toolLinkMuted}>완료</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  onPress={() => setSelecting(true)}
                  hitSlop={6}
                  disabled={visible.length === 0}
                >
                  <Text style={[styles.toolLink, visible.length === 0 && styles.toolDisabled]}>
                    선택
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setConfirmClear(true)}
                  hitSlop={6}
                  disabled={notifications.length === 0}
                >
                  <Text
                    style={[styles.toolDanger, notifications.length === 0 && styles.toolDisabled]}
                  >
                    전체삭제
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {selecting && selectedCount > 0 ? (
          <View style={styles.bulkBar}>
            <Text style={styles.bulkCount}>{selectedCount}개 선택</Text>
            <View style={styles.bulkActions}>
              <Pressable
                onPress={onMarkSelectedRead}
                style={({ pressed }) => [styles.bulkBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.bulkBtnText}>읽음</Text>
              </Pressable>
              <Pressable
                onPress={onMarkSelectedUnread}
                style={({ pressed }) => [styles.bulkBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.bulkBtnText}>안읽음</Text>
              </Pressable>
              <Pressable
                onPress={() => setConfirmDeleteSelected(true)}
                style={({ pressed }) => [styles.bulkBtnDanger, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.bulkBtnDangerText}>삭제</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {visible.length === 0 ? (
          <EmptyState
            icon="notifications-off-outline"
            title="알림이 없어요"
            hint={
              readFilter === 'unread'
                ? '안읽은 알림이 없어요.'
                : readFilter === 'read'
                  ? '읽은 알림이 없어요.'
                  : category === 'all'
                    ? '일정·과제·공지·스터디장 위임 때 알림이 쌓여요. 알림을 탭하면 관련 화면으로 이동해요.'
                    : '이 종류의 알림이 아직 없어요.'
            }
          />
        ) : (
          <View style={styles.list}>
            {visible.map((item) => (
              <SwipeableNotificationRow
                key={item.id}
                item={item}
                selecting={selecting}
                selected={selectedIds.includes(item.id)}
                onToggleSelect={() => toggleSelect(item.id)}
                onPress={() => onPressItem(item)}
                onDelete={() => onDeleteOne(item.id)}
                onToggleRead={() => onToggleRead(item)}
              />
            ))}
          </View>
        )}

        <Text style={styles.hint}>
          왼쪽으로 밀면 삭제 · 길게 누르면 선택 · 탭하면 읽음{'\n'}
          {NOTIFICATION_MONTH_DAYS}일이 지난 알림은 자동으로 삭제돼요.
        </Text>
      </ScrollView>

      <ConfirmDialog
        visible={confirmClear}
        title="알림 전체 삭제"
        body="알림함의 모든 알림을 지울까요? 되돌릴 수 없어요."
        confirmLabel="전체 삭제"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          exitSelect();
          void clearAllNotifications();
        }}
      />
      <ConfirmDialog
        visible={confirmDeleteSelected}
        title="선택한 알림 삭제"
        body={`${selectedCount}개의 알림을 지울까요?`}
        confirmLabel="삭제"
        onCancel={() => setConfirmDeleteSelected(false)}
        onConfirm={() => {
          setConfirmDeleteSelected(false);
          void deleteNotifications(selectedIds).then(() => exitSelect());
        }}
      />
    </SoftBackground>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  categoryRow: {
    gap: 8,
    paddingBottom: spacing.sm,
  },
  readFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm,
  },
  readChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.creamDeep,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  readChipOn: {
    backgroundColor: colors.white,
    borderColor: colors.peach,
  },
  readChipLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.inkMuted,
  },
  readChipLabelOn: {
    color: colors.peach,
  },
  readChipCount: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.inkMuted,
  },
  readChipCountOn: {
    color: colors.peach,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    shadowColor: colors.ink,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  categoryChipOn: {
    backgroundColor: colors.peach,
    borderColor: colors.peach,
    shadowOpacity: 0.12,
    elevation: 2,
  },
  categoryLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  categoryLabelOn: {
    color: colors.white,
  },
  categoryCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.creamDeep,
  },
  categoryCountOn: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  categoryCountText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.inkMuted,
  },
  categoryCountTextOn: {
    color: colors.white,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metaText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolLink: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.peach,
  },
  toolLinkMuted: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  toolDanger: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.danger,
  },
  toolDisabled: {
    opacity: 0.35,
  },
  bulkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.peachSoft,
  },
  bulkCount: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 6,
  },
  bulkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.creamDeep,
  },
  bulkBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ink,
  },
  bulkBtnDanger: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.dangerSoft,
  },
  bulkBtnDangerText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.danger,
  },
  list: {
    gap: spacing.sm,
  },
  swipeWrap: {
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.danger,
  },
  deleteReveal: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 22,
    gap: 6,
  },
  deleteRevealText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
  rowSlide: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowUnread: {
    borderColor: colors.peach,
    borderLeftWidth: 4,
    backgroundColor: colors.white,
  },
  rowSelected: {
    borderColor: colors.peach,
    backgroundColor: colors.creamDeep,
  },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkOn: {
    backgroundColor: colors.peach,
    borderColor: colors.peach,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  rowTime: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.inkMuted,
  },
  rowText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  rowStudy: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.mint,
  },
  readBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.creamDeep,
  },
  readBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.inkMuted,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.peach,
    marginTop: 6,
  },
  hint: {
    marginTop: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  emptyHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
