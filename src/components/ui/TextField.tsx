import { useState, forwardRef } from 'react';
import {
  TextInput,
  TextInputProps,
  StyleSheet,
  Platform,
} from 'react-native';
import { Button as TamaguiButton, Text, View, XStack } from 'tamagui';
import { Icon, IconName } from './Icon';
import { useAppColors } from '../../hooks/useAppColors';
import { useLandingColors } from '../../hooks/useLandingColors';
import { landingFonts as SF } from '../../theme/landing';
import { useAccent } from '../../theme/accent';
import { useScale } from '../../theme/scale';

interface TextFieldProps extends TextInputProps {
  label?: string;
  icon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  hint?: string;
  error?: string;
  success?: boolean;
  containerClassName?: string;
  variant?: 'default' | 'landing';
}

const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    icon,
    rightIcon,
    onRightIconPress,
    hint,
    error,
    success,
    containerClassName = '',
    variant = 'default',
    ...inputProps
  },
  ref,
) {
  const c = useAppColors();
  const lc = useLandingColors();
  const { s, fs } = useScale();
  const accent = useAccent();
  const isLanding = variant === 'landing';
  const [focused, setFocused] = useState(false);

  if (isLanding) {
    const lineColor = error
      ? lc.danger
      : success
        ? lc.success
        : focused
          ? accent
          : lc.line;
    const iconColor = focused && !error ? accent : lc.muted;

    return (
      <View>
        {label ? (
          <Text
            style={[
              styles.landingLabel,
              {
                fontSize: fs(11),
                letterSpacing: fs(1.2),
                marginBottom: s(8),
                color: lc.muted,
              },
            ]}
          >
            {label}
          </Text>
        ) : null}
        <XStack
          style={[
            styles.landingField,
            {
              borderBottomColor: lineColor,
              borderBottomWidth: focused || error ? 1.5 : StyleSheet.hairlineWidth,
              paddingBottom: s(10),
              gap: s(10),
            },
          ]}
        >
          {icon ? <Icon name={icon} size={fs(18)} color={iconColor} /> : null}
          <TextInput
            ref={ref}
            placeholderTextColor={lc.muted}
            style={[
              styles.landingInput,
              {
                fontSize: fs(17),
                lineHeight: fs(24),
                color: lc.ink,
                fontFamily: SF.regular,
                fontWeight: Platform.OS === 'ios' ? '400' : undefined,
              },
            ]}
            onFocus={(e) => {
              setFocused(true);
              inputProps.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              inputProps.onBlur?.(e);
            }}
            {...inputProps}
          />
          {rightIcon ? (
            <TamaguiButton unstyled onPress={onRightIconPress} hitSlop={10} style={{ padding: s(2) }}>
              <Icon name={rightIcon} size={fs(18)} color={lc.muted} />
            </TamaguiButton>
          ) : success && !error ? (
            <Icon name="success" size={fs(16)} color={lc.success} />
          ) : null}
        </XStack>
        {error ? (
          <Text style={{ color: lc.danger, fontSize: fs(12), marginTop: s(6) }}>
            {error}
          </Text>
        ) : null}
        {hint && !error ? (
          <Text
            style={{
              color: lc.muted,
              fontSize: fs(12),
              marginTop: s(6),
              fontFamily: SF.regular,
            }}
          >
            {hint}
          </Text>
        ) : null}
      </View>
    );
  }

  const borderColor = error
    ? c.danger
    : success
      ? c.success
      : focused
        ? c.primary
        : undefined;

  return (
    <View className={containerClassName}>
      {label ? (
        <Text className="mb-2 text-xs font-bold uppercase text-muted dark:text-muted-dark">
          {label}
        </Text>
      ) : null}
      <XStack
        className="flex-row items-center rounded-field border px-3.5"
        style={[
          styles.field,
          {
            backgroundColor: c.surface,
            borderColor: borderColor ?? c.line,
            shadowColor: focused ? c.ink : 'transparent',
            shadowOpacity: focused ? 0.16 : 0,
          },
        ]}
      >
        {icon ? (
          <View className="mr-2.5">
            <Icon name={icon} size={18} color={c.muted} />
          </View>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={c.muted}
          className="flex-1 py-3.5 text-sm text-ink dark:text-ink-dark"
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          {...inputProps}
        />
        {rightIcon ? (
          <TamaguiButton unstyled onPress={onRightIconPress} hitSlop={8} className="ml-2 p-1">
            <Icon name={rightIcon} size={18} color={c.muted} />
          </TamaguiButton>
        ) : success && !error ? (
          <View className="ml-2 p-1">
            <Icon name="success" size={16} color={c.success} />
          </View>
        ) : null}
      </XStack>
      {error ? (
        <Text style={{ color: c.danger, fontSize: 12, marginTop: 6 }}>{error}</Text>
      ) : null}
      {hint ? (
        <Text className="mt-1.5 text-xs text-muted dark:text-muted-dark">{hint}</Text>
      ) : null}
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  field: {
    borderWidth: 1.5,
    shadowOffset: { width: 3, height: 3 },
    shadowRadius: 0,
  },
  landingField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  landingLabel: {
    fontFamily: SF.bold,
    fontWeight: Platform.OS === 'ios' ? '700' : undefined,
    textTransform: 'uppercase',
  },
  landingInput: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
});
