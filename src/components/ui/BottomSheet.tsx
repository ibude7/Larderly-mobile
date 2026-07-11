import { type ElementRef, type ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from 'tamagui';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { useAppColors } from '../../hooks/useAppColors';

type BottomSheetRef = ElementRef<typeof GorhomBottomSheet>;

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  snapPoints?: Array<string | number>;
  title?: string;
  children: ReactNode;
}

export function useBottomSheet() {
  const ref = useRef<BottomSheetRef>(null);
  const open = useCallback(() => ref.current?.snapToIndex(0), []);
  const close = useCallback(() => ref.current?.close(), []);

  return useMemo(() => ({ ref, open, close }), [close, open]);
}

export default function BottomSheet({
  isOpen,
  onClose,
  snapPoints = ['50%', '90%'],
  title,
  children,
}: BottomSheetProps) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const sheet = useBottomSheet();
  const resolvedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

  useEffect(() => {
    if (isOpen) {
      sheet.open();
      return;
    }

    sheet.close();
  }, [isOpen, sheet]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
        pressBehavior="close"
        onPress={onClose}
      />
    ),
    [onClose],
  );

  const renderHandle = useCallback(
    () => (
      <View style={[styles.handleWrap, { backgroundColor: c.surface }]}>
        <View style={[styles.handleBar, { backgroundColor: c.lineStrong }]} />
      </View>
    ),
    [c.lineStrong, c.surface],
  );

  const handleChange = useCallback(
    (index: number) => {
      if (index === -1 && isOpen) onClose();
    },
    [isOpen, onClose],
  );

  return (
    <GorhomBottomSheet
      ref={sheet.ref}
      index={-1}
      snapPoints={resolvedSnapPoints}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={renderBackdrop}
      handleComponent={renderHandle}
      backgroundStyle={[styles.background, { backgroundColor: c.surface }]}
      onChange={handleChange}
    >
      {title ? (
        <View style={[styles.header, { borderBottomColor: c.line }]}>
          <Text numberOfLines={1} style={[styles.title, { color: c.ink }]}>
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[styles.closeButton, { borderColor: c.line, backgroundColor: c.surfaceMuted }]}
          >
            <Icon name="close" size={18} color={c.muted} />
          </Pressable>
        </View>
      ) : null}

      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      >
        {children}
      </BottomSheetScrollView>
    </GorhomBottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleWrap: {
    alignItems: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 8,
    paddingTop: 12,
  },
  handleBar: {
    borderRadius: 2,
    height: 4,
    width: 40,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    paddingRight: 16,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  content: {
    padding: 20,
  },
});
