import React, { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';

import { colors } from '../theme';

export type StickAxis = 'left' | 'right' | 'up' | 'down';

type Props = {
  run: (script: string) => void;
};

type ButtonConfig = {
  label: string;
  index: number;
  x: number;
  y: number;
};

// Button indices for the virtual gamepad
const BUTTON_INDICES: Record<string, number> = {
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
};

// Minimalist gamepad layout
const BUTTONS: ButtonConfig[] = [
  { label: 'A', index: BUTTON_INDICES.A, x: 0.51, y: 0.63 },
  { label: 'B', index: BUTTON_INDICES.B, x: 0.45, y: 0.51 },
  { label: 'X', index: BUTTON_INDICES.X, x: 0.31, y: 0.54 },
  { label: 'Y', index: BUTTON_INDICES.Y, x: 0.25, y: 0.42 },
  { label: 'LB', index: BUTTON_INDICES.LB, x: 0.08, y: 0.5 },
  { label: 'RB', index: BUTTON_INDICES.RB, x: 0.84, y: 0.5 },
  { label: 'LT', index: BUTTON_INDICES.LT, x: 0.12, y: 0.38 },
  { label: 'RT', index: BUTTON_INDICES.RT, x: 0.79, y: 0.37 },
  { label: '⧉', index: BUTTON_INDICES.VIEW, x: 0.92, y: 0.48 },
  { label: '☰', index: BUTTON_INDICES.MENU, x: 0.05, y: 0.48 },
];

const { width, height } = Dimensions.get('window');

/**
 * Modern minimalist button with subtle styling.
 */
function MinimalButton({ label, index, x, y, run }: { label: string; index: number; x: number; y: number; run: (s: string) => void }) {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(pressAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
    run(`window.__xcpPad.setButton(${index}, true, 1)`);
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    run(`window.__xcpPad.setButton(${index}, false, 0)`);
  };

  const position = {
    left: x * width - 30,
    top: y * height - 30,
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed: nativePressed }) => [
        styles.buttonContainer,
        { ...position },
        pressed && styles.buttonPressed,
        nativePressed && styles.buttonPress,
      ]}
      hitSlop={16}
    >
      <Animated.View
        style={{
          transform: [{ scale: pressAnim }],
          opacity: pressed ? 0.9 : 0.8,
        }}
      >
        <Text style={styles.buttonLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

type AnalogStickProps = {
  x: number;
  y: number;
  run: (script: string) => void;
  axisIndex: number;
};

function AnalogStick({ x, y, run, axisIndex }: AnalogStickProps) {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const [active, setActive] = useState(false);
  const stickAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        setActive(true);
        run(`window.__xcpPad.setAxis(${axisIndex}, 0, 0)`);
      },
      onPanResponderMove: (_, gesture) => {
        const maxDistance = 30;
        const distance = Math.sqrt(gesture.dx ** 2 + gesture.dy ** 2);
        const clampedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(gesture.dy, gesture.dx);
        const scale = Math.min(distance / maxDistance, 1);

        const valueX = Math.sin(angle) * scale;
        const valueY = Math.cos(angle) * scale;

        run(`window.__xcpPad.setAxis(${axisIndex}, ${-valueY}, ${valueX})`);
        stickAnim.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: () => {
        setActive(false);
        run(`window.__xcpPad.setAxis(${axisIndex}, 0, 0)`);
        stickAnim.setValue({ x: 0, y: 0 });
      },
      onPanResponderTerminate: () => {
        setActive(false);
        run(`window.__xcpPad.setAxis(${axisIndex}, 0, 0)`);
        stickAnim.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  const position = {
    left: x * width - 25,
    top: y * height - 25,
  };

  const stickScale = stickAnim.y.interpolate({
    inputRange: [-50, 50],
    outputRange: [0.85, 1.15],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.stickContainer}>
      <Pressable
        style={styles.stickBase}
        {...panResponder.panHandlers}
      >
        <Animated.View
          style={[
            styles.stickKnob,
            {
              transform: [
                { translateX: stickAnim.x },
                { translateY: stickAnim.y },
              ],
              scale: stickScale,
            },
          ]}
        />
      </Pressable>
    </View>
  );
}

/**
 * On-screen gamepad with minimalist visual design.
 * All inputs are forwarded to the virtual gamepad injected via the bridge.
 */
export default function TouchControls({ run }: Props) {
  const [dPadActive, setDPadActive] = useState(false);
  const [faceActive, setFaceActive] = useState(false);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* D-Pad - left side */}
      <View style={styles.dpadContainer}>
        <Dpad run={run} active={dPadActive} setActive={setDPadActive} />
      </View>

      {/* Face buttons - right bottom */}
      <View style={styles.faceContainer}>
        {BUTTONS.slice(0, 4).map((button) => (
          <MinimalButton
            key={button.label}
            label={button.label}
            index={button.index}
            x={button.x}
            y={button.y}
            run={run}
          />
        ))}
      </View>

      {/* Shoulder buttons - top */}
      <View style={styles.shoulderContainer}>
        {BUTTONS.slice(4, 8).map((button) => (
          <MinimalButton
            key={button.label}
            label={button.label}
            index={button.index}
            x={button.x}
            y={button.y}
            run={run}
          />
        ))}
      </View>

      {/* Analog sticks */}
      <View style={styles.sticksContainer}>
        <AnalogStick x={0.15} y={0.85} run={run} axisIndex={0} />
        <AnalogStick x={0.85} y={0.85} run={run} axisIndex={1} />
      </View>

      {/* View and Menu buttons */}
      <View style={styles.systemContainer}>
        {BUTTONS.slice(8).map((button) => (
          <MinimalButton
            key={button.label}
            label={button.label}
            index={button.index}
            x={button.x}
            y={button.y}
            run={run}
          />
        ))}
      </View>

      {/* Status indicator */}
      <View style={styles.statusOverlay}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusIcon}>🎮</Text>
        </View>
      </View>
    </View>
  );
}

type DpadButtonProps = {
  direction: 'up' | 'down' | 'left' | 'right';
  x: number;
  y: number;
  run: (script: string) => void;
  onPress: () => void;
  onRelease: () => void;
  active: boolean;
};

function DpadButton({ direction, x, y, run, onPress, onRelease, active }: DpadButtonProps) {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const buttonIndex = direction === 'up' ? 13 : direction === 'down' ? 14 : direction === 'left' ? 11 : 12;

  const handlePressIn = () => {
    pressAnim.setValue(0.95);
    run(`window.__xcpPad.setButton(${buttonIndex}, true, 1)`);
    onPress();
  };

  const handlePressOut = () => {
    pressAnim.setValue(1);
    run(`window.__xcpPad.setButton(${buttonIndex}, false, 0)`);
    onRelease();
  };

  const position = {
    left: x * width - 18,
    top: y * height - 18,
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.dpadButton, position, active && styles.dpadButtonActive]}
    >
      <Animated.Text style={[styles.dpadButtonLabel, { transform: [{ scale: pressAnim }] }]}>
        {direction === 'up' ? '↑' : direction === 'down' ? '↓' : direction === 'left' ? '←' : '→'}
      </Animated.Text>
    </Pressable>
  );
}

type DpadProps = {
  run: (script: string) => void;
  active: boolean;
  setActive: (active: boolean) => void;
};

function Dpad({ run, active, setActive }: DpadProps) {
  const centerX = 0.25;
  const centerY = 0.63;
  const buttonSize = 40;
  const spacing = 12;

  const [activeDir, setActiveDir] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  const handlePressIn = (dir: 'up' | 'down' | 'left' | 'right') => {
    setActiveDir(dir);
    setActive(true);
  };

  const handlePressOut = () => {
    setActiveDir(null);
    setActive(false);
  };

  const dpadStyle = {
    left: centerX * width - buttonSize / 2,
    top: centerY * height - buttonSize * 1.5,
  };

  return (
    <View style={[styles.dpadBase, dpadStyle]}>
      <DpadButton
        direction="up"
        x={centerX}
        y={centerY - 0.35}
        run={run}
        onPress={() => handlePressIn('up')}
        onRelease={handlePressOut}
        active={activeDir === 'up'}
      />
      <DpadButton
        direction="left"
        x={centerX - 0.3}
        y={centerY}
        run={run}
        onPress={() => handlePressIn('left')}
        onRelease={handlePressOut}
        active={activeDir === 'left'}
      />
      <DpadButton
        direction="right"
        x={centerX + 0.3}
        y={centerY}
        run={run}
        onPress={() => handlePressIn('right')}
        onRelease={handlePressOut}
        active={activeDir === 'right'}
      />
      <DpadButton
        direction="down"
        x={centerX}
        y={centerY + 0.35}
        run={run}
        onPress={() => handlePressIn('down')}
        onRelease={handlePressOut}
        active={activeDir === 'down'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    zIndex: 999,
  },
  dpadContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 16,
  },
  dpadBase: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dpadButton: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadButtonActive: {
    backgroundColor: colors.accentSoft,
  },
  dpadButtonLabel: {
    color: colors.accentBright,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  buttonPress: {
    opacity: 0.85,
  },
  buttonLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  faceContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shoulderContainer: {
    position: 'absolute',
    right: 16,
    top: 16,
    flexDirection: 'row',
    gap: 10,
  },
  sticksContainer: {
    position: 'absolute',
    left: 16,
    bottom: 100,
    flexDirection: 'row',
    gap: 30,
  },
  stickContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickBase: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 200, 100, 0.4)',
    shadowColor: 'rgba(0, 200, 100, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  systemContainer: {
    position: 'absolute',
    left: 16,
    top: 16,
    flexDirection: 'row',
    gap: 10,
  },
  statusOverlay: {
    position: 'absolute',
    left: 16,
    top: 16,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  statusIcon: {
    fontSize: 14,
  },
});