/**
 * 계정·이메일·닉네임 순수 헬퍼 (UI/상태 없음)
 */

import {
  isOAuthProvider,
  makeUserId,
  normalizeEmail,
  SocialProfile,
  SocialProvider,
} from '@/src/auth/social';
import { EMAIL_CODE_CHARS, RESERVED_NICKNAMES } from '@/src/store/constants';
import type { LastLogin, User } from '@/src/store/types';

export function makeEmailVerifyCode() {
  for (;;) {
    let code = '';
    for (let i = 0; i < 6; i += 1) {
      code += EMAIL_CODE_CHARS[Math.floor(Math.random() * EMAIL_CODE_CHARS.length)];
    }
    if (/[A-Z]/.test(code) && /[0-9]/.test(code)) return code;
  }
}

export function migrateUser(raw: any): User | null {
  if (!raw?.email || !raw?.nickname) return null;
  const provider: SocialProvider = raw.provider ?? raw.lastProvider ?? 'google';
  const providers: SocialProvider[] = Array.isArray(raw.providers) ? raw.providers : [provider];
  return {
    id: raw.id ?? makeUserId(),
    email: raw.email,
    emailVerified: Boolean(raw.emailVerified),
    nickname: raw.nickname,
    providers,
    emailsByProvider: raw.emailsByProvider ?? { [provider]: raw.email },
    lastProvider: raw.lastProvider ?? provider,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

export function normalizeNickname(nickname: string) {
  return nickname.trim().toLowerCase().replace(/\s+/g, '');
}

export function isReservedNickname(nickname: string) {
  const key = normalizeNickname(nickname);
  return RESERVED_NICKNAMES.some((r) => normalizeNickname(r) === key);
}

export function accountOwnsEmail(account: User, email: string) {
  const target = normalizeEmail(email);
  if (normalizeEmail(account.email) === target) return true;
  return Object.values(account.emailsByProvider).some(
    (e) => e && normalizeEmail(e) === target,
  );
}

export function findAccountByEmail(accounts: User[], email: string) {
  return accounts.find((a) => accountOwnsEmail(a, email)) ?? null;
}

/** 이메일 전용 회원 (간편로그인과 별도 트랙) */
export function isEmailAccount(account: Pick<User, 'providers'>) {
  return account.providers.includes('email') && !account.providers.some(isOAuthProvider);
}

export function isSocialAccount(account: Pick<User, 'providers'>) {
  return account.providers.some(isOAuthProvider);
}

export function toLastLogin(user: User): LastLogin {
  return {
    provider: user.lastProvider,
    email: user.emailsByProvider[user.lastProvider] ?? user.email,
    nickname: user.nickname,
    userId: user.id,
    at: new Date().toISOString(),
  };
}

export function withLinkedProvider(user: User, profile: SocialProfile): User {
  const providers = user.providers.includes(profile.provider)
    ? user.providers
    : [...user.providers, profile.provider];
  return {
    ...user,
    providers,
    emailsByProvider: {
      ...user.emailsByProvider,
      [profile.provider]: profile.email,
    },
    lastProvider: profile.provider,
  };
}

export function normalizeAssignmentSubmitMode(
  raw: { submitMode?: 'file' | 'memo' },
): 'file' | 'memo' {
  return raw.submitMode === 'file' ? 'file' : 'memo';
}
