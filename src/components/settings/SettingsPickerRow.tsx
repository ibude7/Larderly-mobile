import { useState } from 'react';
import type { ComponentType } from 'react';
import { Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { SettingsChoiceChip } from './SettingsChoiceChip';
import { SettingsRow } from './SettingsRow';
import { SettingsSheet } from './SettingsSheet';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6) }}>
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
              style={{
                fontSize: fs(13.5),
                lineHeight: fs(18),
                fontWeight: '500',
                color: c.muted,
                flexShrink: 0,
              }}
              numberOfLines={1}
            >
              {valueLabel}
            </Text>
            {!disabled ? <ChevronRight size={fs(16)} color={c.muted} strokeWidth={2} /> : null}
          </View>
        }
      />
      <SettingsSheet isOpen={open} onClose={() => setOpen(false)} title={label}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8) }}>
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
        </View>
      </SettingsSheet>
    </>
  );
}
