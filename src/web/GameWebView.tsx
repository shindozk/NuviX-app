import React, { forwardRef, useMemo, useRef, useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import RawWebView, {
  type WebViewMessageEvent,
  type WebViewProps,
} from 'react-native-webview';

import { HOME_URL, userAgentFor, type Settings } from '../settings';
import { BRIDGE_JS } from '../utils/bridge';
import { colors } from '../theme';

type WebViewInstance = {
  reload: () => void;
  goBack: () => void;
  injectJavaScript: (script: string) => void;
  clearCache?: (includeDiskFiles: boolean) => void;
  clearHistory?: () => void;
};

type GameWebViewHandle = {
  reload: () => void;
  goHome: () => void;
  login: () => void;
  fullscreen: () => void;
  run: (script: string) => void;
  clearData: () => Promise<void>;
};

type Props = {
  settings: Settings;
  onMessage?: (message: Record<string, unknown>) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
};

const GameWebView = forwardRef<GameWebViewHandle, Props>(function GameWebView(
  { settings, onMessage, onLoadStart, onLoadEnd },
  ref
) {
  const webRef = useRef<WebViewInstance>(null);
  const userAgent = useMemo(() => userAgentFor(settings), [settings]);
  const [loading, setLoading] = useState(true);

  const run = (script: string) => {
    webRef.current?.injectJavaScript(`${script}; true;`);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    if (!onMessage) return;
    try {
      const payload = JSON.parse(event.nativeEvent.data) as Record<string, unknown>;
      onMessage(payload);
    } catch {
      // Ignore non JSON messages coming from the page.
    }
  };

  useImperativeHandle(ref, () => ({
    reload: () => {
      setLoading(true);
      webRef.current?.reload();
    },
    goHome: () => run('window.__xcpGoHome && window.__xcpGoHome()'),
    login: () => run("window.location.href = 'https://login.live.com/'"),
    fullscreen: () => run('window.__xcpFullscreen && window.__xcpFullscreen()'),
    run,
    clearData: async () => {
      await webRef.current?.clearCache?.(false);
      webRef.current?.clearHistory?.();
      // Re-mounting the WebView is the reliable way to drop cookies.
      webRef.current?.reload();
    },
  }));

  useEffect(() => {
    // Apply zoom when settings change
    if (!loading) {
      run(`window.__xcpZoom && window.__xcpZoom(${settings.zoom})`);
    }
  }, [settings.zoom, loading, run]);

  return (
    <View style={styles.root}>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Carregando Xbox Cloud Gaming...</Text>
        </View>
      )}
      <RawWebView
        ref={webRef}
        source={{ uri: HOME_URL }}
        userAgent={userAgent}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        setSupportMultipleWindows={false}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        injectedJavaScriptBeforeContentLoaded={BRIDGE_JS}
        injectedJavaScript={BRIDGE_JS}
        onMessage={handleMessage}
        onLoadStart={() => {
          setLoading(true);
          onLoadStart?.();
        }}
        onLoadEnd={() => {
          setLoading(false);
          onLoadEnd?.();
        }}
        onContentProcessDidTerminate={() => webRef.current?.reload()}
        onRenderProcessGone={() => webRef.current?.reload()}
        style={styles.webview}
        containerStyle={styles.webview}
        bounces={false}
        overScrollMode="never"
        androidLayerType="hardware"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 10, 8, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
});

export default GameWebView;
export type { GameWebViewHandle };