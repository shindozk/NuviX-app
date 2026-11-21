import { forwardRef, useImperativeHandle, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { strings } from '../i18n';
import { colors } from '../theme';
import type { GameWebViewHandle } from './GameWebView';

type Props = {
  settings: { zoom: number };
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
};

/**
 * Web preview only. play.xbox.com refuses to load inside an iframe, so the
 * browser build shows a lightweight mock of the stream screen instead. The
 * Android build uses GameWebView.tsx and the real website.
 */
const GameWebView = forwardRef<GameWebViewHandle, Props>(function GameWebView(_props, ref) {
  const [homeCount, setHomeCount] = useState(0);

  useImperativeHandle(ref, () => ({
    reload: () => setHomeCount((value) => value + 1),
    goHome: () => setHomeCount((value) => value + 1),
    login: () => undefined,
    fullscreen: () => undefined,
    run: () => undefined,
    clearData: async () => undefined,
  }));

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>X</Text>
        </View>
        <Text style={styles.title}>Xbox Cloud Gaming</Text>
        <Text style={styles.badge}>{strings.previewBadge}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.heading}>{strings.previewTitle}</Text>
        <Text style={styles.hint}>{strings.streamHint}</Text>
        <Text style={styles.notice}>{strings.previewNotice}</Text>
        <Text style={styles.hint}>
          play.xbox.com · {homeCount > 0 ? strings.reload : strings.home}
        </Text>
      </View>

      <View style={styles.grid}>
        {['Halo Infinite', 'Forza Horizon 5', 'Starfield', 'Sea of Thieves'].map((game) => (
          <View key={game} style={styles.card}>
            <Text style={styles.cardText}>{game}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0F0C',
    paddingHorizontal: 26,
    paddingVertical: 18,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 64,
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    marginLeft: 6,
    color: colors.accentBright,
    fontSize: 10,
    letterSpacing: 1.6,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heading: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  hint: {
    color: colors.textDim,
    fontSize: 13,
    textAlign: 'center',
  },
  notice: {
    color: colors.accentBright,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 8,
  },
  card: {
    flex: 1,
    aspectRatio: 1.6,
    borderRadius: 10,
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  cardText: {
    color: colors.textDim,
    fontSize: 11,
    textAlign: 'center',
  },
});

export default GameWebView;
