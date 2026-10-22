/**
 * 루트 — 폰트 · ThemeProvider · AppProvider · 네비게이션
 */
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { UnsavedProvider } from '@/src/navigation/UnsavedGuard';
import { AppProvider, useApp } from '@/src/store/AppContext';
import { ThemeProvider, useTheme } from '@/src/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, user, pendingSocial, joinedStudyIds } = useApp();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    const root = segments[0];
    const screen = segments[1];
    const inAuth = root === '(auth)';
    const inOnboarding =
      root === 'studies' || (root === '(tabs)' && screen === 'studies');
    const onNickname = inAuth && screen === 'nickname';

    if (!user && !inAuth) {
      router.replace('/(auth)/login');
      return;
    }

    if (!user && onNickname && pendingSocial) {
      return;
    }

    if (!user && onNickname && !pendingSocial) {
      router.replace('/(auth)/login');
      return;
    }

    if (user && inAuth) {
      if (joinedStudyIds.length === 0) {
        router.replace('/studies/join');
      } else {
        router.replace('/(tabs)');
      }
      return;
    }

    if (user && joinedStudyIds.length === 0 && !inOnboarding) {
      router.replace('/studies/join');
    }
  }, [ready, user, pendingSocial, joinedStudyIds, segments, router]);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.cream,
        }}
      >
        <ActivityIndicator color={colors.peach} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootNavigator() {
  const { themeId, colors } = useTheme();
  return (
    <Stack
      key={themeId}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider>
      <AppProvider>
        <UnsavedProvider>
          <StatusBar style="dark" />
          <AuthGate>
            <RootNavigator />
          </AuthGate>
        </UnsavedProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
