import { Redirect } from 'expo-router';

/** 계정 연결은 프로필 화면으로 통합 */
export default function AccountLinkRedirect() {
  return <Redirect href="/profile" />;
}
