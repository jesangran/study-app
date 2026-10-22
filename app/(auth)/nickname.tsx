/**
 * 닉네임 설정 — 소셜 신규 가입
 */
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { providerLabel } from '@/src/auth/social';
import { CuteButton } from '@/src/components/CuteButton';
import { CuteInput } from '@/src/components/CuteInput';
import { SoftBackground } from '@/src/components/SoftBackground';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';

export default function NicknameScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const {
    pendingSocial,
    completeNickname,
    clearPendingSocial,
    joinedStudyIds,
    checkNicknameAvailable,
  } = useApp();
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [hintOk, setHintOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pendingSocial) {
      router.replace('/(auth)/login');
      return;
    }
    setNickname(pendingSocial.suggestedNickname);
  }, [pendingSocial, router]);

  useEffect(() => {
    if (!nickname.trim()) {
      setHint(null);
      setHintOk(false);
      return;
    }
    const t = setTimeout(() => {
      const check = checkNicknameAvailable(nickname);
      if (check.ok) {
        setHint('사용 가능한 닉네임이에요.');
        setHintOk(true);
      } else {
        setHint(check.message);
        setHintOk(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [nickname, checkNicknameAvailable]);

  if (!pendingSocial) return null;

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    const err = await completeNickname(nickname);
    setLoading(false);
    if (err) {
      setError(err);
      setHintOk(false);
      return;
    }
    router.replace(joinedStudyIds.length === 0 ? '/studies/join' : '/(tabs)');
  };

  const onBack = () => {
    clearPendingSocial();
    router.replace('/(auth)/login');
  };

  const provider = pendingSocial.provider;

  return (
    <SoftBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(450)} style={styles.card}>
            <View
              style={[
                styles.avatar,
                provider === 'kakao' ? styles.avatarKakao : styles.avatarGoogle,
              ]}
            >
              <Text
                style={[styles.avatarText, provider === 'kakao' ? styles.avatarTextKakao : null]}
              >
                {pendingSocial.avatarLabel}
              </Text>
            </View>

            <Text style={styles.title}>닉네임을 정해 주세요</Text>
            <Text style={styles.desc}>
              {providerLabel(pendingSocial.provider)} 계정({pendingSocial.email})으로 연결됐어요.
              StudyBuddy에서 보일 이름을 정하면 가입이 끝나요.
            </Text>

            <CuteInput
              label="닉네임"
              value={nickname}
              onChangeText={setNickname}
              placeholder="귀여운 닉네임"
              autoFocus
            />
            {hint ? (
              <Text style={[styles.hint, hintOk ? styles.hintOk : styles.hintWarn]}>{hint}</Text>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <CuteButton
              label="이 닉네임으로 시작하기"
              onPress={onSubmit}
              loading={loading}
              disabled={!hintOk}
            />
            <CuteButton label="다른 계정으로" variant="ghost" onPress={onBack} style={{ marginTop: 8 }} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'stretch',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  avatarKakao: {
    backgroundColor: '#FEE500',
  },
  avatarGoogle: {
    backgroundColor: '#E8F0FE',
  },
  avatarText: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: '#4285F4',
  },
  avatarTextKakao: {
    color: '#191600',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  desc: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  hintOk: {
    color: colors.mint,
  },
  hintWarn: {
    color: '#D6453D',
  },
  error: {
    fontFamily: fonts.medium,
    color: colors.peach,
    marginBottom: spacing.sm,
  },
});
