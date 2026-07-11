import { Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

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
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      style={({ pressed }) => ({
        minHeight: fsLayout(40),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s(6),
        borderRadius: s(999),
        borderWidth: 1,
        borderColor: selected ? c.accentLine : c.line,
        backgroundColor: selected ? c.accentSoft : c.surfaceMuted,
        paddingHorizontal: s(12),
        paddingVertical: s(8),
        opacity: disabled ? 0.45 : pressed ? 0.72 : 1,
      })}
    >
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
          flexShrink: 1,
          fontSize: fs(13),
          lineHeight: fs(17),
          fontWeight: selected ? '600' : '500',
          color: selected ? c.accent : c.inkSoft,
        }}
      >
        {label}
      </Text>
      {selected ? <Check size={fs(13)} color={c.accent} strokeWidth={2.6} /> : null}
    </Pressable>
  );
}
