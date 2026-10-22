import { Redirect } from 'expo-router';

/** 출석은 스터디 홈으로 이동했습니다. */
export default function AttendanceRedirect() {
  return <Redirect href="/(tabs)" />;
}
