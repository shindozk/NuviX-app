import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  faBars,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faClone,
} from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

import { colors, radius } from '../theme';
import FaIcon from './Icon';
import { playUiSound } from './sound';

export type StickAxis = 'left' | 'right' | 'up' | 'down';

type Props = {
  run: (script: string) => void;
};

// Button indices for the virtual gamepad bridge (window.__xcpPad).
const BUTTON_INDICES = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  VIEW: 8,
  MENU: 9,
  UP: 13,
  DOWN: 14,
  LEFT: 11,
  RIGHT: 12,
} as const;

const STICK_RADIUS = 62;
const KNOB_RADIUS = 30;

const { width: SCREEN_W } = Dimensions.get('window');

function feedback() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

/**
 * Gamepad button: round translucent Material-style chip with a soft press
 * animation. Sends press/release to the injected bridge.
 */
function PadButton({
  label,
  icon,
  index,
  size = 54,
  style,
  run,
}: {
  label: string;
  icon?: IconProp;
  index: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
  run: (script: string) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const pressIn = useCallback(() => {
    setPressed(true);
    Animated.spring(scale, { toValue: 0.88, speed: 40, useNativeDriver: true }).start();
    playUiSound('tap', 0.18);
    feedback();
    run(`window.__xcpPad.setButton(${index}, true, 1)`);
  }, [index, run, scale]);

  const pressOut = useCallback(() => {
    setPressed(false);
    Animated.spring(scale, { toValue: 1, speed: 30, useNativeDriver: true }).start();
    run(`window.__xcpPad.setButton(${index}, false, 0)`);
  }, [index, run, scale]);

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} hitSlop={10}>
      <Animated.View
        style={[
          styles.padButton,
          { width: size, height: size, borderRadius: size / 2, transform: [{ scale }] },
          pressed && styles.padButtonPressed,
          style,
        ]}
      >
        {icon ? (
          <FaIcon icon={icon} size={Math.round(size / 3.4)} color={colors.textPrimary} />
        ) : (
          <Text style={[styles.padButtonLabel, { fontSize: Math.round(size / 3) }]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

/** Directional D-pad button with a Font Awesome chevron. */
function DpadButton({
  direction,
  icon,
  x,
  y,
  run,
}: {
  direction: 'up' | 'down' | 'left' | 'right';
  icon: IconProp;
  x: number;
  y: number;
  run: (script: string) => void;
}) {
  const index = BUTTON_INDICES[direction.toUpperCase() as keyof typeof BUTTON_INDICES];
  const scale = useRef(new Animated.Value(1)).current;
  const [active, setActive] = useState(false);

  const pressIn = useCallback(() => {
    setActive(true);
    Animated.spring(scale, { toValue: 0.9, speed: 40, useNativeDriver: true }).start();
    playUiSound('tap', 0.18);
    feedback();
    run(`window.__xcpPad.setButton(${index}, true, 1)`);
  }, [index, run, scale]);

  const pressOut = useCallback(() => {
    setActive(false);
    Animated.spring(scale, { toValue: 1, speed: 30, useNativeDriver: true }).start();
    run(`window.__xcpPad.setButton(${index}, false, 0)`);
  }, [index, run, scale]);

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      hitSlop={8}
      style={[styles.dpadButton, { left: x, top: y }]}
    >
      <Animated.View
        style={[
          styles.dpadButtonInner,
          active && styles.dpadButtonActive,
          { transform: [{ scale }] },
        ]}
      >
        <FaIcon
          icon={icon}
          size={16}
          color={active ? colors.onPrimary : colors.textSecondary}
        />
      </Animated.View>
    </Pressable>
  );
}

/**
 * Analog stick built with native responder gestures: the knob follows the
 * finger inside the base and reports normalized axis values to the bridge.
 */
function AnalogStick({
  side,
  run,
}: {
  side: 'left' | 'right';
  run: (script: string) => void;
}) {
  const axisIndex = side === 'left' ? 0 : 1;
  const knob = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [active, setActive] = useState(false);
  const granted = useRef(false);
  const activeRef = useRef(false);

  const release = useCallback(() => {
    granted.current = false;
    activeRef.current = false;
    setActive(false);
    run(`window.__xcpPad.setAxis(${axisIndex}, 0, 0)`);
    Animated.spring(knob, {
      toValue: { x: 0, y: 0 },
      speed: 40,
      useNativeDriver: true,
    }).start();
  }, [axisIndex, knob, run]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        granted.current = true;
        activeRef.current = true;
        setActive(true);
        feedback();
      },
      onPanResponderMove: (_event, gesture) => {
        if (!granted.current) return;
        const distance = Math.hypot(gesture.dx, gesture.dy);
        const max = STICK_RADIUS - KNOB_RADIUS;
        const factor = distance > max ? max / distance : 1;
        const x = gesture.dx * factor;
        const y = gesture.dy * factor;
        knob.setValue({ x, y });
        const nx = (x / max).toFixed(3);
        const ny = (y / max).toFixed(3);
        run(`window.__xcpPad.setAxis(${axisIndex}, ${-Number(ny)}, ${Number(nx)})`);
      },
      onPanResponderRelease: release,
      onPanResponderTerminate: release,
    })
  ).current;

  return (
    <View
      style={[
        styles.stickBase,
        side === 'left' ? { left: 28, bottom: 28 } : { right: 28, bottom: 28 },
        active && styles.stickBaseActive,
      ]}
    >
      <Animated.View
        style={[
          styles.stickKnob,
          active && styles.stickKnobActive,
          { transform: [{ translateX: knob.x }, { translateY: knob.y }] },
        ]}
        {...pan.panHandlers}
      />
    </View>
  );
}

/**
 * On-screen gamepad with a clean anchored layout:
 * left stick + D-pad on the left, face buttons + right stick on the right,
 * shoulders/triggers on the top corners and system buttons top-center.
 */
export default function TouchControls({ run }: Props) {
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Shoulders + triggers */}
      <View style={[styles.shoulderCluster, { left: 18 }]}>
        <PadButton label="LB" index={BUTTON_INDICES.LB} size={46} run={run} />
        <PadButton label="LT" index={BUTTON_INDICES.LT} size={46} run={run} />
      </View>
      <View style={[styles.shoulderCluster, { right: 18 }]}>
        <PadButton label="RB" index={BUTTON_INDICES.RB} size={46} run={run} />
        <PadButton label="RT" index={BUTTON_INDICES.RT} size={46} run={run} />
      </View>

      {/* System buttons, top center */}
      <View style={styles.systemCluster}>
        <PadButton label="View" icon={faClone} index={BUTTON_INDICES.VIEW} size={40} run={run} />
        <PadButton label="Menu" icon={faBars} index={BUTTON_INDICES.MENU} size={40} run={run} />
      </View>

      {/* Left stick + D-pad */}
      <AnalogStick side="left" run={run} />
      <View style={[styles.dpadCluster, { left: 28 + STICK_RADIUS * 2 + 26 }]}>
        <DpadButton direction="up" icon={faChevronUp} x={44} y={0} run={run} />
        <DpadButton direction="left" icon={faChevronLeft} x={0} y={44} run={run} />
        <DpadButton direction="right" icon={faChevronRight} x={88} y={44} run={run} />
        <DpadButton direction="down" icon={faChevronDown} x={44} y={88} run={run} />
      </View>

      {/* Face buttons (Xbox diamond) + right stick */}
      <View style={[styles.faceCluster, { right: 28 + STICK_RADIUS * 2 + 26 }]}>
        <View style={styles.faceRow}>
          <PadButton label="Y" index={BUTTON_INDICES.Y} run={run} />
        </View>
        <View style={styles.faceRow}>
          <PadButton label="X" index={BUTTON_INDICES.X} run={run} />
          <PadButton label="B" index={BUTTON_INDICES.B} run={run} />
        </View>
        <View style={styles.faceRow}>
          <PadButton label="A" index={BUTTON_INDICES.A} run={run} />
        </View>
      </View>
      <AnalogStick side="right" run={run} />
    </View>
  );
}

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
  shoulderCluster: {
    position: 'absolute',
    top: 18,
    flexDirection: 'row',
    gap: 10,
  },
  systemCluster: {
    position: 'absolute',
    top: 18,
    left: SCREEN_W / 2 - 50,
    flexDirection: 'row',
    gap: 12,
  },
  padButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padButtonPressed: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  padButtonLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  dpadCluster: {
    position: 'absolute',
    bottom: 72,
    width: 132,
    height: 132,
  },
  dpadButton: {
    position: 'absolute',
    width: 44,
    height: 44,
  },
  dpadButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  faceCluster: {
    position: 'absolute',
    bottom: 40,
    width: 172,
    alignItems: 'center',
  },
  faceRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 3,
  },
  stickBase: {
    position: 'absolute',
    width: STICK_RADIUS * 2,
    height: STICK_RADIUS * 2,
    borderRadius: STICK_RADIUS,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickBaseActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(29, 184, 101, 0.10)',
  },
  stickKnob: {
    width: KNOB_RADIUS * 2,
    height: KNOB_RADIUS * 2,
    borderRadius: KNOB_RADIUS,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  stickKnobActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
});
