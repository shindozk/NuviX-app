import { useEvent } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { strings } from '../i18n';
import { colors } from '../theme';

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
    onFinish();
  }, [onFinish]);

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
    const timer = setTimeout(() => setTapHintVisible(false), 2500);
    return () => clearTimeout(timer);
  }, [isPlaying]);

  return (
    <Pressable style={styles.root} onPress={finish} accessibilityLabel={strings.bootSkip}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        nativeControls={false}
        contentFit="cover"
        allowsPictureInPicture={false}
      />
      <View style={styles.bottom}>
        <Text style={[styles.skip, !tapHintVisible && styles.skipHidden]}>{strings.bootSkip}</Text>
      </View>
    </Pressable>
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
  skipHidden: {
    opacity: 0,
  },
});
