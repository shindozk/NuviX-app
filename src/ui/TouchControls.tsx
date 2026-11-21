import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
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
  faKeyboard,
  faCog,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

import { colors, radius } from '../theme';
import FaIcon from './Icon';
import { playUiSound } from './sound';

export type StickAxis = 'left' | 'right' | 'up' | 'down';

// Button indices for the virtual gamepad bridge (window.__xcpPad) using the
// standard W3C gamepad button layout.
const BUTTON_INDICES = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  VIEW: 8, // Select / Back
  MENU: 9, // Start / Menu
  L3: 10,
  R3: 11,
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15,
} as const;

// SteveMXZ "Virtual Gamepad" profile (controls-3.icp) normalized layout.
// Coordinates are fractions of screen width/height (0..1); scale multiplies U.
// This is the standard Xbox-style layout used in Winlator Cmod by StevenMXZ.
const U_BASE = 0.075;
const STEVEMXZ_LAYOUT = {
  // D-pad
  dpad: { x: 0.10784313827753067, y: 0.4, scale: 0.85 },
  // Face buttons: X, Y, A, B (right side, clock positions)
  faceX: { x: 0.73, y: 0.45, scale: 1 },
  faceY: { x: 0.73, y: 0.55, scale: 1 },
  faceA: { x: 0.83, y: 0.5, scale: 1 },
  faceB: { x: 0.83, y: 0.52, scale: 1 },
  // Shoulders/Triggers
  l1: { x: 0.08, y: 0.32, scale: 1 },
  r1: { x: 0.92, y: 0.32, scale: 1 },
  l2: { x: 0.08, y: 0.22, scale: 2 },
  r2: { x: 0.92, y: 0.22, scale: 2 },
  // Start/Select
  start: { x: 0.5, y: 0.92, scale: 0.85 },
  select: { x: 0.5, y: 0.92, scale: 0.85 },
  // Analog sticks
  leftStick: { x: 0.26, y: 0.68, scale: 1 },
  rightStick: { x: 0.74, y: 0.68, scale: 1 },
  // L3/R3 (stick clicks) - centered on sticks
  l3: { x: 0.26, y: 0.68, scale: 0.85 },
  r3: { x: 0.74, y: 0.68, scale: 0.85 },
  // On-screen keyboard toggle
  keyboardBtn: { x: 0.95, y: 0.92, scale: 0.7 },
} as const;

const STICK_RADIUS_FACTOR = 1.0;

// -------------------------------------------------------
// Generic round gamepad button
// -------------------------------------------------------
function PadButton({
  label,
  icon,
  index,
  size,
  style,
  run,
  rect,
}: {
  label: string;
  icon?: IconProp;
  index: number;
  size: number;
  style?: StyleProp<ViewStyle>;
  run: (script: string) => void;
  rect?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const pressIn = useCallback(() => {
    setPressed(true);
    Animated.spring(scale, { toValue: 0.88, speed: 40, useNativeDriver: true }).start();
    playUiSound('tap', 0.18);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    run(`window.__xcpPad.setButton(${index}, true, 1)`);
  }, [index, run, scale]);

  const pressOut = useCallback(() => {
    setPressed(false);
    Animated.spring(scale, { toValue: 1, speed: 30, useNativeDriver: true }).start();
    run(`window.__xcpPad.setButton(${index}, false, 0)`);
  }, [index, run, scale]);

  const w = rect ? size * 2.4 : size;
  const h = rect ? size * 0.9 : size;

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} hitSlop={10}>
      <Animated.View
        style={[
          styles.padButton,
          { width: w, height: h, borderRadius: rect ? h / 2 : w / 2, transform: [{ scale }] },
          pressed && styles.padButtonPressed,
          style,
        ]}
      >
        {icon ? (
          <FaIcon icon={icon} size={Math.round(size / 2.6)} color={colors.textPrimary} />
        ) : (
          <Text style={[styles.padButtonLabel, { fontSize: Math.round(size / 2.4) }]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

// -------------------------------------------------------
// Directional D-pad button
// -------------------------------------------------------
function DpadButton({
  direction,
  icon,
  x,
  y,
  size,
  run,
}: {
  direction: 'up' | 'down' | 'left' | 'right';
  icon: IconProp;
  x: number;
  y: number;
  size: number;
  run: (script: string) => void;
}) {
  const index = BUTTON_INDICES[direction.toUpperCase() as keyof typeof BUTTON_INDICES];
  const scale = useRef(new Animated.Value(1)).current;
  const [active, setActive] = useState(false);

  const pressIn = useCallback(() => {
    setActive(true);
    Animated.spring(scale, { toValue: 0.9, speed: 40, useNativeDriver: true }).start();
    playUiSound('tap', 0.18);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
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
      style={[styles.dpadButton, { left: x, top: y, width: size, height: size }]}
    >
      <Animated.View
        style={[
          styles.dpadButtonInner,
          active && styles.dpadButtonActive,
          { transform: [{ scale }] },
        ]}
      >
        <FaIcon icon={icon} size={Math.round(size / 2.4)} color={active ? colors.onPrimary : colors.textSecondary} />
      </Animated.View>
    </Pressable>
  );
}

// -------------------------------------------------------
// Analog stick
// -------------------------------------------------------
function AnalogStick({
  side,
  cx,
  cy,
  size,
  run,
}: {
  side: 'left' | 'right';
  cx: number;
  cy: number;
  size: number;
  run: (script: string) => void;
}) {
  const axisX = side === 'left' ? 0 : 2;
  const axisY = side === 'left' ? 1 : 3;
  const knob = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [active, setActive] = useState(false);
  const granted = useRef(false);
  const max = size / 2 - size / 5;

  const release = useCallback(() => {
    granted.current = false;
    setActive(false);
    run(`window.__xcpPad.setAxis(${axisX}, 0)`);
    run(`window.__xcpPad.setAxis(${axisY}, 0)`);
    Animated.spring(knob, {
      toValue: { x: 0, y: 0 },
      speed: 40,
      useNativeDriver: true,
    }).start();
  }, [axisX, axisY, knob, run]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        granted.current = true;
        setActive(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      },
      onPanResponderMove: (_event: any, gesture: any) => {
        if (!granted.current) return;
        const distance = Math.hypot(gesture.dx, gesture.dy);
        const factor = distance > max ? max / distance : 1;
        const x = gesture.dx * factor;
        const y = gesture.dy * factor;
        knob.setValue({ x, y });
        // Standard gamepad: up = -1, down = +1
        const nx = x / max;
        const ny = y / max; // ny positive = down, negative = up (standard)
        run(`window.__xcpPad.setAxis(${axisX}, ${Number(nx).toFixed(3)})`);
        run(`window.__xcpPad.setAxis(${axisY}, ${Number(ny).toFixed(3)})`);
      },
      onPanResponderRelease: release,
      onPanResponderTerminate: release,
    })
  ).current;

  return (
    <View
      style={[
        styles.stickBase,
        {
          left: cx - size / 2,
          top: cy - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        active && styles.stickBaseActive,
      ]}
    >
      <Animated.View
        style={[
          styles.stickKnob,
          {
            width: size * 0.45,
            height: size * 0.45,
            borderRadius: (size * 0.45) / 2,
            transform: [{ translateX: knob.x }, { translateY: knob.y }],
          },
          active && styles.stickKnobActive,
        ]}
        {...pan.panHandlers}
      />
    </View>
  );
}

// -------------------------------------------------------
// Main TouchControls component
// -------------------------------------------------------
export default function TouchControls({ run }: { run: (script: string) => void }) {
  const { width: W, height: H } = Dimensions.get('window');
  const U = Math.min(W, H) * U_BASE;

  // Position helper: converts normalized layout fractions to pixel positions/sizes
  const pos = (p: { x: number; y: number; scale: number }) => ({
    cx: p.x * W,
    cy: p.y * H,
    size: U * p.scale * 1.7, // 1.7x scale for comfortable touch targets
  });

  const dpad = pos(STEVEMXZ_LAYOUT.dpad);
  const dpadBtnSize = U * STEVEMXZ_LAYOUT.dpad.scale * 1.3;
  const dpadOffset = U * STEVEMXZ_LAYOUT.dpad.scale * 0.5;

  const leftStick = pos(STEVEMXZ_LAYOUT.leftStick);
  const rightStick = pos(STEVEMXZ_LAYOUT.rightStick);
  const stickSize = U * STEVEMXZ_LAYOUT.leftStick.scale * 3.0;

  // Face button positions use a slightly different size multiplier
  const faceBtnSize = U * 1.6;

  // Keyboard toggle button position (SteveMXZ layout fraction)
  const keyboardBtn = pos(STEVEMXZ_LAYOUT.keyboardBtn);
  const keyboardBtnSize = U * STEVEMXZ_LAYOUT.keyboardBtn.scale * 1.5;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* ---------- Shoulders/Triggers ---------- */}
      {/* Left shoulder L1 */}
      <View
        style={{
          position: 'absolute',
          left: STEVEMXZ_LAYOUT.l1.x * W - (U * 1.2) / 2,
          top: STEVEMXZ_LAYOUT.l1.y * H - (U * 0.6) / 2,
        }}
      >
        <PadButton label="LB" index={BUTTON_INDICES.LB} size={U * 1.2} run={run} rect />
      </View>

      {/* Left trigger L2 */}
      <View
        style={{
          position: 'absolute',
          left: STEVEMXZ_LAYOUT.l2.x * W - (U * 2.0 * 1.3) / 2,
          top: STEVEMXZ_LAYOUT.l2.y * H - (U * 0.8 * 1.3) / 2,
        }}
      >
        <PadButton label="LT" index={BUTTON_INDICES.LT} size={U * 2.0 * 0.8} run={run} rect />
      </View>

      {/* Right shoulder R1 */}
      <View
        style={{
          position: 'absolute',
          left: STEVEMXZ_LAYOUT.r1.x * W - (U * 1.2) / 2,
          top: STEVEMXZ_LAYOUT.r1.y * H - (U * 0.6) / 2,
        }}
      >
        <PadButton label="RB" index={BUTTON_INDICES.RB} size={U * 1.2} run={run} rect />
      </View>

      {/* Right trigger R2 */}
      <View
        style={{
          position: 'absolute',
          left: STEVEMXZ_LAYOUT.r2.x * W - (U * 2.0 * 1.3) / 2,
          top: STEVEMXZ_LAYOUT.r2.y * H - (U * 0.8 * 1.3) / 2,
        }}
      >
        <PadButton label="RT" index={BUTTON_INDICES.RT} size={U * 2.0 * 0.8} run={run} rect />
      </View>

      {/* ---------- D-pad ---------- */}
      <DpadButton
        direction="up"
        icon={faChevronUp}
        x={dpad.cx - dpadBtnSize / 2}
        y={dpad.cy - dpadOffset - dpadBtnSize / 2}
        size={dpadBtnSize}
        run={run}
      />
      <DpadButton
        direction="down"
        icon={faChevronDown}
        x={dpad.cx - dpadBtnSize / 2}
        y={dpad.cy + dpadOffset - dpadBtnSize / 2}
        size={dpadBtnSize}
        run={run}
      />
      <DpadButton
        direction="left"
        icon={faChevronLeft}
        x={dpad.cx - dpadOffset - dpadBtnSize / 2}
        y={dpad.cy - dpadBtnSize / 2}
        size={dpadBtnSize}
        run={run}
      />
      <DpadButton
        direction="right"
        icon={faChevronRight}
        x={dpad.cx + dpadOffset - dpadBtnSize / 2}
        y={dpad.cy - dpadBtnSize / 2}
        size={dpadBtnSize}
        run={run}
      />

      {/* ---------- Analog sticks ---------- */}
      <AnalogStick side="left" cx={leftStick.cx} cy={leftStick.cy} size={stickSize} run={run} />
      <AnalogStick side="right" cx={rightStick.cx} cy={rightStick.cy} size={stickSize} run={run} />

      {/* ---------- Face buttons (X, Y, A, B) ---------- */}
      {/* X button */}
      <View style={{ position: 'absolute', left: 0.73 * W - faceBtnSize / 2, top: 0.45 * H - faceBtnSize / 2 }}>
        <PadButton label="X" index={BUTTON_INDICES.X} size={faceBtnSize} run={run} />
      </View>
      {/* Y button */}
      <View style={{ position: 'absolute', left: 0.73 * W - faceBtnSize / 2, top: 0.55 * H - faceBtnSize / 2 }}>
        <PadButton label="Y" index={BUTTON_INDICES.Y} size={faceBtnSize} run={run} />
      </View>
      {/* A button */}
      <View style={{ position: 'absolute', left: 0.83 * W - faceBtnSize / 2, top: 0.5 * H - faceBtnSize / 2 }}>
        <PadButton label="A" index={BUTTON_INDICES.A} size={faceBtnSize} run={run} />
      </View>
      {/* B button */}
      <View style={{ position: 'absolute', left: 0.83 * W - faceBtnSize / 2, top: 0.52 * H - faceBtnSize / 2 }}>
        <PadButton label="B" index={BUTTON_INDICES.B} size={faceBtnSize} run={run} />
      </View>

      {/* ---------- Start / Select ---------- */}
      <View style={{ position: 'absolute', left: 0.5 * W - (U * 1.1) / 2, top: 0.92 * H - (U * 0.9) / 2 }}>
        <PadButton label="Start" index={BUTTON_INDICES.MENU} size={U * 1.1} run={run} rect />
      </View>
      <View style={{ position: 'absolute', left: 0.5 * W - (U * 1.1) / 2, top: 0.88 * H - (U * 0.9) / 2 }}>
        <PadButton label="Select" index={BUTTON_INDICES.VIEW} size={U * 1.1} run={run} rect />
      </View>

      {/* ---------- L3 / R3 (stick clicks) ---------- */}
      <View style={{ position: 'absolute', left: leftStick.cx - (U * 0.9) / 2, top: leftStick.cy - (U * 0.9) / 2 }}>
        <PadButton label="L3" index={BUTTON_INDICES.L3} size={U * 0.9} run={run} />
      </View>
      <View style={{ position: 'absolute', left: rightStick.cx - (U * 0.9) / 2, top: rightStick.cy - (U * 0.9) / 2 }}>
        <PadButton label="R3" index={BUTTON_INDICES.R3} size={U * 0.9} run={run} />
      </View>

      {/* ---------- On-screen keyboard toggle ---------- */}
      <View
        style={{
          position: 'absolute',
          left: keyboardBtn.cx - keyboardBtnSize / 2,
          top: keyboardBtn.cy - keyboardBtnSize / 2,
        }}
      >
        <Pressable
          onPress={() => {
            playUiSound('tap', 0.18);
            // Signal the app to toggle on-screen keyboard
            run(`window.__xcpPad.setButton(${BUTTON_INDICES.VIEW}, true, 1)`);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
          }}
          style={styles.keyboardBtn}
        >
          <FaIcon icon={faKeyboard} size={Math.round(keyboardBtnSize / 2.4)} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* ---------- Settings button ---------- */}
      <View
        style={{
          position: 'absolute',
          left: 0.02 * W,
          top: 0.02 * H,
        }}
      >
        <Pressable
          onPress={() => {
            playUiSound('tap', 0.18);
            run(`window.__xcpPad.setButton(${BUTTON_INDICES.MENU}, true, 1)`);
            // TODO: Open settings panel
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
          }}
          style={styles.settingsBtn}
        >
          <FaIcon icon={faCog} size={Math.round((U * 1.0) / 2.4)} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

// -------------------------------------------------------
// Styles - Modern minimalist design matching Winlator Cmod StevenMXZ style
// -------------------------------------------------------
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    elevation: 90,
    backgroundColor: 'rgba(7, 10, 8, 0.8)', // M3 surface dark overlay
  },

  // D-pad base styles
  dpadButton: {
    position: 'absolute',
  },
  dpadButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },

  // Stick base styles
  stickBase: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999, // fully rounded
  },
  stickBaseActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(29, 184, 101, 0.10)',
  },
  stickKnob: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 999,
  },
  stickKnobActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },

  // Generic pad button
  padButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  padButtonPressed: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  padButtonLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,

  },

  // Control buttons (shoulders/triggers, face, start/select)
  keyboardBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },

  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 12,
    left: 12,
  },
});