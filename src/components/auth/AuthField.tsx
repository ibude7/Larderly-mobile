import { useState, forwardRef, ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Icon, IconName } from '../ui/Icon';
import { useScale } from '../../theme/scale';
import { landing, landingFonts as SF } from '../../theme/landing';
import { useAccent } from '../../theme/accent';

interface AuthFieldProps extends TextInputProps {
  label: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
}

export const AuthField = forwardRef<TextInput, AuthFieldProps>(function AuthField(
  {
    label,
    hint,
    error,
    trailing,
    rightIcon,
    onRightIconPress,
    ...inputProps
  },
  ref,
) {
  const { s, fs } = useScale();
  const accent = useAccent();
  const [focused, setFocused] = useState(false);
  const active = focused && !error;

  return (
    <View style={{ gap: s(6), width: '100%' }}>
      <View style={styles.labelRow}>
        <Text
          style={{
            fontSize: fs(13),
            lineHeight: fs(17),
            fontFamily: SF.medium,
            fontWeight: Platform.OS === 'ios' ? '500' : undefined,
            color: landing.body,
          }}
        >
          {label}
        </Text>
        {trailing}
      </View>

      <View
        style={[
          styles.inputBox,
          {
            borderRadius: s(12),
            paddingHorizontal: s(14),
            paddingVertical: s(12),
            gap: s(8),
            borderColor: error ? landing.danger : active ? accent : landing.line,
            borderWidth: active || error ? s(1.5) : StyleSheet.hairlineWidth * 2,
          },
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={landing.muted}
          style={{
            flex: 1,
            minWidth: 0,
            paddingVertical: 0,
            fontSize: fs(16),
            lineHeight: fs(22),
            fontFamily: SF.regular,
            fontWeight: Platform.OS === 'ios' ? '400' : undefined,
            color: landing.ink,
          }}
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
          <Pressable onPress={onRightIconPress} hitSlop={10}>
            <Icon name={rightIcon} size={fs(18)} color={landing.muted} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={{ fontSize: fs(12), lineHeight: fs(16), color: landing.danger }}>{error}</Text>
      ) : hint ? (
        <Text
          style={{
            fontSize: fs(12),
            lineHeight: fs(16),
            fontFamily: SF.regular,
            color: landing.muted,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: landing.surface,
  },
});
