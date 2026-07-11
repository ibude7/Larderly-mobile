import { memo } from "react";
import {
  PressableProps,
  StyleSheet,
} from "react-native";
import { Button as TamaguiButton, Spinner, Text, View, XStack } from "tamagui";
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
  const pad = size === "sm" ? styles.padSm : styles.padMd;
  const isDisabled = disabled || loading;
  const labelSize = size === "sm" ? 13 : 15;
  const iconColor = getIconColor(variant, c);
  const labelColor =
    variant === "primary" || variant === "danger"
      ? "#FFFFFF"
      : variant === "ghost"
        ? c.muted
        : c.ink;

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
    <Spinner size="small" color={iconColor} />
  ) : (
    <>
      {icon && (
        <View>
          <Icon name={icon} size={18} color={iconColor} />
        </View>
      )}
      <Text
        style={{ fontSize: labelSize, color: labelColor, fontFamily: "Outfit_700Bold" }}
      >
        {label}
      </Text>
    </>
  );

  return (
    <Animated.View style={[animatedStyle, primaryGlow, full && styles.full]}>
      <TamaguiButton
        unstyled
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
          pad,
          {
            opacity: isDisabled ? 0.55 : 1,
            backgroundColor,
            borderColor,
            overflow: "hidden",
          },
          full && styles.full,
        ]}
        className={className}
      >
        <XStack style={styles.content}>
          {content}
        </XStack>
      </TamaguiButton>
    </Animated.View>
  );
}

export default memo(Button);

const styles = StyleSheet.create({
  full: {
    width: "100%",
  },
  button: {
    borderWidth: 1.5,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  padSm: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  padMd: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
});
