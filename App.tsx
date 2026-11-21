import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar, Platform, StyleSheet, View, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React from 'react';

import BootAnimation from './src/boot/BootAnimation';
import { useSettings } from './src/settings';
import FloatingMenu from './src/ui/FloatingMenu';
import SettingsPanel from './src/ui/SettingsPanel';
import TouchControls from './src/ui/TouchControls';
import GameWebView, { type GameWebViewHandle } from './src/web/GameWebView';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const KEEP_AWAKE_TAG = 'xcloud-play';

function Root() {
  const { settings, update, reset } = useSettings();
  const [booting, setBooting] = React.useState(true);
  const [settingsVisible, setSettingsVisible] = React.useState(false);
  const webRef = React.useRef<GameWebViewHandle>(null);

  // The app always runs in landscape, including the boot animation.
  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => undefined);
  }, []);

  React.useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

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

  // Force app into fullscreen mode on start
  React.useEffect(() => {
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
          <FloatingMenu onAction={handleAction} touchControlsOn={settings.touchControls} />
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
      <Root />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  stage: {
    flex: 1,
  },
});