import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
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
import { BlurView } from 'expo-blur';
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
import SidePanel from './SidePanel';

export type MenuAction = 'home' | 'reload' | 'touch' | 'settings' | 'exit';

type MenuItem = {
  action: MenuAction;
  icon: IconProp;
  labelKey: keyof typeof strings;
  danger?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { action: 'home', icon: faHouse, labelKey: 'home' },
  { action: 'reload', icon: faRotateRight, labelKey: 'reload' },
  { action: 'touch', icon: faGamepad, labelKey: 'touchControls' },
  { action: 'settings', icon: faGear, labelKey: 'settings' },
  { action: 'exit', icon: faPowerOff, labelKey: 'exit', danger: true },
];

const BUTTON_SIZE = 52;
const EDGE = 10;
const DOCK_OPACITY = 0.7;
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

export type FloatingMenuHandle = { close: () => void; isOpen: () => boolean };

const FloatingMenu = forwardRef<FloatingMenuHandle, Props>(function FloatingMenu({ onAction, touchControlsOn }: Props, ref) {
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
    playUiSound('dock', 0.3);
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
      onPanResponderGrant: () => {
        moved.current = false;
        dragStart.current = { ...positionRef.current };
        wake();
      },
      onPanResponderMove: (_event, gesture) => {
        if (!moved.current && Math.hypot(gesture.dx, gesture.dy) > TAP_SLOP) {
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

  const handleAction = (action: MenuAction) => {
    if (action === 'touch') {
      // Toggle touch controls without closing the menu
      playUiSound('toggle', 0.4);
      onAction(action);
      return;
    }
    playUiSound('tap', 0.4);
    setOpen(false);
    scheduleDock(400);
    setTimeout(() => onAction(action), 180);
  };

  useImperativeHandle(ref, () => ({
    close: () => { setOpen(false); scheduleDock(400); },
    isOpen: () => open,
  }));

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Side panel on the left */}
      <SidePanel visible={open} side="left" title={strings.menu} onClose={() => { setOpen(false); scheduleDock(400); }}>
        <View style={styles.menuContent}>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.action}
              onPress={() => handleAction(item.action)}
              style={({ pressed }) => [
                styles.menuItem,
                item.danger && styles.menuItemDanger,
                pressed && styles.menuItemPressed,
              ]}
              accessibilityRole={item.action === 'touch' ? 'switch' : 'button'}
              accessibilityState={item.action === 'touch' ? { checked: touchControlsOn } : undefined}
            >
              <View style={[styles.menuItemIcon, item.danger && styles.menuItemIconDanger]}>
                <FaIcon
                  icon={item.icon}
                  size={18}
                  color={item.danger ? colors.danger : touchControlsOn && item.action === 'touch' ? colors.accentBright : colors.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.menuItemLabel,
                  item.danger && styles.menuItemLabelDanger,
                  touchControlsOn && item.action === 'touch' && styles.menuItemLabelActive,
                ]}
              >
                {strings[item.labelKey]}
              </Text>
              {item.action === 'touch' && (
                <View style={[styles.togglePill, touchControlsOn && styles.togglePillOn]}>
                  <View style={[styles.toggleDot, touchControlsOn && styles.toggleDotOn]} />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </SidePanel>

      {/* Draggable floating button */}
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
});

export default FloatingMenu;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
  },
  menuContent: {
    padding: 16,
    gap: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  menuItemDanger: {
    backgroundColor: 'rgba(223, 74, 74, 0.08)',
    borderColor: 'rgba(223, 74, 74, 0.2)',
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemIconDanger: {
    backgroundColor: 'rgba(223, 74, 74, 0.12)',
    borderColor: 'rgba(223, 74, 74, 0.3)',
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  menuItemLabelActive: {
    color: colors.accentBright,
    fontWeight: '600',
  },
  menuItemLabelDanger: {
    color: colors.danger,
    fontWeight: '600',
  },
  togglePill: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  togglePillOn: {
    backgroundColor: colors.accentSoft,
  },
  toggleDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.textTertiary,
  },
  toggleDotOn: {
    backgroundColor: colors.accent,
    alignSelf: 'flex-end',
  },
  button: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    zIndex: 999,
    elevation: 999,
  },
  buttonInner: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 20, 28, 0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(29, 184, 101, 0.5)',
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
