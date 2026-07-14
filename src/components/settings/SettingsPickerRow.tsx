import { useState } from 'react';
import type { ComponentType } from 'react';
import { ChevronRight } from '../ui/Glyph';
import { Text, View, XStack } from 'tamagui';
import { SettingsChoiceChip } from './SettingsChoiceChip';
import { SettingsRow } from './SettingsRow';
import { SettingsSheet } from './SettingsSheet';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { settingsFonts } from './settingsFonts';

type RowIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface PickerOption<T extends string> {
  id: T;
  label: string;
  icon?: RowIcon;
  /** Swatch color shown next to the option and as the current-value indicator. */
  color?: string;
}

interface SettingsPickerRowProps<T extends string> {
  icon: RowIcon;
  iconColor?: string;
  label: string;
  value: T;
  valueLabel: string;
  options: PickerOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  subtitle?: string;
}

export function SettingsPickerRow<T extends string>({
  icon,
  iconColor,
  label,
  value,
  valueLabel,
  options,
  onChange,
  disabled,
  subtitle,
}: SettingsPickerRowProps<T>) {
  const { s, fs } = useScale();
  const c = useSettingsTheme();
  const [open, setOpen] = useState(false);
  const currentColor = options.find((o) => o.id === value)?.color;

  return (
    <>
      <SettingsRow
        icon={icon}
        iconColor={iconColor}
        label={label}
        subtitle={subtitle}
        disabled={disabled}
        onPress={disabled ? undefined : () => setOpen(true)}
        trailing={
          <XStack style={{ alignItems: 'center', gap: s(6) }}>
            {currentColor ? (
              <View
                style={{
                  width: s(10),
                  height: s(10),
                  borderRadius: s(5),
                  backgroundColor: currentColor,
                }}
              />
            ) : null}
            <Text
              numberOfLines={1}
              style={{
                fontFamily: settingsFonts.medium,
                fontSize: fs(13.5),
                lineHeight: fs(18),
                color: c.muted,
                flexShrink: 0,
              }}
            >
              {valueLabel}
            </Text>
            {!disabled ? <ChevronRight size={fs(16)} color={c.ink} strokeWidth={2} /> : null}
          </XStack>
        }
      />
      <SettingsSheet isOpen={open} onClose={() => setOpen(false)} title={label}>
        <XStack style={{ flexWrap: 'wrap', gap: s(8) }}>
          {options.map((opt) => (
            <SettingsChoiceChip
              key={opt.id}
              label={opt.label}
              selected={opt.id === value}
              color={opt.color}
              onPress={() => {
                onChange(opt.id);
                setOpen(false);
              }}
            />
          ))}
        </XStack>
      </SettingsSheet>
    </>
  );
}
