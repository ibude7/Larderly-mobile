import { Children, type ReactNode, isValidElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useScale } from '../../theme/scale';
import { premiumTheme, premiumType } from './premiumTheme';

interface SettingsGroupProps {
  title: string;
  children: ReactNode;
}

/** Quiet section label + white card group. No accent dots or left rails. */
export function SettingsGroup({ title, children }: SettingsGroupProps) {
  const { s, fs } = useScale();
  const items = Children.toArray(children).filter(Boolean);
  const lastIndex = items.length - 1;

  return (
    <View style={{ gap: s(8) }}>
      <Text
        style={[
          premiumType.groupLabel,
          {
            fontSize: fs(12),
            lineHeight: fs(16),
            paddingHorizontal: s(4),
            flexShrink: 0,
          },
        ]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.card,
          premiumTheme.shadow,
          {
            borderRadius: s(premiumTheme.radiusCard),
            borderColor: premiumTheme.border,
            backgroundColor: premiumTheme.surface,
            overflow: 'hidden',
          },
        ]}
      >
        {items.map((child, index) => {
          if (!isValidElement(child)) return child;
          return (
            <View key={child.key ?? index}>
              {typeof child.type === 'string'
                ? child
                : {
                    ...child,
                    props: {
                      ...child.props,
                      last: index === lastIndex,
                    },
                  }}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
