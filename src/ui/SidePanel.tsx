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
import { BlurView } from 'expo-blur';
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
 * Material 3 modal side sheet: a rounded, blurred surface that slides in over a
 * soft scrim, and can be dismissed by dragging it towards its edge.
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
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const translateRef = useRef(direction * sheetWidth);

  useEffect(() => {
    const listener = translateX.addListener(({ value }) => {
      translateRef.current = value;
    });
    return () => translateX.removeListener(listener);
  }, [translateX]);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      translateX.setValue(direction * sheetWidth * 0.3);

      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          friction: 9,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: duration.medium2,
          easing: easing.emphasizedDecelerate,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: duration.short4,
          easing: easing.standard,
          useNativeDriver: true,
        }).start();
      });

      playUiSound('open', 0.4);
      return;
    }

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: direction * sheetWidth,
        duration: duration.medium1,
        easing: easing.emphasizedAccelerate,
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 0,
        duration: duration.short4,
        easing: easing.standard,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: duration.short3,
        easing: easing.standard,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setRendered(false);
    });

    playUiSound('close', 0.3);
    // Only run on visibility changes, not on width changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = useRef(
    PanResponder.create({
      // Claim horizontal drags only, so vertical lists keep scrolling.
      onMoveShouldSetPanResponder: (_event, gesture) =>
        Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderMove: (_event, gesture) => {
        const next = translateRef.current + gesture.dx;
        const limit = sheetWidth * 0.9;
        translateX.setValue(Math.max(-limit, Math.min(limit, next)));

        const travelled = side === 'right' ? next / sheetWidth : -next / sheetWidth;
        backdrop.setValue(Math.max(0, 1 - Math.max(0, travelled)));
      },
      onPanResponderRelease: (_event, gesture) => {
        const travelled = side === 'right' ? translateRef.current : -translateRef.current;
        const shouldClose = travelled > sheetWidth * 0.32 || gesture.vx * direction > 0.6;

        if (shouldClose) {
          onCloseRef.current();
          return;
        }
        Animated.spring(translateX, {
          toValue: 0,
          friction: 9,
          tension: 80,
          useNativeDriver: true,
        }).start();
        Animated.timing(backdrop, {
          toValue: 1,
          duration: duration.short3,
          easing: easing.standard,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          friction: 9,
          tension: 80,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  if (!rendered) return null;

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdrop }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel={strings.close}
            accessibilityRole="button"
          />
        </Animated.View>

        <Animated.View
          {...pan.panHandlers}
          style={[
            styles.sheet,
            side === 'right' ? styles.sheetRight : styles.sheetLeft,
            { width: sheetWidth, transform: [{ translateX }] },
          ]}
        >
          <BlurView
            intensity={Platform.OS === 'android' ? 56 : 72}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.sheetTint]} />

          <Animated.View style={[styles.inner, { opacity: contentOpacity }]}>
            <View style={styles.handle} />

            <View
              style={[
                styles.header,
                { paddingTop: insets.top > 0 ? insets.top * 0.5 + spacing.sm : spacing.md },
              ]}
            >
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <IconButton
                icon={faXmark}
                variant="tonal"
                onPress={onClose}
                accessibilityLabel={strings.close}
              />
            </View>

            <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
              {children}
            </View>
          </Animated.View>
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
    backgroundColor: alpha(colors.surfaceContainerLow, 0.84),
  },
  inner: {
    flex: 1,
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
