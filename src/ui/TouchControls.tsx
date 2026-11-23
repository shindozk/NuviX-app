import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  Text,
  useWindowDimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

import { alpha, colors } from '../theme';
import { playUiSound } from './sound';

// ============================================================
// Winlator .icp  —  Virtual Gamepad Control
// ============================================================
//  Based on Winlator input_controls/*.icp format.
//  Positions are normalised (0.0–1.0) and multiplied by the
//  screen dimensions at runtime, exactly like Winlator does.
// ============================================================

// W3C gamepad button indices (same as Winlator KEY_* constants)
const B = {
  A: 0, B: 1, X: 2, Y: 3,
  LB: 4, RB: 5, LT: 6, RT: 7,
  VIEW: 8, MENU: 9, L3: 10, R3: 11,
  UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15,
} as const;

type Run = (script: string) => void;

/** Haptic + audio feedback shared by every button. */
function usePressFeedback(run: Run, index: number) {
  return {
    pressIn: useCallback(() => {
      playUiSound('tap', 0.14);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      }
      run(`window.__xcpPad.setButton(${index}, true, 1)`);
    }, [index, run]),
    pressOut: useCallback(() => {
      run(`window.__xcpPad.setButton(${index}, false, 0)`);
    }, [index, run]),
  };
}

// -------------------------------------------------------
//  BUTTON — generic .icp button (CIRCLE / RECT / ROUND_RECT)
// -------------------------------------------------------
function IcpButton({
  label,
  index,
  size,
  shape = 'CIRCLE',
  run,
}: {
  label: string;
  index: number;
  size: number;
  shape?: 'CIRCLE' | 'RECT' | 'ROUND_RECT';
  run: Run;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const { pressIn, pressOut } = usePressFeedback(run, index);

  const borderRadius =
    shape === 'CIRCLE' ? size / 2 :
    shape === 'ROUND_RECT' ? size * 0.28 : size * 0.14;

  return (
    <Pressable
      style={[
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius,
        },
      ]}
      hitSlop={6}
      onPressIn={() => {
        Animated.spring(scale, {
          toValue: 0.9,
          useNativeDriver: true,
        }).start();
        pressIn();
      }}
      onPressOut={() => {
        Animated.spring(scale, {
          toValue: 1,
          friction: 3,
          tension: 120,
          useNativeDriver: true,
        }).start();
        pressOut();
      }}
      accessible
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Animated.Text
        style={[
          styles.btnLabel,
          {
            fontSize: Math.round(size * 0.36),
            transform: [{ scale }],
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

// -------------------------------------------------------
//  D_PAD — .icp directional pad (4 keys)
// -------------------------------------------------------
function IcpDPad({
  size,
  run,
  bindings,
}: {
  size: number;
  run: Run;
  bindings: [number, number, number, number]; // UP, RIGHT, DOWN, LEFT
}) {
  const labels = ['▲', '►', '▼', '◄'];
  const { pressIn, pressOut } = usePressFeedback(run, bindings[0]);

  return (
    <View style={[styles.dpadContainer, { width: size * 3, height: size * 3 }]}>
      {/* UP */}
      <Pressable
        style={[styles.dpadKey, { width: size, height: size, borderBottomLeftRadius: size * 0.3, borderBottomRightRadius: size * 0.3 }]}
        hitSlop={4}
        onPressIn={() => {
          playUiSound('tap', 0.12);
          run(`window.__xcpPad.setButton(${bindings[0]}, true, 1)`);
        }}
        onPressOut={() => {
          run(`window.__xcpPad.setButton(${bindings[0]}, false, 0)`);
        }}
      >
        <Text style={styles.dpadLabel}>{labels[0]}</Text>
      </Pressable>
      {/* RIGHT */}
      <Pressable
        style={[styles.dpadKey, { width: size, height: size, borderTopLeftRadius: size * 0.3, borderBottomLeftRadius: size * 0.3 }]}
        hitSlop={4}
        onPressIn={() => {
          playUiSound('tap', 0.12);
          run(`window.__xcpPad.setButton(${bindings[1]}, true, 1)`);
        }}
        onPressOut={() => {
          run(`window.__xcpPad.setButton(${bindings[1]}, false, 0)`);
        }}
      >
        <Text style={styles.dpadLabel}>{labels[1]}</Text>
      </Pressable>
      {/* DOWN */}
      <Pressable
        style={[styles.dpadKey, { width: size, height: size, borderTopLeftRadius: size * 0.3, borderTopRightRadius: size * 0.3 }]}
        hitSlop={4}
        onPressIn={() => {
          playUiSound('tap', 0.12);
          run(`window.__xcpPad.setButton(${bindings[2]}, true, 1)`);
        }}
        onPressOut={() => {
          run(`window.__xcpPad.setButton(${bindings[2]}, false, 0)`);
        }}
      >
        <Text style={styles.dpadLabel}>{labels[2]}</Text>
      </Pressable>
      {/* LEFT */}
      <Pressable
        style={[styles.dpadKey, { width: size, height: size, borderTopRightRadius: size * 0.3, borderBottomRightRadius: size * 0.3 }]}
        hitSlop={4}
        onPressIn={() => {
          playUiSound('tap', 0.12);
          run(`window.__xcpPad.setButton(${bindings[3]}, true, 1)`);
        }}
        onPressOut={() => {
          run(`window.__xcpPad.setButton(${bindings[3]}, false, 0)`);
        }}
      >
        <Text style={styles.dpadLabel}>{labels[3]}</Text>
      </Pressable>
      {/* Center */}
      <View style={[styles.dpadCenter, { width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25 }]} />
    </View>
  );
}

// -------------------------------------------------------
//  STICK — .icp analog stick (4 directions)
// -------------------------------------------------------
function IcpStick({
  side,
  size,
  run,
  bindings,
}: {
  side: 'left' | 'right';
  size: number;
  run: Run;
  bindings: [number, number, number, number]; // UP, RIGHT, DOWN, LEFT (KEY_W/D/S/A)
}) {
  const knobPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const knobSize = size * 0.44;
  const maxOffset = size / 2 - knobSize / 2;
  const axisIndex = side === 'left' ? 0 : 2;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        playUiSound('tap', 0.12);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        }
        run(`window.__xcpPad.setButton(${bindings[0]}, true, 1)`);
      },
      onPanResponderMove: (_event, gesture) => {
        const dx = Math.max(-maxOffset, Math.min(maxOffset, gesture.dx));
        const dy = Math.max(-maxOffset, Math.min(maxOffset, gesture.dy));
        knobPos.setValue({ x: dx, y: dy });
        run(`window.__xcpPad.setAxis(${axisIndex}, ${dx}, ${dy})`);
      },
      onPanResponderRelease: () => {
        knobPos.setValue({ x: 0, y: 0 });
        run(`window.__xcpPad.setAxis(${axisIndex}, 0, 0)`);
        run(`window.__xcpPad.setButton(${bindings[0]}, false, 0)`);
      },
    })
  ).current;

  return (
    <View
      style={[styles.stickBase, { width: size, height: size, borderRadius: size / 2 }]}
      {...pan.panHandlers}
      accessible
      accessibilityLabel={`${side} stick`}
    >
      <Animated.View
        style={[
          styles.stickKnob,
          {
            width: knobSize,
            height: knobSize,
            borderRadius: knobSize / 2,
            transform: [{ translateX: knobPos.x }, { translateY: knobPos.y }],
          },
        ]}
      />
    </View>
  );
}

// -------------------------------------------------------
//  SHOULDER / TRIGGER — .icp top buttons (RECT)
// -------------------------------------------------------
function IcpShoulder({
  label,
  index,
  size,
  run,
}: {
  label: string;
  index: number;
  size: number;
  run: Run;
}) {
  const { pressIn, pressOut } = usePressFeedback(run, index);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      style={[
        styles.shoulder,
        {
          width: size,
          height: size * 0.42,
          borderTopLeftRadius: size * 0.21,
          borderTopRightRadius: size * 0.21,
          borderBottomLeftRadius: size * 0.08,
          borderBottomRightRadius: size * 0.08,
          backgroundColor: pressed
            ? alpha(colors.primary, 0.3)
            : alpha(colors.onSurface, 0.1),
          borderColor: pressed
            ? alpha(colors.primary, 0.7)
            : alpha(colors.onSurface, 0.24),
        },
      ]}
      hitSlop={5}
      onPressIn={() => {
        setPressed(true);
        pressIn();
      }}
      onPressOut={() => {
        setPressed(false);
        pressOut();
      }}
      accessible
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Text
        style={[
          styles.shoulderLabel,
          {
            fontSize: Math.round(size * 0.2),
            color: pressed ? colors.primary : colors.onSurface,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ============================================================
//  MAIN — Virtual Gamepad Control
// ============================================================
export default function TouchControls({ run }: { run: Run }) {
  const { width, height } = useWindowDimensions();
  const U = Math.min(width, height) * 0.062;

  // Winlator .icp sizes (scaled)
  const faceSize = Math.round(U * 1.0);
  const stickSize = Math.round(U * 2.0);
  const padKeySize = Math.round(U * 0.85);
  const shoulderSize = Math.round(U * 2.2);
  const gap = Math.round(U * 0.14);

  // Safe insets
  const safeTop = Math.max(10, height * 0.02);
  const safeBottom = Math.max(10, height * 0.035);

  // Winlator .icp positions (normalised 0–1) × screen size
  // These are the DEFAULT positions from the .icp files
  const icp = (x: number, y: number) => ({
    x: Math.round(width * x),
    y: Math.round(height * y),
  });

  // Stick position (left, bottom area)
  const stickLeft = icp(0.108, 0.733);
  // Face buttons (right side, diamond layout)
  const faceRight = icp(0.813, 0.733);
  // Shoulder buttons (top corners)
  const shoulderLeft = icp(0.078, 0.089);
  const shoulderRight = icp(0.922, 0.089);
  // D-pad (left, above stick)
  const dpadLeft = icp(0.05, 0.42);
  // Mouse aim (right side)
  const aimRight = icp(0.931, 0.444);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* === SHOULDERS (top corners, .icp) === */}
      <View style={[styles.shoulderWrap, { top: safeTop, left: shoulderLeft.x - shoulderSize / 2 }]}>
        <IcpShoulder label="LB" index={B.LB} size={shoulderSize} run={run} />
      </View>
      <View style={[styles.shoulderWrap, { top: safeTop, left: shoulderRight.x - shoulderSize / 2 }]}>
        <IcpShoulder label="RB" index={B.RB} size={shoulderSize} run={run} />
      </View>

      {/* === D-PAD (left, .icp) === */}
      <View
        style={[
          styles.dpadWrap,
          {
            bottom: safeBottom + stickSize * 0.3,
            left: dpadLeft.x,
          },
        ]}
      >
        <IcpDPad
          size={padKeySize}
          run={run}
          bindings={[B.UP, B.RIGHT, B.DOWN, B.LEFT]}
        />
      </View>

      {/* === STICK (left, bottom, .icp) === */}
      <View
        style={[
          styles.stickWrap,
          {
            bottom: safeBottom,
            left: stickLeft.x - stickSize / 2,
          },
        ]}
      >
        <IcpStick
          side="left"
          size={stickSize}
          run={run}
          bindings={[B.UP, B.RIGHT, B.DOWN, B.LEFT]}
        />
      </View>

      {/* === FACE BUTTONS (right, diamond, .icp) === */}
      <View
        style={[
          styles.faceDiamond,
          {
            bottom: safeBottom + faceSize * 0.8,
            right: width - faceRight.x - faceSize * 1.5,
          },
        ]}
      >
        {/* Y (top) */}
        <View style={{ marginBottom: gap }}>
          <IcpButton label="Y" index={B.Y} size={faceSize} run={run} />
        </View>
        {/* X (left) + B (right) */}
        <View style={{ flexDirection: 'row', gap, marginBottom: gap }}>
          <IcpButton label="X" index={B.X} size={faceSize} run={run} />
          <IcpButton label="B" index={B.B} size={faceSize} run={run} />
        </View>
        {/* A (bottom) */}
        <IcpButton label="A" index={B.A} size={faceSize} run={run} />
      </View>

      {/* === AIM (right side, .icp mouse button) === */}
      <View
        style={[
          styles.aimWrap,
          {
            bottom: safeBottom + stickSize * 0.5,
            right: width - aimRight.x,
          },
        ]}
      >
        <IcpButton label="◎" index={B.R3} size={Math.round(faceSize * 0.7)} shape="CIRCLE" run={run} />
      </View>

      {/* === L3 / R3 (small, above sticks) === */}
      <View
        style={[
          styles.smallBtn,
          {
            bottom: safeBottom + stickSize + 8,
            left: stickLeft.x - stickSize * 0.2,
          },
        ]}
      >
        <IcpButton label="L3" index={B.L3} size={Math.round(faceSize * 0.5)} run={run} />
      </View>
      <View
        style={[
          styles.smallBtn,
          {
            bottom: safeBottom + stickSize + 8,
            right: width - aimRight.x + faceSize * 0.3,
          },
        ]}
      >
        <IcpButton label="R3" index={B.R3} size={Math.round(faceSize * 0.5)} run={run} />
      </View>
    </View>
  );
}

// ============================================================
//  STYLES
// ============================================================
const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
  },

  // Shoulder buttons
  shoulderWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shoulder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  shoulderLabel: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // D-pad
  dpadWrap: {
    position: 'absolute',
  },
  dpadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dpadKey: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.onSurface, 0.1),
    borderWidth: 1,
    borderColor: alpha(colors.onSurface, 0.2),
  },
  dpadLabel: {
    fontSize: 16,
    color: colors.onSurface,
    fontWeight: '700',
  },
  dpadCenter: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    backgroundColor: alpha(colors.onSurface, 0.06),
    borderWidth: 1,
    borderColor: alpha(colors.onSurface, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Analog stick
  stickWrap: {
    position: 'absolute',
  },
  stickBase: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.onSurface, 0.06),
    borderWidth: 2.5,
    borderColor: alpha(colors.onSurface, 0.2),
  },
  stickKnob: {
    backgroundColor: alpha(colors.onSurface, 0.24),
    borderWidth: 1.5,
    borderColor: alpha(colors.onSurface, 0.36),
  },

  // Face buttons
  faceDiamond: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.onSurface, 0.1),
    borderWidth: 2,
    borderColor: alpha(colors.onSurface, 0.28),
  },
  btnLabel: {
    fontWeight: '700',
    color: colors.onSurface,
  },

  // Small buttons (L3/R3, aim)
  aimWrap: {
    position: 'absolute',
  },
  smallBtn: {
    position: 'absolute',
  },
});
