import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  faGamepad,
  faGear,
  faHouse,
  faPowerOff,
  faRotateRight,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

import { alpha, colors, duration, easing, elevation, radius, shape, spacing, typeScale } from '../theme';
import { strings } from '../i18n';
import FaIcon from './Icon';
import { ListRow, M3Switch } from './m3';
import { playUiSound } from './sound';

export type MenuAction = 'home' | 'reload' | 'touch' | 'settings' | 'exit';

type MenuItem = {
  action: MenuAction;
  icon: IconProp;
  labelKey: keyof typeof strings;
  danger?: boolean;
  toggle?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { action: 'home', icon: faHouse, labelKey: 'home' },
  { action: 'reload', icon: faRotateRight, labelKey: 'reload' },
  { action: 'touch', icon: faGamepad, labelKey: 'touchControls', toggle: true },
  { action: 'settings', icon: faGear, labelKey: 'settings' },
  { action: 'exit', icon: faPowerOff, labelKey: 'exit', danger: true },
];

const BUTTON_SIZE = 56;
const EDGE = 12;
const DOCK_OPACITY = 0.55;
const ACTIVE_OPACITY = 1;
const INACTIVITY_MS = 3200;
const TAP_SLOP = 8;

const MENU_WIDTH = 300;
const MENU_MARGIN = 12;
const MENU_GAP = 10;

type Props = {
  onAction: (action: MenuAction) => void;
  touchControlsOn: boolean;
};

const screen = Dimensions.get('window');

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

export type FloatingMenuHandle = { close: () => void; isOpen: () => boolean };

const FloatingMenu = forwardRef<FloatingMenuHandle, Props>(function FloatingMenu(
  { onAction, touchControlsOn },
  ref
) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  const [layout, setLayout] = useState({
    width: screen.width,
    height: screen.height,
    x: 0,
    anchorY: 0,
    cardW: MENU_WIDTH,
    cardH: 0,
    placeRight: true,
  });

  const progress = useRef(new Animated.Value(0)).current;
  const scrim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(DOCK_OPACITY)).current;

  const position = useRef(
    new Animated.ValueXY({
      x: screen.width - BUTTON_SIZE - EDGE,
      y: screen.height / 2 - BUTTON_SIZE / 2,
    })
  ).current;
  const positionRef = useRef({
    x: screen.width - BUTTON_SIZE - EDGE,
    y: screen.height / 2 - BUTTON_SIZE / 2,
  });

  const moved = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const listener = position.addListener(({ x, y }) => {
      positionRef.current = { x, y };
    });
    return () => position.removeListener(listener);
  }, [position]);

  const clearInactivity = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  };

  const wake = () => {
    clearInactivity();
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: ACTIVE_OPACITY,
        duration: duration.short2,
        easing: easing.standard,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1.06,
        speed: 30,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const dockToEdge = () => {
    const { width: w, height: h } = layout;
    const { x, y } = positionRef.current;
    const targetX = x + BUTTON_SIZE / 2 < w / 2 ? EDGE : w - BUTTON_SIZE - EDGE;
    const targetY = clamp(y, EDGE, h - BUTTON_SIZE - EDGE);

    Animated.parallel([
      Animated.spring(position, {
        toValue: { x: targetX, y: targetY },
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: openRef.current ? ACTIVE_OPACITY : DOCK_OPACITY,
        duration: duration.medium2,
        easing: easing.emphasizedDecelerate,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 25,
        useNativeDriver: true,
      }),
    ]).start();
    playUiSound('dock', 0.28);
  };

  const scheduleDock = (delay = INACTIVITY_MS) => {
    clearInactivity();
    inactivityTimer.current = setTimeout(() => {
      if (!openRef.current) dockToEdge();
    }, delay);
  };

  const openMenu = () => {
    const { width: w, height: h } = layout;
    const { x, y } = positionRef.current;

    const cardW = Math.min(MENU_WIDTH, w - MENU_MARGIN * 2);
    const placeRight = x + BUTTON_SIZE + MENU_GAP + cardW <= w - MENU_MARGIN;
    const rawX = placeRight ? x + BUTTON_SIZE + MENU_GAP : x - cardW - MENU_GAP;

    setLayout((current) => ({
      ...current,
      x: clamp(rawX, MENU_MARGIN, w - cardW - MENU_MARGIN),
      anchorY: y + BUTTON_SIZE / 2,
      cardW,
      placeRight,
    }));

    clearInactivity();
    openRef.current = true;
    setOpen(true);

    Animated.parallel([
      Animated.timing(progress, {
        toValue: 1,
        duration: duration.medium2,
        easing: easing.emphasizedDecelerate,
        useNativeDriver: true,
      }),
      Animated.timing(scrim, {
        toValue: 1,
        duration: duration.short4,
        easing: easing.standard,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: ACTIVE_OPACITY,
        duration: duration.short2,
        easing: easing.standard,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 30,
        useNativeDriver: true,
      }),
    ]).start();

    playUiSound('open', 0.4);
  };

  const closeMenu = () => {
    if (!openRef.current) return;
    openRef.current = false;

    Animated.parallel([
      Animated.timing(progress, {
        toValue: 0,
        duration: duration.short3,
        easing: easing.emphasizedAccelerate,
        useNativeDriver: true,
      }),
      Animated.timing(scrim, {
        toValue: 0,
        duration: duration.short3,
        easing: easing.standard,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setOpen(false);
      scheduleDock(600);
    });

    playUiSound('close', 0.3);
  };

  const actions = useRef({ wake, dock: dockToEdge, open: openMenu, close: closeMenu });
  actions.current = { wake, dock: dockToEdge, open: openMenu, close: closeMenu };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        moved.current = false;
        dragStart.current = { ...positionRef.current };
        if (openRef.current) actions.current.close();
        actions.current.wake();
      },
      onPanResponderMove: (_event, gesture) => {
        if (!moved.current && Math.hypot(gesture.dx, gesture.dy) > TAP_SLOP) {
          moved.current = true;
          Animated.spring(scale, {
            toValue: 1.12,
            speed: 30,
            useNativeDriver: true,
          }).start();
        }
        if (!moved.current) return;

        const { width: w, height: h } = layout;
        position.setValue({
          x: clamp(dragStart.current.x + gesture.dx, 0, w - BUTTON_SIZE),
          y: clamp(dragStart.current.y + gesture.dy, 0, h - BUTTON_SIZE),
        });
      },
      onPanResponderRelease: () => {
        if (!moved.current) {
          if (openRef.current) actions.current.close();
          else actions.current.open();
          return;
        }
        actions.current.dock();
      },
      onPanResponderTerminate: () => {
        if (moved.current) actions.current.dock();
      },
    })
  ).current;

  useEffect(() => () => clearInactivity(), []);

  useImperativeHandle(ref, () => ({
    close: closeMenu,
    isOpen: () => openRef.current,
  }));

  const toggleMenu = () => {
    if (openRef.current) closeMenu();
    else openMenu();
  };

  const handleItemPress = (item: MenuItem) => {
    playUiSound('tap', 0.4);
    if (item.toggle) {
      onAction(item.action);
      return;
    }
    closeMenu();
    onAction(item.action);
  };

  const cardTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layout.placeRight ? -16 : 16, 0],
  });
  const cardScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });
  const scrimOpacity = scrim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.34],
  });

  const cardTop = (() => {
    const halfCard = layout.cardH > 0 ? layout.cardH / 2 : 150;
    return clamp(
      layout.anchorY - halfCard,
      MENU_MARGIN,
      layout.height - Math.min(layout.cardH || 300, layout.height) - MENU_MARGIN
    );
  })();

  const logoSource =
    Platform.OS === 'android'
      ? require('../../assets/android-icon_logo.png')
      : require('../../assets/icon.png');

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Scrim — only when open */}
      {open ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: scrimOpacity, zIndex: 99 }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeMenu}
            accessibilityLabel={strings.close}
            accessibilityRole="button"
          />
        </Animated.View>
      ) : null}

      {/* Card menu — only when open, above the scrim but below the button */}
      {open ? (
        <Animated.View
          style={[
            styles.card,
            elevation.level3,
            {
              left: layout.x,
              top: cardTop,
              width: layout.cardW,
              opacity: progress,
              transform: [{ translateX: cardTranslate }, { scale: cardScale }],
              zIndex: 100,
            },
          ]}
          onLayout={(event) => {
            const next = event.nativeEvent.layout.height;
            setLayout((current) =>
              Math.abs(next - current.cardH) > 1 ? { ...current, cardH: next } : current
            );
          }}
        >
          <BlurView
            intensity={Platform.OS === 'android' ? 48 : 60}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.cardTint]} />

          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{strings.menu}</Text>
            <View style={styles.cardHandle} />
          </View>

          {MENU_ITEMS.map((item) => (
            <ListRow
              key={item.action}
              icon={item.icon}
              label={strings[item.labelKey]}
              tone={item.danger ? 'danger' : 'default'}
              selected={item.toggle ? touchControlsOn : undefined}
              onPress={() => handleItemPress(item)}
              accessibilityRole={item.toggle ? 'switch' : 'button'}
              accessibilityState={item.toggle ? { checked: touchControlsOn } : undefined}
              trailing={
                item.toggle ? (
                  <View pointerEvents="none" style={styles.check}>
                    <M3Switch
                      value={touchControlsOn}
                      onValueChange={() => undefined}
                      accessibilityLabel={strings.touchControls}
                    />
                  </View>
                ) : null
              }
            />
          ))}
        </Animated.View>
      ) : null}

      {/* Draggable dock button — zIndex 110 so it sits above everything */}
      <Animated.View
        style={[
          styles.button,
          elevation.level2,
          {
            opacity,
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { scale },
            ],
            zIndex: 110,
          },
        ]}
        {...panResponder.panHandlers}
        accessible
        accessibilityRole="button"
        accessibilityLabel={strings.menu}
        accessibilityState={{ expanded: open }}
        onAccessibilityTap={toggleMenu}
      >
        <Animated.View style={[styles.buttonInner, { opacity }]}>
          {open ? (
            <FaIcon icon={faXmark} size={20} color={colors.onPrimaryContainer} />
          ) : (
            <Animated.Image
              source={logoSource}
              style={styles.logo}
              resizeMode="cover"
            />
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
});

export default FloatingMenu;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    elevation: 90,
  },

  card: {
    position: 'absolute',
    borderRadius: shape.xl,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: alpha(colors.onSurface, 0.08),
    backgroundColor: colors.surfaceContainer,
  },
  cardTint: {
    backgroundColor: alpha(colors.surfaceContainerHigh, 0.7),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  cardTitle: {
    ...typeScale.labelMedium,
    color: colors.onSurfaceVariant,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  cardHandle: {
    width: 22,
    height: 4,
    borderRadius: shape.full,
    backgroundColor: alpha(colors.onSurface, 0.16),
  },
  check: {
    marginLeft: spacing.xs,
  },

  button: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: alpha(colors.primary, 0.35),
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInner: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
});
