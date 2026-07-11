import { ReactNode, useEffect } from "react";
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Icon } from "./Icon";
import { BlurView } from "expo-blur";
import { useAppColors } from "../../hooks/useAppColors";
import { useTheme } from "../../hooks/useTheme";
import { useScale } from "../../theme/scale";

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
  const { height, s, fs, fsLayout } = useScale();
  const sheetOffset = height * 0.4;
  const translateY = useSharedValue(sheetOffset);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateY.value = sheetOffset;
      opacity.value = 0;
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withSpring(1, { damping: 20, stiffness: 200 });
    }
  }, [isOpen, opacity, sheetOffset, translateY]);

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
          <BlurView
            intensity={15}
            tint={theme}
            style={StyleSheet.absoluteFill}
          />
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="w-full"
        >
          <Animated.View style={sheetStyle}>
            <BlurView
              intensity={theme === "dark" ? 75 : 80}
              tint={theme}
              style={{
                borderTopLeftRadius: s(36),
                borderTopRightRadius: s(36),
                borderWidth: StyleSheet.hairlineWidth,
                borderBottomWidth: 0,
                borderColor: c.line,
                overflow: "hidden",
                maxHeight: height - insets.top - s(16),
                paddingBottom: insets.bottom,
              }}
            >
              <View
                style={{
                  width: s(40),
                  height: s(4),
                  borderRadius: s(2),
                  backgroundColor: c.muted,
                  alignSelf: "center",
                  marginTop: s(12),
                  marginBottom: s(8),
                }}
              />
              <View
                className="flex-row items-center justify-between border-b border-line dark:border-line-dark"
                style={{
                  paddingHorizontal: s(20),
                  paddingBottom: s(16),
                  gap: s(16),
                }}
              >
                <Text
                  className="flex-1 font-display text-ink dark:text-ink-dark"
                  style={{ fontSize: fs(20), flexShrink: 1 }}
                >
                  {title}
                </Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={s(8)}
                  className="items-center justify-center border border-line bg-surface dark:border-line-dark dark:bg-surface-dark"
                  style={{
                    minWidth: fsLayout(40),
                    minHeight: fsLayout(40),
                    borderRadius: s(16),
                  }}
                >
                  <Icon name="close" size={s(18)} color={c.muted} />
                </Pressable>
              </View>
              {scroll ? (
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ padding: s(20) }}
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
