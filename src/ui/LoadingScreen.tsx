import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';

import { alpha, colors, duration, shape, spacing, typeScale } from '../theme';
import { strings } from '../i18n';

type Props = {
  /** Loading state coming from the WebView. */
  visible: boolean;
};

const TRACK_WIDTH = 128;
const TRACK_HEIGHT = 4;
const BAR_WIDTH = 52;

/**
 * Material 3 loading screen: the brand mark on a tonal disc, a quiet
 * indeterminate bar and a small uppercase wordmark. Fades out as soon as the
 * WebView reports that the page is ready.
 */
export default function LoadingScreen({ visible }: Props) {
  const fade = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(visible);

  // Indeterminate bar + soft breathing on the logo.
  useEffect(() => {
    if (!visible) return;

    const bar = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    bar.start();
    breathe.start();

    return () => {
      bar.stop();
      breathe.stop();
    };
  }, [progress, pulse, visible]);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.timing(fade, {
        toValue: 1,
        duration: duration.medium1,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(fade, {
      toValue: 0,
      duration: duration.medium2,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setRendered(false);
    });
  }, [fade, visible]);

  if (!rendered) return null;

  const barTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-BAR_WIDTH, TRACK_WIDTH],
  });
  const logoScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.035],
  });

  return (
    <Animated.View style={[styles.root, { opacity: fade }]} pointerEvents="none">
      <View style={styles.mark}>
        <Animated.Image
          source={require('../../assets/xbox-mark.png')}
          style={[styles.logo, { transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.bar, { transform: [{ translateX: barTranslate }] }]} />
      </View>

      <Text style={styles.wordmark}>{strings.appName}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 20,
  },
  mark: {
    width: 112,
    height: 112,
    borderRadius: shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: alpha(colors.onSurface, 0.07),
  },
  logo: {
    width: 56,
    height: 56,
  },
  track: {
    marginTop: spacing.xxl,
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: shape.full,
    backgroundColor: colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: BAR_WIDTH,
    borderRadius: shape.full,
    backgroundColor: colors.primary,
  },
  wordmark: {
    marginTop: spacing.md,
    ...typeScale.labelSmall,
    color: colors.textTertiary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
