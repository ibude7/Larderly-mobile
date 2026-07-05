import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, IconName } from '../ui/Icon';
import { useAppColors } from '../../hooks/useAppColors';
import { useTheme } from '../../hooks/useTheme';

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
  onPress: () => void;
}

function TabButton({ focused, label, icon, onPress }: TabButtonProps) {
  const c = useAppColors();

  const labelOpacity = useDerivedValue(() => {
    return withTiming(focused ? 1 : 0, { duration: 150 });
  });

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
    >
      <Icon name={icon} size={22} color={focused ? c.primary : c.muted} />
      <Animated.Text
        style={[
          styles.label,
          { color: c.primary },
          labelStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const c = useAppColors();
  const theme = useTheme();

  const [containerWidth, setContainerWidth] = useState(0);
  const tabWidth = containerWidth ? containerWidth / 5 : 0;

  const translateX = useDerivedValue(() => {
    if (tabWidth === 0) return 0;
    return withSpring(state.index * tabWidth, { damping: 15, stiffness: 100 });
  });

  const indicatorOpacity = useDerivedValue(() => {
    // Hide indicator behind Scanner FAB
    return withSpring(state.index === 2 ? 0 : 1);
  });

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: indicatorOpacity.value,
  }));

  // Center Scanner button onPress handler
  const handleScannerPress = () => {
    const route = state.routes[2];
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (state.index !== 2 && !event.defaultPrevented) {
      navigation.navigate(route.name as never);
    }
  };

  const isScannerFocused = state.index === 2;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.floatingContainer,
        {
          bottom: insets.bottom + 12,
        },
      ]}
    >
      {/* Frosted Glass Floating Tab Bar */}
      <BlurView
        intensity={theme === 'dark' ? 75 : 80}
        tint={theme}
        style={[
          styles.blurBar,
          {
            borderColor: c.line,
            backgroundColor: theme === 'dark' ? 'rgba(26, 26, 34, 0.65)' : 'rgba(255, 255, 255, 0.45)',
          },
        ]}
      >
        <View
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          style={styles.contentContainer}
        >
          {/* Floating active pill indicator */}
          {tabWidth > 0 && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: tabWidth,
                  height: 48,
                  top: 0,
                  padding: 4,
                },
                indicatorStyle,
              ]}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: `${c.primary}12`,
                  borderRadius: 24,
                }}
              />
            </Animated.View>
          )}

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

            // Index 2 is the Scanner placeholder slot inside the Bar
            if (index === 2) {
              return (
                <View key={route.key} style={{ width: `${100 / 5}%`, height: 48 }} />
              );
            }

            return (
              <View key={route.key} style={{ width: `${100 / 5}%`, alignItems: 'center' }}>
                <TabButton
                  focused={focused}
                  label={meta.label}
                  icon={meta.icon}
                  onPress={onPress}
                />
              </View>
            );
          })}
        </View>
      </BlurView>

      {/* Elevated FAB Scanner Button outside the BlurView (to prevent clipping) */}
      <View
        pointerEvents="box-none"
        style={styles.scannerFabContainer}
      >
        <Pressable
          onPress={handleScannerPress}
          style={[
            styles.scannerFab,
            {
              backgroundColor: c.primary,
              shadowColor: c.primary,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open Barcode Scanner"
          accessibilityState={isScannerFocused ? { selected: true } : {}}
        >
          <Icon name="scanner" size={26} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 100,
  },
  blurBar: {
    borderRadius: 36,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    width: '100%',
  },
  scannerFabContainer: {
    position: 'absolute',
    left: '50%',
    top: -12,
    width: 56,
    height: 56,
    marginLeft: -28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  scannerFab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
