/**
 * 간편로그인 (프로토타입 mock)
 * Android 전용: OAuth는 카카오·Google만. Apple은 과거 데이터 표시용.
 */

/** 지금 앱에서 새로 로그인·연결 가능한 제공자 */
export type OAuthProvider = 'kakao' | 'google';

/** 저장된 계정에 남을 수 있는 제공자 (Apple = 레거시) */
export type SocialProvider = OAuthProvider | 'apple' | 'email';

export type SocialProfile = {
  provider: OAuthProvider;
  email: string;
  suggestedNickname: string;
  avatarLabel: string;
};

type SignInOptions = {
  /** same: 카카오·구글이 같은 이메일인 경우(소셜끼리 자동 연결) 데모용 */
  emailMode?: 'default' | 'same';
};

const SHARED_EMAIL = 'ran@studybuddy.app';

/** 프로토타입용 간편로그인 목 프로필 (실 SDK 연동 전) */
export async function mockSocialSignIn(
  provider: OAuthProvider,
  options: SignInOptions = {},
): Promise<SocialProfile> {
  await new Promise((r) => setTimeout(r, 700));
  const same = options.emailMode === 'same';

  if (provider === 'kakao') {
    return {
      provider: 'kakao',
      email: same ? SHARED_EMAIL : 'ran.kakao@studybuddy.app',
      suggestedNickname: '카카오란',
      avatarLabel: '카',
    };
  }

  return {
    provider: 'google',
    email: same ? SHARED_EMAIL : 'ran.google@gmail.com',
    suggestedNickname: '구글란',
    avatarLabel: 'G',
  };
}

export function providerLabel(provider: SocialProvider) {
  if (provider === 'kakao') return '카카오';
  if (provider === 'google') return '구글';
  if (provider === 'apple') return 'Apple';
  return '이메일';
}

/** 현재 Android 빌드에서 OAuth로 쓸 수 있는지 */
export function isOAuthProvider(provider: SocialProvider): provider is OAuthProvider {
  return provider === 'kakao' || provider === 'google';
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function makeUserId() {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
