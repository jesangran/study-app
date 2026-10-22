/**
 * 프로필 — 닉네임 · 이메일 · 계정 연결 · 테마 · 탈퇴
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { MenuHeader } from '@/src/components/MenuHeader';
import {
  OAuthProvider,
  providerLabel,
  SocialProfile,
  SocialProvider,
} from '@/src/auth/social';
import { SoftBackground } from '@/src/components/SoftBackground';
import { useUnsavedGuard, useUnsavedGuardContext } from '@/src/navigation/UnsavedGuard';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useTheme, useColors, useThemedStyles } from '@/src/theme';
import type { ThemeId } from '@/src/theme';

/** Android: 카카오·Google만 연결 가능 */
const PROVIDERS: OAuthProvider[] = ['kakao', 'google'];

const EMAIL_DOMAINS = [
  'gmail.com',
  'naver.com',
  'kakao.com',
  'daum.net',
  'hanmail.net',
  'nate.com',
  'icloud.com',
  'studybuddy.app',
] as const;

const DOMAIN_CUSTOM = '직접입력';

function splitEmail(email: string): { local: string; domain: string; custom: boolean } {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0) {
    return { local: trimmed, domain: EMAIL_DOMAINS[0], custom: false };
  }
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();
  const known = EMAIL_DOMAINS.find((d) => d === domain);
  if (known) return { local, domain: known, custom: false };
  return { local, domain: domain || '', custom: true };
}

type DialogState =
  | { kind: 'confirmLink'; provider: OAuthProvider; profile: SocialProfile }
  | { kind: 'confirmUnlink'; provider: SocialProvider }
  | { kind: 'alert'; message: string; warn?: boolean };

function formatJoinedAt(iso?: string) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}.${m}.${day}`;
  } catch {
    return '-';
  }
}

function getTimeGreeting(nickname: string) {
  const hour = new Date().getHours();
  const name = nickname.trim() || '친구';

  // 새벽 0–4 · 아침 5–10 · 점심 11–16 · 저녁 17–20 · 밤 21–23
  if (hour < 5) {
    return {
      title: `고요한 새벽이에요, ${name}`,
      en: 'Good early morning',
      period: 'dawn' as const,
    };
  }
  if (hour < 11) {
    return {
      title: `좋은 아침이에요, ${name}!`,
      en: 'Good morning',
      period: 'morning' as const,
    };
  }
  if (hour < 17) {
    return {
      title: `맛있는 점심 되세요, ${name}!`,
      en: 'Good afternoon',
      period: 'lunch' as const,
    };
  }
  if (hour < 21) {
    return {
      title: `좋은 저녁이에요, ${name}!`,
      en: 'Good evening',
      period: 'evening' as const,
    };
  }
  return {
    title: `편안한 밤 되세요, ${name}`,
    en: 'Good night',
    period: 'night' as const,
  };
}

function FieldTitle({
  title,
  en,
  style,
}: {
  title: string;
  en: string;
  style?: object;
}) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.fieldTitleWrap, style]}>
      <Text style={styles.label}>{title}</Text>
      <Text style={styles.labelEn}>{en}</Text>
    </View>
  );
}

function SectionTitle({
  title,
  en,
  outside,
}: {
  title: string;
  en: string;
  outside?: boolean;
}) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={outside ? styles.sectionOutsideWrap : styles.sectionWrap}>
      <Text style={outside ? styles.sectionOutside : styles.section}>{title}</Text>
      <Text style={styles.labelEn}>{en}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { allowNextLeave, consumeLeave } = useUnsavedGuardContext();
  const {
    user,
    checkNicknameAvailable,
    updateNickname,
    requestEmailVerification,
    confirmEmailVerification,
    requestLinkProvider,
    confirmLinkProvider,
    unlinkProvider,
    deleteAccount,
  } = useApp();
  const { themeId, setThemeId, themes, colors: themeColors } = useTheme();

  const [nicknameDraft, setNicknameDraft] = useState(user?.nickname ?? '');
  const [nickMessage, setNickMessage] = useState<string | null>(null);
  const [nickOk, setNickOk] = useState(false);
  const [savingNick, setSavingNick] = useState(false);

  const [emailLocal, setEmailLocal] = useState(() => splitEmail(user?.email ?? '').local);
  const [emailDomain, setEmailDomain] = useState(() => splitEmail(user?.email ?? '').domain);
  const [domainCustom, setDomainCustom] = useState(() => splitEmail(user?.email ?? '').custom);
  const [domainOpen, setDomainOpen] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [emailAwaitingCode, setEmailAwaitingCode] = useState(false);
  const [emailExpiresAt, setEmailExpiresAt] = useState<number | null>(null);
  const [emailRemainSec, setEmailRemainSec] = useState(0);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [emailHintOk, setEmailHintOk] = useState(false);

  const emailDraft = `${emailLocal.trim()}@${emailDomain.trim().toLowerCase()}`;
  const profileDirty =
    !!user &&
    (nicknameDraft.trim() !== user.nickname ||
      emailDraft !== user.email.trim().toLowerCase() ||
      emailAwaitingCode ||
      emailCode.trim().length > 0);
  useUnsavedGuard(profileDirty);

  const resetEmailVerifyUi = () => {
    setEmailAwaitingCode(false);
    setEmailCode('');
    setEmailExpiresAt(null);
    setEmailRemainSec(0);
    setEmailHint(null);
  };

  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [dialogReady, setDialogReady] = useState(true);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    setNicknameDraft(user?.nickname ?? '');
  }, [user?.nickname]);

  useEffect(() => {
    const parts = splitEmail(user?.email ?? '');
    setEmailLocal(parts.local);
    setEmailDomain(parts.domain);
    setDomainCustom(parts.custom);
    setDomainOpen(false);
    resetEmailVerifyUi();
  }, [user?.email, user?.emailVerified]);

  useEffect(() => {
    if (!emailAwaitingCode || !emailExpiresAt) {
      setEmailRemainSec(0);
      return;
    }
    const tick = () => {
      const remain = Math.max(0, Math.ceil((emailExpiresAt - Date.now()) / 1000));
      setEmailRemainSec(remain);
      if (remain <= 0) {
        setEmailHint('인증번호가 만료됐어요. 다시 요청해 주세요.');
        setEmailHintOk(false);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [emailAwaitingCode, emailExpiresAt]);

  const countdownUrgent =
    emailAwaitingCode && emailRemainSec > 0 && emailRemainSec <= 60;

  const countdownBlink = useSharedValue(1);
  useEffect(() => {
    if (!countdownUrgent) {
      cancelAnimation(countdownBlink);
      countdownBlink.value = 1;
      return;
    }
    countdownBlink.value = withRepeat(
      withTiming(0.28, { duration: 450, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(countdownBlink);
      countdownBlink.value = 1;
    };
  }, [countdownBlink, countdownUrgent]);

  const countdownBlinkStyle = useAnimatedStyle(() => ({
    opacity: countdownBlink.value,
  }));

  useEffect(() => {
    if (!dialog) {
      setDialogReady(true);
      return;
    }
    // 확인/결과로 내용이 바뀔 때 같은 위치 버튼이 바로 눌리지 않도록 잠깐 잠금
    setDialogReady(false);
    const t = setTimeout(() => setDialogReady(true), 380);
    return () => clearTimeout(t);
  }, [dialog]);

  const showAlert = (message: string, warn = false) => {
    setDialog({ kind: 'alert', message, warn });
  };

  const closeDialog = () => {
    if (!dialogReady) return;
    setDialog(null);
  };

  useEffect(() => {
    if (!user) return;
    const trimmed = nicknameDraft.trim();
    if (!trimmed || trimmed === user.nickname) {
      setNickMessage(null);
      setNickOk(false);
      return;
    }
    const t = setTimeout(() => {
      const check = checkNicknameAvailable(nicknameDraft, user.id);
      if (check.ok) {
        setNickMessage('사용 가능한 닉네임이에요.');
        setNickOk(true);
      } else {
        setNickMessage(check.message);
        setNickOk(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [nicknameDraft, user, checkNicknameAvailable]);

  const providerText = useMemo(
    () => (user ? user.providers.map((p) => providerLabel(p)).join(' · ') : ''),
    [user],
  );

  if (!user) {
    return (
      <SoftBackground>
        <View style={[styles.center, { paddingTop: spacing.lg }]}>
          <Text style={styles.empty}>로그인이 필요해요</Text>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.link}>로그인으로</Text>
          </Pressable>
        </View>
      </SoftBackground>
    );
  }

  const onSaveNickname = async () => {
    setSavingNick(true);
    const err = await updateNickname(nicknameDraft);
    setSavingNick(false);
    if (err) {
      setNickMessage(err);
      setNickOk(false);
      return;
    }
    setNickMessage('닉네임을 저장했어요.');
    setNickOk(true);
  };

  const onRequestEmailCode = async () => {
    if (emailAwaitingCode && emailRemainSec > 0) {
      showAlert('이메일을 확인해 주세요.');
      return;
    }
    setEmailBusy(true);
    setEmailHint(null);
    const result = await requestEmailVerification(emailDraft);
    setEmailBusy(false);
    if (!result.ok) {
      setEmailHint(result.message);
      setEmailHintOk(false);
      setEmailAwaitingCode(false);
      setEmailExpiresAt(null);
      return;
    }
    setEmailAwaitingCode(true);
    setEmailCode('');
    setEmailExpiresAt(result.expiresAt);
    setEmailHint('영문·숫자 포함 6자리 인증번호를 입력해 주세요.');
    setEmailHintOk(true);
    showAlert(
      `인증 메일을 보냈어요.\n\n프로토타입 인증번호: ${result.demoCode}`,
    );
  };

  const onConfirmEmailCode = async () => {
    if (emailRemainSec <= 0) {
      setEmailHint('인증번호가 만료됐어요. 다시 요청해 주세요.');
      setEmailHintOk(false);
      return;
    }
    if (!emailCode.trim()) {
      setEmailHint('인증번호를 입력해 주세요.');
      setEmailHintOk(false);
      return;
    }
    setEmailBusy(true);
    const err = await confirmEmailVerification(emailCode);
    setEmailBusy(false);
    if (err) {
      setEmailHint(err);
      setEmailHintOk(false);
      return;
    }
    setEmailAwaitingCode(false);
    setEmailCode('');
    setEmailExpiresAt(null);
    setEmailHint('이메일이 인증·등록됐어요.');
    setEmailHintOk(true);
    showAlert('이메일 인증이 완료됐어요!');
  };

  const onLink = async (provider: OAuthProvider) => {
    setDialog(null);
    setBusy(provider);
    try {
      const result = await requestLinkProvider(provider);
      if (result.status === 'already_linked') {
        showAlert(`이미 ${providerLabel(provider)}가 연결되어 있어요.`);
        return;
      }
      if (result.status === 'error') {
        showAlert(result.message, true);
        return;
      }
      if (result.status === 'linked') {
        showAlert(
          result.autoMerged
            ? `${providerLabel(provider)}가 같은 이메일로 자동 연결됐어요.`
            : `${providerLabel(provider)} 연결 완료!`,
        );
        return;
      }
      setDialog({ kind: 'confirmLink', provider, profile: result.profile });
    } catch {
      showAlert('계정 연결 중 오류가 났어요.', true);
    } finally {
      setBusy(null);
    }
  };

  const onConfirmLink = async () => {
    if (!dialog || dialog.kind !== 'confirmLink' || !dialogReady) return;
    const { provider, profile } = dialog;
    setBusy(provider);
    try {
      const err = await confirmLinkProvider(profile);
      showAlert(err ?? `${providerLabel(provider)} 연결 완료!`, !!err);
    } finally {
      setBusy(null);
    }
  };

  const onUnlinkPress = (provider: SocialProvider) => {
    setDialog(null);
    if (user.providers.length <= 1) {
      showAlert('마지막 로그인 수단은 해제할 수 없어요. 다른 수단을 먼저 연결해 주세요.', true);
      return;
    }
    setDialog({ kind: 'confirmUnlink', provider });
  };

  const onConfirmUnlink = async () => {
    if (!dialog || dialog.kind !== 'confirmUnlink' || !dialogReady) return;
    const provider = dialog.provider;
    setBusy(provider);
    try {
      const err = await unlinkProvider(provider);
      showAlert(err ?? `${providerLabel(provider)} 연결을 해제했어요.`, !!err);
    } finally {
      setBusy(null);
    }
  };

  const canSaveNick =
    nicknameDraft.trim().length >= 2 &&
    nicknameDraft.trim() !== user.nickname &&
    nickOk;

  const emailChanged =
    emailDraft.toLowerCase() !== user.email.toLowerCase() || !user.emailVerified;
  const emailCooldownActive = emailAwaitingCode && emailRemainSec > 0;
  const canSendEmail =
    emailLocal.trim().length > 0 &&
    emailDomain.trim().length > 0 &&
    emailChanged &&
    !emailBusy;
  // 유효시간 중에는 눌러도 알림만 띄우므로 disabled 처리하지 않음
  const verifyBtnDisabled = !canSendEmail && !emailCooldownActive;
  const verifyBtnDimmed = !canSendEmail || emailCooldownActive;

  const emailCountdown =
    emailRemainSec > 0
      ? `${String(Math.floor(emailRemainSec / 60)).padStart(2, '0')}:${String(
          emailRemainSec % 60,
        ).padStart(2, '0')}`
      : '00:00';

  const greeting = getTimeGreeting(user.nickname);

  return (
    <SoftBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: spacing.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MenuHeader title="프로필" caption="닉네임 · 이메일 · 계정 연결" />

        <Text style={styles.title}>{greeting.title}</Text>
        <Text style={styles.titleEn}>{greeting.en}</Text>
        <Text style={styles.desc}>
          로그인은 소셜 계정으로, 연락용 이메일은 따로 인증해 등록할 수 있어요.
        </Text>

        <View style={styles.card}>
          <SectionTitle title="기본 정보" en="Basic info" />
          <FieldTitle title="닉네임" en="Nickname" />
          <View style={styles.nickRow}>
            <TextInput
              value={nicknameDraft}
              onChangeText={setNicknameDraft}
              placeholder="닉네임"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              maxLength={12}
              autoCapitalize="none"
            />
            <Pressable
              onPress={onSaveNickname}
              disabled={!canSaveNick || savingNick}
              style={[styles.saveBtn, (!canSaveNick || savingNick) && styles.saveBtnDisabled]}
            >
              {savingNick ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveBtnText}>저장</Text>
              )}
            </Pressable>
          </View>
          {nickMessage ? (
            <Text style={[styles.hint, nickOk ? styles.hintOk : styles.hintWarn]}>
              {nickMessage}
            </Text>
          ) : (
            <Text style={styles.hint}>2~12자 · 다른 회원과 겹치면 안 돼요</Text>
          )}

          <FieldTitle title="이메일" en="Email" style={{ marginTop: spacing.md }} />
          <View style={styles.emailComposeRow}>
            <TextInput
              value={emailLocal}
              onChangeText={(t) => {
                setEmailLocal(t.replace(/@/g, ''));
                resetEmailVerifyUi();
              }}
              placeholder="아이디"
              placeholderTextColor={colors.inkMuted}
              style={[styles.input, styles.emailLocalInput]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.emailAt}>@</Text>
            {domainCustom ? (
              <TextInput
                value={emailDomain}
                onChangeText={(t) => {
                  setEmailDomain(t.replace(/@/g, '').replace(/\s/g, ''));
                  resetEmailVerifyUi();
                }}
                placeholder="직접 입력"
                placeholderTextColor={colors.inkMuted}
                style={[styles.input, styles.emailDomainInput]}
                autoCapitalize="none"
                autoCorrect={false}
              />
            ) : null}
            <Pressable
              onPress={() => setDomainOpen((v) => !v)}
              style={[
                styles.domainSelect,
                domainCustom && styles.domainSelectCompact,
                domainOpen && styles.domainSelectOpen,
              ]}
            >
              <Text style={styles.domainSelectText} numberOfLines={1}>
                {domainCustom ? DOMAIN_CUSTOM : emailDomain}
              </Text>
              <Text style={styles.domainCaret}>{domainOpen ? '▲' : '▼'}</Text>
            </Pressable>
            <Pressable
              onPress={onRequestEmailCode}
              disabled={verifyBtnDisabled}
              style={[styles.verifyBtn, verifyBtnDimmed && styles.saveBtnDisabled]}
            >
              {emailBusy && !emailAwaitingCode ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveBtnText}>
                  {emailAwaitingCode ? '재전송' : '인증 요청'}
                </Text>
              )}
            </Pressable>
          </View>
          {domainOpen ? (
            <View style={styles.domainMenu}>
              {EMAIL_DOMAINS.map((domain) => {
                const selected = !domainCustom && domain === emailDomain;
                return (
                  <Pressable
                    key={domain}
                    onPress={() => {
                      setDomainCustom(false);
                      setEmailDomain(domain);
                      setDomainOpen(false);
                      resetEmailVerifyUi();
                    }}
                    style={[styles.domainOption, selected && styles.domainOptionSelected]}
                  >
                    <Text
                      style={[
                        styles.domainOptionText,
                        selected && styles.domainOptionTextSelected,
                      ]}
                    >
                      {domain}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => {
                  setDomainCustom(true);
                  setEmailDomain('');
                  setDomainOpen(false);
                  resetEmailVerifyUi();
                }}
                style={[styles.domainOption, domainCustom && styles.domainOptionSelected]}
              >
                <Text
                  style={[
                    styles.domainOptionText,
                    domainCustom && styles.domainOptionTextSelected,
                  ]}
                >
                  {DOMAIN_CUSTOM}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.emailStatusRow}>
            <View
              style={[
                styles.emailBadge,
                user.emailVerified ? styles.emailBadgeOk : styles.emailBadgeWarn,
              ]}
            >
              <Text
                style={[
                  styles.emailBadgeText,
                  user.emailVerified ? styles.emailBadgeTextOk : styles.emailBadgeTextWarn,
                ]}
              >
                {user.emailVerified ? '인증됨' : '미인증'}
              </Text>
            </View>
            <Text style={styles.emailStatusHint} numberOfLines={1}>
              소셜 로그인 메일과 달라도 돼요
            </Text>
          </View>

          {emailAwaitingCode ? (
            <View style={styles.codeBlock}>
              <FieldTitle title="인증번호 6자리 (영문·숫자)" en="Verification code" />
              <View style={styles.codeRow}>
                <TextInput
                  value={emailCode}
                  onChangeText={(t) => setEmailCode(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                  placeholder="A1B2C3"
                  placeholderTextColor={colors.inkMuted}
                  style={[styles.input, styles.codeInput]}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                />
                <Animated.Text
                  style={[
                    styles.countdown,
                    countdownUrgent ? styles.countdownWarn : null,
                    countdownUrgent ? countdownBlinkStyle : null,
                  ]}
                >
                  {emailCountdown}
                </Animated.Text>
                <Pressable
                  onPress={onConfirmEmailCode}
                  disabled={
                    emailBusy || emailCode.trim().length < 6 || emailRemainSec <= 0
                  }
                  style={[
                    styles.saveBtn,
                    (emailBusy || emailCode.trim().length < 6 || emailRemainSec <= 0) &&
                      styles.saveBtnDisabled,
                  ]}
                >
                  {emailBusy ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.saveBtnText}>확인</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : null}

          {emailHint ? (
            <Text style={[styles.hint, emailHintOk ? styles.hintOk : styles.hintWarn]}>
              {emailHint}
            </Text>
          ) : (
            <Text style={styles.hint}>
              인증 후 등록 · 유효시간 1분(테스트) · 프로토타입에서는 인증번호가 알림으로 표시돼요
            </Text>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoLabelWrap}>
              <Text style={styles.infoLabel}>최초 가입일</Text>
              <Text style={styles.infoLabelEn}>Joined on</Text>
            </View>
            <Text style={styles.infoValue}>{formatJoinedAt(user.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLabelWrap}>
              <Text style={styles.infoLabel}>연결된 로그인</Text>
              <Text style={styles.infoLabelEn}>Linked logins</Text>
            </View>
            <Text style={styles.infoValue}>{providerText}</Text>
          </View>
        </View>

        <SectionTitle title="계정 연결" en="Account linking" outside />
        {user.providers.includes('email') &&
        !user.providers.some((p) => p === 'kakao' || p === 'google' || p === 'apple') ? (
          <Text style={styles.sectionHint}>
            이메일 회원은 간편로그인과 별도예요. 카카오·Google 연결은 소셜 계정에서만 가능해요.
          </Text>
        ) : (
          <>
            <Text style={styles.sectionHint}>
              간편로그인 계정끼리만 연결할 수 있어요. 이메일 회원가입과는 합쳐지지 않아요.
            </Text>

            {PROVIDERS.map((provider) => {
              const linked = user.providers.includes(provider);
              const email = user.emailsByProvider[provider];
              const canUnlink = user.providers.length > 1;
              const badgeLabel =
                provider === 'kakao' ? 'K' : provider === 'google' ? 'G' : '';
              const enLabel =
                provider === 'kakao' ? 'Kakao' : 'Google';
              return (
                <View key={provider} style={styles.providerCard}>
                  <View style={styles.providerRow}>
                    <View
                      style={[
                        styles.badge,
                        provider === 'kakao' ? styles.badgeKakao : styles.badgeGoogle,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          provider === 'kakao' ? styles.badgeTextKakao : null,
                        ]}
                      >
                        {badgeLabel}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.providerName}>{providerLabel(provider)}</Text>
                      <Text style={styles.labelEn}>{enLabel}</Text>
                      <Text style={styles.providerMeta}>
                        {linked ? `연결됨 · ${email}` : '아직 연결되지 않음'}
                      </Text>
                    </View>
                    {busy === provider ? (
                      <ActivityIndicator color={colors.peach} />
                    ) : linked ? (
                      <Pressable
                        onPress={() => onUnlinkPress(provider)}
                        style={[styles.unlinkBtn, !canUnlink && styles.btnDisabled]}
                      >
                        <Text style={[styles.unlinkText, !canUnlink && styles.btnDisabledText]}>
                          해제
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable onPress={() => onLink(provider)} style={styles.linkBtn}>
                        <Text style={styles.linkBtnText}>연결</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}

        <SectionTitle title="앱 색상" en="Theme colors" outside />
        <Text style={styles.sectionHint}>마음에 드는 팔레트를 고르면 앱 전체에 바로 적용돼요.</Text>
        <View style={styles.themeList}>
          {themes.map((item) => {
            const active = themeId === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  void setThemeId(item.id as ThemeId);
                }}
                style={({ pressed }) => [
                  styles.themeCard,
                  active && {
                    borderColor: themeColors.peach,
                    backgroundColor: themeColors.peachSoft,
                  },
                  pressed && { opacity: 0.9 },
                ]}
              >
                <View style={styles.themeSwatches}>
                  {item.swatches.map((hex) => (
                    <View key={hex} style={[styles.themeDot, { backgroundColor: hex }]} />
                  ))}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.themeName,
                      active && { color: themeColors.peach },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={styles.themeCaption}>{item.caption}</Text>
                </View>
                {active ? (
                  <View style={[styles.themeCheck, { backgroundColor: themeColors.peach }]}>
                    <Ionicons name="checkmark" size={14} color={themeColors.white} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.withdrawSection,
            { borderColor: themeColors.dangerLine },
          ]}
        >
          <Text style={[styles.withdrawTitle, { color: themeColors.danger }]}>회원 탈퇴</Text>
          <Text style={styles.withdrawHint}>
            탈퇴하면 이 기기에 저장된 계정과 스터디 기록이 삭제되고, 로그인 화면으로 돌아가요.
          </Text>
          <Pressable
            onPress={() => setConfirmWithdraw(true)}
            disabled={withdrawing}
            style={({ pressed }) => [
              styles.withdrawBtn,
              {
                backgroundColor: themeColors.dangerSoft,
                borderColor: themeColors.dangerLine,
              },
              (pressed || withdrawing) && { opacity: 0.85 },
            ]}
          >
            {withdrawing ? (
              <ActivityIndicator color={themeColors.danger} />
            ) : (
              <Text style={[styles.withdrawBtnText, { color: themeColors.danger }]}>
                회원 탈퇴하기
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmWithdraw}
        title="회원 탈퇴"
        body="정말 탈퇴할까요? 계정 정보와 스터디 가입·출석·과제 기록이 삭제되며 되돌릴 수 없어요."
        confirmLabel="탈퇴하기"
        onCancel={() => setConfirmWithdraw(false)}
        onConfirm={() => {
          setConfirmWithdraw(false);
          setWithdrawing(true);
          void deleteAccount().then((err) => {
            setWithdrawing(false);
            if (err) {
              setDialog({ kind: 'alert', message: err, warn: true });
              return;
            }
            allowNextLeave();
            router.replace('/(auth)/login');
            consumeLeave();
          });
        }}
      />

      <Modal
        visible={!!dialog}
        transparent
        animationType="fade"
        onRequestClose={closeDialog}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} pointerEvents={dialogReady ? 'auto' : 'none'}>
            {dialog?.kind === 'confirmLink' ? (
              <>
                <Text style={styles.confirmTitle}>
                  {providerLabel(dialog.provider)} 연결 확인
                </Text>
                <Text style={styles.confirmBody}>
                  {providerLabel(dialog.provider)} 이메일({dialog.profile.email})이 현재
                  계정({user.email})과 달라요. 그래도 이 계정에 연결할까요?
                </Text>
                <View style={styles.confirmActions}>
                  <Pressable onPress={closeDialog} style={styles.modalCancel}>
                    <Text style={styles.modalCancelText}>취소</Text>
                  </Pressable>
                  <Pressable
                    onPress={onConfirmLink}
                    style={[styles.modalOk, busy ? styles.btnDisabled : null]}
                    disabled={!!busy}
                  >
                    {busy ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.modalOkText}>연결하기</Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : null}

            {dialog?.kind === 'confirmUnlink' ? (
              <>
                <Text style={styles.confirmTitle}>
                  {providerLabel(dialog.provider)} 연결 해제
                </Text>
                <Text style={styles.confirmBody}>
                  {providerLabel(dialog.provider)} 로그인을 이 계정에서 해제할까요?
                </Text>
                <View style={styles.confirmActions}>
                  <Pressable onPress={closeDialog} style={styles.modalCancel}>
                    <Text style={styles.modalCancelText}>취소</Text>
                  </Pressable>
                  <Pressable
                    onPress={onConfirmUnlink}
                    style={[styles.modalOk, styles.modalOkDanger, busy ? styles.btnDisabled : null]}
                    disabled={!!busy}
                  >
                    {busy ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.modalOkText}>해제</Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : null}

            {dialog?.kind === 'alert' ? (
              <>
                <Text style={styles.confirmTitle}>알림</Text>
                <Text
                  style={[styles.confirmBody, dialog.warn ? styles.messageWarn : null]}
                >
                  {dialog.message}
                </Text>
                <View style={styles.confirmActions}>
                  <Pressable
                    onPress={closeDialog}
                    style={[styles.modalOk, !dialogReady ? styles.btnDisabled : null]}
                    disabled={!dialogReady}
                  >
                    <Text style={styles.modalOkText}>확인</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SoftBackground>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  link: {
    marginTop: 8,
    fontFamily: fonts.bold,
    color: colors.mint,
  },
  back: {
    marginBottom: spacing.md,
  },
  backText: {
    fontFamily: fonts.bold,
    color: colors.inkMuted,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: colors.ink,
    marginBottom: 2,
    lineHeight: 32,
  },
  titleEn: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginBottom: 8,
  },
  desc: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.lg,
  },
  sectionWrap: {
    marginBottom: spacing.md,
  },
  sectionOutsideWrap: {
    marginBottom: 4,
  },
  section: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: colors.ink,
  },
  sectionOutside: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: colors.ink,
  },
  sectionHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
  },
  fieldTitleWrap: {
    marginBottom: 6,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.inkMuted,
  },
  labelEn: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: '#A89B94',
    marginTop: 1,
  },
  nickRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
  },
  saveBtn: {
    backgroundColor: colors.peach,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 64,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
  },
  verifyBtn: {
    backgroundColor: colors.mint,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 88,
    alignItems: 'center',
  },
  emailComposeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emailLocalInput: {
    flex: 1.1,
    minWidth: 0,
  },
  emailDomainInput: {
    flex: 1.2,
    minWidth: 0,
  },
  emailAt: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.inkMuted,
  },
  domainSelect: {
    flex: 1.2,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  domainSelectCompact: {
    flex: 0,
    minWidth: 92,
    maxWidth: 108,
  },
  domainSelectOpen: {
    borderColor: colors.mint,
  },
  domainSelectText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  domainCaret: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.inkMuted,
  },
  domainMenu: {
    marginTop: 6,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  domainOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  domainOptionSelected: {
    backgroundColor: colors.mintSoft,
  },
  domainOptionText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  domainOptionTextSelected: {
    fontFamily: fonts.bold,
    color: colors.mint,
  },
  emailStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  emailBadge: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  emailBadgeOk: {
    backgroundColor: colors.mintSoft,
  },
  emailBadgeWarn: {
    backgroundColor: colors.peachSoft,
  },
  emailBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  emailBadgeTextOk: {
    color: colors.mint,
  },
  emailBadgeTextWarn: {
    color: colors.peach,
  },
  emailStatusHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    flexShrink: 1,
  },
  codeBlock: {
    marginTop: spacing.sm,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeInput: {
    flex: 1,
    minWidth: 0,
  },
  countdown: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: '#E86B8A',
    minWidth: 48,
    textAlign: 'center',
  },
  countdownWarn: {
    color: '#C2185B',
    fontSize: 15,
  },
  hint: {
    marginTop: 6,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
  },
  hintOk: {
    color: colors.mint,
  },
  hintWarn: {
    color: '#D6453D',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  infoLabelWrap: {
    flexShrink: 1,
  },
  infoLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  infoLabelEn: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: '#A89B94',
    marginTop: 1,
  },
  infoValue: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
  providerCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.sm,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeKakao: {
    backgroundColor: '#FEE500',
  },
  badgeGoogle: {
    backgroundColor: '#E8F0FE',
  },
  badgeApple: {
    backgroundColor: '#111111',
  },
  badgeText: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: '#4285F4',
  },
  badgeTextKakao: {
    color: '#191600',
  },
  providerName: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  providerMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  linkBtn: {
    backgroundColor: colors.mint,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  linkBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
  unlinkBtn: {
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FDE8E6',
    borderWidth: 1,
    borderColor: '#F5B7B1',
  },
  unlinkText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#D6453D',
  },
  themeList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  themeSwatches: {
    flexDirection: 'row',
    gap: 4,
  },
  themeDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  themeName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  themeCaption: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 2,
  },
  themeCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawSection: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    gap: spacing.sm,
  },
  withdrawTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  withdrawHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    lineHeight: 18,
  },
  withdrawBtn: {
    marginTop: 4,
    minHeight: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  withdrawBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnDisabledText: {
    color: '#A86B66',
  },
  confirmTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmBody: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.inkMuted,
    lineHeight: 22,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(47, 42, 40, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    zIndex: 2,
  },
  modalCancel: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.creamDeep,
    minWidth: 88,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.inkMuted,
  },
  modalOk: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
    minWidth: 88,
    alignItems: 'center',
  },
  modalOkDanger: {
    backgroundColor: '#D6453D',
  },
  modalOkText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
  },
  messageWarn: {
    color: '#D6453D',
  },
});
