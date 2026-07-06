import { memo } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { useAppColors } from '../../hooks/useAppColors';
import { Icon, IconName } from './Icon';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  emoji?: string;
  icon?: IconName;
  count?: number;
  variant?: 'default' | 'danger' | 'success';
}

function Chip({ label, active, onPress, emoji, icon, count, variant = 'default' }: ChipProps) {
  const c = useAppColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const accentColor = variant === 'danger' ? c.danger : variant === 'success' ? c.success : c.primary;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.93, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
    >
      <Animated.View
        style={[
          animStyle,
          {
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
            backgroundColor: active ? accentColor : 'transparent',
            borderWidth: 1,
            borderColor: active ? accentColor : c.line,
          }
        ]}
      >
        {icon ? <Icon name={icon} size={14} color={active ? '#FFFFFF' : c.ink} /> : null}
        {emoji ? <Text style={{ fontSize: 13 }}>{emoji}</Text> : null}
        <Text style={{
          fontSize: 12, fontFamily: 'Outfit_700Bold',
          color: active ? '#FFFFFF' : c.muted,
          letterSpacing: 0.2,
        }}>{label}</Text>
        {count !== undefined ? (
          <Text style={{ fontSize: 10, fontFamily: 'Outfit_600SemiBold', color: active ? 'rgba(255,255,255,0.7)' : c.subtle }}>
            {count}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export default memo(Chip);
