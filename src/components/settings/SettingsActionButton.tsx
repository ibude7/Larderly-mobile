import type { ComponentType } from 'react';
import { Spinner, Button, Text, XStack } from 'tamagui';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { settingsFonts } from './settingsFonts';

type ButtonIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
type ButtonTone = 'primary' | 'secondary' | 'danger';

interface SettingsActionButtonProps {
  label: string;
  onPress: () => void;
  icon?: ButtonIcon;
  tone?: ButtonTone;
  loading?: boolean;
  disabled?: boolean;
  style?: object;
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
    tone === 'primary' ? c.accentLine : tone === 'danger' ? c.tint(c.danger, 0.36) : c.lineStrong;

  return (
    <Button
      unstyled
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      pressStyle={{ opacity: 0.72 }}
      style={[
        {
          minHeight: fsLayout(48),
          borderRadius: s(16),
          borderWidth: 1,
          borderColor,
          backgroundColor: background,
          paddingHorizontal: s(16),
          paddingVertical: s(12),
          alignItems: 'center',
          justifyContent: 'center',
          opacity: inactive ? 0.5 : 1,
        },
        style,
      ]}
    >
      <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: s(8) }}>
        {loading ? (
          <Spinner size="small" color={foreground} />
        ) : Icon ? (
          <Icon size={fs(16)} color={foreground} strokeWidth={2.2} />
        ) : null}
        <Text
          style={{
            fontFamily: settingsFonts.semibold,
            fontSize: fs(14.5),
            lineHeight: fs(19),
            color: foreground,
            textAlign: 'center',
            flexShrink: 1,
          }}
        >
          {label}
        </Text>
      </XStack>
    </Button>
  );
}
