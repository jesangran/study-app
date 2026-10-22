import { Stack } from 'expo-router';

import { useColors } from '@/src/theme';

export default function StudyIdLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.ink,
        contentStyle: { backgroundColor: colors.cream },
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: '스터디 홈', headerShown: false }} />
      <Stack.Screen name="attendance" options={{ title: '출석' }} />
      <Stack.Screen name="assignments" options={{ title: '과제' }} />
      <Stack.Screen name="notices" options={{ title: '공지' }} />
      <Stack.Screen name="members" options={{ title: '스터디원' }} />
      <Stack.Screen name="member/[memberId]" options={{ title: '스터디원 상세' }} />
    </Stack>
  );
}
