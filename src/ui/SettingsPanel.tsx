import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { strings } from '../i18n';
import { colors, radius } from '../theme';
import { ZOOM_OPTIONS, type Settings, type UserAgentMode } from '../settings';

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function SettingsPanel({
  visible,
  settings,
  onChange,
  onClose,
  onLogin,
  onReset,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>{strings.settingsTitle}</Text>
            <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel={strings.close}>
              <Text style={styles.closeGlyph}>×</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Section title={strings.userAgent}>
              <Text style={styles.hint}>{strings.userAgentHint}</Text>
              <View style={styles.chips}>
                {UA_OPTIONS.map((option) => {
                  const active = settings.userAgentMode === option.mode;
                  return (
                    <Pressable
                      key={option.mode}
                      onPress={() => onChange({ userAgentMode: option.mode })}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
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
                    <Pressable
                      key={option}
                      onPress={() => onChange({ zoom: option })}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {option}%
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section title={strings.behavior}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{strings.keepAwake}</Text>
                <Switch
                  value={settings.keepAwake}
                  onValueChange={(value) => onChange({ keepAwake: value })}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={settings.keepAwake ? colors.accentBright : colors.textDim}
                />
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{strings.touchControlsToggle}</Text>
                <Switch
                  value={settings.touchControls}
                  onValueChange={(value) => onChange({ touchControls: value })}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={settings.touchControls ? colors.accentBright : colors.textDim}
                />
              </View>
            </Section>

            <Section title={strings.account}>
              <Text style={styles.hint}>{strings.signInHint}</Text>
              <Pressable onPress={onLogin} style={styles.wideButton}>
                <Text style={styles.wideButtonText}>{strings.accountAction}</Text>
              </Pressable>
            </Section>

            <Section title={strings.data}>
              <Pressable onPress={onReset} style={[styles.wideButton, styles.dangerButton]}>
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    paddingHorizontal: 60,
    paddingVertical: 18,
  },
  panel: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  closeButton: {
    marginLeft: 'auto',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.panelSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 20,
  },
  content: {
    padding: 20,
    gap: 18,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: colors.accentBright,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  hint: {
    color: colors.textDim,
    fontSize: 12,
    lineHeight: 17,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelSoft,
  },
  chipActive: {
    borderColor: colors.accentBright,
    backgroundColor: colors.accentSoft,
  },
  chipText: {
    color: colors.textDim,
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  input: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 10,
    color: colors.text,
    fontSize: 12,
    minHeight: 52,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 14,
  },
  wideButton: {
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelSoft,
  },
  wideButtonText: {
    color: colors.text,
    fontSize: 13,
  },
  dangerButton: {
    borderColor: 'rgba(217, 83, 79, 0.5)',
  },
  dangerText: {
    color: colors.danger,
  },
  footer: {
    color: colors.textDim,
    fontSize: 11,
    textAlign: 'center',
  },
});
