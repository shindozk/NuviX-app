import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  faDatabase,
  faGlobe,
  faMagnifyingGlass,
  faSliders,
  faUser,
  faVolumeHigh,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

import { colors, radius } from '../theme';
import { ZOOM_OPTIONS, type Settings, type UserAgentMode } from '../settings';
import { strings } from '../i18n';
import FaIcon from './Icon';
import { playUiSound } from './sound';

type Props = {
  visible: boolean;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
  onLogin: () => void;
  onReset: () => void;
};

const UA_OPTIONS: { mode: UserAgentMode; label: string }[] = [
  { mode: 'mobile', label: strings.uaMobile },
  { mode: 'desktop', label: strings.uaDesktop },
  { mode: 'tv', label: strings.uaTv },
  { mode: 'custom', label: strings.uaCustom },
];

/**
 * Settings as a Material You bottom sheet: it slides up from the bottom with
 * heavily rounded top corners, spring animation and M3 switches/chips.
 */
export default function SettingsPanel({
  visible,
  settings,
  onChange,
  onClose,
  onLogin,
  onReset,
}: Props) {
  const [rendered, setRendered] = useState(visible);
  const translateY = useRef(new Animated.Value(600)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      playUiSound('open', 0.4);
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 600,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setRendered(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!rendered) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdrop }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              playUiSound('close', 0.4);
              onClose();
            }}
          />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{strings.settingsTitle}</Text>
            <Pressable
              onPress={() => {
                playUiSound('close', 0.4);
                onClose();
              }}
              style={styles.closeButton}
              accessibilityLabel={strings.close}
              hitSlop={8}
            >
              <FaIcon icon={faXmark} size={16} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Section icon={faGlobe} title={strings.userAgent}>
              <Text style={styles.hint}>{strings.userAgentHint}</Text>
              <View style={styles.chips}>
                {UA_OPTIONS.map((option) => (
                  <Chip
                    key={option.mode}
                    active={settings.userAgentMode === option.mode}
                    onPress={() => {
                      playUiSound('tap', 0.35);
                      onChange({ userAgentMode: option.mode });
                    }}
                  >
                    {option.label}
                  </Chip>
                ))}
              </View>
              {settings.userAgentMode === 'custom' && (
                <TextInput
                  value={settings.customUserAgent}
                  onChangeText={(value) => onChange({ customUserAgent: value })}
                  placeholder={strings.customUaPlaceholder}
                  placeholderTextColor={colors.textTertiary}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                />
              )}
            </Section>

            <Section icon={faMagnifyingGlass} title={strings.zoom}>
              <View style={styles.chips}>
                {ZOOM_OPTIONS.map((option) => (
                  <Chip
                    key={option}
                    active={settings.zoom === option}
                    onPress={() => {
                      playUiSound('tap', 0.35);
                      onChange({ zoom: option });
                    }}
                  >
                    {option}%
                  </Chip>
                ))}
              </View>
            </Section>

            <Section icon={faSliders} title={strings.behavior}>
              <ToggleRow
                label={strings.keepAwake}
                value={settings.keepAwake}
                onValueChange={(value) => {
                  playUiSound('toggle', 0.4);
                  onChange({ keepAwake: value });
                }}
              />
              <ToggleRow
                label={strings.touchControlsToggle}
                value={settings.touchControls}
                onValueChange={(value) => {
                  playUiSound('toggle', 0.4);
                  onChange({ touchControls: value });
                }}
              />
              <ToggleRow
                label={strings.uiSounds}
                icon={faVolumeHigh}
                value={settings.uiSounds}
                onValueChange={(value) => {
                  playUiSound('toggle', 0.4);
                  onChange({ uiSounds: value });
                }}
              />
            </Section>

            <Section icon={faUser} title={strings.account}>
              <Text style={styles.hint}>{strings.signInHint}</Text>
              <Pressable
                onPress={() => {
                  playUiSound('tap', 0.4);
                  onLogin();
                }}
                style={styles.filledButton}
              >
                <Text style={styles.filledButtonText}>{strings.accountAction}</Text>
              </Pressable>
            </Section>

            <Section icon={faDatabase} title={strings.data}>
              <Pressable
                onPress={() => {
                  playUiSound('tap', 0.4);
                  onReset();
                }}
                style={styles.outlinedDangerButton}
              >
                <Text style={styles.dangerText}>{strings.resetSettings}</Text>
              </Pressable>
            </Section>

            <Text style={styles.footer}>
              {strings.appName} · {strings.version} 1.0.0
            </Text>
            <Text style={styles.footer}>{strings.notOfficial}</Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

type SectionProps = {
  icon: IconProp;
  title: string;
  children: React.ReactNode;
};

function Section({ icon, title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <FaIcon icon={icon} size={14} color={colors.accentBright} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

type ChipProps = {
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
};

function Chip({ active, onPress, children }: ChipProps) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => scale.setValue(0.96)}
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, speed: 30, useNativeDriver: true }).start()
      }
      style={[styles.chip, active && styles.chipActive, { transform: [{ scale }] }]}
      accessibilityRole="button"
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{children}</Text>
    </Pressable>
  );
}

type ToggleRowProps = {
  label: string;
  icon?: IconProp;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

/** Material You style switch with an animated thumb. */
function ToggleRow({ label, icon, value, onValueChange }: ToggleRowProps) {
  const thumb = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(thumb, {
      toValue: value ? 1 : 0,
      speed: 30,
      useNativeDriver: true,
    }).start();
  }, [value, thumb]);

  const trackBackground = thumb.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surfaceVariant, colors.accent],
  });
  const thumbTranslate = thumb.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26],
  });
  const thumbColor = thumb.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textTertiary, colors.onPrimary],
  });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      {icon ? (
        <View style={styles.rowIcon}>
          <FaIcon icon={icon} size={14} color={colors.textSecondary} />
        </View>
      ) : null}
      <Text style={styles.rowLabel}>{label}</Text>
      <Animated.View style={[styles.switchTrack, { backgroundColor: trackBackground }]}>
        <Animated.View
          style={[
            styles.switchThumb,
            { transform: [{ translateX: thumbTranslate }], backgroundColor: thumbColor },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    backgroundColor: '#000000',
  },
  sheet: {
    backgroundColor: colors.surfaceContainerLow,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    maxHeight: '88%',
    paddingBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outline,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 6,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    gap: 22,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  hint: {
    color: colors.textTertiary,
    fontSize: 13,
    lineHeight: 19,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.accentBright,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 13,
    minHeight: 56,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  rowPressed: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  rowIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  switchTrack: {
    width: 52,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  filledButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  filledButtonText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  outlinedDangerButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(223, 74, 74, 0.55)',
    backgroundColor: colors.surface,
  },
  dangerText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    color: colors.textTertiary,
    fontSize: 11,
    textAlign: 'center',
  },
});
