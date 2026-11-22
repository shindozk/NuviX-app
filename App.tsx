import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as NavigationBar from 'expo-navigation-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar, Platform, StyleSheet, View, BackHandler, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import React from 'react';

import { alpha, colors, shape } from './src/theme';

/**
 * React Native Paper theme built from the same Material 3 role table as
 * `src/theme.ts`, so Paper components and the hand-built primitives match.
 */
const nuvixTheme = {
  ...MD3DarkTheme,
  dark: true,
  roundness: shape.md,
  version: 3,
  isV3: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    primaryContainer: colors.primaryContainer,
    onPrimaryContainer: colors.onPrimaryContainer,
    inversePrimary: '#2F6B45',

    secondary: colors.secondary,
    onSecondary: colors.onSecondary,
    secondaryContainer: colors.secondaryContainer,
    onSecondaryContainer: colors.onSecondaryContainer,

    tertiary: colors.tertiary,
    onTertiary: colors.onTertiary,
    tertiaryContainer: colors.tertiaryContainer,
    onTertiaryContainer: colors.onTertiaryContainer,

    error: colors.error,
    onError: colors.onError,
    errorContainer: colors.errorContainer,
    onErrorContainer: colors.onErrorContainer,

    background: colors.background,
    onBackground: colors.onSurface,
    surface: colors.surface,
    onSurface: colors.onSurface,
    surfaceVariant: colors.surfaceVariant,
    onSurfaceVariant: colors.onSurfaceVariant,
    surfaceDisabled: alpha(colors.onSurface, 0.12),
    onSurfaceDisabled: colors.textDisabled,
    inverseSurface: colors.inverseSurface,
    inverseOnSurface: colors.onInverseSurface,

    outline: colors.outline,
    outlineVariant: colors.outlineVariant,
    shadow: colors.shadow,
    scrim: colors.scrim,

    backdrop: alpha(colors.surfaceContainerLowest, 0.6),
    notification: colors.surfaceContainerHigh,

    elevation: {
      level0: 'transparent',
      level1: colors.surfaceContainerLow,
      level2: colors.surfaceContainer,
      level3: colors.surfaceContainerHigh,
      level4: colors.surfaceContainerHighest,
      level5: colors.surfaceBright,
    },
  },
} as typeof MD3DarkTheme;

import BootAnimation from './src/boot/BootAnimation';
import { useSettings } from './src/settings';
import FloatingMenu, { type FloatingMenuHandle } from './src/ui/FloatingMenu';
import SettingsPanel from './src/ui/SettingsPanel';
import TouchControls from './src/ui/TouchControls';
import GameWebView, { type GameWebViewHandle } from './src/web/GameWebView';
import { setSoundsEnabled } from './src/ui/sound';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const KEEP_AWAKE_TAG = 'xcloud-play';

function Root() {
  const { settings, update, reset } = useSettings();
  const [booting, setBooting] = React.useState(true);
  const [settingsVisible, setSettingsVisible] = React.useState(false);
  const webRef = React.useRef<GameWebViewHandle>(null);
  const menuRef = React.useRef<FloatingMenuHandle>(null);

  // The app always runs in landscape, including the boot animation.
  // A watcher re-locks landscape whenever the device/app flips to portrait.
  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    const lockLandscape = () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(
        () => undefined
      );
    };
    lockLandscape();

    // Detect portrait orientation changes and force landscape again.
    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      const orientation = event.orientationInfo.orientation;
      if (
        orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
        orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN
      ) {
        lockLandscape();
      }
    });

    // Fallback: dimensions-based portrait detection.
    const dimsSub = Dimensions.addEventListener('change', ({ window }: { window: { width: number; height: number } }) => {
      if (window.width < window.height) lockLandscape();
    });

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
      dimsSub?.remove?.();
    };
  }, []);

  React.useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);

    // Match the system bars and window background to the Material You surface,
    // so nothing flashes white behind the WebView.
    SystemUI.setBackgroundColorAsync(colors.surface).catch(() => undefined);
    if (Platform.OS === 'android') {
      NavigationBar.setStyle('dark');
      NavigationBar.setVisibilityAsync('hidden').catch(() => undefined);
    }
  }, []);

  // Interface sounds follow the user setting.
  React.useEffect(() => {
    setSoundsEnabled(settings.uiSounds);
  }, [settings.uiSounds]);

  // Keep the screen on while a stream is running.
  React.useEffect(() => {
    if (!settings.keepAwake) {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
      return;
    }
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [settings.keepAwake]);

  // Force app into fullscreen mode on start (browser only)
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;

    const requestFullscreen = () => {
      const doc = document as any;
      if (doc.documentElement) {
        doc.documentElement.requestFullscreen?.().catch(() => {});
      }
    };
    // Try immediately, then on next tick if needed
    requestFullscreen();
    const handleOrientationChange = () => requestFullscreen();
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // Android Back button handling
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    
    const onBackPress = () => {
      if (settingsVisible) {
        setSettingsVisible(false);
        return true;
      }
      if (menuRef.current?.isOpen()) {
        menuRef.current.close();
        return true;
      }
      if (settings.touchControls) {
        update({ touchControls: false });
        return true;
      }
      // Navigate to home in the webview
      webRef.current?.goHome();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [settingsVisible, settings.touchControls, update]);

  // Rumble coming from the real gamepad through the website.
  const handleMessage = React.useCallback((message: Record<string, unknown>) => {
    if (message.type !== 'haptic') return;
    if (Platform.OS === 'web') return;
    const intensity = Number(message.intensity ?? 1);
    const duration = Number(message.duration ?? 120);
    if (!duration || intensity <= 0) return;
    const style =
      intensity > 0.66
        ? Haptics.ImpactFeedbackStyle.Heavy
        : intensity > 0.33
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(style).catch(() => undefined);
  }, []);

  const runTouchScript = React.useCallback((script: string) => {
    webRef.current?.run(script);
  }, []);

  const handleAction = React.useCallback(
    (action: string) => {
      switch (action) {
        case 'home':
          webRef.current?.goHome();
          break;
        case 'reload':
          webRef.current?.reload();
          break;
        case 'touch':
          update({ touchControls: !settings.touchControls });
          break;
        case 'settings':
          setSettingsVisible(true);
          break;
        case 'exit':
          if (Platform.OS === 'android') {
            // Try to finish the activity
            BackHandler.exitApp();
          }
          break;
        default:
          break;
      }
    },
    [settings.touchControls, update]
  );

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      {booting ? (
        <BootAnimation onFinish={() => setBooting(false)} />
      ) : (
        <View style={styles.stage}>
          <GameWebView ref={webRef} settings={settings} onMessage={handleMessage} />
          {settings.touchControls && <TouchControls run={runTouchScript} />}
          <FloatingMenu ref={menuRef} onAction={handleAction} touchControlsOn={settings.touchControls} />
          <SettingsPanel
            visible={settingsVisible}
            settings={settings}
            onChange={update}
            onClose={() => setSettingsVisible(false)}
            onLogin={() => {
              setSettingsVisible(false);
              webRef.current?.login();
            }}
            onReset={() => {
              reset().catch(() => undefined);
            }}
          />
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={nuvixTheme}>
        <Root />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  stage: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});