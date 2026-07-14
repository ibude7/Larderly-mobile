import type { StyleProp, TextStyle } from 'react-native';
import { Text } from 'tamagui';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { settingsFonts } from './settingsFonts';

export function SettingsBodyText({
  children,
  style,
  accent,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  accent?: boolean;
}) {
  const { fs } = useScale();
  const c = useSettingsTheme();
  return (
    <Text
      style={[
        {
          fontFamily: accent ? settingsFonts.semibold : settingsFonts.regular,
          fontSize: fs(14),
          lineHeight: fs(20),
          color: accent ? c.ink : c.inkSoft,
          flexShrink: 0,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
