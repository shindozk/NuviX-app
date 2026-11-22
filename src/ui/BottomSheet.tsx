import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

import { alpha, colors, duration, easing, shape, spacing, typeScale } from '../theme';
import { IconButton } from './m3';
import { playUiSound } from './sound';

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Fraction of the screen height the sheet covers when open. */
  heightRatio?: number;
};

/**
 * Material 3 modal bottom sheet: a rounded surface that slides up from the
 * bottom edge over a soft scrim, can be dismissed by dragging down or tapping
 * outside, and handles the safe area at the bottom.
 */
export default function BottomSheet({
  visible,
  title,
  onClose,
  children,
  heightRatio = 0.82,
}: Props) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const sheetHeight = Math.round(screenHeight * heightRatio);
  const closedY = sheetHeight + insets.bottom;

  const [rendered, setRendered] = useState(visible);

  const translateY = useRef(new Animated.Value(closedY)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 22,
          stiffness: 200,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: duration.medium2,
          easing: easing.standard,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: closedY,
          duration: duration.medium1,
          easing: easing.accelerate,
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 0,
          duration: duration.short,
          easing: easing.standard,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [visible, closedY, translateY, backdrop]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gesture) => gesture.dy > 6,
      onPanResponderMove: (_event, gesture) => {
        translateY.setValue(Math.max(0, gesture.dy));
      },
      onPanResponderRelease: (_event, gesture) => {
        const shouldClose = gesture.dy > 90 || gesture.vy > 0.5;
        if (shouldClose) {
          onClose();
          return;
        }
        Animated.spring(translateY, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          mass: 0.9,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        translateY.setValue(0);
      },
    })
  ).current;

  if (!rendered) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      hardwareAccelerated={Platform.OS === 'android'}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdrop }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: Math.max(insets.bottom, spacing.lg),
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.sheetTint} pointerEvents="none" />

          <View style={styles.handle} {...pan.panHandlers} />

          <View style={styles.header}>
            {title ? (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <IconButton
              icon={faXmark}
              onPress={() => {
                playUiSound('tap', 0.3);
                onClose();
              }}
              variant="standard"
              accessibilityLabel="Close"
            />
          </View>

          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    backgroundColor: colors.scrim,
    opacity: 0,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: shape.xl,
    borderTopRightRadius: shape.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: alpha(colors.onSurface, 0.08),
    borderBottomWidth: 0,
    backgroundColor: colors.surfaceContainer,
    shadowColor: colors.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
  sheetTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: alpha(colors.surfaceContainerLow, 0.45),
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: shape.full,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: alpha(colors.onSurface, 0.24),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typeScale.titleLarge,
    color: colors.onSurface,
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
