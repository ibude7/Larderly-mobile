import { Check } from '../ui/Glyph';
import { Button, Text, View, XStack } from 'tamagui';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { settingsFonts } from './settingsFonts';

interface SettingsChoiceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  /** Optional swatch shown before the label (e.g. accent color). */
  color?: string;
}

export function SettingsChoiceChip({
  label,
  selected,
  onPress,
  disabled = false,
  color,
}: SettingsChoiceChipProps) {
  const { s, fs, fsLayout } = useScale();
  const c = useSettingsTheme();

  return (
    <Button
      unstyled
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      pressStyle={{ opacity: 0.72 }}
      style={{
        minHeight: fsLayout(40),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s(6),
        borderRadius: s(999),
        borderWidth: 1,
        borderColor: selected ? c.accentLine : c.lineStrong,
        backgroundColor: selected ? c.accentSoft : c.surfaceMuted,
        paddingHorizontal: s(12),
        paddingVertical: s(8),
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <XStack style={{ alignItems: 'center', gap: s(6) }}>
        {color ? (
          <View
            style={{
              width: s(10),
              height: s(10),
              borderRadius: s(5),
              backgroundColor: color,
            }}
          />
        ) : null}
        <Text
          style={{
            fontFamily: selected ? settingsFonts.semibold : settingsFonts.medium,
            fontSize: fs(13),
            lineHeight: fs(17),
            color: selected ? c.accent : c.inkSoft,
            flexShrink: 1,
          }}
        >
          {label}
        </Text>
        {selected ? <Check size={fs(13)} color={c.ink} strokeWidth={2.6} /> : null}
      </XStack>
    </Button>
  );
}
