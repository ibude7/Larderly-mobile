import React, { useEffect } from 'react';
import { TextInput, StyleProp, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';

const AnimatedTextComponent = Animated.createAnimatedComponent(TextInput);

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  formatFn?: (n: number) => string;
}

export default function AnimatedNumber({
  value,
  duration = 600,
  style,
  formatFn,
}: AnimatedNumberProps) {
  const animatedValue = useSharedValue(value);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration });
  }, [value, duration]);

  const formattedValue = useDerivedValue(() => {
    return formatFn ? formatFn(animatedValue.value) : Math.round(animatedValue.value).toString();
  });

  const animatedProps = useAnimatedProps(() => {
    return {
      text: formattedValue.value,
    } as any;
  });

  return (
    <AnimatedTextComponent
      underlineColorAndroid="transparent"
      editable={false}
      style={[style, { padding: 0 }]}
      animatedProps={animatedProps}
      value={formatFn ? formatFn(value) : Math.round(value).toString()}
    />
  );
}
