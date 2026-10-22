import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AppColors,
  DEFAULT_THEME_ID,
  getTheme,
  normalizeThemeId,
  ThemeDef,
  ThemeId,
  THEMES,
} from '@/src/theme/palettes';
import { syncThemeColors } from '@/src/theme/activeColors';

const STORAGE_KEY = 'studybuddy.theme';

type ThemeContextValue = {
  ready: boolean;
  themeId: ThemeId;
  theme: ThemeDef;
  colors: AppColors;
  themes: ThemeDef[];
  setThemeId: (id: ThemeId) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const id = normalizeThemeId(raw);
        if (alive && id) {
          setThemeIdState(id);
          if (raw === 'coral') {
            await AsyncStorage.setItem(STORAGE_KEY, id);
          }
        }
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setThemeId = useCallback(async (id: ThemeId) => {
    setThemeIdState(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  const theme = useMemo(() => getTheme(themeId), [themeId]);

  useEffect(() => {
    syncThemeColors(theme.colors);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ready,
      themeId,
      theme,
      colors: theme.colors,
      themes: THEMES,
      setThemeId,
    }),
    [ready, themeId, theme, setThemeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/** ThemeProvider 밖에서 쓰일 때(테스트 등) 기본 팔레트 */
export function useColors(): AppColors {
  const ctx = useContext(ThemeContext);
  return ctx?.colors ?? getTheme(DEFAULT_THEME_ID).colors;
}
