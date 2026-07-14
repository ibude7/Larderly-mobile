import { Text } from 'tamagui';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { settingsFonts } from './settingsFonts';

interface SettingsSectionHeaderProps {
  title: string;
}

/** Compact module/section label used above SettingsRowGroup blocks. */
export function SettingsSectionHeader({ title }: SettingsSectionHeaderProps) {
  const { s, fs } = useScale();
  const c = useSettingsTheme();

  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: settingsFonts.bold,
        fontSize: fs(11.5),
        lineHeight: fs(15),
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: c.muted,
        marginBottom: s(8),
        flexShrink: 0,
      }}
    >
      {title}
    </Text>
  );
}
