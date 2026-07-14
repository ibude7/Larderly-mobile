import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Text, XStack } from 'tamagui';
import { SettingsGlass } from '../settings/SettingsGlass';
import { settingsType } from '../settings/settingsFonts';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

interface ShoppingCheckoutBarProps {
  checkedCount: number;
  uncheckedCount: number;
  totalLabel: string;
  checkoutLabel: string;
  clearLabel: string;
  onCheckout: () => void;
  onClear: () => void;
  busy?: boolean;
}

export function ShoppingCheckoutBar({
  checkedCount,
  uncheckedCount,
  totalLabel,
  checkoutLabel,
  clearLabel,
  onCheckout,
  onClear,
  busy = false,
}: ShoppingCheckoutBarProps) {
  const { s, fs } = useScale();
  const c = useAppColors();

  if (checkedCount === 0 && uncheckedCount === 0) return null;

  return (
    <SettingsGlass
      elevated
      interactive={false}
      radius={s(22)}
      contentStyle={{
        paddingHorizontal: s(14),
        paddingVertical: s(12),
        gap: s(10),
      }}
    >
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[settingsType('semibold'), { fontSize: fs(14), color: c.ink }]}>
          {totalLabel}
        </Text>
        {checkedCount > 0 ? (
          <Pressable onPress={onClear} hitSlop={8} disabled={busy} testID="shopping-clear-checked">
            <Text style={[settingsType('medium'), { fontSize: fs(13), color: c.muted }]}>
              {clearLabel}
            </Text>
          </Pressable>
        ) : null}
      </XStack>
      {checkedCount > 0 ? (
        <Pressable
          onPress={onCheckout}
          disabled={busy}
          testID="shopping-checkout"
          style={[
            styles.cta,
            {
              backgroundColor: c.primary,
              borderRadius: s(999),
              paddingVertical: s(12),
              opacity: busy ? 0.6 : 1,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[settingsType('semibold'), { fontSize: fs(15), color: '#FFF', textAlign: 'center' }]}>
              {checkoutLabel}
            </Text>
          )}
        </Pressable>
      ) : null}
    </SettingsGlass>
  );
}

const styles = StyleSheet.create({
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
