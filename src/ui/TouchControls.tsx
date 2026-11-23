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
  faCircle,
} from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

import { alpha, colors } from '../theme';
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
}: {
  label: string;
  index: number;
  size: number;
  run: Run;
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
          styles.faceLabel,
          {
            fontSize: Math.round(size * 0.42),
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
      <Animated.View
        style={[
          styles.padInner,
          {
            width: size * 0.62,
            height: size * 0.62,
            borderRadius: size * 0.32,
          },
          pressed && { opacity: 0.6, transform: [{ scale: 0.9 }] },
        ]}
      >
        <View
          style={[
            styles.triangle,
            {
              borderLeftWidth: size * 0.16,
              borderRightWidth: size * 0.16,
              borderBottomWidth: size * 0.26,
              transform: [{ rotate: icon === faChevronUp ? '0deg' : icon === faChevronDown ? '180deg' : icon === faChevronLeft ? '-90deg' : '90deg' }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

// -------------------------------------------------------
// Shoulder / trigger button (LB / RB / LT / RT)
// -------------------------------------------------------
function ShoulderButton({
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
          height: size * 0.52,
          borderTopLeftRadius: size * 0.26,
          borderTopRightRadius: size * 0.26,
          borderBottomLeftRadius: size * 0.1,
          borderBottomRightRadius: size * 0.1,
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
      <Animated.Text
        style={[
          styles.shoulderLabel,
          {
            fontSize: Math.round(size * 0.22),
            color: pressed ? colors.primary : colors.onSurface,
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
  size,
  run,
}: {
  side: 'left' | 'right';
  index: number;
  size: number;
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
        const max = size / 2 - size * 0.22;
        const dx = Math.max(-max, Math.min(max, gesture.dx));
        const dy = Math.max(-max, Math.min(max, gesture.dy));
        run(`window.__xcpPad.setAxis(${side === 'left' ? 0 : 2}, ${dx}, ${dy})`);
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
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      {...pan.panHandlers}
      accessible
      accessibilityLabel={`${side} analog stick`}
    >
      <View
        style={[
          styles.stickKnob,
          {
            width: size * 0.44,
            height: size * 0.44,
            borderRadius: size * 0.22,
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

  const faceSize = Math.round(U * 1.0);
  const stickBaseSize = Math.round(U * 2.2);
  const padKeySize = Math.round(U * 0.95);
  const shoulderWidth = Math.round(U * 2.4);
  const gap = Math.round(U * 0.12);

  // Safe insets
  const safeTop = Math.max(12, height * 0.025);
  const safeBottom = Math.max(12, height * 0.04);

  const atSafe = (xf: number, yf: number) => ({
    left: width * xf,
    top: height * yf,
  });

  const stickBottom = safeBottom + stickBaseSize * 0.15;
  const padBottom = safeBottom + padKeySize * 0.4;
  const faceBottom = safeBottom + faceSize * 1.3;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Shoulder / trigger buttons — topo da tela */}
      <View style={[styles.shoulderGroup, { top: safeTop, left: atSafe(0.02, 0).left }]}>
        <ShoulderButton label="LT" index={B.LT} size={shoulderWidth} run={run} />
      </View>
      <View style={[styles.shoulderGroup, { top: safeTop, right: width * 0.02 }]}>
        <ShoulderButton label="RT" index={B.RT} size={shoulderWidth} run={run} />
      </View>
      <View style={[styles.shoulderGroup, { top: safeTop + shoulderWidth * 0.62, left: atSafe(0.02, 0).left }]}>
        <ShoulderButton label="LB" index={B.LB} size={shoulderWidth} run={run} />
      </View>
      <View style={[styles.shoulderGroup, { top: safeTop + shoulderWidth * 0.62, right: width * 0.02 }]}>
        <ShoulderButton label="RB" index={B.RB} size={shoulderWidth} run={run} />
      </View>

      {/* D-pad — canto inferior esquerdo */}
      <View
        style={[
          styles.padGrid,
          {
            bottom: padBottom,
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
            { width: padKeySize * 0.6, height: padKeySize * 0.6, borderRadius: padKeySize * 0.3 },
          ]}
        >
          <View style={[styles.padDot, { width: padKeySize * 0.14, height: padKeySize * 0.14, borderRadius: padKeySize * 0.07 }]} />
        </View>
        <View style={[styles.padCell, { width: padKeySize, height: padKeySize }]}>
          <PadKey icon={faChevronRight} label="D-pad right" index={B.RIGHT} size={padKeySize} run={run} />
        </View>
        <View style={[styles.padCell, { width: padKeySize, height: padKeySize }]}>
          <PadKey icon={faChevronDown} label="D-pad down" index={B.DOWN} size={padKeySize} run={run} />
        </View>
      </View>

      {/* Analog sticks — base inferior esquerda / direita */}
      <View
        style={[
          styles.stickGroup,
          {
            bottom: stickBottom,
            left: atSafe(0.12, 0).left,
          },
        ]}
      >
        <AnalogStick side="left" index={B.L3} size={stickBaseSize} run={run} />
      </View>
      <View
        style={[
          styles.stickGroup,
          {
            bottom: stickBottom,
            right: width * 0.12,
          },
        ]}
      >
        <AnalogStick side="right" index={B.R3} size={stickBaseSize} run={run} />
      </View>

      {/* Face buttons — losango inferior direito */}
      <View
        style={[
          styles.faceGroup,
          {
            bottom: faceBottom,
            right: width * 0.06,
            width: faceSize * 3 + gap * 2,
            height: faceSize * 3 + gap * 2,
          },
        ]}
      >
        <View style={[styles.faceRow, { gap }]}>
          <FaceButton label="Y" index={B.Y} size={faceSize} run={run} />
        </View>
        <View style={[styles.faceRow, { gap }]}>
          <FaceButton label="X" index={B.X} size={faceSize} run={run} />
          <FaceButton label="B" index={B.B} size={faceSize} run={run} />
        </View>
        <View style={[styles.faceRow, { gap }]}>
          <FaceButton label="A" index={B.A} size={faceSize} run={run} />
        </View>
      </View>

      {/* L3 / R3 small buttons — acima dos sticks */}
      <View style={[styles.faceSmall, { bottom: stickBottom + stickBaseSize + 8, left: atSafe(0.12, 0).left + stickBaseSize * 0.28 }]}>
        <FaceButton label="L3" index={B.L3} size={Math.round(faceSize * 0.5)} run={run} />
      </View>
      <View style={[styles.faceSmall, { bottom: stickBottom + stickBaseSize + 8, right: width * 0.12 + stickBaseSize * 0.28 }]}>
        <FaceButton label="R3" index={B.R3} size={Math.round(faceSize * 0.5)} run={run} />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceGroup: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: alpha(colors.onSurface, 0.06),
    borderWidth: 1,
    borderColor: alpha(colors.onSurface, 0.12),
  },
  padDot: {
    backgroundColor: alpha(colors.onSurface, 0.2),
  },
  padKey: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  padInner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.onSurface, 0.09),
    borderWidth: 1.5,
    borderColor: alpha(colors.onSurface, 0.22),
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: alpha(colors.onSurface, 0.85),
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.onSurface, 0.1),
    borderWidth: 2,
    borderColor: alpha(colors.onSurface, 0.28),
  },
  faceLabel: {
    fontWeight: '700',
    color: colors.onSurface,
  },
  shoulder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.onSurface, 0.1),
    borderWidth: 1.5,
    borderColor: alpha(colors.onSurface, 0.24),
  },
  shoulderLabel: {
    fontWeight: '600',
    letterSpacing: 0.5,
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
});
