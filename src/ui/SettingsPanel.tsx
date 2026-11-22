import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  faDatabase,
  faGlobe,
  faMagnifyingGlass,
  faMicrochip,
  faRotateRight,
  faSliders,
  faUser,
  faVolumeHigh,
} from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

import { alpha, colors, spacing, typeScale } from '../theme';
import { ZOOM_OPTIONS, type Settings, type UserAgentMode } from '../settings';
import { strings } from '../i18n';
import { Button, ChipRow, Divider, ListRow, M3Switch, SectionHeader, Segmented, TextField } from './m3';
import SidePanel from './SidePanel';
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

const ZOOM_SEGMENTS = ZOOM_OPTIONS.map((option) => ({ value: option, label: `${option}%` }));

export default function SettingsPanel({
  visible,
  settings,
  onChange,
  onClose,
  onLogin,
  onReset,
}: Props) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  const change = (patch: Partial<Settings>) => {
    playUiSound('toggle', 0.4);
    onChange(patch);
  };

  return (
    <SidePanel visible={visible} side="right" title={strings.settingsTitle} onClose={onClose}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Section icon={faGlobe} title={strings.userAgent}>
          <Text style={styles.hint}>{strings.userAgentHint}</Text>
          <ChipRow<UserAgentMode>
            options={UA_OPTIONS.map((option) => ({
              value: option.mode,
              label: option.label,
            }))}
            value={settings.userAgentMode}
            onChange={(value) => change({ userAgentMode: value })}
            accessibilityLabel={strings.userAgent}
          />
          {settings.userAgentMode === 'custom' ? (
            <TextField
              label={strings.customUa}
              value={settings.customUserAgent}
              onChangeText={(value) => onChange({ customUserAgent: value })}
              placeholder={strings.customUaPlaceholder}
              multiline
            />
          ) : null}
        </Section>

        <Section icon={faMagnifyingGlass} title={strings.zoom}>
          <Segmented<number>
            options={ZOOM_SEGMENTS}
            value={settings.zoom}
            onChange={(value) => change({ zoom: value })}
            accessibilityLabel={strings.zoom}
          />
        </Section>

        <Section icon={faSliders} title={strings.behavior}>
          <View style={styles.card}>
            <ToggleRow
              label={strings.keepAwake}
              value={settings.keepAwake}
              onValueChange={(value) => change({ keepAwake: value })}
            />
            <Divider style={styles.divider} />
            <ToggleRow
              label={strings.touchControlsToggle}
              value={settings.touchControls}
              onValueChange={(value) => change({ touchControls: value })}
            />
            <Divider style={styles.divider} />
            <ToggleRow
              label={strings.uiSounds}
              icon={faVolumeHigh}
              value={settings.uiSounds}
              onValueChange={(value) => change({ uiSounds: value })}
            />
          </View>
        </Section>

        <Section icon={faMicrochip} title={strings.performance}>
          <View style={styles.card}>
            <ToggleRow
              label={strings.showStats}
              value={settings.showPerformanceStats}
              onValueChange={(value) => change({ showPerformanceStats: value })}
            />
            <Divider style={styles.divider} />
            <ToggleRow
              label={strings.enableHaptics}
              value={settings.enableHaptics}
              onValueChange={(value) => change({ enableHaptics: value })}
            />
          </View>
        </Section>

        <Section icon={faUser} title={strings.account}>
          <View style={styles.card}>
            <Text style={styles.body}>{strings.signInHint}</Text>
            <View style={styles.actions}>
              <Button
                label={strings.accountAction}
                icon={faUser}
                onPress={() => {
                  playUiSound('tap', 0.4);
                  onLogin();
                }}
              />
            </View>
          </View>
        </Section>

        <Section icon={faDatabase} title={strings.data}>
          {confirmingReset ? (
            <View style={[styles.card, styles.confirmCard]}>
              <Text style={styles.body}>{strings.resetConfirm}</Text>
              <View style={styles.confirmActions}>
                <Button
                  label={strings.cancel}
                  variant="outlined"
                  onPress={() => setConfirmingReset(false)}
                />
                <Button
                  label={strings.confirm}
                  tone="danger"
                  onPress={() => {
                    setConfirmingReset(false);
                    playUiSound('tap', 0.4);
                    onReset();
                  }}
                />
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <ListRow
                icon={faRotateRight}
                label={strings.resetSettings}
                tone="danger"
                onPress={() => setConfirmingReset(true)}
              />
            </View>
          )}
        </Section>

        <View style={styles.footerBox}>
          <Text style={styles.footer}>
            {strings.appName} · {strings.version} 1.0.0
          </Text>
          <Text style={styles.footerMuted}>{strings.notOfficial}</Text>
        </View>
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
      <SectionHeader icon={icon} title={title} />
      <View style={styles.sectionBody}>{children}</View>
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
    <ListRow
      icon={icon}
      label={label}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      trailing={
        <View pointerEvents="none" style={styles.switchWrap}>
          <M3Switch value={value} onValueChange={onValueChange} accessibilityLabel={label} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.md,
  },
  sectionBody: {
    gap: spacing.xs,
  },
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: alpha(colors.onSurface, 0.05),
    overflow: 'hidden',
  },
  divider: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xxs,
  },
  switchWrap: {
    marginLeft: spacing.xs,
  },
  hint: {
    ...typeScale.bodyMedium,
    color: colors.onSurfaceVariant,
  },
  body: {
    ...typeScale.bodyMedium,
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  actions: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  confirmCard: {
    gap: spacing.md,
    padding: spacing.md,
    paddingTop: 0,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingLeft: spacing.md,
  },
  footerBox: {
    alignItems: 'center',
    gap: spacing.xxs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  footer: {
    ...typeScale.labelMedium,
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
  footerMuted: {
    ...typeScale.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
