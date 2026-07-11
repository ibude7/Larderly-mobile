import { Children, Fragment, ReactNode } from 'react';
import { View } from 'react-native';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

interface SettingsRowGroupProps {
  children: ReactNode;
  /** Optional section accent used for a subtle left edge marker. */
  accent?: string;
}

/** Grouped, elevated container that separates SettingsRow children with hairline dividers. */
export function SettingsRowGroup({ children, accent }: SettingsRowGroupProps) {
  const { s } = useScale();
  const c = useSettingsTheme();
  const items = Children.toArray(children).filter(Boolean);

  return (
    <View
      style={{
        borderRadius: s(18),
        borderWidth: 1,
        borderColor: c.line,
        backgroundColor: c.surface,
        overflow: 'hidden',
        borderLeftWidth: accent ? s(3) : 1,
        borderLeftColor: accent ?? c.line,
      }}
    >
      {items.map((child, index) => (
        <Fragment key={index}>
          {child}
          {index < items.length - 1 ? (
            <View
              style={{
                height: 1,
                backgroundColor: c.line,
                marginLeft: s(58),
              }}
            />
          ) : null}
        </Fragment>
      ))}
    </View>
  );
}
