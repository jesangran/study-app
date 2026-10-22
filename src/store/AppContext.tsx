/**
 * StudyBuddy 앱 전역 상태 (AsyncStorage studybuddy.v4)
 *
 * 섹션 안내
 * 1. hydrate / persist
 * 2. 세션 · 계정
 * 3. 인증 (소셜 · 이메일 · 프로필 연결)
 * 4. 스터디 멤버십 · 생성 · 관리
 * 5. 알림함
 * 6. 스터디장 위임
 * 7. 일정 · 공지 · 과제 · 출석
 * 8. 파생 뷰 · Provider value
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  makeUserId,
  mockSocialSignIn,
  normalizeEmail,
  OAuthProvider,
  SocialProfile,
  SocialProvider,
} from '@/src/auth/social';
import {
  Assignment,
  AssignmentSubmission,
  MOCK_ASSIGNMENTS,
  MOCK_ATTENDANCE,
  MOCK_NOTICES,
  MOCK_SCHEDULE,
  MOCK_STUDIES,
  Notice,
  ScheduleItem,
  Study,
} from '@/src/data/mock';
import {
  AppNotification,
  MOCK_NOTIFICATIONS,
  NOTIFICATION_SEED_VERSION,
  NotificationKind,
  purgeExpiredNotifications,
  unreadNotificationCount as countUnreadNotifications,
} from '@/src/data/notifications';
import {
  accountOwnsEmail,
  findAccountByEmail,
  isEmailAccount,
  isReservedNickname,
  isSocialAccount,
  makeEmailVerifyCode,
  migrateUser,
  normalizeAssignmentSubmitMode,
  normalizeNickname,
  toLastLogin,
  withLinkedProvider,
} from '@/src/store/authHelpers';
import { EMAIL_CODE_TTL_MS, EMAIL_RE, STORAGE_KEY } from '@/src/store/constants';
import type {
  AppContextValue,
  EmailCheckResult,
  EmailRequestResult,
  LastLogin,
  LeadOffer,
  LinkProviderResult,
  NicknameCheckResult,
  PendingEmailAuth,
  PendingEmailVerification,
  PersistedState,
  SocialLoginResult,
  User,
} from '@/src/store/types';
import { normalizeScheduleItem } from '@/src/utils/schedulePlace';
import {
  findStudyById,
  normalizeStudy,
  syncRuntimeStudies,
  validateInviteCode,
} from '@/src/utils/study';
import {
  mergeAssignments,
  mergeNotices,
  mergeSchedules,
  todayYmd,
  validateAssignmentDraft,
  validateAssignmentFile,
  validateAssignmentMemo,
  validateNoticeDraft,
  validateScheduleDraft,
} from '@/src/utils/studyRhythm';

export type {
  EmailCheckResult,
  EmailRequestResult,
  LastLogin,
  LeadOffer,
  LinkProviderResult,
  NicknameCheckResult,
  SocialLoginResult,
  User,
} from '@/src/store/types';

function normalizeAssignment(
  raw: Assignment | (Omit<Assignment, 'submitMode'> & { submitMode?: Assignment['submitMode'] }),
): Assignment {
  return {
    ...raw,
    submitMode: normalizeAssignmentSubmitMode(raw),
  };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<User[]>([]);
  const [pendingSocial, setPendingSocial] = useState<SocialProfile | null>(null);
  const [autoLogin, setAutoLoginState] = useState(true);
  const [lastLogin, setLastLogin] = useState<LastLogin | null>(null);
  const [joinedStudyIds, setJoinedStudyIds] = useState<string[]>([]);
  const [adminStudyIds, setAdminStudyIds] = useState<string[]>([]);
  const [attendedIds, setAttendedIds] = useState<string[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<
    Record<string, AssignmentSubmission>
  >({});
  const [customSchedules, setCustomSchedules] = useState<ScheduleItem[]>([]);
  const [scheduleEdits, setScheduleEdits] = useState<Record<string, ScheduleItem>>({});
  const [deletedScheduleIds, setDeletedScheduleIds] = useState<string[]>([]);
  const [customNotices, setCustomNotices] = useState<Notice[]>([]);
  const [noticeEdits, setNoticeEdits] = useState<Record<string, Notice>>({});
  const [deletedNoticeIds, setDeletedNoticeIds] = useState<string[]>([]);
  const [customAssignments, setCustomAssignments] = useState<Assignment[]>([]);
  const [assignmentEdits, setAssignmentEdits] = useState<Record<string, Assignment>>({});
  const [deletedAssignmentIds, setDeletedAssignmentIds] = useState<string[]>([]);
  const [customStudies, setCustomStudies] = useState<Study[]>([]);
  const [studyEdits, setStudyEdits] = useState<Record<string, Partial<Study>>>({});
  const [deletedStudyIds, setDeletedStudyIds] = useState<string[]>([]);
  const [leadOffers, setLeadOffers] = useState<LeadOffer[]>([]);
  const [studyLeads, setStudyLeads] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [notificationSeedVersion, setNotificationSeedVersion] = useState(NOTIFICATION_SEED_VERSION);
  const [pendingEmail, setPendingEmail] = useState<PendingEmailVerification | null>(null);
  const [pendingEmailAuth, setPendingEmailAuth] = useState<PendingEmailAuth | null>(null);

  const stateRef = useRef<PersistedState>({
    user: null,
    accounts: [],
    autoLogin: true,
    lastLogin: null,
    joinedStudyIds: [],
    adminStudyIds: [],
    attendedIds: [],
    submittedAssignmentIds: [],
    assignmentSubmissions: {},
    customSchedules: [],
    scheduleEdits: {},
    deletedScheduleIds: [],
    customNotices: [],
    noticeEdits: {},
    deletedNoticeIds: [],
    customAssignments: [],
    assignmentEdits: {},
    deletedAssignmentIds: [],
    customStudies: [],
    studyEdits: {},
    deletedStudyIds: [],
    leadOffers: [],
    studyLeads: {},
    notifications: MOCK_NOTIFICATIONS,
    notificationSeedVersion: NOTIFICATION_SEED_VERSION,
  });

  useEffect(() => {
    stateRef.current = {
      user,
      accounts,
      autoLogin,
      lastLogin,
      joinedStudyIds,
      adminStudyIds,
      attendedIds,
      submittedAssignmentIds: Object.keys(assignmentSubmissions),
      assignmentSubmissions,
      customSchedules,
      scheduleEdits,
      deletedScheduleIds,
      customNotices,
      noticeEdits,
      deletedNoticeIds,
      customAssignments,
      assignmentEdits,
      deletedAssignmentIds,
      customStudies,
      studyEdits,
      deletedStudyIds,
      leadOffers,
      studyLeads,
      notifications,
      notificationSeedVersion,
    };
  }, [
    user,
    accounts,
    autoLogin,
    lastLogin,
    joinedStudyIds,
    adminStudyIds,
    attendedIds,
    assignmentSubmissions,
    customSchedules,
    scheduleEdits,
    deletedScheduleIds,
    customNotices,
    noticeEdits,
    deletedNoticeIds,
    customAssignments,
    assignmentEdits,
    deletedAssignmentIds,
    customStudies,
    studyEdits,
    deletedStudyIds,
    leadOffers,
    studyLeads,
    notifications,
    notificationSeedVersion,
  ]);

  useEffect(() => {
    syncRuntimeStudies(customStudies, studyEdits, deletedStudyIds);
  }, [customStudies, studyEdits, deletedStudyIds]);


  // ——— 1. hydrate / persist ———
  const persist = useCallback(async (overrides: Partial<PersistedState> = {}) => {
    const next = { ...stateRef.current, ...overrides };
    stateRef.current = next;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // v1 → v2 마이그레이션
        const rawV2 = await AsyncStorage.getItem(STORAGE_KEY);
        const rawV1 = !rawV2 ? await AsyncStorage.getItem('studybuddy.v1') : null;
        const raw = rawV2 ?? rawV1;
        if (raw) {
          const parsed = JSON.parse(raw) as PersistedState & { user?: any };
          const enabled = parsed.autoLogin ?? true;
          setAutoLoginState(enabled);

          const migratedAccounts = (parsed.accounts ?? [])
            .map(migrateUser)
            .filter(Boolean) as User[];
          const migratedUser = migrateUser(parsed.user);
          let nextAccounts = migratedAccounts;
          if (migratedUser && !nextAccounts.some((a) => a.id === migratedUser.id)) {
            nextAccounts = [...nextAccounts, migratedUser];
          }
          // lastLogin 이메일로도 계정 복원 가능하도록
          setAccounts(nextAccounts);
          setLastLogin(parsed.lastLogin ?? null);
          setJoinedStudyIds(parsed.joinedStudyIds ?? []);
          setAdminStudyIds(parsed.adminStudyIds ?? []);
          setAttendedIds(parsed.attendedIds ?? []);
          const restoredSubs: Record<string, AssignmentSubmission> = {
            ...(parsed.assignmentSubmissions ?? {}),
          };
          for (const id of parsed.submittedAssignmentIds ?? []) {
            if (!restoredSubs[id]) {
              restoredSubs[id] = {
                assignmentId: id,
                mode: 'memo',
                memo: '(이전 제출)',
                submittedAt: todayYmd(),
              };
            }
          }
          setAssignmentSubmissions(restoredSubs);
          setCustomSchedules(
            (parsed.customSchedules ?? []).map((item) => normalizeScheduleItem(item)),
          );
          const restoredEdits = Object.fromEntries(
            Object.entries(parsed.scheduleEdits ?? {}).map(([id, item]) => [
              id,
              normalizeScheduleItem(item),
            ]),
          );
          setScheduleEdits(restoredEdits);
          setDeletedScheduleIds(parsed.deletedScheduleIds ?? []);
          setCustomNotices(parsed.customNotices ?? []);
          setNoticeEdits(parsed.noticeEdits ?? {});
          setDeletedNoticeIds(parsed.deletedNoticeIds ?? []);
          setCustomAssignments((parsed.customAssignments ?? []).map(normalizeAssignment));
          setAssignmentEdits(
            Object.fromEntries(
              Object.entries(parsed.assignmentEdits ?? {}).map(([id, item]) => [
                id,
                normalizeAssignment(item),
              ]),
            ),
          );
          setDeletedAssignmentIds(parsed.deletedAssignmentIds ?? []);
          const restoredStudies = (parsed.customStudies ?? []).map((s) =>
            normalizeStudy(s as Study),
          );
          setCustomStudies(restoredStudies);
          const restoredStudyEdits = (parsed.studyEdits ?? {}) as Record<string, Partial<Study>>;
          setStudyEdits(restoredStudyEdits);
          setDeletedStudyIds(parsed.deletedStudyIds ?? []);
          setLeadOffers(parsed.leadOffers ?? []);
          setStudyLeads(parsed.studyLeads ?? {});
          const seedOk = parsed.notificationSeedVersion === NOTIFICATION_SEED_VERSION;
          const restoredNotifications = purgeExpiredNotifications(
            seedOk && Array.isArray(parsed.notifications) && parsed.notifications.length > 0
              ? parsed.notifications
              : MOCK_NOTIFICATIONS,
          );
          setNotifications(restoredNotifications);
          setNotificationSeedVersion(NOTIFICATION_SEED_VERSION);
          syncRuntimeStudies(
            restoredStudies,
            restoredStudyEdits,
            parsed.deletedStudyIds ?? [],
          );

          if (enabled && migratedUser) {
            setUser(migratedUser);
          } else {
            setUser(null);
          }

          const restored: PersistedState = {
            user: enabled ? migratedUser : null,
            accounts: nextAccounts,
            autoLogin: enabled,
            lastLogin: parsed.lastLogin ?? null,
            joinedStudyIds: parsed.joinedStudyIds ?? [],
            adminStudyIds: parsed.adminStudyIds ?? [],
            attendedIds: parsed.attendedIds ?? [],
            submittedAssignmentIds: Object.keys(restoredSubs),
            assignmentSubmissions: restoredSubs,
            customSchedules: (parsed.customSchedules ?? []).map((item) =>
              normalizeScheduleItem(item),
            ),
            scheduleEdits: restoredEdits,
            deletedScheduleIds: parsed.deletedScheduleIds ?? [],
            customNotices: parsed.customNotices ?? [],
            noticeEdits: parsed.noticeEdits ?? {},
            deletedNoticeIds: parsed.deletedNoticeIds ?? [],
            customAssignments: (parsed.customAssignments ?? []).map(normalizeAssignment),
            assignmentEdits: Object.fromEntries(
              Object.entries(parsed.assignmentEdits ?? {}).map(([id, item]) => [
                id,
                normalizeAssignment(item),
              ]),
            ),
            deletedAssignmentIds: parsed.deletedAssignmentIds ?? [],
            customStudies: restoredStudies,
            studyEdits: restoredStudyEdits,
            deletedStudyIds: parsed.deletedStudyIds ?? [],
            leadOffers: parsed.leadOffers ?? [],
            studyLeads: parsed.studyLeads ?? {},
            notifications: restoredNotifications,
            notificationSeedVersion: NOTIFICATION_SEED_VERSION,
          };
          stateRef.current = restored;
          await persist(restored);
        }
      } finally {
        setReady(true);
      }
    })();
  }, [persist]);

  const upsertAccount = useCallback((list: User[], next: User) => {
    const idx = list.findIndex((a) => a.id === next.id);
    if (idx >= 0) {
      const copy = [...list];
      copy[idx] = next;
      return copy;
    }
    return [...list, next];
  }, []);


  // ——— 2. 세션 · 계정 ———
  const setAutoLogin = useCallback(
    async (value: boolean) => {
      setAutoLoginState(value);
      if (!value) {
        await persist({ autoLogin: false, user: null });
        return;
      }
      await persist({ autoLogin: true });
    },
    [persist],
  );

  const commitUser = useCallback(
    async (nextUser: User) => {
      const nextLast = toLastLogin(nextUser);
      const nextAccounts = upsertAccount(accounts, nextUser);
      setUser(nextUser);
      setAccounts(nextAccounts);
      setLastLogin(nextLast);
      setPendingSocial(null);
      await persist({
        user: nextUser,
        accounts: nextAccounts,
        lastLogin: nextLast,
        autoLogin,
      });
    },
    [accounts, autoLogin, persist, upsertAccount],
  );


  // ——— 3. 인증: 소셜 ———
  const loginWithSocial = useCallback(
    async (provider: OAuthProvider): Promise<SocialLoginResult> => {
      try {
        const profile = await mockSocialSignIn(provider);

        // 1) 최근 로그인 동일 provider+email → 바로 입장 (소셜 계정만)
        if (
          lastLogin &&
          lastLogin.provider === provider &&
          normalizeEmail(lastLogin.email) === normalizeEmail(profile.email)
        ) {
          const existing =
            accounts.find((a) => a.id === lastLogin.userId) ??
            findAccountByEmail(accounts, profile.email);
          if (existing && isSocialAccount(existing)) {
            await commitUser(withLinkedProvider(existing, profile));
            return { status: 'logged_in' };
          }
        }

        // 2) 같은 이메일의 소셜 계정만 연결 (이메일 회원과는 합치지 않음)
        const byEmail = findAccountByEmail(accounts, profile.email);
        if (byEmail) {
          if (isEmailAccount(byEmail)) {
            return {
              status: 'error',
              message:
                '이 이메일은 이메일 회원으로 가입되어 있어요. 이메일 로그인을 이용해 주세요.',
            };
          }
          if (isSocialAccount(byEmail)) {
            const merged = withLinkedProvider(byEmail, profile);
            await commitUser(merged);
            return {
              status: 'logged_in',
              merged: !byEmail.providers.includes(provider),
            };
          }
        }

        // 3) 신규 간편가입 → 닉네임
        setPendingSocial(profile);
        return { status: 'need_nickname' };
      } catch {
        return { status: 'error', message: '간편로그인에 실패했어요. 다시 시도해 주세요.' };
      }
    },
    [accounts, commitUser, lastLogin],
  );

  const checkNicknameAvailable = useCallback(
    (nickname: string, excludeUserId?: string): NicknameCheckResult => {
      const trimmed = nickname.trim();
      if (trimmed.length < 2) {
        return { ok: false, message: '닉네임은 2자 이상 입력해 주세요.' };
      }
      if (trimmed.length > 12) {
        return { ok: false, message: '닉네임은 12자 이하로 입력해 주세요.' };
      }
      const key = normalizeNickname(trimmed);
      if (isReservedNickname(trimmed)) {
        return { ok: false, message: '사용할 수 없는 닉네임이에요.' };
      }
      const taken = accounts.some(
        (a) => a.id !== excludeUserId && normalizeNickname(a.nickname) === key,
      );
      if (taken) {
        return { ok: false, message: '이미 사용 중인 닉네임이에요.' };
      }
      return { ok: true };
    },
    [accounts],
  );

  const checkEmailAvailable = useCallback(
    (email: string, excludeUserId?: string): EmailCheckResult => {
      const trimmed = normalizeEmail(email);
      if (!EMAIL_RE.test(trimmed)) {
        return { ok: false, message: '이메일 형식을 확인해 주세요.' };
      }
      const taken = accounts.some(
        (a) => a.id !== excludeUserId && accountOwnsEmail(a, trimmed),
      );
      if (taken) {
        return { ok: false, message: '이미 사용 중인 이메일이에요.' };
      }
      return { ok: true };
    },
    [accounts],
  );

  const clearPendingEmailAuth = useCallback(() => {
    setPendingEmailAuth(null);
  }, []);

  const requestSignupEmailCode = useCallback(
    async (email: string): Promise<EmailRequestResult> => {
      const trimmed = normalizeEmail(email);
      if (!EMAIL_RE.test(trimmed)) {
        return { ok: false, message: '이메일 형식을 확인해 주세요.' };
      }
      const existing = findAccountByEmail(accounts, trimmed);
      if (existing) {
        if (isSocialAccount(existing)) {
          return {
            ok: false,
            message: '간편로그인으로 가입된 이메일이에요. 카카오·Google로 로그인해 주세요.',
          };
        }
        return {
          ok: false,
          message: '이미 가입된 이메일이에요. 이메일 로그인으로 들어와 주세요.',
        };
      }

      await new Promise((r) => setTimeout(r, 450));
      const code = makeEmailVerifyCode();
      const sentAt = Date.now();
      setPendingEmailAuth({
        purpose: 'signup',
        email: trimmed,
        code,
        sentAt,
        verified: false,
      });
      return { ok: true, demoCode: code, expiresAt: sentAt + EMAIL_CODE_TTL_MS };
    },
    [accounts],
  );

  const confirmSignupEmailCode = useCallback(async (code: string) => {
    if (!pendingEmailAuth || pendingEmailAuth.purpose !== 'signup') {
      return '먼저 인증번호를 요청해 주세요.';
    }
    if (Date.now() - pendingEmailAuth.sentAt > EMAIL_CODE_TTL_MS) {
      setPendingEmailAuth(null);
      return '인증번호가 만료됐어요. 다시 요청해 주세요.';
    }
    if (code.trim().toUpperCase() !== pendingEmailAuth.code) {
      return '인증번호가 올바르지 않아요.';
    }
    const emailCheck = checkEmailAvailable(pendingEmailAuth.email);
    if (!emailCheck.ok) {
      setPendingEmailAuth(null);
      return emailCheck.message;
    }
    setPendingEmailAuth({ ...pendingEmailAuth, verified: true });
    return null;
  }, [checkEmailAvailable, pendingEmailAuth]);

  const completeEmailSignup = useCallback(
    async (nickname: string) => {
      if (!pendingEmailAuth || pendingEmailAuth.purpose !== 'signup' || !pendingEmailAuth.verified) {
        return '이메일 인증을 먼저 완료해 주세요.';
      }

      const emailCheck = checkEmailAvailable(pendingEmailAuth.email);
      if (!emailCheck.ok) return emailCheck.message;

      const nickCheck = checkNicknameAvailable(nickname);
      if (!nickCheck.ok) return nickCheck.message;

      const nextUser: User = {
        id: makeUserId(),
        email: pendingEmailAuth.email,
        emailVerified: true,
        nickname: nickname.trim(),
        providers: ['email'],
        emailsByProvider: { email: pendingEmailAuth.email },
        lastProvider: 'email',
        createdAt: new Date().toISOString(),
      };
      setPendingEmailAuth(null);
      await commitUser(nextUser);
      return null;
    },
    [checkEmailAvailable, checkNicknameAvailable, commitUser, pendingEmailAuth],
  );

  const requestEmailLoginCode = useCallback(
    async (email: string): Promise<EmailRequestResult> => {
      const trimmed = normalizeEmail(email);
      if (!EMAIL_RE.test(trimmed)) {
        return { ok: false, message: '이메일 형식을 확인해 주세요.' };
      }
      const existing = findAccountByEmail(accounts, trimmed);
      if (!existing) {
        return { ok: false, message: '가입되지 않은 이메일이에요. 먼저 회원가입해 주세요.' };
      }
      if (!isEmailAccount(existing)) {
        return {
          ok: false,
          message: '간편로그인으로 가입된 이메일이에요. 카카오·Google로 로그인해 주세요.',
        };
      }

      await new Promise((r) => setTimeout(r, 450));
      const code = makeEmailVerifyCode();
      const sentAt = Date.now();
      setPendingEmailAuth({
        purpose: 'login',
        email: trimmed,
        code,
        sentAt,
        verified: false,
      });
      return { ok: true, demoCode: code, expiresAt: sentAt + EMAIL_CODE_TTL_MS };
    },
    [accounts],
  );

  const confirmEmailLogin = useCallback(
    async (code: string) => {
      if (!pendingEmailAuth || pendingEmailAuth.purpose !== 'login') {
        return '먼저 인증번호를 요청해 주세요.';
      }
      if (Date.now() - pendingEmailAuth.sentAt > EMAIL_CODE_TTL_MS) {
        setPendingEmailAuth(null);
        return '인증번호가 만료됐어요. 다시 요청해 주세요.';
      }
      if (code.trim().toUpperCase() !== pendingEmailAuth.code) {
        return '인증번호가 올바르지 않아요.';
      }
      const existing = findAccountByEmail(accounts, pendingEmailAuth.email);
      if (!existing || !isEmailAccount(existing)) {
        setPendingEmailAuth(null);
        return '이메일 회원 계정을 찾을 수 없어요.';
      }
      setPendingEmailAuth(null);
      await commitUser({
        ...existing,
        lastProvider: 'email',
      });
      return null;
    },
    [accounts, commitUser, pendingEmailAuth],
  );

  const completeNickname = useCallback(
    async (nickname: string) => {
      if (!pendingSocial) return '로그인 정보가 없어요. 다시 시작해 주세요.';
      const check = checkNicknameAvailable(nickname);
      if (!check.ok) return check.message;

      const existing = findAccountByEmail(accounts, pendingSocial.email);
      if (existing) {
        if (isEmailAccount(existing)) {
          return '이 이메일은 이메일 회원으로 가입되어 있어요. 이메일 로그인을 이용해 주세요.';
        }
        if (isSocialAccount(existing)) {
          await commitUser(
            withLinkedProvider({ ...existing, nickname: nickname.trim() }, pendingSocial),
          );
          return null;
        }
      }

      const nextUser: User = {
        id: makeUserId(),
        email: pendingSocial.email,
        emailVerified: false,
        nickname: nickname.trim(),
        providers: [pendingSocial.provider],
        emailsByProvider: { [pendingSocial.provider]: pendingSocial.email },
        lastProvider: pendingSocial.provider,
        createdAt: new Date().toISOString(),
      };
      await commitUser(nextUser);
      return null;
    },
    [accounts, checkNicknameAvailable, commitUser, pendingSocial],
  );

  const clearPendingSocial = useCallback(() => {
    setPendingSocial(null);
  }, []);

  const updateNickname = useCallback(
    async (nickname: string) => {
      if (!user) return '로그인이 필요해요.';
      const check = checkNicknameAvailable(nickname, user.id);
      if (!check.ok) return check.message;
      if (nickname.trim() === user.nickname) {
        return null;
      }
      await commitUser({ ...user, nickname: nickname.trim() });
      return null;
    },
    [checkNicknameAvailable, commitUser, user],
  );

  const requestEmailVerification = useCallback(
    async (email: string): Promise<EmailRequestResult> => {
      if (!user) return { ok: false, message: '로그인이 필요해요.' };
      const trimmed = normalizeEmail(email);
      if (!EMAIL_RE.test(trimmed)) {
        return { ok: false, message: '이메일 형식을 확인해 주세요.' };
      }
      if (trimmed === normalizeEmail(user.email) && user.emailVerified) {
        return { ok: false, message: '이미 인증된 이메일이에요.' };
      }
      const taken = accounts.some(
        (a) => a.id !== user.id && accountOwnsEmail(a, trimmed),
      );
      if (taken) {
        return { ok: false, message: '이미 다른 계정에서 사용 중인 이메일이에요.' };
      }

      // 프로토타입: 실제 메일 대신 화면에 인증번호를 보여 줌
      await new Promise((r) => setTimeout(r, 450));
      const code = makeEmailVerifyCode();
      const sentAt = Date.now();
      setPendingEmail({
        userId: user.id,
        email: trimmed,
        code,
        sentAt,
      });
      return { ok: true, demoCode: code, expiresAt: sentAt + EMAIL_CODE_TTL_MS };
    },
    [accounts, user],
  );

  const confirmEmailVerification = useCallback(
    async (code: string) => {
      if (!user) return '로그인이 필요해요.';
      if (!pendingEmail || pendingEmail.userId !== user.id) {
        return '먼저 인증번호를 요청해 주세요.';
      }
      if (Date.now() - pendingEmail.sentAt > EMAIL_CODE_TTL_MS) {
        setPendingEmail(null);
        return '인증번호가 만료됐어요. 다시 요청해 주세요.';
      }
      if (code.trim().toUpperCase() !== pendingEmail.code) {
        return '인증번호가 올바르지 않아요.';
      }

      const taken = accounts.some(
        (a) => a.id !== user.id && accountOwnsEmail(a, pendingEmail.email),
      );
      if (taken) {
        setPendingEmail(null);
        return '이미 다른 계정에서 사용 중인 이메일이에요.';
      }

      await commitUser({
        ...user,
        email: pendingEmail.email,
        emailVerified: true,
      });
      setPendingEmail(null);
      return null;
    },
    [accounts, commitUser, pendingEmail, user],
  );

  const requestLinkProvider = useCallback(
    async (provider: OAuthProvider): Promise<LinkProviderResult> => {
      if (!user) return { status: 'error', message: '로그인이 필요해요.' };
      if (isEmailAccount(user)) {
        return {
          status: 'error',
          message: '이메일 회원은 간편로그인과 별도예요. 이메일 로그인만 사용할 수 있어요.',
        };
      }
      if (user.providers.includes(provider)) return { status: 'already_linked' };

      try {
        const profile = await mockSocialSignIn(provider);

        const other = findAccountByEmail(accounts, profile.email);
        if (other && other.id !== user.id) {
          return {
            status: 'error',
            message: '이미 다른 StudyBuddy 계정에 연결된 이메일이에요.',
          };
        }

        if (accountOwnsEmail(user, profile.email)) {
          await commitUser(withLinkedProvider(user, profile));
          return { status: 'linked', autoMerged: true };
        }

        return { status: 'confirm', profile };
      } catch {
        return { status: 'error', message: '계정 연결에 실패했어요.' };
      }
    },
    [accounts, commitUser, user],
  );

  const confirmLinkProvider = useCallback(
    async (profile: SocialProfile) => {
      if (!user) return '로그인이 필요해요.';
      if (user.providers.includes(profile.provider)) return '이미 연결된 로그인이에요.';

      const other = findAccountByEmail(accounts, profile.email);
      if (other && other.id !== user.id) {
        return '이미 다른 StudyBuddy 계정에 연결된 이메일이에요.';
      }

      await commitUser(withLinkedProvider(user, profile));
      return null;
    },
    [accounts, commitUser, user],
  );

  const unlinkProvider = useCallback(
    async (provider: SocialProvider) => {
      if (!user) return '로그인이 필요해요.';
      if (!user.providers.includes(provider)) return '연결되지 않은 로그인이에요.';
      if (user.providers.length <= 1) {
        return '마지막 로그인 수단은 해제할 수 없어요.';
      }

      const nextProviders = user.providers.filter((p) => p !== provider);
      const nextEmails = { ...user.emailsByProvider };
      delete nextEmails[provider];
      const nextLast = nextProviders.includes(user.lastProvider)
        ? user.lastProvider
        : nextProviders[0];

      await commitUser({
        ...user,
        providers: nextProviders,
        emailsByProvider: nextEmails,
        lastProvider: nextLast,
      });
      return null;
    },
    [commitUser, user],
  );

  const logout = useCallback(async () => {
    setUser(null);
    setPendingSocial(null);
    setPendingEmail(null);
    setPendingEmailAuth(null);
    await persist({ user: null });
  }, [persist]);

  const deleteAccount = useCallback(async () => {
    const current = stateRef.current.user;
    if (!current) return '로그인된 계정이 없어요.';

    const nextAccounts = stateRef.current.accounts.filter((a) => a.id !== current.id);
    const nextLastLogin =
      stateRef.current.lastLogin?.userId === current.id ? null : stateRef.current.lastLogin;

    setAccounts(nextAccounts);
    setUser(null);
    setPendingSocial(null);
    setPendingEmail(null);
    setPendingEmailAuth(null);
    setJoinedStudyIds([]);
    setAdminStudyIds([]);
    setAttendedIds([]);
    setAssignmentSubmissions({});
    setLeadOffers([]);
    setStudyLeads({});
    setNotifications(MOCK_NOTIFICATIONS);
    setLastLogin(nextLastLogin);

    await persist({
      user: null,
      accounts: nextAccounts,
      lastLogin: nextLastLogin,
      joinedStudyIds: [],
      adminStudyIds: [],
      attendedIds: [],
      submittedAssignmentIds: [],
      assignmentSubmissions: {},
      leadOffers: [],
      studyLeads: {},
      notifications: MOCK_NOTIFICATIONS,
    });
    return null;
  }, [persist]);

  const allStudies = useMemo(() => {
    const byId = new Map<string, Study>();
    for (const study of MOCK_STUDIES) byId.set(study.id, study);
    for (const study of customStudies.map(normalizeStudy)) byId.set(study.id, study);
    return [...byId.values()]
      .filter((study) => !deletedStudyIds.includes(study.id))
      .map((study) => {
        const edit = studyEdits[study.id];
        return edit ? normalizeStudy({ ...study, ...edit }) : study;
      });
  }, [customStudies, studyEdits, deletedStudyIds]);

  const pushNotification = useCallback(
    async (input: {
      kind: NotificationKind;
      title: string;
      body: string;
      studyId?: string;
    }) => {
      const study = input.studyId ? findStudyById(input.studyId) : null;
      const item: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        kind: input.kind,
        title: input.title,
        body: input.body,
        createdAt: new Date().toISOString(),
        studyId: input.studyId,
        studyName: study?.name,
        read: false,
      };
      const next = purgeExpiredNotifications([item, ...stateRef.current.notifications]).slice(
        0,
        200,
      );
      setNotifications(next);
      await persist({ notifications: next });
    },
    [persist],
  );


  // ——— 4. 스터디 멤버십 · 관리 ———
  const joinStudy = useCallback(
    async (studyId: string, options?: { viaInvite?: boolean }) => {
      if (stateRef.current.joinedStudyIds.includes(studyId)) return null;
      if (stateRef.current.deletedStudyIds.includes(studyId)) return '삭제된 스터디예요.';

      const study =
        MOCK_STUDIES.find((s) => s.id === studyId) ??
        stateRef.current.customStudies.map(normalizeStudy).find((s) => s.id === studyId) ??
        null;

      if (!study) return '스터디를 찾을 수 없어요.';
      if (study.visibility === 'private' && !options?.viaInvite) {
        return '비공개 스터디는 초대코드로만 가입할 수 있어요.';
      }

      const next = [...stateRef.current.joinedStudyIds, studyId];
      setJoinedStudyIds(next);
      await persist({ joinedStudyIds: next });
      const nick = stateRef.current.user?.nickname?.trim() || '나';
      await pushNotification({
        kind: 'member_joined',
        title: '스터디원 가입',
        body: `${study.emoji} ${nick}님이 ${study.name}에 들어왔어요.`,
        studyId,
      });
      return null;
    },
    [persist, pushNotification],
  );

  const joinByInvite = useCallback(
    async (code: string) => {
      const found = allStudies.find(
        (s) => s.inviteCode.toLowerCase() === code.trim().toLowerCase(),
      );
      if (!found) return '초대코드를 찾을 수 없어요.';
      return joinStudy(found.id, { viaInvite: true });
    },
    [allStudies, joinStudy],
  );

  const createStudy = useCallback(
    async (input: {
      name: string;
      topic: string;
      emoji: string;
      color: string;
      inviteCode?: string;
      visibility: 'public' | 'private';
    }) => {
      const name = input.name.trim();
      const topic = input.topic.trim();
      const emoji = input.emoji.trim() || '📚';
      const color = input.color.trim() || '#DE7272';
      const visibility = input.visibility === 'private' ? 'private' : 'public';
      if (name.length < 2) return { ok: false as const, message: '스터디 이름은 2자 이상 입력해 주세요.' };
      if (name.length > 24) return { ok: false as const, message: '스터디 이름은 24자 이하로 입력해 주세요.' };
      if (topic.length < 1) return { ok: false as const, message: '주제를 입력해 주세요.' };
      if (topic.length > 20) return { ok: false as const, message: '주제는 20자 이하로 입력해 주세요.' };

      const existingCodes = allStudies.map((s) => s.inviteCode);
      const codeCheck = validateInviteCode(input.inviteCode ?? '', existingCodes);
      if (!codeCheck.ok) {
        return { ok: false as const, message: codeCheck.message };
      }
      const inviteCode = codeCheck.code;

      const study = normalizeStudy({
        id: `custom_${Date.now()}`,
        name,
        topic,
        inviteCode,
        memberCount: 1,
        emoji,
        color,
        visibility,
      });

      const nextStudies = [...stateRef.current.customStudies, study];
      const nextJoined = stateRef.current.joinedStudyIds.includes(study.id)
        ? stateRef.current.joinedStudyIds
        : [...stateRef.current.joinedStudyIds, study.id];
      const nextAdmin = stateRef.current.adminStudyIds.includes(study.id)
        ? stateRef.current.adminStudyIds
        : [...stateRef.current.adminStudyIds, study.id];

      setCustomStudies(nextStudies);
      setJoinedStudyIds(nextJoined);
      setAdminStudyIds(nextAdmin);
      syncRuntimeStudies(nextStudies, stateRef.current.studyEdits, stateRef.current.deletedStudyIds);
      await persist({
        customStudies: nextStudies,
        joinedStudyIds: nextJoined,
        adminStudyIds: nextAdmin,
      });

      return { ok: true as const, study };
    },
    [allStudies, persist],
  );

  const updateStudyName = useCallback(
    async (studyId: string, rawName: string) => {
      if (!stateRef.current.adminStudyIds.includes(studyId)) {
        return '스터디장만 이름을 바꿀 수 있어요.';
      }
      const name = rawName.trim();
      if (name.length < 2) return '스터디 이름은 2자 이상 입력해 주세요.';
      if (name.length > 24) return '스터디 이름은 24자 이하로 입력해 주세요.';

      const exists =
        MOCK_STUDIES.some((s) => s.id === studyId) ||
        stateRef.current.customStudies.some((s) => s.id === studyId);
      if (!exists || stateRef.current.deletedStudyIds.includes(studyId)) {
        return '스터디를 찾을 수 없어요.';
      }

      const nextCustom = stateRef.current.customStudies.map((s) =>
        s.id === studyId ? normalizeStudy({ ...s, name }) : s,
      );
      const nextEdits = {
        ...stateRef.current.studyEdits,
        [studyId]: { ...stateRef.current.studyEdits[studyId], name },
      };

      setCustomStudies(nextCustom);
      setStudyEdits(nextEdits);
      syncRuntimeStudies(nextCustom, nextEdits, stateRef.current.deletedStudyIds);
      await persist({ customStudies: nextCustom, studyEdits: nextEdits });
      return null;
    },
    [persist],
  );

  const leaveStudy = useCallback(
    async (studyId: string) => {
      const study =
        MOCK_STUDIES.find((s) => s.id === studyId) ??
        stateRef.current.customStudies.map(normalizeStudy).find((s) => s.id === studyId) ??
        findStudyById(studyId);
      const nextJoined = stateRef.current.joinedStudyIds.filter((id) => id !== studyId);
      const nextAdmin = stateRef.current.adminStudyIds.filter((id) => id !== studyId);
      setJoinedStudyIds(nextJoined);
      setAdminStudyIds(nextAdmin);
      await persist({ joinedStudyIds: nextJoined, adminStudyIds: nextAdmin });
      const nick = stateRef.current.user?.nickname?.trim() || '나';
      await pushNotification({
        kind: 'member_left',
        title: '스터디원 탈퇴',
        body: `${study?.emoji ?? '✨'} ${nick}님이 ${study?.name ?? '스터디'}에서 나갔어요.`,
        studyId,
      });
    },
    [persist, pushNotification],
  );

  const deleteStudy = useCallback(
    async (studyId: string) => {
      if (!stateRef.current.adminStudyIds.includes(studyId)) {
        return '스터디장만 스터디를 삭제할 수 있어요.';
      }
      const nextJoined = stateRef.current.joinedStudyIds.filter((id) => id !== studyId);
      const nextAdmin = stateRef.current.adminStudyIds.filter((id) => id !== studyId);
      const nextCustom = stateRef.current.customStudies.filter((study) => study.id !== studyId);
      const nextDeleted = stateRef.current.deletedStudyIds.includes(studyId)
        ? stateRef.current.deletedStudyIds
        : [...stateRef.current.deletedStudyIds, studyId];
      const leadOffers = stateRef.current.leadOffers.filter((offer) => offer.studyId !== studyId);
      const studyLeads = { ...stateRef.current.studyLeads };
      delete studyLeads[studyId];
      setJoinedStudyIds(nextJoined);
      setAdminStudyIds(nextAdmin);
      setCustomStudies(nextCustom);
      setDeletedStudyIds(nextDeleted);
      setLeadOffers(leadOffers);
      setStudyLeads(studyLeads);
      const nextEdits = { ...stateRef.current.studyEdits };
      delete nextEdits[studyId];
      setStudyEdits(nextEdits);
      syncRuntimeStudies(nextCustom, nextEdits, nextDeleted);
      await persist({
        joinedStudyIds: nextJoined,
        adminStudyIds: nextAdmin,
        customStudies: nextCustom,
        studyEdits: nextEdits,
        deletedStudyIds: nextDeleted,
        leadOffers,
        studyLeads,
      });
      return null;
    },
    [persist],
  );

  const setStudyAdmin = useCallback(
    async (studyId: string, isAdmin: boolean) => {
      if (!stateRef.current.joinedStudyIds.includes(studyId)) {
        return '먼저 스터디에 가입해 주세요.';
      }
      const prev = stateRef.current.adminStudyIds;
      const next = isAdmin
        ? prev.includes(studyId)
          ? prev
          : [...prev, studyId]
        : prev.filter((id) => id !== studyId);
      const studyLeads = { ...stateRef.current.studyLeads };
      if (isAdmin) delete studyLeads[studyId];
      setAdminStudyIds(next);
      setStudyLeads(studyLeads);
      await persist({ adminStudyIds: next, studyLeads });
      return null;
    },
    [persist],
  );


  // ——— 5. 알림함 ———
  const markNotificationsRead = useCallback(
    async (ids?: string[]) => {
      const idSet = ids ? new Set(ids) : null;
      const next = stateRef.current.notifications.map((item) => {
        if (idSet && !idSet.has(item.id)) return item;
        if (item.read) return item;
        return { ...item, read: true };
      });
      setNotifications(next);
      await persist({ notifications: next });
    },
    [persist],
  );

  const markNotificationsUnread = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      const next = stateRef.current.notifications.map((item) => {
        if (!idSet.has(item.id) || !item.read) return item;
        return { ...item, read: false };
      });
      setNotifications(next);
      await persist({ notifications: next });
    },
    [persist],
  );

  const deleteNotifications = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      const next = stateRef.current.notifications.filter((item) => !idSet.has(item.id));
      setNotifications(next);
      await persist({ notifications: next });
    },
    [persist],
  );

  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);
    await persist({ notifications: [] });
  }, [persist]);


  // ——— 6. 스터디장 위임 ———
  const requestLeadTransfer = useCallback(
    async (studyId: string, memberId: string, nickname: string) => {
      if (!stateRef.current.adminStudyIds.includes(studyId)) {
        return '스터디장만 위임할 수 있어요.';
      }
      const currentLead = stateRef.current.studyLeads[studyId];
      if (currentLead && currentLead !== 'self') {
        return '지금 스터디장이 아니라서 위임할 수 없어요.';
      }
      if (memberId === 'self') return '나에게는 위임할 수 없어요.';
      if (stateRef.current.leadOffers.some((offer) => offer.studyId === studyId)) {
        return '이미 위임 요청이 있어요. 상대가 확인한 뒤에 다시 보낼 수 있어요.';
      }
      const next = [
        ...stateRef.current.leadOffers,
        { id: `lead_${Date.now()}`, studyId, toMemberId: memberId, toNickname: nickname },
      ];
      setLeadOffers(next);
      await persist({ leadOffers: next });
      const study = findStudyById(studyId);
      await pushNotification({
        kind: 'lead_offered',
        title: '스터디장 위임 요청',
        body: `${study?.emoji ?? '✨'} ${study?.name ?? '스터디'} 스터디장 위임 요청이 ${nickname}님에게 갔어요.`,
        studyId,
      });
      return null;
    },
    [persist, pushNotification],
  );

  const cancelLeadTransfer = useCallback(
    async (studyId: string) => {
      const next = stateRef.current.leadOffers.filter((offer) => offer.studyId !== studyId);
      setLeadOffers(next);
      await persist({ leadOffers: next });
    },
    [persist],
  );

  const respondLeadTransfer = useCallback(
    async (studyId: string, accept: boolean) => {
      const offer = stateRef.current.leadOffers.find((item) => item.studyId === studyId);
      if (!offer) return '위임 요청이 없어요.';
      const leadOffers = stateRef.current.leadOffers.filter((item) => item.studyId !== studyId);
      if (!accept) {
        setLeadOffers(leadOffers);
        await persist({ leadOffers });
        return null;
      }
      const studyLeads = { ...stateRef.current.studyLeads, [studyId]: offer.toMemberId };
      const adminStudyIds = stateRef.current.adminStudyIds.filter((id) => id !== studyId);
      setStudyLeads(studyLeads);
      setAdminStudyIds(adminStudyIds);
      setLeadOffers(leadOffers);
      await persist({ studyLeads, adminStudyIds, leadOffers });
      const study = findStudyById(studyId);
      await pushNotification({
        kind: 'lead_accepted',
        title: '스터디장 위임 완료',
        body: `${study?.emoji ?? '✨'} ${study?.name ?? '스터디'} 스터디장이 ${offer.toNickname}님에게 위임됐어요.`,
        studyId,
      });
      return null;
    },
    [persist, pushNotification],
  );

  const visibleSchedules = () =>
    mergeSchedules(
      MOCK_SCHEDULE,
      stateRef.current.customSchedules,
      stateRef.current.scheduleEdits,
      stateRef.current.deletedScheduleIds,
    );


  // ——— 7. 일정 ———
  const addSchedule = useCallback(
    async (input: {
      studyId: string;
      title: string;
      date: string;
      time: string;
      placeType: 'online' | 'offline';
      place: string;
      address?: string;
      mapx?: string;
      mapy?: string;
    }) => {
      if (!stateRef.current.adminStudyIds.includes(input.studyId)) {
        return '스터디장만 일정을 추가할 수 있어요.';
      }
      const checked = validateScheduleDraft(input);
      if (!checked.ok) return checked.message;

      const item = normalizeScheduleItem({
        id: `sch_custom_${Date.now()}`,
        ...checked.value,
      });
      const next = [...stateRef.current.customSchedules, item];
      setCustomSchedules(next);
      await persist({ customSchedules: next });
      const study = findStudyById(item.studyId);
      await pushNotification({
        kind: 'schedule_created',
        title: '일정 등록',
        body: `${study?.emoji ?? '✨'} ${study?.name ?? '스터디'}에 「${item.title}」 일정이 등록됐어요.`,
        studyId: item.studyId,
      });
      return null;
    },
    [persist, pushNotification],
  );

  const updateSchedule = useCallback(
    async (
      scheduleId: string,
      input: {
        title: string;
        date: string;
        time: string;
        placeType: 'online' | 'offline';
        place: string;
        address?: string;
        mapx?: string;
        mapy?: string;
      },
    ) => {
      const existing = visibleSchedules().find((item) => item.id === scheduleId);
      if (!existing) return '일정을 찾을 수 없어요.';
      if (!stateRef.current.adminStudyIds.includes(existing.studyId)) {
        return '스터디장만 일정을 수정할 수 있어요.';
      }
      const checked = validateScheduleDraft({ ...input, studyId: existing.studyId });
      if (!checked.ok) return checked.message;
      const item = normalizeScheduleItem({ id: existing.id, ...checked.value });
      const next = { ...stateRef.current.scheduleEdits, [existing.id]: item };
      setScheduleEdits(next);
      await persist({ scheduleEdits: next });
      const study = findStudyById(existing.studyId);
      await pushNotification({
        kind: 'schedule_updated',
        title: '일정 수정',
        body: `${study?.emoji ?? '✨'} ${study?.name ?? '스터디'} 「${item.title}」 일정이 수정됐어요.`,
        studyId: existing.studyId,
      });
      return null;
    },
    [persist, pushNotification],
  );

  const deleteSchedule = useCallback(
    async (scheduleId: string) => {
      const existing = visibleSchedules().find((item) => item.id === scheduleId);
      if (!existing) return '일정을 찾을 수 없어요.';
      if (!stateRef.current.adminStudyIds.includes(existing.studyId)) {
        return '스터디장만 일정을 삭제할 수 있어요.';
      }
      const deletedScheduleIds = stateRef.current.deletedScheduleIds.includes(scheduleId)
        ? stateRef.current.deletedScheduleIds
        : [...stateRef.current.deletedScheduleIds, scheduleId];
      const scheduleEdits = { ...stateRef.current.scheduleEdits };
      delete scheduleEdits[scheduleId];
      setDeletedScheduleIds(deletedScheduleIds);
      setScheduleEdits(scheduleEdits);
      await persist({ deletedScheduleIds, scheduleEdits });
      const study = findStudyById(existing.studyId);
      await pushNotification({
        kind: 'schedule_deleted',
        title: '일정 삭제',
        body: `${study?.emoji ?? '✨'} ${study?.name ?? '스터디'} 「${existing.title}」 일정이 삭제됐어요.`,
        studyId: existing.studyId,
      });
      return null;
    },
    [persist, pushNotification],
  );

  const visibleNotices = () =>
    mergeNotices(
      MOCK_NOTICES,
      stateRef.current.customNotices,
      stateRef.current.noticeEdits,
      stateRef.current.deletedNoticeIds,
    );


  // ——— 7. 공지 ———
  const addNotice = useCallback(
    async (input: { studyId: string; title: string; body: string; pinned?: boolean }) => {
      if (!stateRef.current.adminStudyIds.includes(input.studyId)) {
        return '스터디장만 공지를 작성할 수 있어요.';
      }
      const checked = validateNoticeDraft(input);
      if (!checked.ok) return checked.message;
      const item: Notice = {
        id: `n_custom_${Date.now()}`,
        studyId: input.studyId,
        title: checked.value.title,
        body: checked.value.body,
        date: todayYmd(),
        pinned: Boolean(input.pinned),
      };
      const next = [...stateRef.current.customNotices, item];
      setCustomNotices(next);
      await persist({ customNotices: next });
      const study = findStudyById(item.studyId);
      await pushNotification({
        kind: 'notice_created',
        title: '새 공지',
        body: `${study?.emoji ?? '✨'} ${study?.name ?? '스터디'} 「${item.title}」 공지가 올라왔어요.`,
        studyId: item.studyId,
      });
      return null;
    },
    [persist, pushNotification],
  );

  const updateNotice = useCallback(
    async (noticeId: string, input: { title: string; body: string; pinned?: boolean }) => {
      const existing = visibleNotices().find((item) => item.id === noticeId);
      if (!existing) return '공지를 찾을 수 없어요.';
      if (!stateRef.current.adminStudyIds.includes(existing.studyId)) {
        return '스터디장만 공지를 수정할 수 있어요.';
      }
      const checked = validateNoticeDraft(input);
      if (!checked.ok) return checked.message;
      const item: Notice = {
        ...existing,
        title: checked.value.title,
        body: checked.value.body,
        pinned: Boolean(input.pinned),
      };
      const next = { ...stateRef.current.noticeEdits, [existing.id]: item };
      setNoticeEdits(next);
      await persist({ noticeEdits: next });
      const study = findStudyById(existing.studyId);
      await pushNotification({
        kind: 'notice_updated',
        title: '공지 수정',
        body: `${study?.emoji ?? '✨'} ${study?.name ?? '스터디'} 「${item.title}」 공지가 수정됐어요.`,
        studyId: existing.studyId,
      });
      return null;
    },
    [persist, pushNotification],
  );

  const deleteNotice = useCallback(
    async (noticeId: string) => {
      const existing = visibleNotices().find((item) => item.id === noticeId);
      if (!existing) return '공지를 찾을 수 없어요.';
      if (!stateRef.current.adminStudyIds.includes(existing.studyId)) {
        return '스터디장만 공지를 삭제할 수 있어요.';
      }
      const deletedNoticeIds = stateRef.current.deletedNoticeIds.includes(noticeId)
        ? stateRef.current.deletedNoticeIds
        : [...stateRef.current.deletedNoticeIds, noticeId];
      const noticeEdits = { ...stateRef.current.noticeEdits };
      delete noticeEdits[noticeId];
      setDeletedNoticeIds(deletedNoticeIds);
      setNoticeEdits(noticeEdits);
      await persist({ deletedNoticeIds, noticeEdits });
      const study = findStudyById(existing.studyId);
      await pushNotification({
        kind: 'notice_deleted',
        title: '공지 삭제',
        body: `${study?.emoji ?? '✨'} ${study?.name ?? '스터디'} 「${existing.title}」 공지가 삭제됐어요.`,
        studyId: existing.studyId,
      });
      return null;
    },
    [persist, pushNotification],
  );

  const visibleAssignments = () =>
    mergeAssignments(
      MOCK_ASSIGNMENTS,
      stateRef.current.customAssignments,
      stateRef.current.assignmentEdits,
      stateRef.current.deletedAssignmentIds,
    );


  // ——— 7. 과제 · 출석 ———
  const addAssignment = useCallback(
    async (input: {
      studyId: string;
      title: string;
      dueDate: string;
      description: string;
      submitMode: 'file' | 'memo';
    }) => {
      if (!stateRef.current.adminStudyIds.includes(input.studyId)) {
        return '스터디장만 과제를 등록할 수 있어요.';
      }
      const checked = validateAssignmentDraft(input);
      if (!checked.ok) return checked.message;
      const item: Assignment = {
        id: `hw_custom_${Date.now()}`,
        ...checked.value,
      };
      const next = [...stateRef.current.customAssignments, item];
      setCustomAssignments(next);
      await persist({ customAssignments: next });
      const study = findStudyById(item.studyId);
      await pushNotification({
        kind: 'assignment_created',
        title: '과제 등록',
        body: `${study?.emoji ?? '✨'} ${study?.name ?? '스터디'}에 「${item.title}」 과제가 등록됐어요.`,
        studyId: item.studyId,
      });
      return null;
    },
    [persist, pushNotification],
  );

  const updateAssignment = useCallback(
    async (
      assignmentId: string,
      input: { title: string; dueDate: string; description: string; submitMode: 'file' | 'memo' },
    ) => {
      const existing = visibleAssignments().find((item) => item.id === assignmentId);
      if (!existing) return '과제를 찾을 수 없어요.';
      if (!stateRef.current.adminStudyIds.includes(existing.studyId)) {
        return '스터디장만 과제를 수정할 수 있어요.';
      }
      const checked = validateAssignmentDraft({ ...input, studyId: existing.studyId });
      if (!checked.ok) return checked.message;
      const item: Assignment = { id: existing.id, ...checked.value };
      const next = { ...stateRef.current.assignmentEdits, [existing.id]: item };
      setAssignmentEdits(next);
      await persist({ assignmentEdits: next });
      const study = findStudyById(existing.studyId);
      await pushNotification({
        kind: 'assignment_updated',
        title: '과제 수정',
        body: `${study?.emoji ?? '✨'} ${study?.name ?? '스터디'} 「${item.title}」 과제가 수정됐어요.`,
        studyId: existing.studyId,
      });
      return null;
    },
    [persist, pushNotification],
  );

  const deleteAssignment = useCallback(
    async (assignmentId: string) => {
      const existing = visibleAssignments().find((item) => item.id === assignmentId);
      if (!existing) return '과제를 찾을 수 없어요.';
      if (!stateRef.current.adminStudyIds.includes(existing.studyId)) {
        return '스터디장만 과제를 삭제할 수 있어요.';
      }
      const deletedAssignmentIds = stateRef.current.deletedAssignmentIds.includes(assignmentId)
        ? stateRef.current.deletedAssignmentIds
        : [...stateRef.current.deletedAssignmentIds, assignmentId];
      const assignmentEdits = { ...stateRef.current.assignmentEdits };
      delete assignmentEdits[assignmentId];
      const assignmentSubmissions = { ...stateRef.current.assignmentSubmissions };
      delete assignmentSubmissions[assignmentId];
      setDeletedAssignmentIds(deletedAssignmentIds);
      setAssignmentEdits(assignmentEdits);
      setAssignmentSubmissions(assignmentSubmissions);
      await persist({
        deletedAssignmentIds,
        assignmentEdits,
        assignmentSubmissions,
        submittedAssignmentIds: Object.keys(assignmentSubmissions),
      });
      const study = findStudyById(existing.studyId);
      await pushNotification({
        kind: 'assignment_deleted',
        title: '과제 삭제',
        body: `${study?.emoji ?? '✨'} ${study?.name ?? '스터디'} 「${existing.title}」 과제가 삭제됐어요.`,
        studyId: existing.studyId,
      });
      return null;
    },
    [persist, pushNotification],
  );

  const toggleAttendance = useCallback(
    async (sessionId: string) => {
      const attended = stateRef.current.attendedIds;
      const next = attended.includes(sessionId)
        ? attended.filter((id) => id !== sessionId)
        : [...attended, sessionId];
      setAttendedIds(next);
      await persist({ attendedIds: next });
    },
    [persist],
  );

  const submitAssignment = useCallback(
    async (
      assignmentId: string,
      input:
        | { mode: 'memo'; memo: string }
        | { mode: 'file'; fileName: string; fileUri: string; fileMime?: string; fileSize?: number },
    ) => {
      const existing = visibleAssignments().find((item) => item.id === assignmentId);
      if (!existing) return '과제를 찾을 수 없어요.';
      if (existing.submitMode !== input.mode) {
        return existing.submitMode === 'file'
          ? '이 과제는 파일로 제출해 주세요.'
          : '이 과제는 메모로 제출해 주세요.';
      }
      if (input.mode === 'memo') {
        const checked = validateAssignmentMemo(input.memo);
        if (!checked.ok) return checked.message;
        const next = {
          ...stateRef.current.assignmentSubmissions,
          [assignmentId]: {
            assignmentId,
            mode: 'memo' as const,
            memo: checked.value,
            submittedAt: todayYmd(),
          },
        };
        setAssignmentSubmissions(next);
        await persist({
          assignmentSubmissions: next,
          submittedAssignmentIds: Object.keys(next),
        });
        return null;
      }
      const checked = validateAssignmentFile({
        name: input.fileName,
        size: input.fileSize,
        mimeType: input.fileMime,
      });
      if (!checked.ok) return checked.message;
      const next = {
        ...stateRef.current.assignmentSubmissions,
        [assignmentId]: {
          assignmentId,
          mode: 'file' as const,
          fileName: input.fileName,
          fileUri: input.fileUri,
          fileMime: input.fileMime,
          fileSize: input.fileSize,
          submittedAt: todayYmd(),
        },
      };
      setAssignmentSubmissions(next);
      await persist({
        assignmentSubmissions: next,
        submittedAssignmentIds: Object.keys(next),
      });
      return null;
    },
    [persist],
  );

  const clearAssignmentSubmission = useCallback(
    async (assignmentId: string) => {
      const next = { ...stateRef.current.assignmentSubmissions };
      delete next[assignmentId];
      setAssignmentSubmissions(next);
      await persist({
        assignmentSubmissions: next,
        submittedAssignmentIds: Object.keys(next),
      });
    },
    [persist],
  );

  const toggleAssignment = useCallback(
    async (assignmentId: string) => {
      if (stateRef.current.assignmentSubmissions[assignmentId]) {
        await clearAssignmentSubmission(assignmentId);
        return;
      }
      const existing = visibleAssignments().find((item) => item.id === assignmentId);
      if (!existing) return;
      if (existing.submitMode === 'memo') {
        await submitAssignment(assignmentId, { mode: 'memo', memo: '제출 완료' });
      }
    },
    [clearAssignmentSubmission, submitAssignment],
  );

  const myStudies = useMemo(
    () => allStudies.filter((s) => joinedStudyIds.includes(s.id)),
    [allStudies, joinedStudyIds],
  );
  const managedStudies = useMemo(
    () => myStudies.filter((s) => adminStudyIds.includes(s.id)),
    [myStudies, adminStudyIds],
  );
  const allSchedules = useMemo(
    () => mergeSchedules(MOCK_SCHEDULE, customSchedules, scheduleEdits, deletedScheduleIds),
    [customSchedules, scheduleEdits, deletedScheduleIds],
  );
  const mySchedule = useMemo(
    () => allSchedules.filter((item) => joinedStudyIds.includes(item.studyId)),
    [allSchedules, joinedStudyIds],
  );
  const myAttendance = useMemo(
    () => MOCK_ATTENDANCE.filter((item) => joinedStudyIds.includes(item.studyId)),
    [joinedStudyIds],
  );
  const allAssignments = useMemo(
    () =>
      mergeAssignments(
        MOCK_ASSIGNMENTS,
        customAssignments,
        assignmentEdits,
        deletedAssignmentIds,
      ).map(normalizeAssignment),
    [customAssignments, assignmentEdits, deletedAssignmentIds],
  );
  const submittedAssignmentIds = useMemo(
    () => Object.keys(assignmentSubmissions),
    [assignmentSubmissions],
  );
  const myAssignments = useMemo(
    () => allAssignments.filter((item) => joinedStudyIds.includes(item.studyId)),
    [allAssignments, joinedStudyIds],
  );
  const allNotices = useMemo(
    () => mergeNotices(MOCK_NOTICES, customNotices, noticeEdits, deletedNoticeIds),
    [customNotices, noticeEdits, deletedNoticeIds],
  );
  const myNotices = useMemo(
    () => allNotices.filter((item) => joinedStudyIds.includes(item.studyId)),
    [allNotices, joinedStudyIds],
  );

  const attendanceRate = useMemo(() => {
    if (myAttendance.length === 0) return 0;
    const done = myAttendance.filter((s) => attendedIds.includes(s.id)).length;
    return Math.round((done / myAttendance.length) * 100);
  }, [myAttendance, attendedIds]);

  const assignmentRate = useMemo(() => {
    if (myAssignments.length === 0) return 0;
    const done = myAssignments.filter((a) => submittedAssignmentIds.includes(a.id)).length;
    return Math.round((done / myAssignments.length) * 100);
  }, [myAssignments, submittedAssignmentIds]);

  const unreadNotificationCount = useMemo(
    () => countUnreadNotifications(notifications),
    [notifications],
  );


  // ——— 8. 파생 뷰 · Provider value ———
  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      user,
      pendingSocial,
      autoLogin,
      lastLogin,
      joinedStudyIds,
      adminStudyIds,
      attendedIds,
      submittedAssignmentIds,
      assignmentSubmissions,
      notifications,
      unreadNotificationCount,
      markNotificationsRead,
      markNotificationsUnread,
      deleteNotifications,
      clearAllNotifications,
      studies: allStudies,
      myStudies,
      managedStudies,
      schedule: allSchedules,
      mySchedule,
      attendance: MOCK_ATTENDANCE,
      myAttendance,
      assignments: allAssignments,
      myAssignments,
      notices: allNotices,
      myNotices,
      setAutoLogin,
      loginWithSocial,
      completeNickname,
      clearPendingSocial,
      checkNicknameAvailable,
      checkEmailAvailable,
      updateNickname,
      requestEmailVerification,
      confirmEmailVerification,
      requestSignupEmailCode,
      confirmSignupEmailCode,
      completeEmailSignup,
      requestEmailLoginCode,
      confirmEmailLogin,
      clearPendingEmailAuth,
      requestLinkProvider,
      confirmLinkProvider,
      unlinkProvider,
      logout,
      deleteAccount,
      joinStudy,
      joinByInvite,
      leaveStudy,
      deleteStudy,
      updateStudyName,
      setStudyAdmin,
      leadOffers,
      studyLeads,
      requestLeadTransfer,
      cancelLeadTransfer,
      respondLeadTransfer,
      createStudy,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      addNotice,
      updateNotice,
      deleteNotice,
      addAssignment,
      updateAssignment,
      deleteAssignment,
      toggleAttendance,
      toggleAssignment,
      submitAssignment,
      clearAssignmentSubmission,
      attendanceRate,
      assignmentRate,
    }),
    [
      ready,
      user,
      pendingSocial,
      autoLogin,
      lastLogin,
      joinedStudyIds,
      adminStudyIds,
      attendedIds,
      submittedAssignmentIds,
      assignmentSubmissions,
      notifications,
      unreadNotificationCount,
      markNotificationsRead,
      markNotificationsUnread,
      deleteNotifications,
      clearAllNotifications,
      customSchedules,
      scheduleEdits,
      deletedScheduleIds,
      customNotices,
      noticeEdits,
      deletedNoticeIds,
      customAssignments,
      assignmentEdits,
      deletedAssignmentIds,
      allAssignments,
      allSchedules,
      allNotices,
      allStudies,
      myStudies,
      managedStudies,
      mySchedule,
      myAttendance,
      myAssignments,
      myNotices,
      setAutoLogin,
      loginWithSocial,
      completeNickname,
      clearPendingSocial,
      checkNicknameAvailable,
      checkEmailAvailable,
      updateNickname,
      requestEmailVerification,
      confirmEmailVerification,
      requestSignupEmailCode,
      confirmSignupEmailCode,
      completeEmailSignup,
      requestEmailLoginCode,
      confirmEmailLogin,
      clearPendingEmailAuth,
      requestLinkProvider,
      confirmLinkProvider,
      unlinkProvider,
      logout,
      deleteAccount,
      joinStudy,
      joinByInvite,
      leaveStudy,
      deleteStudy,
      updateStudyName,
      setStudyAdmin,
      leadOffers,
      studyLeads,
      requestLeadTransfer,
      cancelLeadTransfer,
      respondLeadTransfer,
      createStudy,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      addNotice,
      updateNotice,
      deleteNotice,
      addAssignment,
      updateAssignment,
      deleteAssignment,
      toggleAttendance,
      toggleAssignment,
      submitAssignment,
      clearAssignmentSubmission,
      attendanceRate,
      assignmentRate,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
