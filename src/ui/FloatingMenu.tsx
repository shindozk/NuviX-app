import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, duration } from '../theme';
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

const BUTTON_SIZE = 56;
const PANEL_WIDTH = 236;
const EDGE = 12;
const GAP = 8;

type Props = {
  onAction: (action: MenuAction) => void;
  touchControlsOn: boolean;
};

/**
 * Side menu: a small round button pinned to the right edge of the screen, and
 * a panel that slides in from that edge when the button is tapped.
 */
export default function FloatingMenu({ onAction, touchControlsOn }: Props) {
  const [open, setOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? duration.medium : duration.short,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [PANEL_WIDTH + EDGE + BUTTON_SIZE + GAP, 0],
  });
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  });

  const handleAction = (action: MenuAction) => {
    setOpen(false);
    setTimeout(() => onAction(action), duration.short);
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {open ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityLabel={strings.close}
          />
        </Animated.View>
      ) : null}

      <Animated.View
        style={[
          styles.panel,
          { transform: [{ translateX }], opacity: progress },
        ]}
        pointerEvents={open ? 'auto' : 'none'}
      >
        <View style={styles.panelCard}>
          {MENU_ITEMS.map((item, index) => (
            <MenuItem
              key={item.action}
              item={item}
              index={index}
              isOn={item.action === 'touch' && touchControlsOn}
              onPress={() => handleAction(item.action)}
              open={open}
            />
          ))}
        </View>
      </Animated.View>

      <Pressable
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        accessibilityRole="button"
        accessibilityLabel={open ? strings.close : strings.menu}
      >
        <Text style={styles.buttonIcon}>{open ? '×' : '≡'}</Text>
      </Pressable>
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
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!open) {
      scale.setValue(1);
      opacity.setValue(1);
      return;
    }
    scale.setValue(0.95);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        delay: index * 35,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        delay: index * 35,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, index, scale, opacity]);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        isOn && styles.menuItemActive,
        pressed && styles.menuItemPress,
      ]}
    >
      <Text style={[styles.menuItemIcon, isOn && styles.menuItemIconActive]}>
        {item.icon}
      </Text>
      <Text style={[styles.menuItemLabel, isOn && styles.menuItemLabelActive]}>
        {strings[item.labelKey]}
      </Text>
      {isOn ? <View style={styles.indicatorBadge} /> : null}
    </Pressable>
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
  panel: {
    position: 'absolute',
    right: EDGE + BUTTON_SIZE + GAP,
    top: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    justifyContent: 'center',
  },
  panelCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  button: {
    position: 'absolute',
    right: EDGE,
    top: '50%',
    marginTop: -BUTTON_SIZE / 2,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 12,
  },
  buttonPressed: {
    transform: [{ scale: 0.94 }],
  },
  buttonIcon: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  menuItemActive: {
    backgroundColor: colors.accentSoft,
  },
  menuItemPress: {
    opacity: 0.85,
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
