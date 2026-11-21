import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const SEGMENTS = 24;
const SEGMENT_WIDTH = 2.5;
const SEGMENT_HEIGHT = 9;
const RADIUS = 62;
const RING = (RADIUS + SEGMENT_HEIGHT) * 2;

type Props = {
  /** Loading state coming from the WebView. */
  visible: boolean;
};

/**
 * Loading screen: a white Xbox mark with a segmented progress ring drawn
 * around it. The ring fills clockwise while the page is on its way and the
 * screen fades away once the WebView reports the page is ready.
 */
export default function LoadingScreen({ visible }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const mounted = useRef(visible);
  const [rendered, setRendered] = useState(visible);

  // Soft breathing on the logo so the screen never looks frozen.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    if (visible) {
      mounted.current = true;
      setRendered(true);
      progress.stopAnimation();
      progress.setValue(0);
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
      // Estimated progress: quick at first, then crawling near the end, so the
      // ring keeps moving until the real page load completes it.
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 0.55,
          duration: 1500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0.82,
          duration: 2800,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0.94,
          duration: 6000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]).start();
      return;
    }

    if (!mounted.current) return;
    progress.stopAnimation();
    Animated.timing(progress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          mounted.current = false;
          setRendered(false);
        }
      });
    });
  }, [visible, progress, fade]);

  if (!rendered) return null;

  const logoScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  return (
    <Animated.View
      style={[styles.root, { opacity: fade }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.center}>
        <View style={styles.ring}>
          {Array.from({ length: SEGMENTS }).map((_, index) => {
            const start = index / SEGMENTS;
            const end = (index + 1) / SEGMENTS;
            const opacity = progress.interpolate({
              inputRange: [0, start, end],
              outputRange: [0.14, 0.14, 1],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[
                  styles.segment,
                  {
                    opacity,
                    transform: [
                      { rotate: `${(360 / SEGMENTS) * index}deg` },
                      { translateY: -RADIUS },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>
        <Animated.Image
          source={require('../../assets/xbox-mark.png')}
          style={[styles.logo, { transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />
      </View>
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
    backgroundColor: '#060708',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  center: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    position: 'absolute',
    width: SEGMENT_WIDTH,
    height: SEGMENT_HEIGHT,
    borderRadius: SEGMENT_WIDTH,
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 92,
    height: 92,
  },
});
