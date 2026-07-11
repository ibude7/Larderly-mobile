import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useScale } from '../../theme/scale';
import { landing, landingFonts as SF } from '../../theme/landing';
import { useAccent } from '../../theme/accent';
import type { AuthEntryMode } from '../../navigation/authContent';

interface AuthModeSwitchProps {
  mode: AuthEntryMode;
  onChange: (mode: AuthEntryMode) => void;
  disabled?: boolean;
}

export function AuthModeSwitch({ mode, onChange, disabled = false }: AuthModeSwitchProps) {
  const { s, fs } = useScale();
  const accent = useAccent();

  const select = (next: AuthEntryMode) => {
    if (disabled || next === mode) return;
    Haptics.selectionAsync();
    onChange(next);
  };

  return (
    <View
      style={[
        styles.track,
        {
          borderRadius: s(999),
          padding: s(3),
          backgroundColor: 'rgba(46,43,38,0.06)',
        },
      ]}
    >
      {(['signin', 'signup'] as const).map((key) => {
        const active = mode === key;
        return (
          <Pressable
            key={key}
            onPress={() => select(key)}
            disabled={disabled}
            style={[
              styles.segment,
              {
                borderRadius: s(999),
                paddingVertical: s(8),
                paddingHorizontal: s(12),
                backgroundColor: active ? landing.surface : 'transparent',
                borderWidth: active ? StyleSheet.hairlineWidth : 0,
                borderColor: active ? landing.line : 'transparent',
              },
            ]}
          >
            <Text
              style={{
                fontSize: fs(12),
                lineHeight: fs(16),
                fontFamily: active ? SF.semibold : SF.regular,
                fontWeight: Platform.OS === 'ios' ? (active ? '600' : '400') : undefined,
                color: active ? landing.ink : landing.muted,
                textAlign: 'center',
              }}
            >
              {key === 'signin' ? 'Sign in' : 'Create account'}
            </Text>
            {active ? (
              <View
                style={{
                  marginTop: s(4),
                  alignSelf: 'center',
                  width: s(16),
                  height: s(2),
                  borderRadius: 1,
                  backgroundColor: accent,
                }}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    flexDirection: 'row',
    flexShrink: 0,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
  },
});
