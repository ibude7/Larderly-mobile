import { useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence 
} from 'react-native-reanimated';
import AppLogo from '../components/ui/AppLogo';
import { useAppColors } from '../hooks/useAppColors';

const { width: screenWidth } = Dimensions.get('window');

export default function LoadingScreen() {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  
  const scale = useSharedValue(1);
  const lineWidth = useSharedValue(0);

  useEffect(() => {
    // Pulse animation for logo
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 800 }),
        withTiming(1.0, { duration: 800 })
      ),
      -1,
      true
    );

    // Progress line animation
    lineWidth.value = withTiming(screenWidth * 0.6, { duration: 2000 });
  }, [scale, lineWidth]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    alignItems: 'center',
    justifyContent: 'center',
  }));

  const lineStyle = useAnimatedStyle(() => ({
    width: lineWidth.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: c.canvas }]}>
      {/* Background Orbs */}
      <View 
        style={[
          styles.orangeOrb, 
          { backgroundColor: c.primaryGlow || 'rgba(232,122,61,0.2)' }
        ]} 
      />
      <View 
        style={[
          styles.violetOrb, 
          { backgroundColor: c.violetGlow || 'rgba(139,92,246,0.2)' }
        ]} 
      />

      {/* Center Content */}
      <View style={styles.centerContent}>
        <Animated.View style={logoStyle}>
          <AppLogo size="lg" showWordmark={false} />
        </Animated.View>
        <Text style={[styles.wordmark, { color: c.ink }]}>Larderly</Text>
        
        <View style={[styles.lineTrack, { backgroundColor: 'transparent' }]}>
          <Animated.View 
            style={[
              styles.lineFill, 
              { backgroundColor: c.primary },
              lineStyle
            ]} 
          />
        </View>
      </View>

      {/* Bottom Tagline */}
      <Text 
        style={[
          styles.tagline, 
          { color: c.muted, bottom: insets.bottom + 32 }
        ]}
      >
        Your pantry, organized
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orangeOrb: {
    width: 300,
    height: 300,
    borderRadius: 150,
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
  },
  violetOrb: {
    width: 150,
    height: 150,
    borderRadius: 75,
    position: 'absolute',
    bottom: 100,
    right: 20,
  },
  centerContent: {
    alignItems: 'center',
  },
  wordmark: {
    fontSize: 36,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: -1,
    marginTop: 16,
  },
  lineTrack: {
    height: 2,
    marginTop: 24,
    alignItems: 'center',
  },
  lineFill: {
    height: 2,
    borderRadius: 1,
  },
  tagline: {
    position: 'absolute',
    fontSize: 14,
    width: '100%',
    textAlign: 'center',
  }
});
