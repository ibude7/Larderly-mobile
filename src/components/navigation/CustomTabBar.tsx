import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FrostedNavbarGlass } from '../landing/FrostedNavbarGlass';
import { Icon, IconName } from '../ui/Icon';
import { ScanBarcode } from '../ui/Glyph';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';
import { landingFonts as SF } from '../../theme/landing';
import { brandOrange } from '../../theme/brand';
import { SETTINGS_ICON_STROKE } from '../settings/SettingsIconWell';

const TAB_META: Record<string, { label: string; icon: IconName }> = {
  Dashboard: { label: 'Home', icon: 'dashboard' },
  Pantry: { label: 'Inventory', icon: 'pantry' },
  Scanner: { label: 'Scan', icon: 'scanner' },
  Shopping: { label: 'Lists', icon: 'cart' },
  Meals: { label: 'Recipes', icon: 'chef' },
};

interface TabPressHandlers {
  onPress: () => void;
  onLongPress: () => void;
}

interface TabItemProps extends TabPressHandlers {
  label: string;
  icon: IconName;
  focused: boolean;
}

function TabItem({ label, icon, focused, onPress, onLongPress }: TabItemProps) {
  const { s, fs, fsLayout } = useScale();
  const c = useAppColors();
  const iconSize = fs(22);
  const labelSize = fs(10);
  const iconWell = fsLayout(30);

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={styles.tab}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={label}
    >
      <View style={styles.tabInner}>
        <View style={[styles.iconWell, { height: iconWell }]}>
          <Icon name={icon} size={iconSize} color={focused ? c.primary : c.muted} />
        </View>
        <Text
          style={{
            marginTop: s(5),
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

interface ScanFabProps extends TabPressHandlers {
  focused: boolean;
  size: number;
  top: number;
}

function ScanFab({ focused, onPress, onLongPress, size, top }: ScanFabProps) {
  const { s, fs } = useScale();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={[
        styles.scanFab,
        {
          top,
          width: size,
          height: size,
          marginLeft: -size / 2,
          borderRadius: size / 2,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel="Scan"
    >
      <LinearGradient
        colors={[...brandOrange.gradient]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: brandOrange.dark,
          shadowOpacity: focused ? 0.34 : 0.24,
          shadowRadius: s(10),
          shadowOffset: { width: 0, height: s(5) },
          elevation: focused ? 9 : 6,
        }}
      >
        <ScanBarcode
          size={fs(22)}
          color="#FFFFFF"
          strokeWidth={SETTINGS_ICON_STROKE + 0.15}
        />
      </LinearGradient>
    </Pressable>
  );
}

interface ScanLabelSlotProps extends TabPressHandlers {
  focused: boolean;
}

function ScanLabelSlot({ focused, onPress, onLongPress }: ScanLabelSlotProps) {
  const { s, fs, fsLayout } = useScale();
  const c = useAppColors();
  const iconWell = fsLayout(30);
  const labelSize = fs(10);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={styles.tab}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel="Scan"
    >
      <View style={styles.tabInner}>
        <View style={[styles.iconWell, { height: iconWell }]} />
        <Text
          style={{
            marginTop: s(5),
            fontSize: labelSize,
            lineHeight: fs(12),
            fontFamily: focused ? SF.semibold : SF.medium,
            fontWeight: Platform.OS === 'ios' ? (focused ? '600' : '500') : undefined,
            color: focused ? c.ink : c.muted,
          }}
          numberOfLines={1}
        >
          Scan
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
  const sideInset = s(16);
  const fabSize = s(54);
  const fabTop = -Math.round(fabSize * 0.52);

  const scannerRoute = state.routes.find((route) => route.name === 'Scanner');
  const scannerIndex = state.routes.findIndex((route) => route.name === 'Scanner');
  const scannerFocused = scannerIndex >= 0 && state.index === scannerIndex;

  const scannerHandlers = scannerRoute
    ? {
        onPress: () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: scannerRoute.key,
            canPreventDefault: true,
          });
          if (!scannerFocused && !event.defaultPrevented) {
            navigation.navigate(scannerRoute.name, scannerRoute.params);
          }
        },
        onLongPress: () => {
          navigation.emit({
            type: 'tabLongPress',
            target: scannerRoute.key,
          });
        },
      }
    : null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.floatWrap,
        {
          bottom: insets.bottom + floatGap,
          left: sideInset,
          right: sideInset,
        },
      ]}
    >
      <View style={styles.dockShell}>
        {scannerHandlers ? (
          <ScanFab
            focused={scannerFocused}
            size={fabSize}
            top={fabTop}
            onPress={scannerHandlers.onPress}
            onLongPress={scannerHandlers.onLongPress}
          />
        ) : null}

        <FrostedNavbarGlass
          borderRadius={radius}
          contentStyle={{
            paddingHorizontal: s(8),
            paddingTop: s(8),
            paddingBottom: s(10),
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

              if (route.name === 'Scanner') {
                if (!scannerHandlers) return null;
                return (
                  <ScanLabelSlot
                    key={route.key}
                    focused={focused}
                    onPress={scannerHandlers.onPress}
                    onLongPress={scannerHandlers.onLongPress}
                  />
                );
              }

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
    </View>
  );
}

const styles = StyleSheet.create({
  floatWrap: {
    position: 'absolute',
    zIndex: 100,
  },
  dockShell: {
    position: 'relative',
    overflow: 'visible',
  },
  scanFab: {
    position: 'absolute',
    left: '50%',
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  iconWell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
