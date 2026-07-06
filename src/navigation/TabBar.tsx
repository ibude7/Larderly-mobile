import { View, Text, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
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

const SPRING = { damping: 14, stiffness: 120, mass: 1 };

interface TabButtonProps {
  focused: boolean;
  label: string;
  icon: IconName;
  onPress: () => void;
}

function ScanButton({ onPress, focused }: { onPress: () => void; focused: boolean }) {
  const c = useAppColors();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.88, SPRING); }}
      onPressOut={() => { scale.value = withSpring(1, SPRING); }}
      className="min-w-0 flex-1 items-center justify-center"
      accessibilityRole="button"
      accessibilityLabel="Open Barcode Scanner"
      accessibilityState={focused ? { selected: true } : {}}
      testID="tab-scanner"
      style={{ marginTop: -26 }}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            borderRadius: 30,
            shadowColor: c.primary,
            shadowOpacity: 0.55,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 6 },
            elevation: 12,
          },
        ]}
      >
        <LinearGradient
          colors={[c.primary, c.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3,
            borderColor: 'rgba(255,255,255,0.35)',
          }}
        >
          <Icon name="scanner" size={26} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function TabButton({ focused, label, icon, onPress }: TabButtonProps) {
  const c = useAppColors();
  const scale = useSharedValue(1);
  const active = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    active.value = withTiming(focused ? 1 : 0, { duration: 220 });
  }, [focused, active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: active.value,
    transform: [{ scale: 0.7 + active.value * 0.3 }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.88, SPRING); }}
      onPressOut={() => { scale.value = withSpring(1, SPRING); }}
      className="min-w-0 flex-1 items-center justify-center py-1"
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      testID={`tab-${label.toLowerCase()}`}
    >
      <Animated.View style={[animatedStyle, { alignItems: 'center' }]}>
        <View style={{ width: 46, height: 32, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={[
              pillStyle,
              {
                position: 'absolute',
                width: 46,
                height: 32,
                borderRadius: 16,
                backgroundColor: c.primaryGlow,
              },
            ]}
          />
          <Icon name={icon} size={22} color={focused ? c.primary : c.muted} />
        </View>
        <Text
          className={focused ? 'font-bold' : 'font-medium'}
          style={{ fontSize: 10, marginTop: 2, color: focused ? c.primary : c.muted, letterSpacing: 0.3 }}
        >
          {label}
        </Text>
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
        left: 20,
        right: 20,
      }}
    >
      <BlurView
        intensity={theme === 'dark' ? 70 : 84}
        tint={theme}
        style={{
          borderRadius: 34,
          borderWidth: 1,
          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)',
          backgroundColor: theme === 'dark' ? 'rgba(15,20,16,0.62)' : 'rgba(255,255,255,0.62)',
          paddingHorizontal: 6,
          paddingVertical: 8,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOpacity: 0.28,
          shadowRadius: 26,
          shadowOffset: { width: 0, height: 10 },
          elevation: 14,
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

            if (route.name === 'Scanner') {
              return <ScanButton key={route.key} focused={focused} onPress={onPress} />;
            }

            return (
              <TabButton
                key={route.key}
                focused={focused}
                label={meta.label}
                icon={meta.icon}
                onPress={onPress}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
