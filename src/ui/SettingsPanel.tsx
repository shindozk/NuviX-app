import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Chip as PaperChip, Switch as PaperSwitch, TextInput as PaperTextInput, Button as PaperButton } from 'react-native-paper';
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
import SidePanel from './SidePanel';

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
  return (
    <SidePanel visible={visible} side="right" title={strings.settingsTitle} onClose={onClose}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                style={[styles.chip, settings.userAgentMode === option.mode && styles.chipActive]}
                textStyle={[styles.chipText, settings.userAgentMode === option.mode && styles.chipTextActive]}
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
                style={[styles.chip, settings.zoom === option && styles.chipActive]}
                textStyle={[styles.chipText, settings.zoom === option && styles.chipTextActive]}
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
    </SidePanel>
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
