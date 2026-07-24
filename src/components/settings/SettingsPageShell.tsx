import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search } from '../ui/Glyph';
import { Text, View, XStack, YStack } from 'tamagui';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { SettingsChromeButton, SettingsChromeSpacer } from './SettingsChromeButton';
import { SettingsThemeScope } from './SettingsThemeScope';
import { settingsType } from './settingsFonts';

interface SettingsPageShellProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  onSearch?: () => void;
  rightSlot?: ReactNode;
  /** Hub: title centered between chrome buttons. Detail: compact nav title. */
  variant?: 'hub' | 'detail';
  children: ReactNode;
}

/**
 * Settings shell — hub layout matches reference:
 * [back]   Settings   [search]
 *       subtitle
 * then scroll content (no large title below chrome).
 */
export function SettingsPageShell({
  title,
  subtitle,
  onBack,
  onSearch,
  rightSlot,
  variant = 'detail',
  children,
}: SettingsPageShellProps) {
  const insets = useSafeAreaInsets();
  const { s, fs, fsLayout } = useScale();
  const c = useSettingsTheme();
  const isHub = variant === 'hub';

  const chromeRight =
    rightSlot ??
    (onSearch ? (
      <SettingsChromeButton
        icon={Search}
        onPress={onSearch}
        accessibilityLabel="Search settings"
      />
    ) : (
      <SettingsChromeSpacer />
    ));

  return (
    <SettingsThemeScope>
      <YStack flex={1} style={{ backgroundColor: c.surfaceElevated }}>
        {isHub ? (
          <YStack
            style={{
              paddingTop: insets.top + s(6),
              paddingBottom: s(10),
              paddingHorizontal: s(16),
              gap: s(2),
            }}
          >
            <XStack
              style={{
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: fsLayout(44),
              }}
            >
              <SettingsChromeButton
                icon={ChevronLeft}
                onPress={onBack}
                accessibilityLabel="Go back"
              />
              <Text
                accessibilityRole="header"
                numberOfLines={1}
                style={{
                  ...settingsType('bold'),
                  fontSize: fs(20),
                  lineHeight: fs(26),
                  color: c.ink,
                  flexShrink: 1,
                  textAlign: 'center',
                  letterSpacing: -0.3,
                }}
              >
                {title}
              </Text>
              {chromeRight}
            </XStack>
            {subtitle ? (
              <Text
                numberOfLines={2}
                style={{
                  ...settingsType('regular'),
                  fontSize: fs(14),
                  lineHeight: fs(19),
                  color: c.muted,
                  textAlign: 'center',
                  flexShrink: 0,
                  paddingHorizontal: s(48),
                }}
              >
                {subtitle}
              </Text>
            ) : null}
          </YStack>
        ) : (
          <XStack
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: insets.top + s(6),
              paddingBottom: s(8),
              paddingHorizontal: s(16),
              minHeight: fsLayout(52),
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: c.line,
              gap: s(10),
            }}
          >
            <SettingsChromeButton
              icon={ChevronLeft}
              onPress={onBack}
              accessibilityLabel="Go back"
            />
            <YStack flex={1} style={{ minWidth: 0, gap: s(1) }}>
              <Text
                numberOfLines={1}
                style={{
                  ...settingsType('semibold'),
                  fontSize: fs(17),
                  lineHeight: fs(22),
                  color: c.ink,
                  flexShrink: 0,
                }}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  numberOfLines={2}
                  style={{
                    ...settingsType('regular'),
                    fontSize: fs(12),
                    lineHeight: fs(16),
                    color: c.muted,
                    flexShrink: 0,
                  }}
                >
                  {subtitle}
                </Text>
              ) : null}
            </YStack>
            {chromeRight}
          </XStack>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: s(16),
              paddingTop: isHub ? s(4) : s(16),
              paddingBottom: insets.bottom + s(36),
              gap: isHub ? s(12) : s(16),
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </YStack>
    </SettingsThemeScope>
  );
}
