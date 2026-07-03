import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, IconName } from '../components/ui/Icon';
import { colors } from '../theme';

const TAB_META: Record<string, { label: string; icon: IconName }> = {
  Dashboard: { label: 'Home', icon: 'dashboard' },
  Pantry: { label: 'Pantry', icon: 'pantry' },
  Scanner: { label: 'Scan', icon: 'scanner' },
  Shopping: { label: 'List', icon: 'cart' },
  Meals: { label: 'Meals', icon: 'chef' },
};

/**
 * Custom bottom tab bar mirroring the web MobileNav: five items with a raised,
 * circular center Scan button.
 */
export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingBottom: Math.max(insets.bottom, 6) }}
      className="flex-row items-end justify-around border-t border-line bg-surface px-2 pt-2"
    >
      {state.routes.map((route, index) => {
        const meta = TAB_META[route.name];
        if (!meta) return null;
        const focused = state.index === index;
        const isScanner = route.name === 'Scanner';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        if (isScanner) {
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              className="min-w-0 flex-1 items-center"
              accessibilityRole="button"
              accessibilityLabel="Open Barcode Scanner"
            >
              <View
                className={`-mt-7 h-14 w-14 items-center justify-center rounded-full border-4 border-surface ${
                  focused ? 'bg-primary' : 'bg-ink'
                }`}
              >
                <Icon name="scanner" size={24} color="#FFFFFF" />
              </View>
              <Text className="mt-1 text-[10px] font-bold text-ink">{meta.label}</Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            className="min-w-0 flex-1 items-center gap-1 py-1.5"
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
          >
            <Icon name={meta.icon} size={24} color={focused ? colors.primary : colors.muted} />
            <Text
              className={`text-[10px] font-bold ${focused ? 'text-primary' : 'text-muted'}`}
            >
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
