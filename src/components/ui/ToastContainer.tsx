import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { useToast, ToastType } from '../../contexts/ToastContext';
import { Icon, IconName } from './Icon';
import { BlurView } from 'expo-blur';
import { toastColors } from '../../theme';
import { useAppColors } from '../../hooks/useAppColors';
import { useTheme } from '../../hooks/useTheme';

const ICON: Record<ToastType, IconName> = {
  success: 'success',
  error: 'error',
  info: 'info',
  warning: 'warning',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const insets = useSafeAreaInsets();
  const c = useAppColors();
  const theme = useTheme();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ top: insets.top + 8 }}
      className="absolute inset-x-3 z-50 gap-2.5"
    >
      {toasts.map((toast) => {
        const accent = toastColors(c)[toast.type];
        return (
          <Animated.View key={toast.id} entering={FadeInDown.springify().damping(18)}>
            <BlurView
              intensity={theme === 'dark' ? 75 : 80}
              tint={theme}
              style={{
                borderRadius: 22,
                borderWidth: 1,
                borderColor: c.line,
                overflow: 'hidden',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
              }}
            >
              <View
                className="absolute inset-y-2 left-1.5 w-1 rounded-full"
                style={{
                  backgroundColor: accent,
                  shadowColor: accent,
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                }}
              />
              <View
                className="h-9 w-9 items-center justify-center rounded-2xl"
                style={{ backgroundColor: accent + '26' }}
              >
                <Icon name={ICON[toast.type]} size={20} color={accent} />
              </View>
              <Text className="flex-1 pt-1 text-sm font-semibold leading-5 text-ink dark:text-[#F6F1EA]">
                {toast.message}
              </Text>
              <Pressable onPress={() => removeToast(toast.id)} hitSlop={8} className="p-1">
                <Icon name="close" size={16} color={c.muted} />
              </Pressable>
            </BlurView>
          </Animated.View>
        );
      })}
    </View>
  );
}
