import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState, useRef } from 'react';

import { SUPPORTED_LANGUAGES, type LanguageCode } from './i18n';

export type UserAgentMode = 'mobile' | 'desktop' | 'tv' | 'custom';

// Build language options from supported languages
export const LANGUAGE_OPTIONS = SUPPORTED_LANGUAGES.map((lang) => ({
  code: lang.code,
  name: lang.name,
  flag: lang.flag,
}));

export type Settings = {
  userAgentMode: UserAgentMode;
  customUserAgent: string;
  zoom: number;
  keepAwake: boolean;
  touchControls: boolean;
  showPerformanceStats: boolean;
  enableHaptics: boolean;
  uiSounds: boolean;
  language: 'auto' | LanguageCode;
};

export const HOME_URL = 'https://play.xbox.com/';

export const ZOOM_OPTIONS = [90, 100, 110, 125] as const;

export const DEFAULT_SETTINGS: Settings = {
  userAgentMode: 'desktop',
  customUserAgent: '',
  zoom: 100,
  keepAwake: true,
  touchControls: false,
  showPerformanceStats: false,
  enableHaptics: true,
  uiSounds: true,
  language: 'auto',
};

const STORAGE_KEY = 'xcloud-play:settings:v2';

const UA_MOBILE =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36';
const UA_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0';
const UA_TV =
  'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) 76.0.3809.146/6.0 TV Safari/537.36';

export function userAgentFor(settings: Settings): string | undefined {
  switch (settings.userAgentMode) {
    case 'mobile':
      return UA_MOBILE;
    case 'desktop':
      return UA_DESKTOP;
    case 'tv':
      return UA_TV;
    case 'custom':
      return settings.customUserAgent.trim() || undefined;
    default:
      return undefined;
  }
}

export async function clearWebsiteData(): Promise<void> {
  await AsyncStorage.removeItem('xcloud-play:cookies');
  await AsyncStorage.removeItem('xcloud-play:cache');
  await AsyncStorage.removeItem('xcloud-play:history');
}

export async function resetSettings(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active || !isMounted.current) return;
        try {
          const parsed = JSON.parse(raw ?? '{}') as Partial<Settings>;
          setSettings((prev) => ({ ...prev, ...parsed }));
        } catch {
          // Invalid JSON, use defaults
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active && isMounted.current) setReady(true);
      });
    return () => {
      active = false;
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => undefined);
  }, [settings, ready]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const reset = useCallback(async () => {
    await resetSettings();
    if (isMounted.current) {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  return { settings, update, reset, ready };
}