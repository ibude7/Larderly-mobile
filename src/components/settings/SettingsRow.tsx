import type { ComponentType, ReactNode } from 'react';
import { Children, Fragment, isValidElement } from 'react';
import { StyleSheet } from 'react-native';
import { ChevronRight } from '../ui/Glyph';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Button, Text, View, XStack, YStack } from 'tamagui';
import { usePreferenceValues } from '../../contexts/PreferenceValueContext';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { SETTINGS_ICON_STROKE, SettingsIconWell } from './SettingsIconWell';
import { settingsType } from './settingsFonts';

type RowIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface SettingsRowProps {
  icon: RowIcon;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: ReactNode;
  danger?: boolean;
  iconColor?: string;
  disabled?: boolean;
}

const SPRING = { damping: 18, stiffness: 280 };
const WELL = 38;
const H_PAD = 16;
const ICON_GAP = 14;

export function SettingsRow({
  icon: Icon,
  label,
  subtitle,
  onPress,
  trailing,
  danger,
  iconColor,
  disabled,
}: SettingsRowProps) {
  const { s, fs, fsLayout } = useScale();
  const c = useSettingsTheme();
  const { reduceMotion } = usePreferenceValues();
  const color = danger ? c.danger : iconColor ?? c.inkSoft;
  const labelColor = danger ? c.danger : c.ink;
  const scale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <XStack
      style={{
        alignItems: 'center',
        gap: s(ICON_GAP),
        paddingHorizontal: s(H_PAD),
        paddingVertical: s(10),
        opacity: disabled ? 0.45 : 1,
        minHeight: fsLayout(54),
      }}
    >
      <SettingsIconWell icon={Icon} color={color} size={WELL} iconSize={18} shape="squircle" />
      <YStack flex={1} style={{ minWidth: 0, gap: s(1) }}>
        <Text
          style={{
            ...settingsType('semibold'),
            fontSize: fs(15),
            lineHeight: fs(20),
            color: labelColor,
            flexShrink: 0,
          }}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text
            style={{
              ...settingsType('regular'),
              fontSize: fs(12.5),
              lineHeight: fs(16),
              color: c.muted,
              flexShrink: 0,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </YStack>
      {trailing !== undefined ? (
        trailing
      ) : onPress ? (
        <ChevronRight size={fs(18)} color={c.muted} strokeWidth={SETTINGS_ICON_STROKE} />
      ) : null}
    </XStack>
  );

  if (!onPress) return content;

  return (
    <Animated.View style={pressStyle}>
      <Button
        unstyled
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => {
          if (!reduceMotion) scale.value = withSpring(0.985, SPRING);
        }}
        onPressOut={() => {
          if (!reduceMotion) scale.value = withSpring(1, SPRING);
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${label}. ${subtitle}` : label}
        pressStyle={reduceMotion ? { opacity: 0.6 } : undefined}
      >
        {content}
      </Button>
    </Animated.View>
  );
}

/** Inset divider — starts at text column, not under the icon well. */
export function SettingsRowDivider() {
  const { s } = useScale();
  const c = useSettingsTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        marginLeft: s(H_PAD) + s(WELL) + s(ICON_GAP),
        marginRight: s(H_PAD),
        backgroundColor: c.line,
      }}
    />
  );
}

export function withRowDividers(children: ReactNode): ReactNode {
  const items = Children.toArray(children).filter(isValidElement);
  return items.map((child, index) => (
    <Fragment key={child.key ?? index}>
      {child}
      {index < items.length - 1 ? <SettingsRowDivider /> : null}
    </Fragment>
  ));
}
