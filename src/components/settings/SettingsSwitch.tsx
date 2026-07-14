import { useEffect } from 'react';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Button } from 'tamagui';
import { usePreferenceValues } from '../../contexts/PreferenceValueContext';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

interface SettingsSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function SettingsSwitch({ value, onValueChange, disabled, accessibilityLabel }: SettingsSwitchProps) {
  const { s } = useScale();
  const c = useSettingsTheme();
  const { reduceMotion } = usePreferenceValues();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = reduceMotion ? (value ? 1 : 0) : withTiming(value ? 1 : 0, { duration: 180 });
  }, [value, progress, reduceMotion]);

  const trackWidth = s(48);
  const trackHeight = s(28);
  const thumbSize = s(22);
  const pad = s(3);

  const trackAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [c.surfaceMuted, c.accent]),
  }));

  const thumbTranslate = useDerivedValue(() => progress.value * (trackWidth - thumbSize - pad * 2));

  const thumbAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbTranslate.value }],
  }));

  return (
    <Button
      unstyled
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync();
        onValueChange(!value);
      }}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View
        style={[
          {
            width: trackWidth,
            height: trackHeight,
            borderRadius: trackHeight / 2,
            padding: pad,
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: value ? c.accentLine : c.line,
          },
          trackAnimStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              backgroundColor: '#FFFFFF',
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: s(3),
              shadowOffset: { width: 0, height: s(1) },
            },
            thumbAnimStyle,
          ]}
        />
      </Animated.View>
    </Button>
  );
}
