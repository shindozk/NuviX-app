import React, { useCallback, useRef, useState } from 'react';
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
import * as Haptics from 'expo-haptics';
import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faKeyboard,
} from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

import { colors, radius } from '../theme';
import FaIcon from './Icon';
import { playUiSound } from './sound';

// Standard W3C gamepad button indices
const B = {
  A: 0, B: 1, X: 2, Y: 3,
  LB: 4, RB: 5, LT: 6, RT: 7,
  VIEW: 8, MENU: 9, L3: 10, R3: 11,
  UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15,
} as const;

// -------------------------------------------------------
// Reusable round button
// -------------------------------------------------------
function RoundButton({
  label,
  icon,
  index,
  size,
  run,
  accent,
}: {
  label: string;
  icon?: IconProp;
  index: number;
  size: number;
  run: (script: string) => void;
  accent?: boolean;
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

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} hitSlop={6}>
      <Animated.View
        style={[
          styles.roundBtn,
          { width: size, height: size, borderRadius: size / 2, transform: [{ scale }] },
          pressed && styles.roundBtnPressed,
          accent && styles.roundBtnAccent,
        ]}
      >
        {icon ? (
          <FaIcon icon={icon} size={Math.round(size * 0.42)} color={pressed ? colors.onPrimary : colors.textPrimary} />
        ) : (
          <Text style={[styles.roundBtnLabel, { fontSize: Math.round(size * 0.38) }]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

// -------------------------------------------------------
// Rectangular shoulder/trigger button
// -------------------------------------------------------
function ShoulderButton({
  label,
  index,
  width,
  height,
  run,
}: {
  label: string;
  index: number;
  width: number;
  height: number;
  run: (script: string) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const pressIn = useCallback(() => {
    setPressed(true);
    Animated.spring(scale, { toValue: 0.92, speed: 40, useNativeDriver: true }).start();
    playUiSound('tap', 0.18);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    run(`window.__xcpPad.setButton(${index}, true, 1)`);
  }, [index, run, scale]);

  const pressOut = useCallback(() => {
    setPressed(false);
    Animated.spring(scale, { toValue: 1, speed: 30, useNativeDriver: true }).start();
    run(`window.__xcpPad.setButton(${index}, false, 0)`);
  }, [index, run, scale]);

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} hitSlop={4}>
      <Animated.View
        style={[
          styles.shoulderBtn,
          { width, height, borderRadius: height / 2, transform: [{ scale }] },
          pressed && styles.shoulderBtnPressed,
        ]}
      >
        <Text style={[styles.shoulderBtnLabel, { fontSize: Math.round(height * 0.45) }]}>{label}</Text>
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
        const nx = x / max;
        const ny = y / max;
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
            width: size * 0.4,
            height: size * 0.4,
            borderRadius: (size * 0.4) / 2,
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
// Main component
// -------------------------------------------------------
export default function TouchControls({ run }: { run: (script: string) => void }) {
  const { width: W, height: H } = Dimensions.get('window');
  const U = Math.min(W, H) * 0.07;

  // Helper to place an element centered at (fx, fy) fraction
  const at = (fx: number, fy: number, w: number, h: number) => ({
    position: 'absolute' as const,
    left: fx * W - w / 2,
    top: fy * H - h / 2,
    width: w,
    height: h,
  });

  const btnSize = U * 1.6;
  const dpadBtnSize = U * 1.5;
  const dpadGap = U * 0.75;
  const stickSize = U * 3.2;
  const shoulderW = U * 2.4;
  const shoulderH = U * 0.9;
  const triggerW = U * 2.8;
  const triggerH = U * 1.0;

  // D-pad center
  const dpadCx = 0.13 * W;
  const dpadCy = 0.42 * H;

  // Face buttons center (diamond)
  const faceCx = 0.87 * W;
  const faceCy = 0.42 * H;
  const faceGap = U * 1.1;

  // Sticks
  const leftStickCx = 0.13 * W;
  const leftStickCy = 0.78 * H;
  const rightStickCx = 0.87 * W;
  const rightStickCy = 0.78 * H;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* ---------- Triggers (top) ---------- */}
      <View style={at(0.06, 0.06, triggerW, triggerH)}>
        <ShoulderButton label="LT" index={B.LT} width={triggerW} height={triggerH} run={run} />
      </View>
      <View style={at(0.94, 0.06, triggerW, triggerH)}>
        <ShoulderButton label="RT" index={B.RT} width={triggerW} height={triggerH} run={run} />
      </View>

      {/* ---------- Shoulders ---------- */}
      <View style={at(0.06, 0.16, shoulderW, shoulderH)}>
        <ShoulderButton label="LB" index={B.LB} width={shoulderW} height={shoulderH} run={run} />
      </View>
      <View style={at(0.94, 0.16, shoulderW, shoulderH)}>
        <ShoulderButton label="RB" index={B.RB} width={shoulderW} height={shoulderH} run={run} />
      </View>

      {/* ---------- Select / Start ---------- */}
      <View style={at(0.42, 0.10, U * 2.2, U * 0.9)}>
        <ShoulderButton label="Select" index={B.VIEW} width={U * 2.2} height={U * 0.9} run={run} />
      </View>
      <View style={at(0.58, 0.10, U * 2.2, U * 0.9)}>
        <ShoulderButton label="Start" index={B.MENU} width={U * 2.2} height={U * 0.9} run={run} />
      </View>

      {/* ---------- D-pad ---------- */}
      <View style={at(0.13, 0.36, dpadBtnSize, dpadBtnSize)}>
        <RoundButton label="" icon={faChevronUp} index={B.UP} size={dpadBtnSize} run={run} />
      </View>
      <View style={at(0.13, 0.48, dpadBtnSize, dpadBtnSize)}>
        <RoundButton label="" icon={faChevronDown} index={B.DOWN} size={dpadBtnSize} run={run} />
      </View>
      <View style={at(0.085, 0.42, dpadBtnSize, dpadBtnSize)}>
        <RoundButton label="" icon={faChevronLeft} index={B.LEFT} size={dpadBtnSize} run={run} />
      </View>
      <View style={at(0.175, 0.42, dpadBtnSize, dpadBtnSize)}>
        <RoundButton label="" icon={faChevronRight} index={B.RIGHT} size={dpadBtnSize} run={run} />
      </View>

      {/* ---------- Face buttons (diamond: Y top, X left, B right, A bottom) ---------- */}
      <View style={at(0.87, 0.42 - faceGap / H, btnSize, btnSize)}>
        <RoundButton label="Y" index={B.Y} size={btnSize} run={run} />
      </View>
      <View style={at(0.87 - faceGap / W, 0.42, btnSize, btnSize)}>
        <RoundButton label="X" index={B.X} size={btnSize} run={run} />
      </View>
      <View style={at(0.87 + faceGap / W, 0.42, btnSize, btnSize)}>
        <RoundButton label="B" index={B.B} size={btnSize} run={run} />
      </View>
      <View style={at(0.87, 0.42 + faceGap / H, btnSize, btnSize)}>
        <RoundButton label="A" index={B.A} size={btnSize} run={run} />
      </View>

      {/* ---------- Analog sticks ---------- */}
      <AnalogStick side="left" cx={leftStickCx} cy={leftStickCy} size={stickSize} run={run} />
      <AnalogStick side="right" cx={rightStickCx} cy={rightStickCy} size={stickSize} run={run} />

      {/* ---------- L3 / R3 (small, above sticks) ---------- */}
      <View style={at(0.13, 0.62, U * 1.3, U * 1.3)}>
        <RoundButton label="L3" index={B.L3} size={U * 1.3} run={run} />
      </View>
      <View style={at(0.87, 0.62, U * 1.3, U * 1.3)}>
        <RoundButton label="R3" index={B.R3} size={U * 1.3} run={run} />
      </View>

      {/* ---------- On-screen keyboard toggle (bottom right) ---------- */}
      <View style={at(0.95, 0.92, U * 1.6, U * 1.6)}>
        <Pressable
          onPress={() => {
            playUiSound('tap', 0.18);
            // Toggle on-screen keyboard via the bridge VIEW button
            run(`window.__xcpPad.setButton(${B.VIEW}, true, 1)`);
            setTimeout(() => run(`window.__xcpPad.setButton(${B.VIEW}, false, 0)`), 100);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
          }}
          style={styles.kbdBtn}
        >
          <FaIcon icon={faKeyboard} size={Math.round(U * 0.65)} color={colors.textPrimary} />
        </Pressable>
      </View>
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
    // Transparent - no overlay covering the game
    backgroundColor: 'transparent',
  },

  roundBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnPressed: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  roundBtnAccent: {
    borderColor: colors.accent,
  },
  roundBtnLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
  },

  shoulderBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shoulderBtnPressed: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  shoulderBtnLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  stickBase: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickBaseActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(29, 184, 101, 0.08)',
  },
  stickKnob: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  stickKnobActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },

  kbdBtn: {
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
