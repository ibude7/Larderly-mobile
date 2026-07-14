import type { ReactNode } from 'react';
import { Text, YStack } from 'tamagui';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { SettingsRowGroup } from './SettingsRowGroup';
import { settingsType } from './settingsFonts';

interface SettingsModuleProps {
  title: string;
  children: ReactNode;
  description?: string;
}

/** Section label + one grouped card — label sits tight above the card. */
export function SettingsModule({ title, description, children }: SettingsModuleProps) {
  const { s, fs } = useScale();
  const c = useSettingsTheme();

  return (
    <YStack style={{ gap: s(6) }}>
      <Text
        accessibilityRole="header"
        style={{
          ...settingsType('semibold'),
          fontSize: fs(11),
          lineHeight: fs(14),
          letterSpacing: 0.7,
          textTransform: 'uppercase',
          color: c.muted,
          flexShrink: 0,
          paddingHorizontal: s(4),
        }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            ...settingsType('regular'),
            fontSize: fs(12),
            lineHeight: fs(16),
            color: c.muted,
            flexShrink: 0,
            paddingHorizontal: s(4),
          }}
        >
          {description}
        </Text>
      ) : null}
      <SettingsRowGroup>{children}</SettingsRowGroup>
    </YStack>
  );
}
