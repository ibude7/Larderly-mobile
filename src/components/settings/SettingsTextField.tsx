import { useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { Eye, EyeOff } from '../ui/Glyph';
import { Button, Text, XStack, YStack } from 'tamagui';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { SettingsFieldLabel } from './SettingsFieldLabel';
import { settingsFonts } from './settingsFonts';

interface SettingsTextFieldProps extends TextInputProps {
  label: string;
  hint?: string;
  allowPasswordReveal?: boolean;
}

export function SettingsTextField({
  label,
  hint,
  allowPasswordReveal = false,
  secureTextEntry,
  multiline,
  editable = true,
  ...inputProps
}: SettingsTextFieldProps) {
  const { s, fs, fsLayout } = useScale();
  const c = useSettingsTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isSecure = Boolean(secureTextEntry && !revealed);

  return (
    <YStack style={{ gap: s(7), opacity: editable ? 1 : 0.72 }}>
      <SettingsFieldLabel>{label}</SettingsFieldLabel>
      <XStack
        style={{
          minHeight: fsLayout(multiline ? 76 : 50),
          alignItems: multiline ? 'flex-start' : 'center',
          borderRadius: s(16),
          borderWidth: focused ? 1.5 : 1,
          borderColor: focused ? c.accent : c.lineStrong,
          backgroundColor: editable ? c.surfaceMuted : c.surface,
          paddingHorizontal: s(12),
        }}
      >
        <TextInput
          {...inputProps}
          editable={editable}
          multiline={multiline}
          secureTextEntry={isSecure}
          placeholderTextColor={c.muted}
          selectionColor={c.accent}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            paddingVertical: s(12),
            fontSize: fs(15),
            lineHeight: fs(20),
            color: c.ink,
            fontFamily: settingsFonts.regular,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
        />
        {allowPasswordReveal ? (
          <Button
            unstyled
            onPress={() => setRevealed((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={8}
            style={{
              minWidth: fsLayout(36),
              minHeight: fsLayout(36),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {revealed ? (
              <EyeOff size={fs(18)} color={c.ink} strokeWidth={2} />
            ) : (
              <Eye size={fs(18)} color={c.ink} strokeWidth={2} />
            )}
          </Button>
        ) : null}
      </XStack>
      {hint ? (
        <Text
          style={{
            fontFamily: settingsFonts.regular,
            fontSize: fs(12),
            lineHeight: fs(17),
            color: c.muted,
            flexShrink: 0,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </YStack>
  );
}
