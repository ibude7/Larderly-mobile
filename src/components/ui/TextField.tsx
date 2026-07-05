import { useState, forwardRef } from 'react';
import { View, Text, TextInput, TextInputProps, Pressable } from 'react-native';
import { Icon, IconName } from './Icon';
import { useAppColors } from '../../hooks/useAppColors';

interface TextFieldProps extends TextInputProps {
  label?: string;
  icon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  hint?: string;
  error?: string;
  success?: boolean;
  containerClassName?: string;
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
    ...inputProps
  },
  ref,
) {
  const c = useAppColors();
  const [focused, setFocused] = useState(false);

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
        <Text className="mb-1.5 text-[12px] font-bold uppercase tracking-wider text-muted dark:text-[#6B6878]">
          {label}
        </Text>
      ) : null}
      <View
        className={`flex-row items-center rounded-field border bg-surface dark:bg-[#1A1A22] px-3.5 ${
          borderColor ? '' : 'border-line dark:border-[#2A2A35]'
        }`}
        style={borderColor ? { borderWidth: 1, borderColor } : undefined}
      >
        {icon ? (
          <View className="mr-2.5">
            <Icon name={icon} size={18} color={c.muted} />
          </View>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={c.muted}
          className="flex-1 py-3 text-sm text-ink dark:text-[#F0EEE9]"
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
          <Pressable onPress={onRightIconPress} hitSlop={8} className="ml-2 p-1">
            <Icon name={rightIcon} size={18} color={c.muted} />
          </Pressable>
        ) : success && !error ? (
          <View className="ml-2 p-1">
            <Icon name="success" size={16} color={c.success} />
          </View>
        ) : null}
      </View>
      {error ? (
        <Text style={{ color: c.danger, fontSize: 12, marginTop: 6 }}>{error}</Text>
      ) : null}
      {hint ? <Text className="mt-1.5 text-xs text-muted dark:text-[#6B6878]">{hint}</Text> : null}
    </View>
  );
});

export default TextField;
