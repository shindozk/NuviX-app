import React, { useRef, useState, useEffect } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';

import { colors, radius, duration, easing } from '../theme';
import { strings } from '../i18n';

export type MenuAction = 'home' | 'reload' | 'touch' | 'settings' | 'exit';

type MenuItem = {
  action: MenuAction;
  icon: string;
  labelKey: keyof typeof strings;
};

const MENU_ITEMS: MenuItem[] = [
  { action: 'home', icon: '🏠', labelKey: 'home' },
  { action: 'reload', icon: '🔄', labelKey: 'reload' },
  { action: 'touch', icon: '🎮', labelKey: 'touchControls' },
  { action: 'settings', icon: '⚙️', labelKey: 'settings' },
  { action: 'exit', icon: '🚪', labelKey: 'exit' },
];

type Props = {
  onAction: (action: MenuAction) => void;
  touchControlsOn: boolean;
};

export default function FloatingMenu({ onAction, touchControlsOn }: Props) {
  const [open, setOpen] = useState(false);
  const [translateY, setTranslateY] = useState(new Animated.Value(0));
  const [scale, setScale] = useState(new Animated.Value(1));
  const [opacity, setOpacity] = useState(new Animated.Value(0));
  const [backgroundOpacity, setBackgroundOpacity] = useState(new Animated.Value(0));
  const [dragging, setDragging] = useState(false);

  // Calculate screen position
  const { height } = Dimensions.get('window');
  const menuHeight = 300;

  const animateOpen = () => {
    setOpen(true);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -menuHeight + 60,
        duration: duration.medium,
        useNativeDriver: true,
        easing: Easing.out(Easing.bezier(0.25, 0.8, 0.25, 1)),
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 20,
        stiffness: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration.medium,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();

    Animated.timing(backgroundOpacity, {
      toValue: 0.5,
      duration: duration.medium,
      useNativeDriver: true,
    }).start();
  };

  const animateClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: duration.short,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
      Animated.spring(scale, {
        toValue: 0.95,
        damping: 20,
        stiffness: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: duration.short,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
    ]).start(() => setOpen(false));

    Animated.timing(backgroundOpacity, {
      toValue: 0,
      duration: duration.short,
      useNativeDriver: true,
    }).start();
  };

  const toggleMenu = () => {
    if (open) {
      animateClose();
    } else {
      animateOpen();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) + Math.abs(gesture.dy) > 6,
      onPanResponderGrant: () => {
        setDragging(true);
        translateY.stopAnimation();
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) + Math.abs(gesture.dy) > 6) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        setDragging(false);
        if (!open && gesture.dy < 0 && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 30) {
          animateOpen();
        } else if (open && Math.abs(gesture.dy) > 50) {
          animateClose();
        } else {
          translateY.setValue(0);
        }
      },
    })
  ).current;

  const handleAction = (action: MenuAction) => {
    animateClose();
    setTimeout(() => onAction(action), duration.short);
  };

  return (
    <View style={styles.wrapper}>
      {/* Background overlay */}
      <Animated.View
        style={[
          styles.background,
          { opacity: backgroundOpacity },
          open && styles.backgroundActive,
        ]}
        pointerEvents={open ? 'auto' : 'none'}
      >
        <Pressable onPress={animateClose} style={styles.backgroundTouchable} />
      </Animated.View>

      {/* Floating menu */}
      <Animated.View
        style={[
          styles.menu,
          {
            transform: [{ translateY }, { scale }],
            opacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => {
            const isOn = item.action === 'touch' && touchControlsOn;
            return (
              <MenuItem
                key={item.action}
                item={item}
                index={index}
                isOn={isOn}
                onPress={() => handleAction(item.action)}
                open={open}
              />
            );
          })}
        </View>

        {/* Floating button */}
        <Pressable
          onPress={toggleMenu}
          style={({ pressed }) => [
            styles.floatingButton,
            pressed && styles.floatingButtonPress,
          ]}
          accessibilityLabel={open ? strings.close : strings.menu}
        >
          <Text style={styles.floatingIcon}>{open ? '×' : '≡'}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

type MenuItemProps = {
  item: MenuItem;
  index: number;
  isOn: boolean;
  onPress: () => void;
  open: boolean;
};

function MenuItem({ item, index, isOn, onPress, open }: MenuItemProps) {
  const scale = useRef(new Animated.Value(0.95)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          damping: 20,
          stiffness: 150,
          useNativeDriver: true,
          delay: index * 40,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          delay: index * 40,
          easing: Easing.out(Easing.quad),
        }),
      ]).start();
    }
  }, [open, index, scale, opacity]);

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        opacity,
      }}
    >
      <MenuButtonItem item={item} isOn={isOn} onPress={onPress} />
    </Animated.View>
  );
}

type MenuButtonItemProps = {
  item: MenuItem;
  isOn: boolean;
  onPress: () => void;
};

function MenuButtonItem({ item, isOn, onPress }: MenuButtonItemProps) {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [
        styles.menuItem,
        isOn && styles.menuItemActive,
        pressed && styles.menuItemPress,
        { transform: [{ scale: pressAnim }] },
      ]}
    >
      <Text style={[styles.menuItemIcon, isOn && styles.menuItemIconActive]}>
        {item.icon}
      </Text>
      <Text style={[styles.menuItemLabel, isOn && styles.menuItemLabelActive]}>
        {strings[item.labelKey]}
      </Text>
      {isOn && <View style={styles.indicatorBadge} />}
    </Pressable>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    pointerEvents: 'none',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  backgroundActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backgroundTouchable: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    bottom: 100,
    left: (width - 240) / 2,
    width: 240,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  menuContainer: {
    padding: 16,
    gap: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: -30,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  floatingButtonPress: {
    transform: [{ scale: 0.95 }],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  menuItemActive: {
    backgroundColor: colors.accentSoft,
  },
  menuItemPress: {
    opacity: 0.9,
  },
  menuItemIcon: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  menuItemIconActive: {
    color: colors.accentBright,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  menuItemLabelActive: {
    color: colors.accentBright,
    fontWeight: '600',
  },
  indicatorBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentBright,
    marginLeft: 'auto',
  },
});