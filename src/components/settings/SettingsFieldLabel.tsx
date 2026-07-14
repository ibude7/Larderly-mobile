import { Text } from 'tamagui';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { settingsFonts } from './settingsFonts';

export function SettingsFieldLabel({ children, color }: { children: string; color?: string }) {
  const { fs, s } = useScale();
  const c = useSettingsTheme();
  return (
    <Text
      style={{
        fontFamily: settingsFonts.bold,
        fontSize: fs(11),
        lineHeight: fs(14),
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: color ?? c.muted,
        marginBottom: s(2),
        flexShrink: 0,
      }}
    >
      {children}
    </Text>
  );
}
