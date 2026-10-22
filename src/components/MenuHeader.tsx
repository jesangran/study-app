import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, usePathname, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { SocialProvider } from '@/src/auth/social';
import { NotificationPreviewModal } from '@/src/components/NotificationPreviewModal';
import { describeMotive, MotiveQuote, pickMotiveQuote } from '@/src/data/motives';
import { formatUnreadBadge } from '@/src/data/notifications';
import { useUnsavedGuardContext } from '@/src/navigation/UnsavedGuard';
import { useApp } from '@/src/store/AppContext';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';
import type { AppColors } from '@/src/theme';
import { hrefForNotification } from '@/src/utils/notificationNav';

function LoginMark({ provider, colors, styles }: { provider: SocialProvider; colors: AppColors; styles: Record<string, object> }) {
  if (provider === 'google') {
    return (
      <View style={[styles.mark, styles.markGoogle]}>
        <Ionicons name="logo-google" size={14} color="#4285F4" />
      </View>
    );
  }
  if (provider === 'apple') {
    return (
      <View style={[styles.mark, styles.markApple]}>
        <Ionicons name="logo-apple" size={15} color="#FFFFFF" />
      </View>
    );
  }
  if (provider === 'email') {
    return (
      <View style={[styles.mark, styles.markEmail]}>
        <Ionicons name="mail" size={13} color={colors.mint} />
      </View>
    );
  }
  return (
    <View style={[styles.mark, styles.markKakao]}>
      <Text style={styles.markKakaoText}>K</Text>
    </View>
  );
}

type Props = {
  title: string;
  caption?: string;
};

export function MenuHeader({ title, caption }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const pathname = usePathname();
  const {
    user,
    logout,
    notifications,
    unreadNotificationCount,
    markNotificationsRead,
  } = useApp();
  const { confirmLeave, allowNextLeave, consumeLeave } = useUnsavedGuardContext();
  const [quote, setQuote] = useState<MotiveQuote>(() => pickMotiveQuote().quote);
  const [previewOpen, setPreviewOpen] = useState(false);
  const indexRef = useRef(0);
  const nickname = user?.nickname?.trim() || '친구';
  const provider = user?.lastProvider ?? 'google';
  const badgeLabel = formatUnreadBadge(unreadNotificationCount);
  const onNotificationsScreen = pathname.includes('notifications');

  useFocusEffect(
    useCallback(() => {
      const next = pickMotiveQuote(indexRef.current);
      indexRef.current = next.index;
      setQuote(next.quote);
      setPreviewOpen(false);
    }, []),
  );

  const motive = describeMotive(quote);

  const onLogout = async () => {
    const leave = await confirmLeave();
    if (!leave) return;
    await logout();
    allowNextLeave();
    router.replace('/(auth)/login');
    consumeLeave();
  };

  const onProfile = async () => {
    const leave = await confirmLeave();
    if (!leave) return;
    allowNextLeave();
    router.push('/profile');
    consumeLeave();
  };

  const openPreview = () => {
    if (onNotificationsScreen) {
      router.push('/notifications');
      return;
    }
    setPreviewOpen(true);
  };

  const goInbox = async () => {
    setPreviewOpen(false);
    const leave = await confirmLeave();
    if (!leave) return;
    allowNextLeave();
    router.push('/notifications');
    consumeLeave();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <View style={styles.titleCol}>
          <Text style={styles.title}>{title}</Text>
          {caption ? (
            <Text style={styles.caption} numberOfLines={2}>
              {caption}
            </Text>
          ) : null}
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={onProfile}
            hitSlop={6}
            style={({ pressed }) => [styles.profile, pressed && { opacity: 0.8 }]}
          >
            <LoginMark provider={provider} colors={colors} styles={styles} />
            <Text style={styles.nick} numberOfLines={1}>
              {nickname}
            </Text>
          </Pressable>
          <View style={styles.bellWrap}>
            <Pressable
              onPress={openPreview}
              hitSlop={8}
              accessibilityLabel={
                badgeLabel ? `알림, 안읽은 알림 ${badgeLabel}개` : '알림'
              }
              style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.75 }]}
            >
              <Ionicons name="notifications-outline" size={18} color={colors.ink} />
            </Pressable>
            {badgeLabel ? (
              <View style={styles.notifBadge} pointerEvents="none">
                <Text style={styles.notifBadgeText}>{badgeLabel}</Text>
              </View>
            ) : null}
          </View>
          <Pressable
            onPress={onLogout}
            hitSlop={6}
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.logoutText}>로그아웃</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.idiom}>
        <Text style={styles.badge}>
          {motive.category} · {motive.language}
        </Text>
        <View style={styles.idiomRow}>
          <Text style={styles.hanja}>{motive.lead}</Text>
          {motive.rest ? (
            <Text style={styles.reading} numberOfLines={2}>
              {motive.rest}
            </Text>
          ) : null}
        </View>
      </View>

      <NotificationPreviewModal
        visible={previewOpen}
        notifications={notifications}
        onClose={() => setPreviewOpen(false)}
        onMore={() => {
          void goInbox();
        }}
        onPressItem={(item) => {
          if (!item.read) void markNotificationsRead([item.id]);
          setPreviewOpen(false);
          router.push(hrefForNotification(item));
        }}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 2,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    color: colors.ink,
  },
  caption: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    lineHeight: 18,
    paddingBottom: 3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
    paddingRight: 2,
    overflow: 'visible',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 120,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 10,
  },
  mark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markGoogle: {
    backgroundColor: '#E8F0FE',
  },
  markApple: {
    backgroundColor: '#111111',
  },
  markEmail: {
    backgroundColor: colors.mintSoft,
  },
  markKakao: {
    backgroundColor: '#FEE500',
  },
  markKakaoText: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
    color: '#191600',
  },
  nick: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  bellWrap: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  bellBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    zIndex: 2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.peach,
    borderWidth: 1.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.white,
    lineHeight: 11,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerLine,
  },
  logoutText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.danger,
  },
  idiom: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badge: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.peach,
    marginBottom: 4,
  },
  idiomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  hanja: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.ink,
    letterSpacing: 1,
  },
  reading: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    lineHeight: 18,
    paddingBottom: 2,
  },
});
