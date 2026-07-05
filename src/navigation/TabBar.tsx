import { View, Text, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, IconName } from '../components/ui/Icon';
import { useAppColors } from '../hooks/useAppColors';
import { useTheme } from '../hooks/useTheme';

const TAB_META: Record<string, { label: string; icon: IconName }> = {
  Dashboard: { label: 'Home', icon: 'dashboard' },
  Pantry: { label: 'Pantry', icon: 'pantry' },
  Scanner: { label: 'Scan', icon: 'scanner' },
  Shopping: { label: 'List', icon: 'cart' },
  Meals: { label: 'Meals', icon: 'chef' },
};

interface TabButtonProps {
  focused: boolean;
  label: string;
  icon: IconName;
  isScanner?: boolean;
  onPress: () => void;
}

function TabButton({ focused, label, icon, isScanner, onPress }: TabButtonProps) {
  const c = useAppColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (isScanner) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.88);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        className="min-w-0 flex-1 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Open Barcode Scanner"
        accessibilityState={focused ? { selected: true } : {}}
      >
        <Animated.View
          style={[
            animatedStyle,
            {
              backgroundColor: c.primary,
              borderRadius: 20,
              paddingHorizontal: 20,
              paddingVertical: 10,
              shadowColor: c.primary,
              shadowOpacity: 0.5,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          <Icon name="scanner" size={24} color="#FFFFFF" />
        </Animated.View>
        {focused ? (
          <Text className="mt-1 text-[11px] font-bold" style={{ color: c.primary }}>
            {label}
          </Text>
        ) : null}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.88);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      className="min-w-0 flex-1 items-center justify-center py-1"
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
    >
      <Animated.View style={[animatedStyle, { alignItems: 'center' }]}>
        <Icon name={icon} size={24} color={focused ? c.primary : c.muted} />
        {focused ? (
          <Text className="mt-1 text-[11px] font-bold" style={{ color: c.primary }}>
            {label}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const c = useAppColors();
  const theme = useTheme();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: insets.bottom + 12,
        left: 24,
        right: 24,
      }}
    >
      <BlurView
        intensity={theme === 'dark' ? 75 : 80}
        tint={theme}
        style={{
          borderRadius: 36,
          borderWidth: 1,
          borderColor: c.line,
          paddingHorizontal: 8,
          paddingVertical: 10,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOpacity: 0.4,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <View className="flex-row items-center justify-around">
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
                navigation.navigate(route.name as never);
              }
            };

            return (
              <TabButton
                key={route.key}
                focused={focused}
                label={meta.label}
                icon={meta.icon}
                isScanner={route.name === 'Scanner'}
                onPress={onPress}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
