/**
 * 로그인 — 간편로그인 · 이메일 가입/로그인 진입
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { isOAuthProvider, OAuthProvider, providerLabel } from '@/src/auth/social';
import { SoftBackground } from '@/src/components/SoftBackground';
import { SocialLoginButton } from '@/src/components/SocialLoginButton';
import { DEMO_MODE } from '@/src/config/demo';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';

function formatRecentAt(iso: string) {
  try {
    const d = new Date(iso);
    const mm = `${d.getMonth() + 1}`.padStart(2, '0');
    const dd = `${d.getDate()}`.padStart(2, '0');
    const hh = `${d.getHours()}`.padStart(2, '0');
    const mi = `${d.getMinutes()}`.padStart(2, '0');
    return `${mm}.${dd} ${hh}:${mi}`;
  } catch {
    return '';
  }
}

export default function LoginScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const { loginWithSocial, autoLogin, setAutoLogin, lastLogin, joinedStudyIds } = useApp();
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recentProvider =
    lastLogin && isOAuthProvider(lastLogin.provider) ? lastLogin.provider : null;

  const recentCopy = useMemo(() => {
    if (!lastLogin) return null;
    return {
      title: `${providerLabel(lastLogin.provider)} · ${lastLogin.nickname}`,
      meta: `${lastLogin.email} · ${formatRecentAt(lastLogin.at)}`,
    };
  }, [lastLogin]);

  const goAfterLogin = () => {
    router.replace(joinedStudyIds.length === 0 ? '/studies/join' : '/(tabs)');
  };

  const onSocial = async (provider: OAuthProvider) => {
    setError(null);
    setLoadingProvider(provider);
    const result = await loginWithSocial(provider);
    setLoadingProvider(null);

    if (result.status === 'error') {
      setError(result.message);
      return;
    }
    if (result.status === 'logged_in') {
      goAfterLogin();
      return;
    }
    router.push('/(auth)/nickname');
  };

  const onRecent = () => {
    if (!lastLogin) return;
    if (lastLogin.provider === 'email') {
      router.push({ pathname: '/(auth)/signup', params: { mode: 'login' } });
      return;
    }
    if (!isOAuthProvider(lastLogin.provider)) {
      setError('Android에서는 Apple 로그인을 지원하지 않아요. 카카오 또는 Google로 이어가 주세요.');
      return;
    }
    void onSocial(lastLogin.provider);
  };

  return (
    <SoftBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
          <Text style={styles.brand}>StudyBuddy</Text>
          <Text style={styles.tagline}>아기자기한 스터디 관리</Text>
          <Text style={styles.sub}>간편로그인 또는 이메일로 시작해요</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.card}>
          <Text style={styles.cardTitle}>시작하기</Text>
          <Text style={styles.cardDesc}>
            카카오·Google 간편로그인, 또는 별도 이메일 회원가입으로 시작할 수 있어요. (Android)
          </Text>

          {recentCopy && lastLogin ? (
            <Pressable
              onPress={onRecent}
              style={({ pressed }) => [styles.recentCard, pressed && { opacity: 0.9 }]}
            >
              <View
                style={[
                  styles.recentAvatar,
                  lastLogin.provider === 'kakao'
                    ? styles.recentAvatarKakao
                    : lastLogin.provider === 'google'
                      ? styles.recentAvatarGoogle
                      : lastLogin.provider === 'apple'
                        ? styles.recentAvatarApple
                        : styles.recentAvatarEmail,
                ]}
              >
                {lastLogin.provider === 'apple' ? (
                  <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.recentAvatarText,
                      lastLogin.provider === 'kakao' ? styles.recentAvatarTextKakao : null,
                      lastLogin.provider === 'email' ? styles.recentAvatarTextEmail : null,
                    ]}
                  >
                    {lastLogin.provider === 'kakao'
                      ? '카'
                      : lastLogin.provider === 'google'
                        ? 'G'
                        : '@'}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentLabel}>최근 로그인</Text>
                <Text style={styles.recentTitle}>{recentCopy.title}</Text>
                <Text style={styles.recentMeta}>{recentCopy.meta}</Text>
              </View>
              <Text style={styles.recentGo}>입장</Text>
            </Pressable>
          ) : null}

          <SocialLoginButton
            provider="kakao"
            recent={recentProvider === 'kakao'}
            onPress={() => onSocial('kakao')}
            loading={loadingProvider === 'kakao'}
          />
          <SocialLoginButton
            provider="google"
            recent={recentProvider === 'google'}
            onPress={() => onSocial('google')}
            loading={loadingProvider === 'google'}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={() => router.push('/(auth)/signup')}
            style={({ pressed }) => [styles.emailBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.emailBtnText}>이메일로 회원가입</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: '/(auth)/signup', params: { mode: 'login' } })}
            style={({ pressed }) => [styles.emailLoginLink, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.emailLoginText}>이미 이메일 계정이 있나요? 로그인</Text>
          </Pressable>

          <View style={styles.autoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.autoTitle}>자동 로그인</Text>
              <Text style={styles.autoDesc}>다음에 앱을 켜면 로그인 없이 바로 들어가요</Text>
            </View>
            <Switch
              value={autoLogin}
              onValueChange={setAutoLogin}
              trackColor={{ false: colors.line, true: colors.peachSoft }}
              thumbColor={autoLogin ? colors.peach : '#f4f3f4'}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.noticeBox}>
            <Text style={styles.noticeTitle}>프로토타입 안내</Text>
            <Text style={styles.noticeBody}>
              {DEMO_MODE
                ? '데모 모드예요. 간편로그인(카카오·Google)과 이메일 가입은 서로 다른 계정이고, 이메일 인증번호는 화면에 표시돼요.'
                : '간편로그인(카카오·Google)과 이메일 회원가입은 서로 다른 계정이에요.'}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SoftBackground>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  hero: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  brand: {
    fontFamily: fonts.extraBold,
    fontSize: 40,
    color: colors.ink,
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.inkMuted,
    marginTop: 6,
  },
  sub: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.peach,
    marginTop: 10,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.ink,
    marginBottom: 6,
  },
  cardDesc: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.creamDeep,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.peachSoft,
  },
  recentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentAvatarKakao: {
    backgroundColor: '#FEE500',
  },
  recentAvatarGoogle: {
    backgroundColor: '#E8F0FE',
  },
  recentAvatarEmail: {
    backgroundColor: colors.mintSoft,
  },
  recentAvatarApple: {
    backgroundColor: '#111111',
  },
  recentAvatarText: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: '#4285F4',
  },
  recentAvatarTextKakao: {
    color: '#191600',
  },
  recentAvatarTextEmail: {
    color: colors.mint,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  dividerText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
  },
  emailBtn: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.mint,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  emailBtnText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.mint,
  },
  emailLoginLink: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: spacing.sm,
  },
  emailLoginText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    textDecorationLine: 'underline',
  },
  recentLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.peach,
    marginBottom: 2,
  },
  recentTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  recentMeta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 2,
  },
  recentGo: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    color: colors.peach,
  },
  autoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  autoTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  autoDesc: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  error: {
    fontFamily: fonts.medium,
    color: colors.peach,
    marginTop: spacing.sm,
  },
  noticeBox: {
    marginTop: spacing.md,
    backgroundColor: colors.creamDeep,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  noticeTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ink,
    marginBottom: 4,
  },
  noticeBody: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.inkMuted,
    lineHeight: 18,
  },
});
