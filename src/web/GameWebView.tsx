import { forwardRef, useImperativeHandle, useMemo, useRef, type ComponentType, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import RawWebView, {
  type WebViewMessageEvent,
  type WebViewProps,
} from 'react-native-webview';

import { HOME_URL, userAgentFor, type Settings } from '../settings';
import { BRIDGE_JS } from './bridge';

type WebViewInstance = {
  reload: () => void;
  goBack: () => void;
  injectJavaScript: (script: string) => void;
  clearCache?: (includeDiskFiles: boolean) => void;
  clearHistory?: () => void;
};

// react-native-webview ships a class whose generic props resolve to `never` on
// newer TypeScript versions, so we type the component we actually use here.
const WebView = RawWebView as unknown as ComponentType<
  WebViewProps & { ref?: Ref<WebViewInstance | null> }
>;

export type GameWebViewHandle = {
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

  const run = (script: string) => {
    webRef.current?.injectJavaScript(`${script}; true;`);
  };

  const applyZoom = () => {
    run(`window.__xcpZoom && window.__xcpZoom(${settings.zoom})`);
  };

  useImperativeHandle(ref, () => ({
    reload: () => webRef.current?.reload(),
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

  const handleMessage = (event: WebViewMessageEvent) => {
    if (!onMessage) return;
    try {
      const payload = JSON.parse(event.nativeEvent.data) as Record<string, unknown>;
      onMessage(payload);
    } catch {
      // Ignore non JSON messages coming from the page.
    }
  };

  return (
    <View style={styles.root}>
      <WebView
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
        onLoadStart={onLoadStart}
        onLoadEnd={() => {
          applyZoom();
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
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

export default GameWebView;
