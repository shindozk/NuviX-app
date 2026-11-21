import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  faGamepad,
  faGear,
  faHouse,
  faPowerOff,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

import { colors, radius } from '../theme';
import { strings } from '../i18n';
import FaIcon from './Icon';
import { playUiSound } from './sound';

export type MenuAction = 'home' | 'reload' | 'touch' | 'settings' | 'exit';

type MenuItem = {
  action: MenuAction;
  icon: IconProp;
  labelKey: keyof typeof strings;
};

const MENU_ITEMS: MenuItem[] = [
  { action: 'home', icon: faHouse, labelKey: 'home' },
  { action: 'reload', icon: faRotateRight, labelKey: 'reload' },
  { action: 'touch', icon: faGamepad, labelKey: 'touchControls' },
  { action: 'settings', icon: faGear, labelKey: 'settings' },
  { action: 'exit', icon: faPowerOff, labelKey: 'exit' },
];

const BUTTON_SIZE = 56;
const EDGE = 10;
const DOCK_OPACITY = 0.45;
const ACTIVE_OPACITY = 1;
const INACTIVITY_MS = 3000;
const TAP_SLOP = 6;

type Props = {
  onAction: (action: MenuAction) => void;
  touchControlsOn: boolean;
};

const screen = Dimensions.get('window');

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Dynamic floating button + options sheet.
 *
 * - Shows the NuviX app logo.
 * - Fully draggable anywhere on screen.
 * - While docked at an edge it rests semi-transparent; touching it wakes it
 *   back up to full opacity.
 * - If the user parks it near the middle of the screen, 3 seconds of
 *   inactivity snap it to the nearest left/right edge (with a dock sound).
 * - Tapping opens an options sheet that drops from the top of the screen,
 *   like a notification shade.
 */
export default function FloatingMenu({ onAction, touchControlsOn }: Props) {
  const [open, setOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
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
  const opacity = useRef(new Animated.Value(DOCK_OPACITY)).current;
  const scale = useRef(new Animated.Value(1)).current;
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
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1.08,
        speed: 30,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const dockToEdge = () => {
    const { x, y } = positionRef.current;
    const targetX =
      x + BUTTON_SIZE / 2 < screen.width / 2
        ? EDGE
        : screen.width - BUTTON_SIZE - EDGE;
    const targetY = clamp(y, EDGE, screen.height - BUTTON_SIZE - EDGE);
    Animated.parallel([
      Animated.spring(position, {
        toValue: { x: targetX, y: targetY },
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: DOCK_OPACITY,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 25,
        useNativeDriver: true,
      }),
    ]).start();
    playUiSound('dock', 0.35);
  };

  const scheduleDock = (delay = INACTIVITY_MS) => {
    clearInactivity();
    inactivityTimer.current = setTimeout(dockToEdge, delay);
  };

  useEffect(() => {
    return () => clearInactivity();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        moved.current = false;
        dragStart.current = { ...positionRef.current };
        wake();
      },
      onPanResponderMove: (_event, gesture) => {
        if (
          !moved.current &&
          Math.hypot(gesture.dx, gesture.dy) > TAP_SLOP
        ) {
          moved.current = true;
          Animated.spring(scale, {
            toValue: 1.15,
            speed: 30,
            useNativeDriver: true,
          }).start();
        }
        if (!moved.current) return;
        const x = clamp(
          dragStart.current.x + gesture.dx,
          EDGE,
          screen.width - BUTTON_SIZE - EDGE
        );
        const y = clamp(
          dragStart.current.y + gesture.dy,
          EDGE,
          screen.height - BUTTON_SIZE - EDGE
        );
        position.setValue({ x, y });
      },
      onPanResponderRelease: (_event, gesture) => {
        if (!moved.current) {
          // Tap: open the options sheet.
          playUiSound('open', 0.4);
          Animated.spring(scale, {
            toValue: 1,
            speed: 25,
            useNativeDriver: true,
          }).start();
          Animated.timing(opacity, {
            toValue: ACTIVE_OPACITY,
            duration: 150,
            useNativeDriver: true,
          }).start();
          setOpen(true);
          return;
        }
        const { x } = positionRef.current;
        const nearEdge =
          x <= EDGE + 24 || x >= screen.width - BUTTON_SIZE - EDGE - 24;
        if (nearEdge) {
          dockToEdge();
        } else {
          // Parked in the middle: keep it awake here for 3 s, then dock.
          Animated.spring(scale, {
            toValue: 1,
            speed: 25,
            useNativeDriver: true,
          }).start();
          scheduleDock(INACTIVITY_MS);
        }
      },
      onPanResponderTerminate: () => scheduleDock(INACTIVITY_MS),
    })
  ).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? 320 : 220,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  const sheetTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-320, 0],
  });
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const handleAction = (action: MenuAction) => {
    playUiSound('tap', 0.4);
    setOpen(false);
    scheduleDock(400);
    setTimeout(() => onAction(action), 180);
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {open ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              playUiSound('close', 0.4);
              setOpen(false);
              scheduleDock(400);
            }}
            accessibilityLabel={strings.close}
          />
        </Animated.View>
      ) : null}

      {/* Options sheet dropping from the top, like a notification shade. */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetTranslate }] }]}
        pointerEvents={open ? 'auto' : 'none'}
      >
        <View style={styles.sheetCard}>
          <View style={styles.sheetHeader}>
            <Image source={require('../../assets/icon.png')} style={styles.sheetLogo} />
            <Text style={styles.sheetTitle}>{strings.appName}</Text>
            <Pressable
              onPress={() => {
                playUiSound('close', 0.4);
                setOpen(false);
                scheduleDock(400);
              }}
              style={styles.sheetClose}
              accessibilityLabel={strings.close}
              hitSlop={8}
            >
              <FaIcon icon="xmark" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
          <View style={styles.sheetItems}>
            {MENU_ITEMS.map((item, index) => (
              <SheetItem
                key={item.action}
                item={item}
                index={index}
                isOn={item.action === 'touch' && touchControlsOn}
                open={open}
                onPress={() => handleAction(item.action)}
              />
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Draggable logo button. */}
      <Animated.View
        style={[
          styles.button,
          { transform: [{ translateX: position.x }, { translateY: position.y }, { scale }] },
        ]}
      >
        <Animated.View style={[styles.buttonInner, { opacity }]}>
          <Pressable style={styles.buttonHit}>
            <View {...panResponder.panHandlers} style={styles.buttonContent}>
              <Image
                source={
                  Platform.OS === 'android'
                    ? require('../../assets/android-icon_logo.png')
                    : require('../../assets/icon.png')
                }
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

type SheetItemProps = {
  item: MenuItem;
  index: number;
  isOn: boolean;
  onPress: () => void;
  open: boolean;
};

function SheetItem({ item, index, isOn, onPress, open }: SheetItemProps) {
  const translateY = useRef(new Animated.Value(-24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!open) {
      translateY.setValue(-24);
      opacity.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        delay: 80 + index * 45,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        delay: 80 + index * 45,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, index, translateY, opacity]);

  return (
    <Animated.View
      style={[styles.sheetItemAnimated, { transform: [{ translateY }], opacity }]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.sheetItem, isOn && styles.sheetItemActive, pressed && styles.sheetItemPressed]}
        accessibilityRole="button"
      >
        <View style={[styles.sheetItemIcon, isOn && styles.sheetItemIconActive]}>
          <FaIcon
            icon={item.icon}
            size={16}
            color={isOn ? colors.onPrimary : colors.textSecondary}
          />
        </View>
        <Text style={[styles.sheetItemLabel, isOn && styles.sheetItemLabelActive]}>
          {strings[item.labelKey]}
        </Text>
        {isOn ? <View style={styles.activeDot} /> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
  },
  backdrop: {
    backgroundColor: '#000000',
  },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  sheetCard: {
    width: '100%',
    backgroundColor: colors.surfaceContainer,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
  },
  sheetLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetItems: {
    gap: 4,
  },
  sheetItemAnimated: {},
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: radius.lg,
  },
  sheetItemActive: {
    backgroundColor: colors.accentSoft,
  },
  sheetItemPressed: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  sheetItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetItemIconActive: {
    backgroundColor: colors.accent,
  },
  sheetItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  sheetItemLabelActive: {
    color: colors.accentBright,
    fontWeight: '600',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentBright,
  },
  button: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  buttonInner: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1.5,
    borderColor: colors.accent,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonHit: {
    width: '100%',
    height: '100%',
  },
  buttonContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: BUTTON_SIZE - 8,
    height: BUTTON_SIZE - 8,
    borderRadius: radius.pill,
  },
});
