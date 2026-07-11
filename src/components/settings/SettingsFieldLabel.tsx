import { Text } from 'react-native';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

export function SettingsFieldLabel({ children, color }: { children: string; color?: string }) {
  const { fs } = useScale();
  const c = useSettingsTheme();
  return (
    <Text
      style={{
        fontSize: fs(11),
        lineHeight: fs(14),
        fontWeight: '700',
        letterSpacing: fs(1),
        textTransform: 'uppercase',
        color: color ?? c.muted,
        marginBottom: fs(8),
        flexShrink: 0,
      }}
    >
      {children}
    </Text>
  );
}
