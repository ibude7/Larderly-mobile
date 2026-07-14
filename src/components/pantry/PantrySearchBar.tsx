import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { Text, XStack } from 'tamagui';
import { CircleX, Search } from '../ui/Glyph';
import { settingsType } from '../settings/settingsFonts';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

interface PantrySearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onCancel: () => void;
  placeholder: string;
  cancelLabel: string;
  resultLabel?: string;
  autoFocus?: boolean;
}

/** Glass search field — icon, clear, cancel, result count. */
export function PantrySearchBar({
  value,
  onChangeText,
  onCancel,
  placeholder,
  cancelLabel,
  resultLabel,
  autoFocus = true,
}: PantrySearchBarProps) {
  const { s, fs, fsLayout } = useScale();
  const c = useAppColors();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(120)}
      layout={Layout.springify().damping(18)}
      style={{ gap: s(8) }}
    >
      <XStack style={{ alignItems: 'center', gap: s(10) }}>
        <XStack
          style={[
            styles.field,
            {
              flex: 1,
              minHeight: fsLayout(44),
              borderRadius: s(16),
              backgroundColor: c.surfaceMuted,
              borderWidth: focused ? 1.5 : StyleSheet.hairlineWidth * 1.5,
              borderColor: focused ? `${c.primary}99` : c.glassLine,
              paddingHorizontal: s(12),
              gap: s(8),
            },
          ]}
        >
          <Search size={fs(18)} color={focused ? c.primary : c.muted} strokeWidth={2.2} />
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={c.muted}
            selectionColor={c.primary}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="never"
            testID="pantry-search-input"
            accessibilityLabel={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              flex: 1,
              minWidth: 0,
              paddingVertical: s(10),
              fontSize: fs(15),
              color: c.ink,
              ...settingsType('regular'),
            }}
          />
          {value.length > 0 ? (
            <Pressable
              onPress={() => {
                onChangeText('');
                inputRef.current?.focus();
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <CircleX size={fs(18)} color={c.muted} strokeWidth={2} />
            </Pressable>
          ) : null}
        </XStack>

        <Pressable
          onPress={onCancel}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        >
          <Text style={[settingsType('semibold'), { fontSize: fs(15), color: c.primary }]}>
            {cancelLabel}
          </Text>
        </Pressable>
      </XStack>

      {resultLabel ? (
        <Text style={[settingsType('medium'), { fontSize: fs(12), color: c.muted }]}>
          {resultLabel}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
