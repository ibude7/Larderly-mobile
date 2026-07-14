import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { FrostedNavbarGlass } from '../landing/FrostedNavbarGlass';
import { Icon, IconName } from '../ui/Icon';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';
import { landingFonts as SF } from '../../theme/landing';

const TAB_META: Record<string, { label: string; icon: IconName }> = {
  Dashboard: { label: 'Home', icon: 'dashboard' },
  Pantry: { label: 'Inventory', icon: 'pantry' },
  Scanner: { label: 'Scan', icon: 'scanner' },
  Shopping: { label: 'Lists', icon: 'cart' },
  Meals: { label: 'Recipes', icon: 'chef' },
};

interface TabItemProps {
  label: string;
  icon: IconName;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function TabItem({ label, icon, focused, onPress, onLongPress }: TabItemProps) {
  const { s, fs, fsLayout } = useScale();
  const c = useAppColors();
  const iconSize = fs(20);
  const labelSize = fs(10);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.tab, { minHeight: fsLayout(52), paddingVertical: s(4) }]}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.tabInner,
          {
            paddingHorizontal: s(8),
            paddingVertical: s(6),
            borderRadius: s(16),
            backgroundColor: focused ? c.primaryGlow : 'transparent',
            borderWidth: focused ? StyleSheet.hairlineWidth * 1.5 : 0,
            borderColor: focused ? `${c.primary}40` : 'transparent',
          },
        ]}
      >
        <Icon name={icon} size={iconSize} color={focused ? c.primary : c.muted} />
        <Text
          style={{
            marginTop: s(3),
            fontSize: labelSize,
            lineHeight: fs(12),
            fontFamily: focused ? SF.semibold : SF.medium,
            fontWeight: Platform.OS === 'ios' ? (focused ? '600' : '500') : undefined,
            color: focused ? c.ink : c.muted,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { s, fsLayout } = useScale();
  const radius = s(28);
  const floatGap = s(12);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.floatWrap,
        {
          bottom: insets.bottom + floatGap,
          left: s(20),
          right: s(20),
        },
      ]}
    >
      <FrostedNavbarGlass
        borderRadius={radius}
        contentStyle={{
          paddingHorizontal: s(6),
          paddingVertical: s(6),
          minHeight: fsLayout(56),
        }}
      >
        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const meta = TAB_META[route.name];
            if (!meta) return null;

            const focused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TabItem
                key={route.key}
                label={meta.label}
                icon={meta.icon}
                focused={focused}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>
      </FrostedNavbarGlass>
    </View>
  );
}

const styles = StyleSheet.create({
  floatWrap: {
    position: 'absolute',
    zIndex: 100,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
