import type { ReactNode } from 'react';
import { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferenceValues } from '../../contexts/PreferenceValueContext';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Settings-native picker/sheet. Uses the settings theme tokens and respects
 * reduce-motion — not the MarketOps Modal / landing chip language.
 */
export function SettingsSheet({ isOpen, onClose, title, children }: SettingsSheetProps) {
  const insets = useSafeAreaInsets();
  const { s, fs, fsLayout, height } = useScale();
  const c = useSettingsTheme();
  const { reduceMotion } = usePreferenceValues();
  const sheetOffset = Math.min(height * 0.35, s(280));
  const translateY = useSharedValue(sheetOffset);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateY.value = sheetOffset;
      opacity.value = 0;
      if (reduceMotion) {
        translateY.value = 0;
        opacity.value = 1;
      } else {
        translateY.value = withSpring(0, { damping: 22, stiffness: 240 });
        opacity.value = withTiming(1, { duration: 180 });
      }
      return;
    }
    if (reduceMotion) {
      translateY.value = sheetOffset;
      opacity.value = 0;
    } else {
      translateY.value = withTiming(sheetOffset, { duration: 160 });
      opacity.value = withTiming(0, { duration: 140 });
    }
  }, [isOpen, opacity, reduceMotion, sheetOffset, translateY]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
          <BlurView
            intensity={c.blurIntensity}
            tint={c.blurTint}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            {
              backgroundColor: c.surface,
              borderColor: c.line,
              paddingBottom: Math.max(insets.bottom, s(16)),
              maxHeight: height * 0.72,
            },
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: s(16),
              paddingTop: s(14),
              paddingBottom: s(10),
              minHeight: fsLayout(48),
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: c.line,
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: fs(16),
                lineHeight: fs(21),
                fontWeight: '600',
                color: c.ink,
                flexShrink: 0,
              }}
            >
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => ({
                width: s(32),
                height: s(32),
                borderRadius: s(16),
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: c.surfaceMuted,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <X size={fs(16)} color={c.inkSoft} strokeWidth={2.2} />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: s(16),
              paddingTop: s(14),
              paddingBottom: s(8),
            }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: 'rgba(15, 18, 22, 0.35)',
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
