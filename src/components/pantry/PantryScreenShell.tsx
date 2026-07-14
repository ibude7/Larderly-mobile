import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, XStack, YStack } from 'tamagui';
import { SettingsChromeButton, SettingsChromeSpacer } from '../settings/SettingsChromeButton';
import { settingsType } from '../settings/settingsFonts';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

interface PantryScreenShellProps {
  title: string;
  subtitle?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  searchSlot?: ReactNode;
  filterSlot?: ReactNode;
  footerSlot?: ReactNode;
  children: ReactNode;
}

/**
 * Tab chrome — left title + clustered actions (Settings hub rhythm).
 */
export function PantryScreenShell({
  title,
  subtitle,
  leftSlot,
  rightSlot,
  searchSlot,
  filterSlot,
  footerSlot,
  children,
}: PantryScreenShellProps) {
  const insets = useSafeAreaInsets();
  const { s, fs, fsLayout } = useScale();
  const c = useAppColors();
  const tabPad = fsLayout(100);

  return (
    <YStack flex={1} style={{ backgroundColor: c.canvas }}>
      <YStack
        style={{
          paddingTop: insets.top + s(8),
          paddingHorizontal: s(16),
          paddingBottom: s(6),
          gap: s(12),
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
          <YStack style={{ flex: 1, minWidth: 0, gap: s(2) }}>
            {leftSlot ? (
              <XStack style={{ alignItems: 'center', gap: s(10) }}>
                {leftSlot}
                <Text
                  style={[
                    settingsType('bold'),
                    {
                      fontSize: fs(28),
                      letterSpacing: fs(-0.6),
                      color: c.ink,
                      flexShrink: 1,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </XStack>
            ) : (
              <Text
                style={[
                  settingsType('bold'),
                  {
                    fontSize: fs(28),
                    letterSpacing: fs(-0.6),
                    color: c.ink,
                  },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
            {subtitle ? (
              <Text
                style={[
                  settingsType('medium'),
                  { fontSize: fs(13), color: c.muted, marginLeft: leftSlot ? s(52) : 0 },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </YStack>
          {rightSlot ?? <SettingsChromeSpacer />}
        </XStack>
        {searchSlot}
        {filterSlot}
      </YStack>

      <View style={[styles.body, { paddingBottom: insets.bottom + tabPad }]}>{children}</View>

      {footerSlot ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.footer,
            {
              bottom: insets.bottom + tabPad - s(8),
              paddingHorizontal: s(16),
            },
          ]}
        >
          {footerSlot}
        </View>
      ) : null}
    </YStack>
  );
}

export { SettingsChromeButton };

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
  },
});
