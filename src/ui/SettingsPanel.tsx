import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Button as PaperButton,
  Chip as PaperChip,
  Switch as PaperSwitch,
  TextInput as PaperTextInput,
} from 'react-native-paper';
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

export default function SettingsPanel({
  visible,
  settings,
  onChange,
  onClose,
  onLogin,
  onReset,
}: Props) {
  const [rendered, setRendered] = useState(visible);
  const translateX = useRef(new Animated.Value(420)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 0.45,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      });
      playUiSound('open', 0.4);
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 420,
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

        <Animated.View style={[styles.sheet, { transform: [{ translateX }] }]}>
          <BlurView intensity={70} tint="dark" style={styles.sheetBlur}>
            <View style={styles.sheetInner}>
              <View style={styles.handle} />
              <View style={styles.header}>
                <Text style={styles.title}>{strings.settingsTitle}</Text>
                <Pressable
                  onPress={() => {
                    playUiSound('close', 0.4);
                    onClose();
                  }}
                  style={styles.closeButton}
                  hitSlop={8}
                  accessibilityLabel={strings.close}
                >
                  <FaIcon icon={faXmark} size={18} color={colors.textPrimary} />
                </Pressable>
              </View>

              <Animated.View style={{ opacity: contentOpacity, flex: 1 }}>
                <ScrollView
                  contentContainerStyle={styles.content}
                  showsVerticalScrollIndicator={false}
                >
                  <Section icon={faGlobe} title={strings.userAgent}>
                    <Text style={styles.hint}>{strings.userAgentHint}</Text>
                    <View style={styles.chips}>
                      {UA_OPTIONS.map((option) => (
                        <PaperChip
                          key={option.mode}
                          selected={settings.userAgentMode === option.mode}
                          onPress={() => {
                            playUiSound('tap', 0.35);
                            onChange({ userAgentMode: option.mode });
                          }}
                          style={[
                            styles.chip,
                            settings.userAgentMode === option.mode && styles.chipActive,
                          ]}
                          textStyle={[
                            styles.chipText,
                            settings.userAgentMode === option.mode && styles.chipTextActive,
                          ]}
                          showSelectedOverlay={false}
                          mode="outlined"
                        >
                          {option.label}
                        </PaperChip>
                      ))}
                    </View>
                    {settings.userAgentMode === 'custom' && (
                      <PaperTextInput
                        value={settings.customUserAgent}
                        onChangeText={(value) => onChange({ customUserAgent: value })}
                        placeholder={strings.customUaPlaceholder}
                        placeholderTextColor={colors.textTertiary}
                        style={styles.input}
                        textColor={colors.textPrimary}
                        mode="outlined"
                        outlineColor="rgba(255,255,255,0.12)"
                        activeOutlineColor={colors.accent}
                        multiline
                      />
                    )}
                  </Section>

                  <Section icon={faMagnifyingGlass} title={strings.zoom}>
                    <View style={styles.chips}>
                      {ZOOM_OPTIONS.map((option) => (
                        <PaperChip
                          key={option}
                          selected={settings.zoom === option}
                          onPress={() => {
                            playUiSound('tap', 0.35);
                            onChange({ zoom: option });
                          }}
                          style={[
                            styles.chip,
                            settings.zoom === option && styles.chipActive,
                          ]}
                          textStyle={[
                            styles.chipText,
                            settings.zoom === option && styles.chipTextActive,
                          ]}
                          showSelectedOverlay={false}
                          mode="outlined"
                        >
                          {option}%
                        </PaperChip>
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
                    <PaperButton
                      mode="contained"
                      onPress={() => {
                        playUiSound('tap', 0.4);
                        onLogin();
                      }}
                      style={styles.filledButton}
                      labelStyle={styles.filledButtonText}
                      buttonColor={colors.accent}
                    >
                      {strings.accountAction}
                    </PaperButton>
                  </Section>

                  <Section icon={faDatabase} title={strings.data}>
                    <PaperButton
                      mode="outlined"
                      onPress={() => {
                        playUiSound('tap', 0.4);
                        onReset();
                      }}
                      style={styles.outlinedDangerButton}
                      labelStyle={styles.dangerText}
                      textColor={colors.danger}
                    >
                      {strings.resetSettings}
                    </PaperButton>
                  </Section>

                  <Text style={styles.footer}>
                    {strings.appName} · {strings.version} 1.0.0
                  </Text>
                  <Text style={styles.footer}>{strings.notOfficial}</Text>
                </ScrollView>
              </Animated.View>
            </View>
          </BlurView>
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

type ToggleRowProps = {
  label: string;
  icon?: IconProp;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function ToggleRow({ label, icon, value, onValueChange }: ToggleRowProps) {
  const thumb = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(thumb, {
      toValue: value ? 1 : 0,
      speed: 30,
      useNativeDriver: true,
    }).start();
  }, [value, thumb]);

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
      <PaperSwitch
        value={value}
        onValueChange={onValueChange}
        color={colors.accent}
        style={styles.switch}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    backgroundColor: '#000000',
  },
  sheet: {
    width: '86%',
    maxWidth: 360,
    height: '100%',
    borderTopLeftRadius: radius.xxl,
    borderBottomLeftRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  sheetBlur: {
    flex: 1,
    backgroundColor: 'rgba(15, 20, 16, 0.75)',
  },
  sheetInner: {
    backgroundColor: 'rgba(15, 20, 16, 0.62)',
    flex: 1,
    paddingBottom: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    backgroundColor: 'rgba(29, 184, 101, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(29, 184, 101, 0.3)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  chipActive: {
    backgroundColor: 'rgba(29, 184, 101, 0.2)',
    borderColor: colors.accent,
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    fontSize: 13,
    minHeight: 56,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rowPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  rowIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  switch: {
    transform: [{ scale: 0.9 }],
  },
  filledButton: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
  },
  filledButtonText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  outlinedDangerButton: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderColor: 'rgba(223, 74, 74, 0.55)',
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