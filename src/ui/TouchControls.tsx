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

// Winlator "Virtual Gamepad" profile (controls-3.icp) normalized layout.
// Coordinates are fractions of screen width/height (0..1); scale multiplies U.
const U_BASE = 0.065;
const WINLATOR_LAYOUT = {
  dpad: { x: 0.10784313827753067, y: 0.4, scale: 0.85 },
  faceX: { x: 0.8133170008659363, y: 0.4, scale: 1 },
  faceY: { x: 0.8721405267715454, y: 0.2666666746, scale: 1 },
  faceA: { x: 0.8721405267715454, y: 0.5333333254, scale: 1 },
  faceB: { x: 0.9309640526771545, y: 0.4, scale: 1 },
  r2: { x: 0.93, y: 0.07, scale: 2 },
  r1: { x: 0.97, y: 0.2222222388, scale: 1 },
  l1: { x: 0.03, y: 0.2222222388, scale: 1 },
  l2: { x: 0.07, y: 0.07, scale: 2 },
  start: { x: 0.538807213306427, y: 0.9111111164093018, scale: 0.85 },
  select: { x: 0.46078431606292725, y: 0.9111111164093018, scale: 0.85 },
  leftStick: { x: 0.21568627655506134, y: 0.7333333492279053, scale: 1 },
  rightStick: { x: 0.7843137383460999, y: 0.7333333492279053, scale: 1 },
  l3: { x: 0.05, y: 0.7333333492279053, scale: 0.85 },
  r3: { x: 0.95, y: 0.7333333492279053, scale: 0.85 },
} as const;

const STICK_RADIUS_FACTOR = 1.0;

function feedback() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

/** Generic round gamepad button. */
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
    feedback();
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

/** Directional D-pad button. */
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

/** Analog stick. */
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
        feedback();
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

export default function TouchControls({ run }: Props) {
  const { width: W, height: H } = Dimensions.get('window');
  const U = Math.min(W, H) * U_BASE;

  const pos = (p: { x: number; y: number; scale: number }) => ({
    cx: p.x * W,
    cy: p.y * H,
    size: U * p.scale * 1.6,
  });

  const dpad = pos(WINLATOR_LAYOUT.dpad);
  const dpadBtnSize = U * WINLATOR_LAYOUT.dpad.scale * 0.9;
  const dpadOffset = U * WINLATOR_LAYOUT.dpad.scale * 0.55;

  const leftStick = pos(WINLATOR_LAYOUT.leftStick);
  const rightStick = pos(WINLATOR_LAYOUT.rightStick);
  const stickSize = U * WINLATOR_LAYOUT.leftStick.scale * 2.2;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Left shoulder L1 */}
      <View
        style={{
          position: 'absolute',
          left: WINLATOR_LAYOUT.l1.x * W - (U * 1 * 1.2) / 2,
          top: WINLATOR_LAYOUT.l1.y * H - (U * 1 * 0.5) / 2,
        }}
      >
        <PadButton label="LB" index={BUTTON_INDICES.LB} size={U * 1 * 1.2} run={run} rect />
      </View>
      {/* Left trigger L2 */}
      <View
        style={{
          position: 'absolute',
          left: WINLATOR_LAYOUT.l2.x * W - (U * 2 * 1.2) / 2,
          top: WINLATOR_LAYOUT.l2.y * H - (U * 2 * 0.5) / 2,
        }}
      >
        <PadButton label="LT" index={BUTTON_INDICES.LT} size={U * 2 * 0.7} run={run} rect />
      </View>
      {/* Right shoulder R1 */}
      <View
        style={{
          position: 'absolute',
          left: WINLATOR_LAYOUT.r1.x * W - (U * 1 * 1.2) / 2,
          top: WINLATOR_LAYOUT.r1.y * H - (U * 1 * 0.5) / 2,
        }}
      >
        <PadButton label="RB" index={BUTTON_INDICES.RB} size={U * 1 * 1.2} run={run} rect />
      </View>
      {/* Right trigger R2 */}
      <View
        style={{
          position: 'absolute',
          left: WINLATOR_LAYOUT.r2.x * W - (U * 2 * 1.2) / 2,
          top: WINLATOR_LAYOUT.r2.y * H - (U * 2 * 0.5) / 2,
        }}
      >
        <PadButton label="RT" index={BUTTON_INDICES.RT} size={U * 2 * 0.7} run={run} rect />
      </View>

      {/* D-pad */}
      <DpadButton direction="up" icon={faChevronUp} x={dpad.cx - dpadBtnSize / 2} y={dpad.cy - dpadOffset - dpadBtnSize / 2} size={dpadBtnSize} run={run} />
      <DpadButton direction="down" icon={faChevronDown} x={dpad.cx - dpadBtnSize / 2} y={dpad.cy + dpadOffset - dpadBtnSize / 2} size={dpadBtnSize} run={run} />
      <DpadButton direction="left" icon={faChevronLeft} x={dpad.cx - dpadOffset - dpadBtnSize / 2} y={dpad.cy - dpadBtnSize / 2} size={dpadBtnSize} run={run} />
      <DpadButton direction="right" icon={faChevronRight} x={dpad.cx + dpadOffset - dpadBtnSize / 2} y={dpad.cy - dpadBtnSize / 2} size={dpadBtnSize} run={run} />

      {/* Left stick */}
      <AnalogStick side="left" cx={leftStick.cx} cy={leftStick.cy} size={stickSize} run={run} />
      {/* Right stick */}
      <AnalogStick side="right" cx={rightStick.cx} cy={rightStick.cy} size={stickSize} run={run} />

      {/* Face buttons */}
      {(() => {
        const f = (p: { x: number; y: number; scale: number }) => ({
          cx: p.x * W,
          cy: p.y * H,
          size: U * p.scale * 1.5,
        });
        const xBtn = f(WINLATOR_LAYOUT.faceX);
        const yBtn = f(WINLATOR_LAYOUT.faceY);
        const aBtn = f(WINLATOR_LAYOUT.faceA);
        const bBtn = f(WINLATOR_LAYOUT.faceB);
        return (
          <>
            <View style={{ position: 'absolute', left: xBtn.cx - xBtn.size / 2, top: xBtn.cy - xBtn.size / 2 }}>
              <PadButton label="X" index={BUTTON_INDICES.X} size={xBtn.size} run={run} />
            </View>
            <View style={{ position: 'absolute', left: yBtn.cx - yBtn.size / 2, top: yBtn.cy - yBtn.size / 2 }}>
              <PadButton label="Y" index={BUTTON_INDICES.Y} size={yBtn.size} run={run} />
            </View>
            <View style={{ position: 'absolute', left: aBtn.cx - aBtn.size / 2, top: aBtn.cy - aBtn.size / 2 }}>
              <PadButton label="A" index={BUTTON_INDICES.A} size={aBtn.size} run={run} />
            </View>
            <View style={{ position: 'absolute', left: bBtn.cx - bBtn.size / 2, top: bBtn.cy - bBtn.size / 2 }}>
              <PadButton label="B" index={BUTTON_INDICES.B} size={bBtn.size} run={run} />
            </View>
          </>
        );
      })()}

      {/* Start / Select */}
      {(() => {
        const s = (p: { x: number; y: number; scale: number }) => ({
          cx: p.x * W,
          cy: p.y * H,
          size: U * p.scale * 1.3,
        });
        const start = s(WINLATOR_LAYOUT.start);
        const select = s(WINLATOR_LAYOUT.select);
        return (
          <>
            <View style={{ position: 'absolute', left: start.cx - start.size / 2, top: start.cy - start.size / 2 }}>
              <PadButton label="Start" index={BUTTON_INDICES.MENU} size={start.size} run={run} rect />
            </View>
            <View style={{ position: 'absolute', left: select.cx - select.size / 2, top: select.cy - select.size / 2 }}>
              <PadButton label="Select" index={BUTTON_INDICES.VIEW} size={select.size} run={run} rect />
            </View>
          </>
        );
      })()}

      {/* L3 / R3 */}
      {(() => {
        const l3 = pos(WINLATOR_LAYOUT.l3);
        const r3 = pos(WINLATOR_LAYOUT.r3);
        const sz = U * 0.85 * 1.2;
        return (
          <>
            <View style={{ position: 'absolute', left: l3.cx - sz / 2, top: l3.cy - sz / 2 }}>
              <PadButton label="L3" index={BUTTON_INDICES.L3} size={sz} run={run} />
            </View>
            <View style={{ position: 'absolute', left: r3.cx - sz / 2, top: r3.cy - sz / 2 }}>
              <PadButton label="R3" index={BUTTON_INDICES.R3} size={sz} run={run} />
            </View>
          </>
        );
      })()}
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
  dpadButton: {
    position: 'absolute',
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
  stickBase: {
    position: 'absolute',
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
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  stickKnobActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
});