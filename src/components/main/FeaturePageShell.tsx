import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, XStack, YStack } from 'tamagui';
import { ChevronLeft } from '../ui/Glyph';
import { SettingsChromeButton, SettingsChromeSpacer } from '../settings/SettingsChromeButton';
import { settingsType } from '../settings/settingsFonts';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

interface FeaturePageShellProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
  /** Tab screens reserve floating tab-bar space. */
  variant?: 'tab' | 'stack';
  scroll?: boolean;
  headerExtra?: ReactNode;
  footerSlot?: ReactNode;
  children: ReactNode;
}

/** Shared chrome for main feature screens (tabs + stack). */
export function FeaturePageShell({
  title,
  subtitle,
  onBack,
  rightSlot,
  variant = 'stack',
  scroll = true,
  headerExtra,
  footerSlot,
  children,
}: FeaturePageShellProps) {
  const insets = useSafeAreaInsets();
  const { s, fs, fsLayout } = useScale();
  const c = useAppColors();
  const tabPad = variant === 'tab' ? fsLayout(100) : s(16);
  const bottomPad = insets.bottom + tabPad;

  const header = (
    <YStack
      style={{
        paddingTop: insets.top + s(8),
        paddingHorizontal: s(16),
        paddingBottom: s(10),
        gap: s(10),
      }}
    >
      <XStack
        style={{
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: s(12),
          minHeight: fsLayout(44),
        }}
      >
        {onBack ? (
          <SettingsChromeButton
            icon={ChevronLeft}
            onPress={onBack}
            accessibilityLabel="Back"
          />
        ) : (
          <View style={{ width: 0 }} />
        )}
        <YStack style={{ flex: 1, minWidth: 0, alignItems: onBack ? 'center' : 'flex-start' }}>
          <Text
            numberOfLines={1}
            style={[
              settingsType('bold'),
              {
                fontSize: onBack ? fs(17) : fs(28),
                letterSpacing: onBack ? 0 : fs(-0.6),
                color: c.ink,
                textAlign: onBack ? 'center' : 'left',
              },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={1}
              style={[
                settingsType('medium'),
                {
                  fontSize: fs(12),
                  color: c.muted,
                  textAlign: onBack ? 'center' : 'left',
                  marginTop: s(2),
                },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </YStack>
        {rightSlot ?? (onBack ? <SettingsChromeSpacer /> : null)}
      </XStack>
      {headerExtra}
    </YStack>
  );

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: s(16),
        paddingBottom: bottomPad,
        gap: s(14),
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, { paddingBottom: bottomPad }]}>{children}</View>
  );

  return (
    <YStack flex={1} style={{ backgroundColor: c.canvas }}>
      {header}
      {body}
      {footerSlot ? (
        <View
          pointerEvents="box-none"
          style={[styles.footer, { bottom: insets.bottom + (variant === 'tab' ? tabPad - s(8) : s(8)), paddingHorizontal: s(16) }]}
        >
          {footerSlot}
        </View>
      ) : null}
    </YStack>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { position: 'absolute', left: 0, right: 0, zIndex: 20 },
});
