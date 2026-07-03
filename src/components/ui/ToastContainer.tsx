import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast, ToastType } from '../../contexts/ToastContext';
import { Icon, IconName } from './Icon';
import { toastColors, colors } from '../../theme';

const ICON: Record<ToastType, IconName> = {
  success: 'success',
  error: 'error',
  info: 'info',
  warning: 'warning',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ top: insets.top + 8 }}
      className="absolute inset-x-3 z-50 gap-2.5"
    >
      {toasts.map((toast) => {
        const accent = toastColors[toast.type];
        return (
          <View
            key={toast.id}
            className="flex-row items-start gap-3 overflow-hidden rounded-[22px] border border-line bg-surface px-4 py-3.5"
            style={{
              shadowColor: '#0F172A',
              shadowOpacity: 0.18,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
              elevation: 6,
            }}
          >
            <View
              className="absolute inset-y-2 left-1.5 w-1 rounded-full"
              style={{ backgroundColor: accent }}
            />
            <View
              className="h-9 w-9 items-center justify-center rounded-2xl"
              style={{ backgroundColor: accent }}
            >
              <Icon name={ICON[toast.type]} size={20} color="#FFFFFF" />
            </View>
            <Text className="flex-1 pt-1 text-sm font-semibold leading-5 text-ink">
              {toast.message}
            </Text>
            <Pressable onPress={() => removeToast(toast.id)} hitSlop={8} className="p-1">
              <Icon name="close" size={16} color={colors.muted} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
