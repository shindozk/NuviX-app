import { useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { strings } from '../i18n';
import { colors } from '../theme';

export type MenuAction = 'home' | 'reload' | 'touch' | 'settings' | 'exit';

type Props = {
  onAction: (action: MenuAction) => void;
  touchControlsOn: boolean;
};

const ITEMS: { action: MenuAction; glyph: string; labelKey: keyof typeof strings }[] = [
  { action: 'home', glyph: '⌂', labelKey: 'home' },
  { action: 'reload', glyph: '⟳', labelKey: 'reload' },
  { action: 'touch', glyph: '◉', labelKey: 'touchControls' },
  { action: 'settings', glyph: '⚙', labelKey: 'settings' },
  { action: 'exit', glyph: '⎋', labelKey: 'exit' },
];

/**
 * Draggable floating button that opens the app shortcuts.
 */
export default function FloatingMenu({ onAction, touchControlsOn }: Props) {
  const [open, setOpen] = useState(false);
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const start = useRef({ x: 0, y: 0 });
  const dragged = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_event, gesture) =>
        Math.abs(gesture.dx) + Math.abs(gesture.dy) > 6,
      onPanResponderGrant: () => {
        dragged.current = false;
        translate.stopAnimation((value) => {
          start.current = value;
        });
      },
      onPanResponderMove: (_event, gesture) => {
        if (Math.abs(gesture.dx) + Math.abs(gesture.dy) > 6) dragged.current = true;
        translate.setValue({ x: start.current.x + gesture.dx, y: start.current.y + gesture.dy });
      },
      onPanResponderRelease: () => {
        translate.flattenOffset();
      },
      onPanResponderTerminate: () => {
        translate.flattenOffset();
      },
    })
  ).current;

  const handlePress = () => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    setOpen((value) => !value);
  };

  return (
    <Animated.View
      style={[styles.wrapper, { transform: translate.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      {open && (
        <View style={styles.menu}>
          {ITEMS.map((item) => {
            const active = item.action === 'touch' && touchControlsOn;
            return (
              <Pressable
                key={item.action}
                style={({ pressed }) => [styles.item, (pressed || active) && styles.itemActive]}
                onPress={() => {
                  setOpen(false);
                  onAction(item.action);
                }}
              >
                <Text style={styles.itemGlyph}>{item.glyph}</Text>
                <Text style={styles.itemLabel}>{strings[item.labelKey]}</Text>
                {active && <View style={styles.dot} />}
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.handle, pressed && styles.handlePressed]}
        accessibilityLabel={strings.menu}
      >
        <Text style={styles.handleGlyph}>{open ? '×' : '≡'}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 18,
    right: 18,
    alignItems: 'flex-end',
  },
  handle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(16, 23, 19, 0.88)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handlePressed: {
    backgroundColor: colors.accent,
  },
  handleGlyph: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  menu: {
    marginBottom: 10,
    backgroundColor: 'rgba(12, 18, 15, 0.96)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 6,
    minWidth: 190,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  itemActive: {
    backgroundColor: colors.accentSoft,
  },
  itemGlyph: {
    color: colors.accentBright,
    fontSize: 15,
    width: 18,
    textAlign: 'center',
  },
  itemLabel: {
    color: colors.text,
    fontSize: 14,
  },
  dot: {
    marginLeft: 'auto',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accentBright,
  },
});
