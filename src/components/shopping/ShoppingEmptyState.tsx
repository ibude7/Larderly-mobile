import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'tamagui';
import { GlassButton } from '../landing/GlassButton';
import { SettingsGlass } from '../settings/SettingsGlass';
import { settingsType } from '../settings/settingsFonts';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

const DISPLAY = Platform.select({
  ios: 'System',
  default: 'Fraunces_600SemiBold',
})!;

interface ShoppingEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function ShoppingEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: ShoppingEmptyStateProps) {
  const { s, fs } = useScale();
  const c = useAppColors();

  return (
    <View style={[styles.root, { paddingHorizontal: s(20) }]} testID="shopping-empty">
      <SettingsGlass
        elevated
        interactive={false}
        radius={s(28)}
        style={{ width: '100%', maxWidth: s(380) }}
        contentStyle={{
          alignItems: 'center',
          paddingHorizontal: s(22),
          paddingTop: s(26),
          paddingBottom: s(22),
          gap: s(14),
        }}
      >
        <View
          style={[
            styles.mark,
            {
              width: s(72),
              height: s(72),
              borderRadius: s(24),
              backgroundColor: `${c.primary}18`,
            },
          ]}
        >
          <Text style={{ fontSize: fs(34) }}>🛒</Text>
        </View>
        <Text
          style={{
            fontFamily: DISPLAY,
            fontWeight: Platform.OS === 'ios' ? '700' : undefined,
            fontSize: fs(26),
            lineHeight: fs(32),
            letterSpacing: fs(-0.5),
            color: c.ink,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        <Text
          style={[
            settingsType('regular'),
            {
              fontSize: fs(15),
              lineHeight: fs(22),
              color: c.muted,
              textAlign: 'center',
              maxWidth: s(280),
            },
          ]}
        >
          {description}
        </Text>
        {actionLabel && onAction ? (
          <View style={{ width: '100%', marginTop: s(6) }}>
            <GlassButton label={actionLabel} variant="amber" showArrow onPress={onAction} />
          </View>
        ) : null}
        {secondaryLabel && onSecondary ? (
          <Pressable onPress={onSecondary} hitSlop={10}>
            <Text style={[settingsType('semibold'), { fontSize: fs(14), color: c.primary }]}>
              {secondaryLabel}
            </Text>
          </Pressable>
        ) : null}
      </SettingsGlass>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  mark: { alignItems: 'center', justifyContent: 'center' },
});
