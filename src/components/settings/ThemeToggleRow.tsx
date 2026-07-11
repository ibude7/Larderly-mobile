import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Moon, Smartphone, Sun } from 'lucide-react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Theme } from '../../contexts/PreferencesContext';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { usePreferenceValues } from '../../contexts/PreferenceValueContext';

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Auto', icon: Smartphone },
];

interface ThemeToggleRowProps {
  value: Theme;
  onChange: (theme: Theme) => void;
}

export function ThemeToggleRow({ value, onChange }: ThemeToggleRowProps) {
  const { s } = useScale();
  const c = useSettingsTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: s(14),
        borderWidth: 1,
        borderColor: c.line,
        backgroundColor: c.surface,
        padding: s(4),
        gap: s(4),
      }}
    >
      {OPTIONS.map((opt) => (
        <ThemeSegment
          key={opt.value}
          option={opt}
          active={value === opt.value}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(opt.value);
          }}
        />
      ))}
    </View>
  );
}

function ThemeSegment({
  option,
  active,
  onPress,
}: {
  option: { value: Theme; label: string; icon: typeof Sun };
  active: boolean;
  onPress: () => void;
}) {
  const { s, fs, fsLayout } = useScale();
  const c = useSettingsTheme();
  const { reduceMotion } = usePreferenceValues();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = reduceMotion ? (active ? 1 : 0) : withTiming(active ? 1 : 0, { duration: 180 });
  }, [active, progress, reduceMotion]);

  const segmentStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['transparent', c.accent]),
  }));

  return (
    <Animated.View style={[{ flex: 1, borderRadius: s(11) }, segmentStyle]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${option.label} theme`}
        accessibilityState={{ selected: active }}
        style={{
          minHeight: fsLayout(40),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: s(6),
          paddingVertical: s(9),
        }}
      >
        <option.icon size={fs(14)} color={active ? '#FFFFFF' : c.muted} strokeWidth={2.2} />
        <Text
          style={{
            fontSize: fs(13),
            lineHeight: fs(17),
            fontWeight: active ? '600' : '500',
            color: active ? '#FFFFFF' : c.muted,
            flexShrink: 0,
          }}
        >
          {option.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
