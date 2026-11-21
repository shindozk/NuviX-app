import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import RawWebView, {
  type WebViewMessageEvent,
  type WebViewNavigation,
} from 'react-native-webview';

import { HOME_URL, userAgentFor, type Settings } from '../settings';
import { BRIDGE_JS } from '../utils/bridge';
import { colors } from '../theme';
import LoadingScreen from '../ui/LoadingScreen';

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

/** Page load that never reports back must not trap the user behind the overlay. */
const LOAD_TIMEOUT_MS = 15000;

const GameWebView = forwardRef<GameWebViewHandle, Props>(function GameWebView(
  { settings, onMessage, onLoadStart, onLoadEnd },
  ref
) {
  const webRef = useRef<React.ComponentRef<typeof RawWebView>>(null);
  const userAgent = useMemo(() => userAgentFor(settings), [settings]);
  const [loading, setLoading] = useState(true);
  const ready = useRef(false);
  const startedAt = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoadTimeout = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
  }, []);

  const finishLoading = useCallback(() => {
    ready.current = true;
    clearLoadTimeout();
    setLoading(false);
    onLoadEnd?.();
  }, [clearLoadTimeout, onLoadEnd]);

  const startLoading = useCallback(() => {
    clearLoadTimeout();
    startedAt.current = Date.now();
    setLoading(true);
    onLoadStart?.();
    // Safety net: the WebView can swallow onLoadEnd (redirects, superseded
    // main-frame loads, renderer swaps), which used to leave the overlay up
    // forever over an already loaded page.
    timeout.current = setTimeout(finishLoading, LOAD_TIMEOUT_MS);
  }, [clearLoadTimeout, finishLoading, onLoadStart]);

  // The first navigation always starts from a blank WebView.
  useEffect(() => {
    startLoading();
    return clearLoadTimeout;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = (script: string) => {
    webRef.current?.injectJavaScript(`${script}; true;`);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    let payload: Record<string, unknown> | null = null;
    try {
      payload = JSON.parse(event.nativeEvent.data) as Record<string, unknown>;
    } catch {
      // Ignore non JSON messages coming from the page.
    }
    if (!payload) return;
    // The injected bridge posts "ready" once the page script is running.
    if (payload.type === 'ready') finishLoading();
    onMessage?.(payload);
  };

  useImperativeHandle(ref, () => ({
    reload: () => {
      ready.current = false;
      startLoading();
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
          // Only the first load (and explicit reloads) gets the overlay, so
          // in-page navigation does not flash it over the running app.
          if (!ready.current) startLoading();
        }}
        onLoad={() => finishLoading()}
        onLoadEnd={() => finishLoading()}
        onNavigationStateChange={(event: WebViewNavigation) => {
          // Android sometimes reports loading=false right after the first
          // commit, so ignore that for the first moments of a load.
          if (!event.loading && Date.now() - startedAt.current > 700) {
            finishLoading();
          }
        }}
        onHttpError={() => finishLoading()}
        onContentProcessDidTerminate={() => {
          ready.current = false;
          startLoading();
          webRef.current?.reload();
        }}
        onRenderProcessGone={() => {
          ready.current = false;
          startLoading();
          webRef.current?.reload();
        }}
        style={styles.webview}
        containerStyle={styles.webview}
        bounces={false}
        overScrollMode="never"
        androidLayerType="hardware"
      />
      <LoadingScreen visible={loading} />
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
});

export default GameWebView;
export type { GameWebViewHandle };
