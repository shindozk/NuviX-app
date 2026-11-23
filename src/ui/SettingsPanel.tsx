import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Switch,
  TextInput,
} from 'react-native';
import {
  faDatabase,
  faGlobe,
  faMagnifyingGlass,
  faMicrochip,
  faRotateRight,
  faSliders,
  faUser,
  faVolumeHigh,
  faXmark,
  faGamepad,
  faHeart,
  faCode,
} from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

import { alpha, colors } from '../theme';
import { ZOOM_OPTIONS, type Settings, type UserAgentMode } from '../settings';
import { strings } from '../i18n';
import FaIcon from './Icon';
import BottomSheet from './BottomSheet';
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
  const [confirmingReset, setConfirmingReset] = useState(false);

  const change = (patch: Partial<Settings>) => {
    playUiSound('toggle', 0.4);
    onChange(patch);
  };

  if (!visible) return null;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{strings.settingsTitle}</Text>
          <Pressable
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <FaIcon icon={faXmark} size={16} color={colors.onSurface} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ===== SEÇÃO: GERAIS ===== */}
          <Section icon={faSliders} title="Geral">
            <ToggleRow
              icon={faVolumeHigh}
              label="Sons da interface"
              value={settings.uiSounds}
              onValueChange={(v) => change({ uiSounds: v })}
            />
            <Divider />
            <ToggleRow
              icon={faMicrochip}
              label="Manter tela ligada"
              value={settings.keepAwake}
              onValueChange={(v) => change({ keepAwake: v })}
            />
            <Divider />
            <ToggleRow
              icon={faGamepad}
              label="Controles na tela"
              value={settings.touchControls}
              onValueChange={(v) => change({ touchControls: v })}
            />
            <Divider />
            <ToggleRow
              icon={faMagnifyingGlass}
              label="Estatísticas de desempenho"
              value={settings.showPerformanceStats}
              onValueChange={(v) => change({ showPerformanceStats: v })}
            />
            <Divider />
            <ToggleRow
              icon={faMicrochip}
              label="Habilitar vibração"
              value={settings.enableHaptics}
              onValueChange={(v) => change({ enableHaptics: v })}
            />
          </Section>

          {/* ===== SEÇÃO: VÍDEO ===== */}
          <Section icon={faMicrochip} title="Vídeo">
            <SegmentedRow
              label="Zoom"
              options={ZOOM_OPTIONS.map((z) => ({ value: String(z), label: `${z}%` }))}
              selected={settings.zoom.toString()}
              onSelect={(v) => change({ zoom: Number(v) })}
            />
          </Section>

          {/* ===== SEÇÃO: NAVEGAÇÃO ===== */}
          <Section icon={faGlobe} title="Navegação">
            <SegmentedRow
              label="User Agent"
              options={UA_OPTIONS.map((o) => ({ value: o.mode, label: o.label }))}
              selected={settings.userAgentMode}
              onSelect={(v) => change({ userAgentMode: v as UserAgentMode })}
            />
            {settings.userAgentMode === 'custom' && (
              <TextInput
                style={styles.textInput}
                value={settings.customUserAgent}
                onChangeText={(v) => change({ customUserAgent: v })}
                placeholder="Digite o User Agent..."
                placeholderTextColor={colors.outline}
              />
            )}
          </Section>

          {/* ===== SEÇÃO: IDIOMA ===== */}
          <Section icon={faGlobe} title="Idioma">
            <SegmentedRow
              label="Idioma"
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'pt', label: 'Português' },
                { value: 'en', label: 'English' },
              ]}
              selected={settings.language}
              onSelect={(v) => change({ language: v as any })}
            />
          </Section>

          {/* ===== SEÇÃO: CONTA ===== */}
          <Section icon={faUser} title="Conta">
            <ActionRow
              icon={faUser}
              label="Login / Conta"
              onPress={onLogin}
            />
          </Section>

          {/* ===== SEÇÃO: DADOS ===== */}
          <Section icon={faDatabase} title="Dados">
            <ActionRow
              icon={faRotateRight}
              label={strings.resetSettings}
              danger
              onPress={() => {
                if (!confirmingReset) {
                  setConfirmingReset(true);
                  return;
                }
                onReset();
                setConfirmingReset(false);
              }}
            />
            {confirmingReset && (
              <View style={styles.confirmCard}>
                <Text style={styles.confirmText}>
                  Tem certeza? Isso apagará todas as configurações.
                </Text>
                <View style={styles.confirmRow}>
                  <Pressable
                    style={[styles.btn, styles.btnCancel]}
                    onPress={() => setConfirmingReset(false)}
                  >
                    <Text style={styles.btnCancelText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.btn, styles.btnConfirm]}
                    onPress={() => {
                      onReset();
                      setConfirmingReset(false);
                    }}
                  >
                    <Text style={styles.btnConfirmText}>Confirmar</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Section>

          <View style={styles.footer}>
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>SK</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>shindozk</Text>
                <Text style={styles.profileRole}>Desenvolvedor</Text>
              </View>
              <View style={styles.profileBadges}>
                <View style={styles.badge}>
                  <FaIcon icon={faCode} size={10} color={colors.primary} />
                  <Text style={styles.badgeText}>Dev</Text>
                </View>
              </View>
            </View>
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>NuviX v1.0</Text>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>Feito com</Text>
              <FaIcon icon={faHeart} size={10} color={colors.danger} />
              <Text style={styles.footerText}>por shindozk</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

// ===================== COMPONENTES AUXILIARES =====================

function Section({
  icon,
  title,
  children,
}: {
  icon: IconProp;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <FaIcon icon={icon} size={14} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onValueChange,
}: {
  icon: IconProp;
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <FaIcon icon={icon} size={16} color={colors.onSurfaceVariant} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: alpha(colors.onSurface, 0.15),
          true: alpha(colors.primary, 0.5),
        }}
        thumbColor={value ? colors.primary : alpha(colors.onSurface, 0.5)}
      />
    </Pressable>
  );
}

function SegmentedRow({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={styles.segmentedRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.segmentedControl}>
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            style={[
              styles.segment,
              selected === opt.value && styles.segmentActive,
            ]}
            onPress={() => onSelect(opt.value)}
          >
            <Text
              style={[
                styles.segmentLabel,
                selected === opt.value && styles.segmentLabelActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  danger,
  onPress,
}: {
  icon: IconProp;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
    >
      <FaIcon
        icon={icon}
        size={16}
        color={danger ? colors.danger : colors.onSurfaceVariant}
      />
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ===================== ESTILOS =====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.onSurface, 0.12),
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionBody: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: alpha(colors.onSurface, 0.06),
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.onSurface,
    fontWeight: '500',
  },
  rowLabelDanger: {
    color: colors.danger,
  },
  divider: {
    height: 1,
    backgroundColor: alpha(colors.onSurface, 0.08),
    marginHorizontal: 16,
  },
  segmentedRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: alpha(colors.onSurface, 0.06),
    borderRadius: 10,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: alpha(colors.primary, 0.2),
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  segmentLabelActive: {
    color: colors.primary,
  },
  textInput: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: alpha(colors.onSurface, 0.06),
    borderWidth: 1,
    borderColor: alpha(colors.onSurface, 0.12),
    color: colors.onSurface,
    fontSize: 13,
  },
  confirmCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: alpha(colors.danger, 0.08),
    borderWidth: 1,
    borderColor: alpha(colors.danger, 0.2),
    gap: 10,
  },
  confirmText: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: alpha(colors.onSurface, 0.1),
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },
  btnConfirm: {
    backgroundColor: colors.danger,
  },
  btnConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: colors.outline,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.outline,
    marginHorizontal: 4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: alpha(colors.primary, 0.08),
    borderWidth: 1,
    borderColor: alpha(colors.primary, 0.2),
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: -0.5,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  profileRole: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  profileBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: alpha(colors.primary, 0.12),
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
});
