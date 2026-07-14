import type { ComponentType, ReactNode } from 'react';
import { Button, View } from 'tamagui';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { SettingsGlass } from './SettingsGlass';
import { SETTINGS_ICON_STROKE } from './SettingsIconWell';

type ChromeIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface SettingsChromeButtonProps {
  icon?: ChromeIcon;
  onPress?: () => void;
  accessibilityLabel: string;
  children?: ReactNode;
}

/** Circular chrome control — floating tab-bar glass. */
export function SettingsChromeButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  children,
}: SettingsChromeButtonProps) {
  const { s, fs } = useScale();
  const c = useSettingsTheme();
  const size = s(42);

  const face = (
    <SettingsGlass
      interactive={Boolean(onPress)}
      elevated
      radius={size / 2}
      style={{ width: size, height: size }}
      contentStyle={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {Icon ? <Icon size={fs(19)} color={c.ink} strokeWidth={SETTINGS_ICON_STROKE} /> : children}
    </SettingsGlass>
  );

  if (!onPress) {
    return <View style={{ width: size, height: size }}>{face}</View>;
  }

  return (
    <Button
      unstyled
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      pressStyle={{ opacity: 0.72 }}
      style={{ width: size, height: size }}
    >
      {face}
    </Button>
  );
}

export function SettingsChromeSpacer() {
  const { s } = useScale();
  return <View style={{ width: s(42), height: s(42) }} />;
}
