import { createElement, useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { strings } from '../i18n';
import { colors } from '../theme';

type Props = {
  onFinish: () => void;
};

/**
 * Web preview of the boot animation. Browsers block autoplay with sound, so
 * the video starts muted and unmutes on the first tap. On Android the native
 * player (BootAnimation.tsx) plays it with full audio.
 */
export default function BootAnimation({ onFinish }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const finished = useRef(false);

  const source = useMemo(() => {
    // Metro turns the asset into a module (or a plain URL, depending on the bundle).
    const asset = require('../../assets/boot.mp4') as unknown;
    const candidate =
      typeof asset === 'string'
        ? asset
        : (asset as { uri?: string; default?: string | { uri?: string } })?.uri ??
          (asset as { default?: string | { uri?: string } })?.default;
    if (typeof candidate === 'string') return candidate;
    return candidate?.uri ?? '';
  }, []);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => finish());
    });
    const timeout = setTimeout(finish, 45000);
    return () => clearTimeout(timeout);
  }, [finish]);

  return (
    <View style={styles.root}>
      {createElement('video', {
        ref: videoRef,
        src: source,
        autoPlay: true,
        playsInline: true,
        muted: false,
        onEnded: finish,
        onError: finish,
        style: {
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: '#000000',
        },
      })}
      <Pressable style={StyleSheet.absoluteFill} onPress={finish} accessibilityLabel={strings.bootSkip}>
        <View style={styles.bottom}>
          <Text style={styles.skip}>{strings.bootSkip}</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 22,
    alignItems: 'center',
  },
  skip: {
    color: colors.textDim,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
});
