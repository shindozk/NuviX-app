/**
 * Material 3 building blocks used by every NuviX surface.
 *
 * These are deliberately small, dependency-free primitives (no Paper, no vector
 * packs) so the whole UI follows one visual language: tonal surfaces, fully
 * rounded shapes, a 4dp rhythm and spring-based press feedback.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

import { alpha, colors, duration, easing, radius, shape, spacing, typeScale } from '../theme';
import FaIcon from './Icon';

/* ------------------------------------------------------------------ *
 * Press feedback
 * ------------------------------------------------------------------ */

function usePressScale(active = 0.94) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = useCallback(
    (toValue: number) => {
      Animated.spring(scale, { toValue, speed: 45, useNativeDriver: true }).start();
    },
    [scale]
  );

  return {
    scale,
    pressIn: useCallback(() => animate(active), [animate, active]),
    pressOut: useCallback(() => animate(1), [animate]),
  };
}

const ripple = (color = alpha(colors.primary, 0.16)) => ({ color, borderless: false });

/* ------------------------------------------------------------------ *
 * Icon button
 * ------------------------------------------------------------------ */

export type IconButtonVariant = 'standard' | 'tonal' | 'filled' | 'outlined';

type IconButtonProps = {
  icon: IconProp;
  onPress?: () => void;
  variant?: IconButtonVariant;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const ICON_BUTTON_BOX = 40;

export function IconButton({
  icon,
  onPress,
  variant = 'standard',
  accessibilityLabel,
  disabled,
  style,
}: IconButtonProps) {
  const { scale, pressIn, pressOut } = usePressScale(0.9);

  const palette = (() => {
    switch (variant) {
      case 'filled':
        return { background: colors.primary, border: colors.primary, foreground: colors.onPrimary };
      case 'tonal':
        return {
          background: colors.secondaryContainer,
          border: colors.secondaryContainer,
          foreground: colors.onSecondaryContainer,
        };
      case 'outlined':
        return {
          background: 'transparent',
          border: colors.outlineVariant,
          foreground: colors.onSurfaceVariant,
        };
      default:
        return {
          background: 'transparent',
          border: 'transparent',
          foreground: colors.onSurfaceVariant,
        };
    }
  })();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      android_ripple={ripple()}
      style={style}
    >
      <Animated.View
        style={[
          styles.iconButton,
          {
            width: ICON_BUTTON_BOX,
            height: ICON_BUTTON_BOX,
            borderRadius: ICON_BUTTON_BOX / 2,
            backgroundColor: disabled ? colors.surfaceContainerHigh : palette.background,
            borderColor: disabled ? colors.outlineVariant : palette.border,
            opacity: disabled ? 0.5 : 1,
            transform: [{ scale }],
          },
        ]}
      >
        <FaIcon
          icon={icon}
          size={17}
          color={disabled ? colors.textDisabled : palette.foreground}
        />
      </Animated.View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ *
 * Switch
 * ------------------------------------------------------------------ */

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const THUMB_SIZE = 24;
const THUMB_INSET = 4;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2;

type M3SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function M3Switch({
  value,
  onValueChange,
  disabled,
  accessibilityLabel,
}: M3SwitchProps) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: duration.short3,
      easing: easing.standard,
      useNativeDriver: true,
    }).start();
  }, [progress, value]);

  const thumbX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, THUMB_TRAVEL],
  });
  const thumbScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [16 / THUMB_SIZE, 1],
  });
  const onOpacity = progress.interpolate({
    inputRange: [0.35, 0.7],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const offOpacity = progress.interpolate({
    inputRange: [0.3, 0.65],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const checkOpacity = progress.interpolate({
    inputRange: [0.55, 0.95],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Pressable
      onPress={() => {
        if (!disabled) onValueChange(!value);
      }}
      hitSlop={10}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: !!disabled }}
    >
      <View style={[styles.track, { opacity: disabled ? 0.5 : 1 }]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.trackOff, { opacity: offOpacity }]} />
        <Animated.View style={[StyleSheet.absoluteFill, styles.trackOn, { opacity: onOpacity }]} />

        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX: thumbX }, { scale: thumbScale }] },
          ]}
        >
          <Animated.View style={[StyleSheet.absoluteFill, styles.thumbOff, { opacity: offOpacity }]} />
          <Animated.View style={[StyleSheet.absoluteFill, styles.thumbOn, { opacity: onOpacity }]} />
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.thumbCheck, { opacity: checkOpacity }]}
          >
            <FaIcon icon={faCheck} size={12} color={colors.onPrimary} />
          </Animated.View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ *
 * Segmented button
 * ------------------------------------------------------------------ */

export type SegmentOption<T> = { value: T; label: string };

type SegmentedProps<T extends string | number> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
  style,
}: SegmentedProps<T>) {
  return (
    <View
      style={[styles.segmented, style]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            android_ripple={ripple(alpha(colors.onSurface, 0.1))}
            style={[styles.segment, index > 0 && styles.segmentDivided]}
          >
            {selected ? <View style={[StyleSheet.absoluteFill, styles.segmentSelected]} /> : null}
            <Text
              style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * Filter chips (wrapping)
 * ------------------------------------------------------------------ */

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function FilterChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: FilterChipProps) {
  const { scale, pressIn, pressOut } = usePressScale(0.96);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Animated.View
        style={[styles.chip, selected && styles.chipSelected, { transform: [{ scale }] }]}
      >
        {selected ? <View style={styles.chipDot} /> : null}
        <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

type ChipRowProps<T extends string | number> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
};

export function ChipRow<T extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: ChipRowProps<T>) {
  return (
    <View style={styles.chipRow} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => (
        <FilterChip
          key={String(option.value)}
          label={option.label}
          selected={option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * List row
 * ------------------------------------------------------------------ */

type ListRowProps = {
  icon?: IconProp;
  label: string;
  description?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  tone?: 'default' | 'danger';
  selected?: boolean;
  disabled?: boolean;
  accessibilityRole?: 'button' | 'switch';
  accessibilityState?: { checked?: boolean; selected?: boolean; disabled?: boolean };
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function ListRow({
  icon,
  label,
  description,
  onPress,
  trailing,
  tone = 'default',
  selected,
  disabled,
  accessibilityRole = 'button',
  accessibilityState,
  accessibilityLabel,
  style,
}: ListRowProps) {
  const { scale, pressIn, pressOut } = usePressScale(0.985);

  const danger = tone === 'danger';
  const iconBackground = danger
    ? colors.errorContainer
    : selected
      ? colors.primaryContainer
      : colors.surfaceContainerHighest;
  const iconForeground = danger
    ? colors.onErrorContainer
    : selected
      ? colors.onPrimaryContainer
      : colors.onSurfaceVariant;

  const content = (
    <Animated.View
      style={[
        styles.row,
        selected && styles.rowSelected,
        { opacity: disabled ? 0.5 : 1, transform: [{ scale }] },
        style,
      ]}
    >
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: iconBackground }]}>
          <FaIcon icon={icon} size={16} color={iconForeground} />
        </View>
      ) : null}

      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]} numberOfLines={1}>
          {label}
        </Text>
        {description ? (
          <Text style={styles.rowDescription} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>

      {trailing ?? null}
    </Animated.View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel ?? label}
      android_ripple={ripple(alpha(colors.onSurface, 0.08))}
    >
      {content}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ *
 * Section header + divider
 * ------------------------------------------------------------------ */

type SectionHeaderProps = {
  icon?: IconProp;
  title: string;
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({ icon, title, style }: SectionHeaderProps) {
  return (
    <View style={[styles.sectionHeader, style]}>
      {icon ? (
        <View style={styles.sectionIcon}>
          <FaIcon icon={icon} size={12} color={colors.primary} />
        </View>
      ) : null}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/* ------------------------------------------------------------------ *
 * Button
 * ------------------------------------------------------------------ */

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconProp;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'filled',
  icon,
  tone = 'default',
  disabled,
  style,
}: ButtonProps) {
  const { scale, pressIn, pressOut } = usePressScale(0.97);
  const danger = tone === 'danger';

  const palette = (() => {
    switch (variant) {
      case 'tonal':
        return {
          background: danger ? colors.errorContainer : colors.secondaryContainer,
          border: 'transparent',
          foreground: danger ? colors.onErrorContainer : colors.onSecondaryContainer,
        };
      case 'outlined':
        return {
          background: 'transparent',
          border: danger ? alpha(colors.error, 0.5) : colors.outline,
          foreground: danger ? colors.error : colors.primary,
        };
      case 'text':
        return {
          background: 'transparent',
          border: 'transparent',
          foreground: danger ? colors.error : colors.primary,
        };
      default:
        return {
          background: danger ? colors.error : colors.primary,
          border: 'transparent',
          foreground: danger ? colors.onError : colors.onPrimary,
        };
    }
  })();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      android_ripple={ripple(alpha(colors.onSurface, 0.12))}
      style={style}
    >
      <Animated.View
        style={[
          styles.button,
          variant === 'text' && styles.buttonText,
          {
            backgroundColor: disabled ? colors.surfaceContainerHigh : palette.background,
            borderColor: disabled ? colors.outlineVariant : palette.border,
            opacity: disabled ? 0.5 : 1,
            transform: [{ scale }],
          },
        ]}
      >
        {icon ? <FaIcon icon={icon} size={14} color={palette.foreground} /> : null}
        <Text style={[styles.buttonLabel, { color: palette.foreground }]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ *
 * Text field (M3 outlined)
 * ------------------------------------------------------------------ */

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, focused && styles.fieldLabelActive]}>{label}</Text>
      <View
        style={[
          styles.fieldBox,
          multiline && styles.fieldBoxMultiline,
          focused && styles.fieldBoxActive,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessibilityLabel={label}
          style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * Styles
 * ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trackOff: {
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1.5,
    borderColor: colors.outline,
  },
  trackOn: {
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: 'absolute',
    left: THUMB_INSET,
    top: THUMB_INSET,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbOff: {
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.outline,
  },
  thumbOn: {
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.onPrimary,
  },
  thumbCheck: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  segmented: {
    flexDirection: 'row',
    height: 40,
    borderRadius: shape.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLow,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  segmentDivided: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.outlineVariant,
  },
  segmentSelected: {
    borderRadius: shape.full,
    backgroundColor: colors.secondaryContainer,
  },
  segmentLabel: {
    ...typeScale.labelMedium,
    letterSpacing: 0.2,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  segmentLabelSelected: {
    color: colors.onSecondaryContainer,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: shape.xs,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: colors.secondaryContainer,
    borderColor: colors.secondaryContainer,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.onSecondaryContainer,
  },
  chipLabel: {
    ...typeScale.labelLarge,
    color: colors.onSurfaceVariant,
  },
  chipLabelSelected: {
    color: colors.onSecondaryContainer,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  rowSelected: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    ...typeScale.bodyLarge,
    color: colors.onSurface,
  },
  rowLabelDanger: {
    color: colors.error,
  },
  rowDescription: {
    ...typeScale.bodySmall,
    color: colors.onSurfaceVariant,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.primary, 0.14),
  },
  sectionTitle: {
    ...typeScale.titleSmall,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.3,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
    opacity: 0.7,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 40,
    paddingHorizontal: spacing.xxl,
    borderRadius: shape.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  buttonText: {
    paddingHorizontal: spacing.md,
  },
  buttonLabel: {
    ...typeScale.labelLarge,
  },

  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typeScale.labelMedium,
    color: colors.onSurfaceVariant,
  },
  fieldLabelActive: {
    color: colors.primary,
  },
  fieldBox: {
    minHeight: 48,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.outline,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  fieldBoxMultiline: {
    minHeight: 88,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    justifyContent: 'flex-start',
  },
  fieldBoxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainer,
  },
  fieldInput: {
    ...typeScale.bodyLarge,
    color: colors.onSurface,
    padding: 0,
  },
  fieldInputMultiline: {
    textAlignVertical: 'top',
  },
});
