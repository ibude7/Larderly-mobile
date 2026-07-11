import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

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
          fontSize: fs(14),
          lineHeight: fs(20),
          fontWeight: accent ? '600' : '400',
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
