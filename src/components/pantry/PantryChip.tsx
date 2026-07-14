import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from 'tamagui';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';
import { settingsType } from '../settings/settingsFonts';

interface PantryChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  count?: number;
}

/** Soft Settings-style filter chip — accent wash when selected, not solid fill. */
function PantryChip({ label, selected, onPress, count }: PantryChipProps) {
  const { s, fs, fsLayout } = useScale();
  const c = useAppColors();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const showCount = typeof count === 'number' && count > 0;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 16, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 240 });
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Animated.View
        style={[
          anim,
          styles.chip,
          {
            minHeight: fsLayout(36),
            paddingHorizontal: s(14),
            paddingVertical: s(8),
            gap: s(6),
            borderRadius: s(999),
            borderWidth: StyleSheet.hairlineWidth * 1.5,
            borderColor: selected ? `${c.primary}66` : c.glassLine,
            backgroundColor: selected ? `${c.primary}1F` : c.surfaceMuted,
          },
        ]}
      >
        <Text
          style={[
            settingsType(selected ? 'semibold' : 'medium'),
            {
              fontSize: fs(13),
              color: selected ? c.primary : c.inkSoft,
            },
          ]}
        >
          {label}
        </Text>
        {showCount ? (
          <View
            style={[
              styles.count,
              {
                paddingHorizontal: s(6),
                minWidth: s(20),
                borderRadius: s(999),
                backgroundColor: selected ? `${c.primary}33` : `${c.ink}14`,
              },
            ]}
          >
            <Text
              style={[
                settingsType('semibold'),
                { fontSize: fs(11), color: selected ? c.primary : c.muted },
              ]}
            >
              {count}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,
  },
});

export default memo(PantryChip);
