import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
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

import { alpha, colors, spring } from '../theme';
import FaIcon from './Icon';
import { playUiSound } from './sound';

// Standard W3C gamepad button indices
const B = {
  A: 0, B: 1, X: 2, Y: 3,
  LB: 4, RB: 5, LT: 6, RT: 7,
  VIEW: 8, MENU: 9, L3: 10, R3: 11,
  UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15,
} as const;

type Run = (script: string) => void;

/** Haptic + click shared by every button. */
function usePressFeedback(run: Run, index: number) {
  return {
    pressIn: useCallback(() => {
      playUiSound('tap', 0.16);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      run(`window.__xcpPad.setButton(${index}, true, 1)`);
    }, [index, run]),
    pressOut: useCallback(() => {
      run(`window.__xcpPad.setButton(${index}, false, 0)`);
    }, [index, run]),
  };
}

// -------------------------------------------------------
// Face button (A / B / X / Y)
// -------------------------------------------------------
function FaceButton({
  label,
  index,
  size,
  run,
  small,
}: {
  label: string;
  index: number;
  size: number;
  run: Run;
  small?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);
  const { pressIn, pressOut } = usePressFeedback(run, index);

  const handleIn = useCallback(() => {
    setPressed(true);
    pressIn();
    Animated.spring(scale, { toValue: 0.9, speed: 45, useNativeDriver: true }).start();
  }, [pressIn, scale]);

  const handleOut = useCallback(() => {
    setPressed(false);
    pressOut();
    Animated.spring(scale, { toValue: 1, ...spring.snappy, useNativeDriver: true }).start();
  }, [pressOut, scale]);

  return (
    <Pressable
      onPressIn={handleIn}
      onPressOut={handleOut}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.face,
          { width: size, height: size, borderRadius: size / 2, transform: [{ scale }] },
          pressed && styles.facePressed,
          small && styles.faceSmall,
        ]}
      >
        <Text
          style={[
            styles.faceLabel,
            { fontSize: Math.max(11, Math.round(size * (small ? 0.38 : 0.34))) },
            pressed && styles.faceLabelPressed,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// -------------------------------------------------------
// D-pad key
// -------------------------------------------------------
function PadKey({
  icon,
  index,
  size,
  label,
  run,
}: {
  icon: IconProp;
  index: number;
  size: number;
  label: string;
  run: Run;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);
  const { pressIn, pressOut } = usePressFeedback(run, index);

  const handleIn = useCallback(() => {
    setPressed(true);
    pressIn();
    Animated.spring(scale, { toValue: 0.9, speed: 45, useNativeDriver: true }).start();
  }, [pressIn, scale]);

  const handleOut = useCallback(() => {
    setPressed(false);
    pressOut();
    Animated.spring(scale, { toValue: 1, ...spring.snappy, useNativeDriver: true }).start();
  }, [pressOut, scale]);

  return (
    <Pressable
      onPressIn={handleIn}
      onPressOut={handleOut}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.padKey,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.32),
            transform: [{ scale }],
          },
          pressed && styles.padKeyPressed,
        ]}
      >
        <FaIcon
          icon={icon}
          size={Math.round(size * 0.42)}
          color={pressed ? colors.onPrimary : colors.onSurfaceVariant}
        />
      </Animated.View>
    </Pressable>
  );
}

// -------------------------------------------------------
// Shoulder / trigger pill
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
  run: Run;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);
  const { pressIn, pressOut } = usePressFeedback(run, index);

  const handleIn = useCallback(() => {
    setPressed(true);
    pressIn();
    Animated.spring(scale, { toValue: 0.92, speed: 45, useNativeDriver: true }).start();
  }, [pressIn, scale]);

  const handleOut = useCallback(() => {
    setPressed(false);
    pressOut();
    Animated.spring(scale, { toValue: 1, ...spring.snappy, useNativeDriver: true }).start();
  }, [pressOut, scale]);

  return (
    <Pressable
      onPressIn={handleIn}
      onPressOut={handleOut}
      hitSlop={3}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.shoulder,
          { width, height, borderRadius: height / 2, transform: [{ scale }] },
          pressed && styles.shoulderPressed,
        ]}
      >
        <Text
          style={[
            styles.shoulderLabel,
            { fontSize: Math.max(11, Math.round(height * 0.36)) },
            pressed && styles.shoulderLabelPressed,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
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
  run: Run;
}) {
  const axisX = side === 'left' ? 0 : 2;
  const axisY = side === 'left' ? 1 : 3;
  const knob = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [active, setActive] = useState(false);
  const granted = useRef(false);
  const max = size * 0.3;

  const release = useCallback(() => {
    granted.current = false;
    setActive(false);
    run(`window.__xcpPad.setAxis(${axisX}, 0)`);
    run(`window.__xcpPad.setAxis(${axisY}, 0)`);
    Animated.spring(knob, {
      toValue: { x: 0, y: 0 },
      ...spring.snappy,
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
      onPanResponderMove: (_event, gesture) => {
        if (!granted.current) return;
        const distance = Math.hypot(gesture.dx, gesture.dy);
        const factor = distance > max ? max / distance : 1;
        const x = gesture.dx * factor;
        const y = gesture.dy * factor;
        knob.setValue({ x, y });

        // Small dead zone keeps the stick from drifting when released.
        const deadzone = 0.14;
        const nx = Math.abs(x / max) < deadzone ? 0 : x / max;
        const ny = Math.abs(y / max) < deadzone ? 0 : y / max;
        run(`window.__xcpPad.setAxis(${axisX}, ${Number(nx).toFixed(3)})`);
        run(`window.__xcpPad.setAxis(${axisY}, ${Number(ny).toFixed(3)})`);
      },
      onPanResponderRelease: release,
      onPanResponderTerminate: release,
    })
  ).current;

  const knobSize = size * 0.4;

  return (
    <View
      pointerEvents="box-none"
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
      <View
        style={[
          styles.stickRing,
          { width: size * 0.62, height: size * 0.62, borderRadius: size * 0.31 },
        ]}
      />
      <Animated.View
        style={[
          styles.stickKnob,
          {
            width: knobSize,
            height: knobSize,
            borderRadius: knobSize / 2,
            transform: [{ translateX: knob.x }, { translateY: knob.y }],
          },
          active && styles.stickKnobActive,
        ]}
        {...pan.panHandlers}
        accessible
        accessibilityRole="button"
        accessibilityLabel={side === 'left' ? 'Left analog stick' : 'Right analog stick'}
      />
    </View>
  );
}

// -------------------------------------------------------
// Main component
// -------------------------------------------------------
export default function TouchControls({ run }: { run: Run }) {
  const { width: W, height: H } = useWindowDimensions();

  // One unit drives every control, so the layout scales with the screen.
  const U = Math.min(W, H) * 0.075;

  const faceSize = U * 1.7;
  const padSize = U * 1.3;
  const padGap = U * 0.16;
  const padGrid = padSize * 3 + padGap * 2;
  const stickSize = U * 3.2;
  const shoulderW = U * 2.3;
  const shoulderH = U * 0.9;
  const triggerW = U * 2.7;
  const triggerH = U * 1.0;
  const faceGap = U * 1.15;

  const clampCenter = (value: number, half: number, limit: number) =>
    Math.max(half + 4, Math.min(value, limit - half - 4));

  /** Centres a control at (fx, fy) and keeps it fully on screen. */
  const atSafe = (fx: number, fy: number, w: number, h: number, margin = 4) => ({
    position: 'absolute' as const,
    left: Math.max(margin, Math.min(fx * W - w / 2, W - w - margin)),
    top: Math.max(margin, Math.min(fy * H - h / 2, H - h - margin)),
    width: w,
    height: h,
  });

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* ---------- Triggers ---------- */}
      <View style={atSafe(0.055, 0.055, triggerW, triggerH)}>
        <ShoulderButton label="LT" index={B.LT} width={triggerW} height={triggerH} run={run} />
      </View>
      <View style={atSafe(0.945, 0.055, triggerW, triggerH)}>
        <ShoulderButton label="RT" index={B.RT} width={triggerW} height={triggerH} run={run} />
      </View>

      {/* ---------- Shoulders ---------- */}
      <View style={atSafe(0.06, 0.155, shoulderW, shoulderH)}>
        <ShoulderButton label="LB" index={B.LB} width={shoulderW} height={shoulderH} run={run} />
      </View>
      <View style={atSafe(0.94, 0.155, shoulderW, shoulderH)}>
        <ShoulderButton label="RB" index={B.RB} width={shoulderW} height={shoulderH} run={run} />
      </View>

      {/* ---------- Select / Start ---------- */}
      <View style={atSafe(0.415, 0.085, U * 2.1, U * 0.86)}>
        <ShoulderButton label="Select" index={B.VIEW} width={U * 2.1} height={U * 0.86} run={run} />
      </View>
      <View style={atSafe(0.585, 0.085, U * 2.1, U * 0.86)}>
        <ShoulderButton label="Start" index={B.MENU} width={U * 2.1} height={U * 0.86} run={run} />
      </View>

      {/* ---------- D-pad (3x3) ---------- */}
      <View
        style={[
          styles.padGrid,
          {
            width: padGrid,
            height: padGrid,
            left: clampCenter(0.13 * W, padGrid / 2, W) - padGrid / 2,
            top: clampCenter(0.43 * H, padGrid / 2, H) - padGrid / 2,
          },
        ]}
      >
        <View style={[styles.padCell, { left: padSize + padGap, top: 0 }]}>
          <PadKey icon={faChevronUp} index={B.UP} size={padSize} label="D-pad up" run={run} />
        </View>
        <View style={[styles.padCell, { left: 0, top: padSize + padGap }]}>
          <PadKey icon={faChevronLeft} index={B.LEFT} size={padSize} label="D-pad left" run={run} />
        </View>
        <View style={[styles.padCell, { left: padSize + padGap, top: padSize + padGap }]}>
          <View
            style={[
              styles.padCenter,
              { width: padSize, height: padSize, borderRadius: padSize * 0.32 },
            ]}
          >
            <View style={styles.padDot} />
          </View>
        </View>
        <View style={[styles.padCell, { left: (padSize + padGap) * 2, top: padSize + padGap }]}>
          <PadKey
            icon={faChevronRight}
            index={B.RIGHT}
            size={padSize}
            label="D-pad right"
            run={run}
          />
        </View>
        <View style={[styles.padCell, { left: padSize + padGap, top: (padSize + padGap) * 2 }]}>
          <PadKey icon={faChevronDown} index={B.DOWN} size={padSize} label="D-pad down" run={run} />
        </View>
      </View>

      {/* ---------- Face buttons (diamond) ---------- */}
      <View style={atSafe(0.875, 0.43 - faceGap / H, faceSize, faceSize)}>
        <FaceButton label="Y" index={B.Y} size={faceSize} run={run} />
      </View>
      <View style={atSafe(0.875 - faceGap / W, 0.43, faceSize, faceSize)}>
        <FaceButton label="X" index={B.X} size={faceSize} run={run} />
      </View>
      <View style={atSafe(0.875 + faceGap / W, 0.43, faceSize, faceSize)}>
        <FaceButton label="B" index={B.B} size={faceSize} run={run} />
      </View>
      <View style={atSafe(0.875, 0.43 + faceGap / H, faceSize, faceSize)}>
        <FaceButton label="A" index={B.A} size={faceSize} run={run} />
      </View>

      {/* ---------- Analog sticks ---------- */}
      <AnalogStick
        side="left"
        cx={clampCenter(0.13 * W, stickSize / 2, W)}
        cy={clampCenter(0.77 * H, stickSize / 2, H)}
        size={stickSize}
        run={run}
      />
      <AnalogStick
        side="right"
        cx={clampCenter(0.87 * W, stickSize / 2, W)}
        cy={clampCenter(0.77 * H, stickSize / 2, H)}
        size={stickSize}
        run={run}
      />

      {/* ---------- L3 / R3 ---------- */}
      <View style={atSafe(0.13, 0.6, U * 1.1, U * 1.1)}>
        <FaceButton label="L3" index={B.L3} size={U * 1.1} run={run} small />
      </View>
      <View style={atSafe(0.87, 0.6, U * 1.1, U * 1.1)}>
        <FaceButton label="R3" index={B.R3} size={U * 1.1} run={run} small />
      </View>

      {/* ---------- On-screen keyboard ---------- */}
      <View style={atSafe(0.945, 0.9, U * 1.4, U * 1.4, 2)}>
        <Pressable
          onPress={() => {
            playUiSound('tap', 0.16);
            run(`window.__xcpPad.setButton(${B.VIEW}, true, 1)`);
            setTimeout(() => run(`window.__xcpPad.setButton(${B.VIEW}, false, 0)`), 90);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
          }}
          accessibilityRole="button"
          accessibilityLabel="On-screen keyboard"
        >
          <View
            style={[styles.kbd, { width: U * 1.4, height: U * 1.4, borderRadius: U * 0.5 }]}
          >
            <FaIcon
              icon={faKeyboard}
              size={Math.round(U * 0.55)}
              color={colors.onPrimaryContainer}
            />
          </View>
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
    zIndex: 50,
    elevation: 50,
    backgroundColor: 'transparent',
  },

  /* Face buttons */
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.onSurface, 0.07),
    borderWidth: 1.5,
    borderColor: alpha(colors.onSurface, 0.16),
  },
  facePressed: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  faceSmall: {
    backgroundColor: alpha(colors.onSurface, 0.04),
  },
  faceLabel: {
    fontWeight: '700',
    letterSpacing: 0.2,
    color: colors.onSurface,
  },
  faceLabelPressed: {
    color: colors.onPrimary,
  },

  /* D-pad */
  padGrid: {
    position: 'absolute',
  },
  padCell: {
    position: 'absolute',
  },
  padKey: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.onSurface, 0.07),
    borderWidth: 1.5,
    borderColor: alpha(colors.onSurface, 0.16),
  },
  padKeyPressed: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  padCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.onSurface, 0.03),
    borderWidth: 1,
    borderColor: alpha(colors.onSurface, 0.06),
  },
  padDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: alpha(colors.onSurface, 0.2),
  },

  /* Shoulder / trigger pills */
  shoulder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.onSurface, 0.08),
    borderWidth: 1.5,
    borderColor: alpha(colors.onSurface, 0.18),
  },
  shoulderPressed: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  shoulderLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.onSurfaceVariant,
  },
  shoulderLabelPressed: {
    color: colors.onPrimary,
  },

  /* Analog sticks */
  stickBase: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.onSurface, 0.05),
    borderWidth: 2,
    borderColor: alpha(colors.onSurface, 0.14),
  },
  stickBaseActive: {
    borderColor: alpha(colors.primary, 0.7),
    backgroundColor: alpha(colors.primary, 0.08),
  },
  stickRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: alpha(colors.onSurface, 0.08),
  },
  stickKnob: {
    backgroundColor: alpha(colors.onSurface, 0.24),
    borderWidth: 1,
    borderColor: alpha(colors.onSurface, 0.34),
  },
  stickKnobActive: {
    backgroundColor: alpha(colors.primary, 0.3),
    borderColor: alpha(colors.primary, 0.9),
  },

  /* Keyboard */
  kbd: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
    borderWidth: 1,
    borderColor: alpha(colors.primary, 0.5),
  },
});
