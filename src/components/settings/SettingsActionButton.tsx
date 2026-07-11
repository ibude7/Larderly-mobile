import type { ComponentType } from 'react';
import { ActivityIndicator, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

type ButtonIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
type ButtonTone = 'primary' | 'secondary' | 'danger';

interface SettingsActionButtonProps {
  label: string;
  onPress: () => void;
  icon?: ButtonIcon;
  tone?: ButtonTone;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function SettingsActionButton({
  label,
  onPress,
  icon: Icon,
  tone = 'secondary',
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
}: SettingsActionButtonProps) {
  const { s, fs, fsLayout } = useScale();
  const c = useSettingsTheme();
  const inactive = disabled || loading;
  const foreground = tone === 'primary' ? '#FFFFFF' : tone === 'danger' ? c.danger : c.ink;
  const background =
    tone === 'primary' ? c.accent : tone === 'danger' ? c.tint(c.danger, 0.12) : c.surfaceMuted;
  const borderColor =
    tone === 'primary' ? c.accentLine : tone === 'danger' ? c.tint(c.danger, 0.36) : c.line;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        {
          minHeight: fsLayout(44),
          borderRadius: s(14),
          borderWidth: 1,
          borderColor,
          backgroundColor: background,
          paddingHorizontal: s(14),
          paddingVertical: s(10),
          alignItems: 'center',
          justifyContent: 'center',
          opacity: inactive ? 0.5 : pressed ? 0.72 : 1,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8) }}>
        {loading ? (
          <ActivityIndicator size="small" color={foreground} />
        ) : Icon ? (
          <Icon size={fs(16)} color={foreground} strokeWidth={2.2} />
        ) : null}
        <Text
          style={{
            flexShrink: 1,
            textAlign: 'center',
            fontSize: fs(14),
            lineHeight: fs(19),
            fontWeight: '600',
            color: foreground,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
