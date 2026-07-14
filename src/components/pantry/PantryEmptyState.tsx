import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'tamagui';
import { GlassButton } from '../landing/GlassButton';
import { SettingsGlass } from '../settings/SettingsGlass';
import { settingsType } from '../settings/settingsFonts';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

interface PantryEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  hints?: string[];
}

const DISPLAY = Platform.select({
  ios: 'System',
  default: 'Fraunces_600SemiBold',
})!;

/** Editorial empty — one glass card, warm CTA, optional voice secondary. */
export function PantryEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  hints,
}: PantryEmptyStateProps) {
  const { s, fs } = useScale();
  const c = useAppColors();

  return (
    <View style={[styles.root, { paddingHorizontal: s(20) }]} testID="pantry-empty">
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
            styles.heroMark,
            {
              width: s(72),
              height: s(72),
              borderRadius: s(24),
              backgroundColor: `${c.primary}18`,
            },
          ]}
        >
          <Text style={{ fontSize: fs(34) }}>🫙</Text>
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

        {hints && hints.length > 0 ? (
          <View style={[styles.hints, { gap: s(8), marginTop: s(2) }]}>
            {hints.map((hint) => (
              <View
                key={hint}
                style={[
                  styles.hint,
                  {
                    paddingHorizontal: s(12),
                    paddingVertical: s(7),
                    borderRadius: s(999),
                    backgroundColor: c.surfaceMuted,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: c.glassLine,
                  },
                ]}
              >
                <Text style={[settingsType('medium'), { fontSize: fs(12), color: c.inkSoft }]}>
                  {hint}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {actionLabel && onAction ? (
          <View style={{ width: '100%', marginTop: s(6) }}>
            <GlassButton label={actionLabel} variant="amber" showArrow onPress={onAction} />
          </View>
        ) : null}

        {secondaryLabel && onSecondary ? (
          <Pressable onPress={onSecondary} hitSlop={10} accessibilityRole="button">
            <Text
              style={[
                settingsType('semibold'),
                { fontSize: fs(14), color: c.primary, paddingVertical: s(4) },
              ]}
            >
              {secondaryLabel}
            </Text>
          </Pressable>
        ) : null}
      </SettingsGlass>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hints: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  hint: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
