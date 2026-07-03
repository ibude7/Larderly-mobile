import { useState, forwardRef } from 'react';
import { View, Text, TextInput, TextInputProps, Pressable } from 'react-native';
import { Icon, IconName } from './Icon';
import { colors } from '../../theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  icon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  hint?: string;
  containerClassName?: string;
}

const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, icon, rightIcon, onRightIconPress, hint, containerClassName = '', ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <View className={containerClassName}>
      {label ? (
        <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
          {label}
        </Text>
      ) : null}
      <View
        className={`flex-row items-center rounded-field border bg-surface px-3.5 ${
          focused ? 'border-primary' : 'border-line'
        }`}
      >
        {icon ? (
          <View className="mr-2.5">
            <Icon name={icon} size={18} color={colors.muted} />
          </View>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.muted}
          className="flex-1 py-3 text-sm text-ink"
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
            <Icon name={rightIcon} size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text className="mt-1.5 text-xs text-muted">{hint}</Text> : null}
    </View>
  );
});

export default TextField;
