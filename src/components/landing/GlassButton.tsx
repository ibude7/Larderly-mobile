import { Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { ChevronRight } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { canUseLiquidGlass } from '../../lib/liquidGlass';

interface GlassButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'dark' | 'amber';
  showArrow?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SPRING = { damping: 18, stiffness: 280 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassButton({ label, onPress, variant = 'dark', showArrow = false, style }: GlassButtonProps) {
  const scale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isAmber = variant === 'amber';
  const useNativeGlass = canUseLiquidGlass();
  const glassContent = (
    <>
      <View pointerEvents="none" style={styles.specularLine} />
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        {showArrow ? <ChevronRight size={19} color="#FFFFFF" strokeWidth={2.4} /> : null}
      </View>
    </>
  );

  return (
    <Animated.View style={[styles.shell, pressStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.978, SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING);
        }}
        style={styles.pressable}
      >
        {useNativeGlass ? (
          <GlassView
            glassEffectStyle="regular"
            colorScheme="dark"
            tintColor={isAmber ? 'rgba(194, 102, 45, 0.42)' : 'rgba(46, 43, 38, 0.34)'}
            isInteractive
            style={[styles.glass, styles.nativeGlass, isAmber && styles.nativeGlassAmber]}
          >
            {glassContent}
          </GlassView>
        ) : (
          <BlurView intensity={Platform.OS === 'ios' ? 40 : 32} tint="dark" style={[styles.glass, isAmber && styles.glassAmber]}>
            {glassContent}
          </BlurView>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    borderRadius: 999,
    shadowColor: '#101010',
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  pressable: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  glass: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 28,
    minHeight: 56,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#2E2B26',
  },
  glassAmber: {
    backgroundColor: '#C2662D',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nativeGlass: {
    backgroundColor: 'transparent',
  },
  nativeGlassAmber: {
    borderColor: 'rgba(255,255,255,0.24)',
  },
  specularLine: {
    position: 'absolute',
    top: 1,
    left: 20,
    right: 20,
    height: 1,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Outfit_600SemiBold',
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: -0.35,
  },
});
