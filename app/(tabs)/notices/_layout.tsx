import { Stack } from 'expo-router';

import { useColors } from '@/src/theme';

export default function NoticesLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.ink,
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen name="index" options={{ title: '공지' }} />
      <Stack.Screen name="[id]" options={{ title: '공지 상세' }} />
    </Stack>
  );
}
