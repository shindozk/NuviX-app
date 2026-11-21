import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'xcloud-play:theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export function useTheme(theme: ThemeMode) {
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');
  const systemTheme = useColorScheme();

  useEffect(() => {
    const getEffectiveTheme = async () => {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      const savedTheme = stored ? JSON.parse(stored) : null;

      if (savedTheme && savedTheme !== 'system') {
        setEffectiveTheme(savedTheme);
      } else {
        setEffectiveTheme(systemTheme || 'dark');
      }
    };

    getEffectiveTheme();
  }, [systemTheme]);

  const setTheme = useCallback(async (newTheme: ThemeMode) => {
    if (newTheme === 'system') {
      setEffectiveTheme(systemTheme || 'dark');
    } else {
      setEffectiveTheme(newTheme);
    }
    await AsyncStorage.setItem(THEME_KEY, JSON.stringify(newTheme));
  }, [systemTheme]);

  return {
    theme: effectiveTheme,
    setTheme,
    isDark: effectiveTheme === 'dark',
  };
}

// Helper function to get theme styles
export function getThemedStyles(styles: ReturnType<typeof StyleSheet.create>) {
  // This can be extended to support dynamic theme switching
  return styles;
}