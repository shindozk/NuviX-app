import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/**
 * Modern UI sound pack for NuviX.
 * All clips are tiny (0.1–0.4 s), bundled locally, and played through
 * dedicated low-volume players so they never interfere with game audio.
 *
 * License: generated for NuviX, treated as CC0 (public domain).
 */
const SOUNDS = {
  tap: require('../../assets/sounds/ui-tap.mp3'),
  open: require('../../assets/sounds/ui-open.mp3'),
  close: require('../../assets/sounds/ui-close.mp3'),
  toggle: require('../../assets/sounds/ui-toggle.mp3'),
  dock: require('../../assets/sounds/ui-dock.mp3'),
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
