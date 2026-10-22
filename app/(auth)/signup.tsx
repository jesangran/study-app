/**
 * 이메일 인증 — 가입/로그인 코드 · 닉네임
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CuteButton } from '@/src/components/CuteButton';
import { CuteInput } from '@/src/components/CuteInput';
import { SoftBackground } from '@/src/components/SoftBackground';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';

type Mode = 'signup' | 'login';
type Step = 'email' | 'code' | 'nickname';

export default function EmailAuthScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const {
    joinedStudyIds,
    checkEmailAvailable,
    checkNicknameAvailable,
    requestSignupEmailCode,
    confirmSignupEmailCode,
    completeEmailSignup,
    requestEmailLoginCode,
    confirmEmailLogin,
    clearPendingEmailAuth,
  } = useApp();

  const initialMode: Mode = params.mode === 'login' ? 'login' : 'signup';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainSec, setRemainSec] = useState(0);
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [emailOk, setEmailOk] = useState(false);
  const [nickHint, setNickHint] = useState<string | null>(null);
  const [nickOk, setNickOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const goAfterAuth = useCallback(() => {
    router.replace(joinedStudyIds.length === 0 ? '/studies/join' : '/(tabs)');
  }, [joinedStudyIds.length, router]);

  const switchMode = (next: Mode) => {
    clearPendingEmailAuth();
    setMode(next);
    setStep('email');
    setCode('');
    setNickname('');
    setDemoCode(null);
    setExpiresAt(null);
    setError(null);
    setNickHint(null);
    setNickOk(false);
  };

  useEffect(() => {
    if (!email.trim()) {
      setEmailHint(null);
      setEmailOk(false);
      return;
    }
    const t = setTimeout(() => {
      if (mode === 'signup') {
        const check = checkEmailAvailable(email);
        setEmailHint(check.ok ? '사용 가능한 이메일이에요.' : check.message);
        setEmailOk(check.ok);
      } else {
        const check = checkEmailAvailable(email);
        if (check.ok) {
          setEmailHint('가입되지 않은 이메일이에요. 회원가입을 해 주세요.');
          setEmailOk(false);
        } else if (check.message.includes('이미 사용')) {
          setEmailHint('이메일 회원이면 인증번호로 로그인할 수 있어요.');
          setEmailOk(true);
        } else {
          setEmailHint(check.message);
          setEmailOk(false);
        }
      }
    }, 250);
    return () => clearTimeout(t);
  }, [email, mode, checkEmailAvailable]);

  useEffect(() => {
    if (step !== 'nickname' || !nickname.trim()) {
      setNickHint(null);
      setNickOk(false);
      return;
    }
    const t = setTimeout(() => {
      const check = checkNicknameAvailable(nickname);
      setNickHint(check.ok ? '사용 가능한 닉네임이에요.' : check.message);
      setNickOk(check.ok);
    }, 250);
    return () => clearTimeout(t);
  }, [nickname, step, checkNicknameAvailable]);

  useEffect(() => {
    if (!expiresAt) {
      setRemainSec(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setRemainSec(left);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [expiresAt]);

  const title = useMemo(() => {
    if (mode === 'login') return '이메일 로그인';
    if (step === 'nickname') return '닉네임 설정';
    return '이메일 회원가입';
  }, [mode, step]);

  const desc = useMemo(() => {
    if (mode === 'login') {
      return '이메일로 가입한 계정만 여기서 로그인해요. 간편로그인과는 별도예요.';
    }
    if (step === 'nickname') {
      return '스터디에서 보일 닉네임을 정해 주세요. 닉네임은 중복될 수 없어요.';
    }
    if (step === 'code') {
      return '이메일로 보낸 인증번호 6자리를 입력해 주세요.';
    }
    return '간편로그인과 별도로, 이메일 인증 후 닉네임만 정하면 가입이 끝나요.';
  }, [mode, step]);

  const onRequestCode = async () => {
    setError(null);
    if (!emailOk) return;
    setBusy(true);
    const result =
      mode === 'signup'
        ? await requestSignupEmailCode(email)
        : await requestEmailLoginCode(email);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      setEmailOk(false);
      return;
    }
    setDemoCode(result.demoCode);
    setExpiresAt(result.expiresAt);
    setCode('');
    setStep('code');
  };

  const onConfirmCode = async () => {
    setError(null);
    setBusy(true);
    if (mode === 'login') {
      const err = await confirmEmailLogin(code);
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      goAfterAuth();
      return;
    }
    const err = await confirmSignupEmailCode(code);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setNickname('');
    setNickHint(null);
    setNickOk(false);
    setStep('nickname');
  };

  const onCompleteSignup = async () => {
    setError(null);
    if (!nickOk) return;
    setBusy(true);
    const err = await completeEmailSignup(nickname);
    setBusy(false);
    if (err) {
      setError(err);
      setNickOk(false);
      return;
    }
    goAfterAuth();
  };

  const onBack = () => {
    if (step === 'nickname') {
      setStep('code');
      setError(null);
      return;
    }
    if (step === 'code') {
      setStep('email');
      setDemoCode(null);
      setExpiresAt(null);
      setCode('');
      setError(null);
      clearPendingEmailAuth();
      return;
    }
    clearPendingEmailAuth();
    router.replace('/(auth)/login');
  };

  return (
    <SoftBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(450)} style={styles.card}>
            <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
              <Text style={styles.backText}>← 뒤로</Text>
            </Pressable>

            <View style={styles.modeRow}>
              <Pressable
                onPress={() => switchMode('signup')}
                style={[styles.modeChip, mode === 'signup' && styles.modeChipOn]}
              >
                <Text style={[styles.modeChipText, mode === 'signup' && styles.modeChipTextOn]}>
                  회원가입
                </Text>
              </Pressable>
              <Pressable
                onPress={() => switchMode('login')}
                style={[styles.modeChip, mode === 'login' && styles.modeChipOn]}
              >
                <Text style={[styles.modeChipText, mode === 'login' && styles.modeChipTextOn]}>
                  로그인
                </Text>
              </Pressable>
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.desc}>{desc}</Text>

            {step === 'email' || step === 'code' ? (
              <CuteInput
                label="이메일"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (step === 'code') {
                    setStep('email');
                    setDemoCode(null);
                    setExpiresAt(null);
                    setCode('');
                    clearPendingEmailAuth();
                  }
                }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
              />
            ) : null}

            {step === 'email' && emailHint ? (
              <Text style={[styles.hint, emailOk ? styles.hintOk : styles.hintWarn]}>
                {emailHint}
              </Text>
            ) : null}

            {step === 'email' ? (
              <CuteButton
                label="인증번호 받기"
                onPress={onRequestCode}
                loading={busy}
                disabled={!emailOk}
              />
            ) : null}

            {step === 'code' ? (
              <>
                {demoCode ? (
                  <View style={styles.demoBox}>
                    <Text style={styles.demoTitle}>프로토타입 인증번호</Text>
                    <Text style={styles.demoCode}>{demoCode}</Text>
                    <Text style={styles.demoMeta}>
                      {remainSec > 0
                        ? `${remainSec}초 후 만료 · 실제 서비스에선 메일로 전송돼요`
                        : '만료됐어요. 다시 요청해 주세요.'}
                    </Text>
                  </View>
                ) : null}

                <CuteInput
                  label="인증번호 6자리"
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                  placeholder="ABC123"
                  autoCapitalize="characters"
                  maxLength={6}
                  autoFocus
                />

                <CuteButton
                  label={mode === 'login' ? '로그인' : '인증 확인'}
                  onPress={onConfirmCode}
                  loading={busy}
                  disabled={code.trim().length < 6 || remainSec <= 0}
                />
                <CuteButton
                  label="인증번호 다시 받기"
                  variant="ghost"
                  onPress={onRequestCode}
                  disabled={busy || !emailOk}
                  style={{ marginTop: 8 }}
                />
              </>
            ) : null}

            {step === 'nickname' ? (
              <>
                <View style={styles.verifiedChip}>
                  <Text style={styles.verifiedText}>인증됨 · {email.trim().toLowerCase()}</Text>
                </View>
                <CuteInput
                  label="닉네임"
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="귀여운 닉네임"
                  autoFocus
                  maxLength={12}
                />
                {nickHint ? (
                  <Text style={[styles.hint, nickOk ? styles.hintOk : styles.hintWarn]}>
                    {nickHint}
                  </Text>
                ) : null}
                <CuteButton
                  label="가입 완료"
                  onPress={onCompleteSignup}
                  loading={busy}
                  disabled={!nickOk}
                />
              </>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.footerHint}>
              {mode === 'signup'
                ? '이미 이메일 계정이 있나요? 로그인 탭을 눌러 주세요.'
                : '아직 계정이 없나요? 회원가입 탭에서 시작해 주세요.'}
            </Text>
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
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  backText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.inkMuted,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.creamDeep,
    alignItems: 'center',
  },
  modeChipOn: {
    backgroundColor: colors.peachSoft,
    borderColor: colors.peach,
  },
  modeChipText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  modeChipTextOn: {
    color: colors.peach,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.ink,
    marginBottom: 8,
  },
  desc: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
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
    marginTop: spacing.sm,
  },
  demoBox: {
    backgroundColor: colors.mintSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.mint,
  },
  demoTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ink,
    marginBottom: 4,
  },
  demoCode: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    letterSpacing: 4,
    color: colors.mint,
  },
  demoMeta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 6,
  },
  verifiedChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.mintSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.mint,
  },
  verifiedText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.mint,
  },
  footerHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
  },
});
