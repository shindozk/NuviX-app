import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
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
  primary,
}: {
  label: string;
  index: number;
  size: number;
  run: Run;
  primary?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const { pressIn, pressOut } = usePressFeedback(run, index);

  return (
    <Pressable
      style={[
        styles.face,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: primary
            ? alpha(colors.primary, 0.22)
            : alpha(colors.onSurface, 0.1),
          borderColor: primary
            ? alpha(colors.primary, 0.65)
            : alpha(colors.onSurface, 0.24),
        },
      ]}
      hitSlop={4}
      onPressIn={() => {
        Animated.spring(scale, {
          toValue: 0.88,
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
          styles.faceLabel,
          {
            fontSize: Math.round(size * 0.38),
            color: primary ? colors.primary : colors.onSurface,
            transform: [{ scale }],
          },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

// -------------------------------------------------------
// Directional pad (D-pad)
// -------------------------------------------------------
function PadKey({
  icon,
  label,
  index,
  size,
  run,
}: {
  icon: IconProp;
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
        styles.padKey,
        {
          width: size,
          height: size,
          backgroundColor: pressed
            ? alpha(colors.primary, 0.28)
            : alpha(colors.onSurface, 0.08),
          borderColor: pressed
            ? alpha(colors.primary, 0.7)
            : alpha(colors.onSurface, 0.2),
        },
      ]}
      hitSlop={3}
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
      <FaIcon icon={icon} size={Math.round(size * 0.36)} color={colors.onSurface} />
    </Pressable>
  );
}

// -------------------------------------------------------
// Shoulder / trigger button (LB / RB / LT / RT)
// -------------------------------------------------------
function ShoulderButton({
  label,
  index,
  width,
  run,
}: {
  label: string;
  index: number;
  width: number;
  run: Run;
}) {
  const { pressIn, pressOut } = usePressFeedback(run, index);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      style={[
        styles.shoulder,
        {
          width,
          height: 32,
          backgroundColor: pressed
            ? alpha(colors.primary, 0.24)
            : alpha(colors.onSurface, 0.09),
          borderColor: pressed
            ? alpha(colors.primary, 0.6)
            : alpha(colors.onSurface, 0.2),
        },
      ]}
      hitSlop={4}
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
      <Animated.Text
        style={[
          styles.shoulderLabel,
          {
            fontSize: 12,
            color: pressed ? colors.primary : colors.onSurface,
            letterSpacing: 0.5,
          },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

// -------------------------------------------------------
// Analog stick
// -------------------------------------------------------
function AnalogStick({
  side,
  index,
  baseSize,
  run,
}: {
  side: 'left' | 'right';
  index: number;
  baseSize: number;
  run: Run;
}) {
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        playUiSound('tap', 0.12);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        run(`window.__xcpPad.setButton(${index}, true, 1)`);
      },
      onPanResponderMove: (_event, gesture) => {
        const max = baseSize / 2 - 18;
        run(`window.__xcpPad.setAxis(${side === 'left' ? 0 : 2}, ${gesture.dx}, ${gesture.dy})`);
      },
      onPanResponderRelease: () => {
        run(`window.__xcpPad.setAxis(${side === 'left' ? 0 : 2}, 0, 0)`);
        run(`window.__xcpPad.setButton(${index}, false, 0)`);
      },
    })
  ).current;

  return (
    <View
      style={[
        styles.stickBase,
        {
          width: baseSize,
          height: baseSize,
          borderRadius: baseSize / 2,
          backgroundColor: alpha(colors.onSurface, 0.055),
          borderColor: alpha(colors.onSurface, 0.16),
        },
      ]}
      {...pan.panHandlers}
      accessible
      accessibilityLabel={`${side} analog stick`}
    >
      <View style={styles.stickRing} />
      <View
        style={[
          styles.stickKnob,
          {
            width: baseSize * 0.36,
            height: baseSize * 0.36,
            borderRadius: (baseSize * 0.36) / 2,
            backgroundColor: alpha(colors.onSurface, 0.26),
            borderColor: alpha(colors.onSurface, 0.36),
          },
        ]}
      />
    </View>
  );
}

// -------------------------------------------------------
// Main TouchControls
// -------------------------------------------------------
export default function TouchControls({ run }: { run: Run }) {
  const { width, height } = useWindowDimensions();
  const U = Math.min(width, height) * 0.062;

  const faceSize = Math.round(U * 1.05);
  const stickBaseSize = Math.round(U * 2.4);
  const padKeySize = Math.round(U * 0.92);
  const shoulderWidth = Math.round(U * 2.6);

  // Safe insets (approx, avoid system nav bar)
  const safeTop = Math.max(12, height * 0.025);
  const safeBottom = Math.max(12, height * 0.04);

  const atSafe = (xf: number, yf: number) => ({
    left: width * xf,
    top: height * yf,
  });

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Shoulder / trigger buttons */}
      <View style={[styles.shoulderGroup, { top: safeTop, left: atSafe(0.02, 0).left }]}>
        <ShoulderButton label="LT" index={B.LT} width={shoulderWidth} run={run} />
      </View>
      <View style={[styles.shoulderGroup, { top: safeTop, right: width * 0.02 }]}>
        <ShoulderButton label="RT" index={B.RT} width={shoulderWidth} run={run} />
      </View>
      <View style={[styles.shoulderGroup, { top: safeTop + 36, left: atSafe(0.02, 0).left }]}>
        <ShoulderButton label="LB" index={B.LB} width={shoulderWidth} run={run} />
      </View>
      <View style={[styles.shoulderGroup, { top: safeTop + 36, right: width * 0.02 }]}>
        <ShoulderButton label="RB" index={B.RB} width={shoulderWidth} run={run} />
      </View>

      {/* D-pad */}
      <View
        style={[
          styles.padGrid,
          {
            bottom: safeBottom + stickBaseSize * 0.4,
            left: atSafe(0.03, 0).left,
            width: padKeySize * 3,
            height: padKeySize * 3,
          },
        ]}
      >
        <View style={[styles.padCell, { width: padKeySize, height: padKeySize }]}>
          <PadKey icon={faChevronUp} label="D-pad up" index={B.UP} size={padKeySize} run={run} />
        </View>
        <View style={[styles.padCell, { width: padKeySize, height: padKeySize }]}>
          <PadKey icon={faChevronLeft} label="D-pad left" index={B.LEFT} size={padKeySize} run={run} />
        </View>
        <View
          style={[
            styles.padCenter,
            { width: padKeySize * 0.65, height: padKeySize * 0.65, borderRadius: padKeySize * 0.33 },
          ]}
        >
          <View style={[styles.padDot, { width: 6, height: 6, borderRadius: 3 }]} />
        </View>
        <View style={[styles.padCell, { width: padKeySize, height: padKeySize }]}>
          <PadKey icon={faChevronRight} label="D-pad right" index={B.RIGHT} size={padKeySize} run={run} />
        </View>
        <View style={[styles.padCell, { width: padKeySize, height: padKeySize }]}>
          <PadKey icon={faChevronDown} label="D-pad down" index={B.DOWN} size={padKeySize} run={run} />
        </View>
      </View>

      {/* Analog sticks */}
      <View
        style={[
          styles.stickGroup,
          {
            bottom: safeBottom + stickBaseSize * 0.35,
            left: atSafe(0.08, 0).left,
          },
        ]}
      >
        <AnalogStick side="left" index={B.L3} baseSize={stickBaseSize} run={run} />
      </View>
      <View
        style={[
          styles.stickGroup,
          {
            bottom: safeBottom + stickBaseSize * 0.35,
            right: width * 0.08,
          },
        ]}
      >
        <AnalogStick side="right" index={B.R3} baseSize={stickBaseSize} run={run} />
      </View>

      {/* Face buttons */}
      <View
        style={[
          styles.faceGroup,
          {
            bottom: safeBottom + faceSize * 1.4,
            right: width * 0.04,
          },
        ]}
      >
        <View style={[styles.faceRow, { gap: faceSize * 0.16 }]}>
          <FaceButton label="Y" index={B.Y} size={faceSize} run={run} />
        </View>
        <View style={[styles.faceRow, { gap: faceSize * 0.16 }]}>
          <FaceButton label="X" index={B.X} size={faceSize} run={run} />
          <FaceButton label="B" index={B.B} size={faceSize} run={run} />
        </View>
        <View style={[styles.faceRow, { gap: faceSize * 0.16 }]}>
          <FaceButton label="A" index={B.A} size={faceSize} run={run} primary />
        </View>
      </View>

      {/* L3 / R3 small buttons */}
      <View style={[styles.faceSmall, { bottom: safeBottom + stickBaseSize * 0.35 + stickBaseSize + 8, left: atSafe(0.08, 0).left }]}>
        <FaceButton label="L3" index={B.L3} size={Math.round(faceSize * 0.55)} run={run} />
      </View>
      <View style={[styles.faceSmall, { bottom: safeBottom + stickBaseSize * 0.35 + stickBaseSize + 8, right: width * 0.08 }]}>
        <FaceButton label="R3" index={B.R3} size={Math.round(faceSize * 0.55)} run={run} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
  },
  shoulderGroup: {
    position: 'absolute',
  },
  faceGroup: {
    position: 'absolute',
    alignItems: 'center',
  },
  faceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 2,
  },
  faceSmall: {
    position: 'absolute',
  },
  stickGroup: {
    position: 'absolute',
  },
  padGrid: {
    position: 'absolute',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  padCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  padCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  padDot: {
    backgroundColor: alpha(colors.onSurface, 0.25),
  },
  padKey: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  faceLabel: {
    fontWeight: '700',
  },
  shoulder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
  },
  shoulderLabel: {
    fontWeight: '600',
  },
  stickBase: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stickRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: alpha(colors.onSurface, 0.08),
  },
  stickKnob: {
    borderWidth: 1,
  },
});
