import type { ReactNode } from 'react';
import { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { X } from '../ui/Glyph';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text, View, XStack, YStack } from 'tamagui';
import { usePreferenceValues } from '../../contexts/PreferenceValueContext';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { SettingsGlass, canUseSettingsNativeGlass } from './SettingsGlass';
import { SettingsThemeScope } from './SettingsThemeScope';
import { settingsFonts } from './settingsFonts';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Fraction of window height (default 0.72). */
  maxHeightRatio?: number;
}

/** Settings picker — Expo liquid glass panel. */
export function SettingsSheet({
  isOpen,
  onClose,
  title,
  children,
  maxHeightRatio = 0.72,
}: SettingsSheetProps) {
  const insets = useSafeAreaInsets();
  const { s, fs, fsLayout, height } = useScale();
  const c = useSettingsTheme();
  const useNativeGlass = canUseSettingsNativeGlass();
  const { reduceMotion } = usePreferenceValues();
  const sheetOffset = Math.min(height * 0.35, s(280));
  const translateY = useSharedValue(sheetOffset);
  const opacity = useSharedValue(0.02);
  const topRadius = s(24);

  useEffect(() => {
    if (isOpen) {
      // Never start at opacity 0 — kills liquid glass on iOS 26.1+.
      translateY.value = sheetOffset;
      opacity.value = 0.02;
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
      opacity.value = 0.02;
    } else {
      translateY.value = withTiming(sheetOffset, { duration: 160 });
      opacity.value = withTiming(0.02, { duration: 140 });
    }
  }, [isOpen, opacity, reduceMotion, sheetOffset, translateY]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SettingsThemeScope>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.root}
        >
          <Animated.View style={[StyleSheet.absoluteFill, scrimStyle]}>
            <Button
              unstyled
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
              onPress={onClose}
              style={StyleSheet.absoluteFill}
            >
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: c.isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.2)',
                  },
                ]}
              />
            </Button>
          </Animated.View>

          <Animated.View
            style={[
              sheetStyle,
              {
                maxHeight: height * maxHeightRatio,
                paddingBottom: Math.max(insets.bottom, s(16)),
              },
            ]}
          >
            <SettingsGlass
              radius={topRadius}
              interactive
              glassStyle="regular"
              style={{
                borderTopLeftRadius: topRadius,
                borderTopRightRadius: topRadius,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
            >
              <YStack style={{ alignItems: 'center', paddingTop: s(10), paddingBottom: s(4) }}>
                <View
                  style={{
                    width: s(36),
                    height: s(4),
                    borderRadius: s(2),
                    backgroundColor: c.tint(c.ink, 0.18),
                  }}
                />
              </YStack>
              <XStack
                style={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: s(16),
                  paddingTop: s(8),
                  paddingBottom: s(12),
                  minHeight: fsLayout(48),
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: c.line,
                }}
              >
                <Text
                  flex={1}
                  style={{
                    fontFamily: settingsFonts.semibold,
                    fontSize: fs(16),
                    lineHeight: fs(21),
                    color: c.ink,
                    flexShrink: 0,
                  }}
                >
                  {title}
                </Text>
                <Button
                  unstyled
                  onPress={onClose}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  pressStyle={{ opacity: 0.7 }}
                  style={{
                    width: s(34),
                    height: s(34),
                    borderRadius: s(17),
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    backgroundColor: useNativeGlass ? 'transparent' : c.surfaceMuted,
                  }}
                >
                  <X size={fs(16)} color={c.ink} strokeWidth={2.2} />
                </Button>
              </XStack>
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
            </SettingsGlass>
          </Animated.View>
        </KeyboardAvoidingView>
      </SettingsThemeScope>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
