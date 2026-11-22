import { useEvent } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Animated } from 'react-native';

import { strings } from '../i18n';
import { alpha, colors, duration, easing, radius, typeScale } from '../theme';

type Props = {
  onFinish: () => void;
};

/**
 * Full screen Xbox boot animation. Plays the local video with sound and moves
 * on to the website when it ends (or when the user taps to skip).
 */
export default function BootAnimation({ onFinish }: Props) {
  const finished = useRef(false);
  const [tapHintVisible, setTapHintVisible] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;
  const hintFade = useRef(new Animated.Value(0)).current;

  const player = useVideoPlayer(require('../../assets/boot.mp4'), (instance) => {
    instance.loop = false;
    instance.volume = 1;
    instance.muted = false;
    instance.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    Animated.timing(opacity, {
      toValue: 0,
      duration: duration.short4,
      easing: easing.standard,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  }, [onFinish, opacity]);

  useEffect(() => {
    const subscription = player.addListener('playToEnd', finish);
    const subscriptionEnd = player.addListener('statusChange', (payload) => {
      if (payload.status === 'error') finish();
    });
    // Safety net: never trap the user on the boot screen.
    const timeout = setTimeout(finish, 45000);
    return () => {
      subscription.remove();
      subscriptionEnd.remove();
      clearTimeout(timeout);
    };
  }, [player, finish]);

  useEffect(() => {
    if (!isPlaying) return;
    Animated.timing(opacity, {
      toValue: 1,
      duration: duration.short4,
      easing: easing.standard,
      useNativeDriver: true,
    }).start();
  }, [isPlaying, opacity]);

  // The skip chip appears after a beat, then fades away on its own.
  useEffect(() => {
    if (!tapHintVisible) return;
    const delay = setTimeout(() => {
      Animated.timing(hintFade, {
        toValue: 1,
        duration: duration.medium2,
        easing: easing.emphasizedDecelerate,
        useNativeDriver: true,
      }).start();
    }, 1600);

    const hide = setTimeout(() => {
      Animated.timing(hintFade, {
        toValue: 0,
        duration: duration.medium1,
        easing: easing.standard,
        useNativeDriver: true,
      }).start(({ finished: done }) => {
        if (done) setTapHintVisible(false);
      });
    }, 5200);

    return () => {
      clearTimeout(delay);
      clearTimeout(hide);
    };
  }, [hintFade, tapHintVisible]);

  return (
    <Pressable style={styles.root} onPress={finish} accessibilityLabel={strings.bootSkip}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        nativeControls={false}
        contentFit="cover"
        allowsPictureInPicture={false}
      />

      <Animated.View
        style={[styles.bottom, { opacity: opacity, transform: [{ translateY: hintFade.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}
        pointerEvents="none"
      >
        <Animated.View style={[styles.chip, { opacity: hintFade }]}>
          <View style={styles.dot} />
          <Text style={styles.skip}>{strings.bootSkip}</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: alpha(colors.surface, 0.55),
    borderWidth: 1,
    borderColor: alpha(colors.onSurface, 0.14),
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  skip: {
    ...typeScale.labelMedium,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.4,
  },
});
