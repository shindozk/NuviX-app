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
import { strings } from '../i18n';
import { IconButton } from './m3';
import { playUiSound } from './sound';

export type SidePanelSide = 'left' | 'right';

type Props = {
  visible: boolean;
  side?: SidePanelSide;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
};

/**
 * Material 3 modal side sheet: a rounded surface that slides in over a soft
 * scrim and can be dismissed by dragging it towards its edge. It is used for
 * the floating menu options panel; the settings form lives in a bottom sheet.
 */
export default function SidePanel({
  visible,
  side = 'right',
  title,
  onClose,
  children,
  width = 360,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const sheetWidth = Math.min(width, Math.max(240, screenWidth - 48));
  const direction = side === 'right' ? 1 : -1;

  const [rendered, setRendered] = useState(visible);

  const translateX = useRef(new Animated.Value(direction * sheetWidth)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const translateRef = useRef(direction * sheetWidth);

  useEffect(() => {
    const listener = translateX.addListener(({ value }) => {
      translateRef.current = value;
    });
    return () => translateX.removeListener(listener);
  }, [translateX]);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.spring(translateX, {
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
        Animated.timing(translateX, {
          toValue: direction * sheetWidth,
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
  }, [visible, direction, sheetWidth, translateX, backdrop]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gesture) =>
        direction > 0 ? gesture.dx < -6 : gesture.dx > 6,
      onPanResponderMove: (_event, gesture) => {
        const travelled = direction > 0 ? Math.min(0, gesture.dx) : Math.max(0, gesture.dx);
        translateX.setValue(travelled);
      },
      onPanResponderRelease: (_event, gesture) => {
        const travelled = direction > 0 ? Math.min(0, gesture.dx) : Math.max(0, gesture.dx);
        const velocityOk = direction > 0 ? gesture.vx < -0.4 : gesture.vx > 0.4;
        const shouldClose = Math.abs(travelled) > 90 || velocityOk;
        if (shouldClose) {
          onClose();
          return;
        }
        Animated.spring(translateX, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          mass: 0.9,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        translateX.setValue(0);
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
            side === 'left' ? styles.sheetLeft : styles.sheetRight,
            { width: sheetWidth, transform: [{ translateX }] },
          ]}
        >
          <View style={styles.sheetTint} pointerEvents="none" />

          <View
            style={[styles.handle, { marginTop: Math.max(insets.top, spacing.sm) + spacing.xs }]}
            {...pan.panHandlers}
          />

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

          <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
            {children}
          </View>
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
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    borderColor: alpha(colors.onSurface, 0.08),
    backgroundColor: colors.surfaceContainer,
    shadowColor: colors.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  sheetLeft: {
    left: 0,
    borderTopRightRadius: shape.xl,
    borderBottomRightRadius: shape.xl,
    borderRightWidth: 1,
  },
  sheetRight: {
    right: 0,
    borderTopLeftRadius: shape.xl,
    borderBottomLeftRadius: shape.xl,
    borderLeftWidth: 1,
  },
  sheetTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: alpha(colors.surfaceContainerLow, 0.35),
  },
  handle: {
    alignSelf: 'center',
    width: 34,
    height: 4,
    borderRadius: shape.full,
    backgroundColor: alpha(colors.onSurface, 0.22),
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    ...typeScale.titleLarge,
    color: colors.onSurface,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
});
