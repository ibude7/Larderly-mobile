import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Icon, IconName } from './Icon';
import { useAppColors } from '../../hooks/useAppColors';
import { useHaptics } from '../../hooks/useHaptics';

interface ToolbarButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
}

export default function ToolbarButton({ icon, label, onPress, active, danger }: ToolbarButtonProps) {
  const c = useAppColors();
  const haptics = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const tone = danger ? c.danger : active ? c.primary : c.ink;
  const bg = active ? c.primaryGlow : c.surfaceGlass;

  return (
    <Animated.View style={[animatedStyle, { shadowColor: active ? tone : c.shadow }, styles.shadow]}>
      <Pressable
        onPress={() => {
          haptics.tap();
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.94, { damping: 16, stiffness: 260 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 220 });
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.button,
          {
            backgroundColor: bg,
            borderColor: active ? tone : c.glassLine,
          },
        ]}
      >
        <Icon name={icon} size={18} color={tone} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  shadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
});
