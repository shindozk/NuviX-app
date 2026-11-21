import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/**
 * Modern OS-style UI sound pack for NuviX.
 *
 * All clips are short synthesized tones (sine-wave based, like iOS/macOS
 * system sounds) bundled locally as WAV. They are played through dedicated
 * low-volume players so they never interfere with game audio.
 */
const SOUNDS = {
  tap: require('../../assets/sounds/ui-tap.wav'),
  open: require('../../assets/sounds/ui-open.wav'),
  close: require('../../assets/sounds/ui-close.wav'),
  toggle: require('../../assets/sounds/ui-toggle.wav'),
  dock: require('../../assets/sounds/ui-dock.wav'),
  navigate: require('../../assets/sounds/ui-navigate.wav'),
  success: require('../../assets/sounds/ui-success.wav'),
  error: require('../../assets/sounds/ui-error.wav'),
  hover: require('../../assets/sounds/ui-hover.wav'),
} as const;

export type UiSound = keyof typeof SOUNDS;

let enabled = true;
let modeConfigured = false;
const players: Partial<Record<UiSound, AudioPlayer>> = {};

/** Wired to the "interface sounds" user setting. */
export function setSoundsEnabled(value: boolean): void {
  enabled = value;
}

async function ensureAudioMode(): Promise<void> {
  if (modeConfigured) return;
  modeConfigured = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'doNotMix',
    });
  } catch {
    // Audio mode is a best-effort hint; playback still works without it.
  }
}

/** Fire-and-forget UI blip. Safe to call from any handler. */
export function playUiSound(sound: UiSound, volume = 0.45): void {
  if (!enabled) return;
  try {
    let player = players[sound];
    if (!player) {
      player = createAudioPlayer(SOUNDS[sound]);
      player.volume = volume;
      player.loop = false;
      players[sound] = player;
    }
    player.seekTo(0);
    player.play();
    ensureAudioMode();
  } catch {
    // A missing/broken sound clip must never break the UI.
  }
}