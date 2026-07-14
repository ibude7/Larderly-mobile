import { useEffect } from 'react';
import { Moon, Smartphone, Sun } from '../ui/Glyph';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Button, Text } from 'tamagui';
import type { Theme } from '../../contexts/PreferencesContext';
import { usePreferenceValues } from '../../contexts/PreferenceValueContext';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { settingsFonts } from './settingsFonts';
import { SettingsGlass } from './SettingsGlass';

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

  return (
    <SettingsGlass
      interactive={false}
      elevated={false}
      radius={s(16)}
      contentStyle={{
        flexDirection: 'row',
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
    </SettingsGlass>
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
    <Animated.View style={[{ flex: 1, borderRadius: s(12) }, segmentStyle]}>
      <Button
        unstyled
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${option.label} theme`}
        accessibilityState={{ selected: active }}
        style={{
          minHeight: fsLayout(42),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: s(6),
          paddingVertical: s(10),
        }}
      >
        <option.icon size={fs(14)} color={active ? '#FFFFFF' : c.muted} strokeWidth={2.2} />
        <Text
          style={{
            fontFamily: active ? settingsFonts.semibold : settingsFonts.medium,
            fontSize: fs(13),
            lineHeight: fs(17),
            color: active ? '#FFFFFF' : c.muted,
            flexShrink: 0,
          }}
        >
          {option.label}
        </Text>
      </Button>
    </Animated.View>
  );
}
