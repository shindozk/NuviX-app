import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Dimensions,
} from 'react-native';

import { colors, radius, duration, easing } from '../theme';
import { ZOOM_OPTIONS, type Settings, type UserAgentMode } from '../settings';
import { strings } from '../i18n';

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
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: duration.medium,
          useNativeDriver: true,
          easing: Easing.out(Easing.bezier(0.25, 0.8, 0.25, 1)),
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration.medium,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 500,
          duration: duration.short,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: duration.short,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  if (!visible) return null;

  return (
    <Modal visible={true} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[
          styles.backdrop,
          { opacity },
        ]}
        pointerEvents="none"
      >
        <Pressable onPress={onClose} style={styles.backdropTouchable} />
        <Animated.View
          style={[
            styles.panel,
            {
              transform: [{ translateY }],
            },
          ]}
          pointerEvents="auto"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{strings.settingsTitle}</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel={strings.close}
            >
              <Text style={styles.closeGlyph}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Section title={strings.userAgent}>
              <Text style={styles.hint}>{strings.userAgentHint}</Text>
              <View style={styles.chips}>
                {UA_OPTIONS.map((option) => {
                  const active = settings.userAgentMode === option.mode;
                  return (
                    <ChipButton
                      key={option.mode}
                      active={active}
                      onPress={() => onChange({ userAgentMode: option.mode })}
                    >
                      {option.label}
                    </ChipButton>
                  );
                })}
              </View>
              {settings.userAgentMode === 'custom' && (
                <TextInput
                  value={settings.customUserAgent}
                  onChangeText={(value) => onChange({ customUserAgent: value })}
                  placeholder={strings.customUaPlaceholder}
                  placeholderTextColor={colors.textDim}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                />
              )}
            </Section>

            <Section title={strings.zoom}>
              <View style={styles.chips}>
                {ZOOM_OPTIONS.map((option) => {
                  const active = settings.zoom === option;
                  return (
                    <ChipButton key={option} active={active} onPress={() => onChange({ zoom: option })}>
                      {option}%
                    </ChipButton>
                  );
                })}
              </View>
            </Section>

            <Section title={strings.behavior}>
              <ToggleRow
                label={strings.keepAwake}
                value={settings.keepAwake}
                onValueChange={(value) => onChange({ keepAwake: value })}
              />
              <ToggleRow
                label={strings.touchControlsToggle}
                value={settings.touchControls}
                onValueChange={(value) => onChange({ touchControls: value })}
              />
            </Section>

            <Section title={strings.account}>
              <Text style={styles.hint}>{strings.signInHint}</Text>
              <Pressable onPress={onLogin} style={styles.wideButton}>
                <Text style={styles.wideButtonText}>{strings.accountAction}</Text>
              </Pressable>
            </Section>

            <Section title={strings.data}>
              <Pressable
                onPress={onReset}
                style={[styles.wideButton, styles.dangerButton]}
              >
                <Text style={[styles.wideButtonText, styles.dangerText]}>
                  {strings.resetSettings}
                </Text>
              </Pressable>
            </Section>

            <Text style={styles.footer}>
              {strings.appName} · {strings.version} 1.0.0
            </Text>
            <Text style={styles.footer}>{strings.notOfficial}</Text>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

type ChipButtonProps = {
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
};

function ChipButton({ active, onPress, children }: ChipButtonProps) {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPress,
        { transform: [{ scale: pressAnim }] },
      ]}
    >
      <Animated.Text
        style={[
          styles.chipText,
          active && styles.chipTextActive,
          { color: active ? colors.background : colors.textSecondary },
        ]}
      >
        {children}
      </Animated.Text>
    </Pressable>
  );
}

type ToggleRowProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function ToggleRow({ label, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={value ? colors.accentBright : colors.textDim}
      />
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  closeGlyph: {
    color: colors.textPrimary,
    fontSize: 20,
    lineHeight: 22,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  hint: {
    color: colors.textTertiary,
    fontSize: 13,
    lineHeight: 20,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  chipPress: {
    opacity: 0.9,
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
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 13,
    minHeight: 50,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  wideButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  wideButtonText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  dangerButton: {
    borderColor: 'rgba(217, 83, 79, 0.5)',
  },
  dangerText: {
    color: colors.danger,
  },
  footer: {
    color: colors.textTertiary,
    fontSize: 11,
    textAlign: 'center',
  },
});