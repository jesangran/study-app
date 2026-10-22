import { Stack } from 'expo-router';

import { useColors } from '@/src/theme';

export default function StudiesLayout() {
  const colors = useColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Screen name="join" />
      <Stack.Screen name="create" />
      <Stack.Screen name="[studyId]" />
    </Stack>
  );
}
