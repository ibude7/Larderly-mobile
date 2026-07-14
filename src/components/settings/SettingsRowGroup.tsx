import type { ReactNode } from 'react';
import { View } from 'tamagui';
import { useScale } from '../../theme/scale';
import { withRowDividers } from './SettingsRow';
import { SettingsSurface } from './SettingsSurface';

interface SettingsRowGroupProps {
  children: ReactNode;
}

export function SettingsRowGroup({ children }: SettingsRowGroupProps) {
  const { s } = useScale();

  return (
    <SettingsSurface elevated radius={s(26)} contentStyle={{ overflow: 'hidden' }}>
      <View>{withRowDividers(children)}</View>
    </SettingsSurface>
  );
}
