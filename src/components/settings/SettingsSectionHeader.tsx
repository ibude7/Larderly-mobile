import { Text } from 'react-native';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

interface SettingsSectionHeaderProps {
  title: string;
  /** Optional wayfinding accent (defaults to muted ink). */
  accent?: string;
}

/** Compact module/section label used above SettingsRowGroup blocks. */
export function SettingsSectionHeader({ title, accent }: SettingsSectionHeaderProps) {
  const { s, fs } = useScale();
  const c = useSettingsTheme();

  return (
    <Text
      accessibilityRole="header"
      style={{
        fontSize: fs(12),
        lineHeight: fs(16),
        fontWeight: '700',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: accent ?? c.muted,
        marginBottom: s(8),
        flexShrink: 0,
      }}
    >
      {title}
    </Text>
  );
}
