import { ReactNode, useEffect } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Icon } from './Icon';
import { BlurView } from 'expo-blur';
import { useAppColors } from '../../hooks/useAppColors';
import { useTheme } from '../../hooks/useTheme';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Wrap children in a scroll view (default). Set false when the body
   * manages its own scrolling (e.g. a chat list). */
  scroll?: boolean;
  /** Prevent tapping the scrim from closing (destructive confirmations). */
  dismissable?: boolean;
}

/**
 * Bottom-sheet style modal. Replaces the web Modal's DOM portal + focus-trap +
 * body-scroll-lock with a native RN Modal, which handles the hardware back
 * button (Android) and focus management for free.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  scroll = true,
  dismissable = true,
}: ModalProps) {
  const c = useAppColors();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateY.value = 300;
      opacity.value = 0;
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withSpring(1, { damping: 20, stiffness: 200 });
    }
  }, [isOpen, opacity, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissable ? onClose : undefined}
        >
          <BlurView intensity={15} tint={theme} style={StyleSheet.absoluteFill} />
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full"
        >
          <Animated.View style={sheetStyle}>
            <BlurView
              intensity={theme === 'dark' ? 75 : 80}
              tint={theme}
              style={{
                borderTopLeftRadius: 36,
                borderTopRightRadius: 36,
                borderWidth: 1,
                borderBottomWidth: 0,
                borderColor: c.line,
                overflow: 'hidden',
                maxHeight: '92%',
                paddingBottom: insets.bottom,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: c.muted,
                  alignSelf: 'center',
                  marginTop: 12,
                  marginBottom: 8,
                }}
              />
              <View className="flex-row items-center justify-between border-b border-line dark:border-line-dark px-5 pb-4">
                <Text numberOfLines={1} className="flex-1 pr-4 font-display text-xl text-ink dark:text-ink-dark">
                  {title}
                </Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={8}
                  className="h-10 w-10 items-center justify-center rounded-2xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark"
                >
                  <Icon name="close" size={18} color={c.muted} />
                </Pressable>
              </View>
              {scroll ? (
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ padding: 20 }}
                  showsVerticalScrollIndicator={false}
                >
                  {children}
                </ScrollView>
              ) : (
                children
              )}
            </BlurView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
}
