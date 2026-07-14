import { Pressable, StyleSheet } from "react-native";
import { Text, View } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useToast, ToastType } from "../../contexts/ToastContext";
import { Icon, IconName } from "./Icon";
import { toastColors } from "../../theme";
import { useAppColors } from "../../hooks/useAppColors";
import { useTheme } from "../../hooks/useTheme";
import { useScale } from "../../theme/scale";
import { GlassView, canUseLiquidGlass } from "../../lib/liquidGlass";

const ICON: Record<ToastType, IconName> = {
  success: "success",
  error: "error",
  info: "info",
  warning: "warning",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const insets = useSafeAreaInsets();
  const c = useAppColors();
  const theme = useTheme();
  const useNativeGlass = canUseLiquidGlass();
  const { s, fs } = useScale();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: insets.top + s(8),
        left: s(12),
        right: s(12),
        zIndex: 50,
        gap: s(10),
      }}
    >
      {toasts.map((toast) => {
        const accent = toastColors(c)[toast.type];
        return (
          <Animated.View
            key={toast.id}
            entering={FadeInDown.springify().damping(18)}
          >
            <GlassView
              glassEffectStyle="regular"
              colorScheme={theme === "dark" ? "dark" : "light"}
              tintColor={theme === "dark" ? "rgba(22, 22, 24, 0.66)" : "rgba(255, 255, 255, 0.66)"}
              style={{
                borderRadius: s(22),
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: c.line,
                overflow: "hidden",
                backgroundColor: useNativeGlass ? "transparent" : c.surfaceGlass,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: s(12),
                paddingHorizontal: s(16),
                paddingVertical: s(14),
                shadowColor: "#000",
                shadowOpacity: 0.25,
                shadowRadius: s(20),
                shadowOffset: { width: 0, height: s(8) },
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: s(8),
                  bottom: s(8),
                  left: s(6),
                  width: s(4),
                  borderRadius: s(999),
                  backgroundColor: accent,
                  shadowColor: accent,
                  shadowOpacity: 0.8,
                  shadowRadius: s(6),
                }}
              />
              <View
                style={{
                  width: s(36),
                  height: s(36),
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: s(16),
                  backgroundColor: accent + "26",
                }}
              >
                <Icon name={ICON[toast.type]} size={s(20)} color={accent} />
              </View>
              <Text
                className="flex-1 font-semibold text-ink dark:text-ink-dark"
                style={{ paddingTop: s(4), fontSize: fs(14) }}
              >
                {toast.message}
              </Text>
              <Pressable
                onPress={() => removeToast(toast.id)}
                hitSlop={s(8)}
                style={{ padding: s(4) }}
              >
                <Icon name="close" size={s(16)} color={c.muted} />
              </Pressable>
            </GlassView>
          </Animated.View>
        );
      })}
    </View>
  );
}
