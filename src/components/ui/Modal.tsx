import { ReactNode } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { colors } from '../../theme';

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
  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/50"
          onPress={dismissable ? onClose : undefined}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full"
        >
          <SafeAreaView
            edges={['bottom']}
            className="max-h-[92%] overflow-hidden rounded-t-[32px] border border-line bg-surface"
          >
            <View className="flex-row items-center justify-between border-b border-line px-5 py-4">
              <View className="flex-1 pr-4">
                <Text className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                  Larderly
                </Text>
                <Text numberOfLines={1} className="text-lg font-bold text-ink">
                  {title}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                className="h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface"
              >
                <Icon name="close" size={18} color={colors.muted} />
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
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
}
