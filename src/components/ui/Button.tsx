import { memo } from "react";
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  PressableProps,
  StyleSheet,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Icon, IconName } from "./Icon";
import { useAppColors } from "../../hooks/useAppColors";
import type { AppColors } from "../../theme";
import { useHaptics } from "../../hooks/useHaptics";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  /** Stretch to fill the parent width. */
  full?: boolean;
  size?: "sm" | "md";
  className?: string;
  hitSlop?: PressableProps["hitSlop"];
}

const LABEL: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-ink dark:text-ink-dark",
  ghost: "text-muted dark:text-muted-dark",
  danger: "text-white",
  outline: "text-ink dark:text-ink-dark",
};

const SPRING = { damping: 14, stiffness: 160 };

function getIconColor(variant: Variant, c: AppColors): string {
  switch (variant) {
    case "primary":
    case "danger":
      return "#FFFFFF";
    case "secondary":
    case "outline":
      return c.ink;
    case "ghost":
      return c.muted;
  }
}

function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled = false,
  loading = false,
  full = false,
  size = "md",
  className = "",
  hitSlop,
}: ButtonProps) {
  const c = useAppColors();
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const pad = size === "sm" ? "px-4 py-2" : "px-6 py-3.5";
  const isDisabled = disabled || loading;
  const labelSize = size === "sm" ? 13 : 15;
  const iconColor = getIconColor(variant, c);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const primaryGlow =
    (variant === "primary" || variant === "danger") && !isDisabled
      ? {
          shadowColor: variant === "danger" ? c.danger : c.ink,
          shadowOpacity: 0.14,
          shadowRadius: 0,
          shadowOffset: { width: 4, height: 4 as const },
          elevation: 4,
        }
      : undefined;

  const backgroundColor =
    variant === "primary"
      ? c.ink
      : variant === "danger"
        ? c.danger
        : variant === "secondary"
          ? c.surface
          : variant === "outline"
            ? "transparent"
            : "transparent";

  const borderColor = variant === "ghost" ? "transparent" : c.lineStrong;

  const content = loading ? (
    <ActivityIndicator size={18} color={iconColor} />
  ) : (
    <>
      {icon && (
        <View>
          <Icon name={icon} size={18} color={iconColor} />
        </View>
      )}
      <Text
        style={{ fontSize: labelSize }}
        className={`font-bold ${LABEL[variant]}`}
      >
        {label}
      </Text>
    </>
  );

  return (
    <Animated.View
      style={[animatedStyle, primaryGlow]}
      className={full ? "w-full" : undefined}
    >
      <Pressable
        onPress={() => {
          haptics.tap();
          onPress();
        }}
        onPressIn={() => {
          if (!isDisabled) scale.value = withSpring(0.94, SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING);
        }}
        disabled={isDisabled}
        hitSlop={hitSlop}
        style={[
          styles.button,
          {
            opacity: isDisabled ? 0.55 : 1,
            backgroundColor,
            borderColor,
            overflow: "hidden",
          },
        ]}
        className={`flex-row items-center justify-center gap-2 rounded-field ${pad} ${
          full ? "w-full" : ""
        } ${className}`}
      >
        {content}
      </Pressable>
    </Animated.View>
  );
}

export default memo(Button);

const styles = StyleSheet.create({
  button: {
    borderWidth: 1.5,
  },
});
