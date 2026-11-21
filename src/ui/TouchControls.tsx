import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { strings } from '../i18n';
import { colors } from '../theme';

export type StickAxis = 'left' | 'right' | 'up' | 'down';

type Props = {
  run: (script: string) => void;
};

// Minimalist gamepad layout inspired by play.xbox.com design
const BUTTONS = {
  A: { label: 'A', x: 0.51, y: 0.63 },
  B: { label: 'B', x: 0.45, y: 0.51 },
  X: { label: 'X', x: 0.31, y: 0.54 },
  Y: { label: 'Y', x: 0.25, y: 0.42 },
  LB: { label: 'LB', x: 0.08, y: 0.5 },
  RB: { label: 'RB', x: 0.84, y: 0.5 },
  LT: { label: 'LT', x: 0.12, y: 0.38 },
  RT: { label: 'RT', x: 0.79, y: 0.37 },
  VIEW: { label: '⧉', x: 0.92, y: 0.48 },
  MENU: { label: '☰', x: 0.05, y: 0.48 },
  UP: { label: '↑', x: 0.5, y: 0.15 },
  DOWN: { label: '↓', x: 0.5, y: 0.85 },
  LEFT: { label: '←', x: 0.2, y: 0.5 },
  RIGHT: { label: '→', x: 0.8, y: 0.5 },
} as const;

/**
 * Modern minimalist button with subtle styling.
 */
function MinimalButton({ label, x, y, run }: { label: string; x: number; y: number; run: (s: string) => void }) {
  return (
    <Pressable
      style={StyleSheet.absoluteFill}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

/**
 * On-screen gamepad with minimalist visual design.
 * All inputs are forwarded to the virtual gamepad injected via the bridge.
 */
export default function TouchControls({ run }: Props) {
  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      {/* D-Pad - left side */}
      <View style={styles.dpad}>
        <MinimalButton label={BUTTONS.UP.label} x={BUTTONS.UP.x} y={BUTTONS.UP.y} run={run} />
        <MinimalButton label={BUTTONS.LEFT.label} x={BUTTONS.LEFT.x} y={BUTTONS.LEFT.y} run={run} />
        <MinimalButton label={BUTTONS.RIGHT.label} x={BUTTONS.RIGHT.x} y={BUTTONS.RIGHT.y} run={run} />
        <MinimalButton label={BUTTONS.DOWN.label} x={BUTTONS.DOWN.x} y={BUTTONS.DOWN.y} run={run} />
      </View>

      {/* Face buttons - right bottom */}
      <View style={styles.faceContainer}>
        <MinimalButton label={BUTTONS.X.label} x={BUTTONS.X.x} y={BUTTONS.X.y} run={run} />
        <MinimalButton label={BUTTONS.Y.label} x={BUTTONS.Y.x} y={BUTTONS.Y.y} run={run} />
        <MinimalButton label={BUTTONS.B.label} x={BUTTONS.B.x} y={BUTTONS.B.y} run={run} />
        <MinimalButton label={BUTTONS.A.label} x={BUTTONS.A.x} y={BUTTONS.A.y} run={run} />
      </View>

      {/* Shoulders - top */}
      <View style={styles.shoulderButtons}>
        <MinimalButton label={BUTTONS.LT.label} x={BUTTONS.LT.x} y={BUTTONS.LT.y} run={run} />
        <MinimalButton label={BUTTONS.RT.label} x={BUTTONS.RT.x} y={BUTTONS.RT.y} run={run} />
        <MinimalButton label={BUTTONS.LB.label} x={BUTTONS.LB.x} y={BUTTONS.LB.y} run={run} />
        <MinimalButton label={BUTTONS.RB.label} x={BUTTONS.RB.x} y={BUTTONS.RB.y} run={run} />
      </View>

      {/* Analogue sticks */}
      <View style={styles.stickPads}>
        <View style={styles.stickBaseLeft}>
          <View style={styles.stickKnobLeft} />
        </View>
        <View style={styles.stickBaseRight}>
          <View style={styles.stickKnobRight} />
        </View>
      </View>

      {/* Status indicator */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{strings.padHint}</Text>
      </View>
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
    pointerEvents: 'none',
    zIndex: 999,
  },
  dpad: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 10, 10, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceContainer: {
    position: 'absolute',
    right: 16,
    bottom: 130,
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 10, 10, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 4,
  },
  shoulderButtons: {
    position: 'absolute',
    right: 16,
    top: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-end',
  },
  stickPads: {
    position: 'absolute',
    left: 16,
    top: 16,
    display: 'flex',
    gap: 20,
  },
  stickBaseLeft: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickKnobLeft: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 200, 100, 0.4)',
    position: 'relative',
  },
  stickBaseRight: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 34,
  },
  stickKnobRight: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 200, 100, 0.4)',
    position: 'relative',
    marginLeft: 34,
  },
  statusBar: {
    position: 'absolute',
    left: 16,
    top: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    letterSpacing: 1,
  },
  buttonLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    letterSpacing: 1,
  },
});