import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text, XStack, YStack } from 'tamagui';
import { Check } from '../ui/Glyph';
import { SettingsGlass } from '../settings/SettingsGlass';
import { settingsType } from '../settings/settingsFonts';
import { categoryFromName } from '../../lib/categories';
import type { ShoppingListItem } from '../../types';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

interface ShoppingItemRowProps {
  item: ShoppingListItem;
  index: number;
  canEdit: boolean;
  autoLabel: string;
  onToggle: () => void;
  onPress: () => void;
}

function ShoppingItemRow({
  item,
  index,
  canEdit,
  autoLabel,
  onToggle,
  onPress,
}: ShoppingItemRowProps) {
  const { s, fs } = useScale();
  const c = useAppColors();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const cat = categoryFromName(item.category || item.name);
  const checked = item.is_checked;
  const checkSize = s(26);

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 10) * 32)
        .springify()
        .damping(17)}
      style={pressStyle}
    >
      <Pressable
        onPress={canEdit ? onToggle : onPress}
        onLongPress={onPress}
        delayLongPress={280}
        onPressIn={() => {
          scale.value = withSpring(0.985, { damping: 18, stiffness: 280 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 16, stiffness: 260 });
        }}
        testID={`shopping-item-${item.id}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        <SettingsGlass
          elevated
          interactive={false}
          radius={s(18)}
          contentStyle={{
            paddingHorizontal: s(12),
            paddingVertical: s(12),
          }}
          style={checked ? { opacity: 0.72 } : undefined}
        >
          <XStack style={{ alignItems: 'center', gap: s(12) }}>
            <View
              style={[
                styles.check,
                {
                  width: checkSize,
                  height: checkSize,
                  borderRadius: checkSize / 2,
                  borderColor: checked ? c.primary : c.glassLine,
                  backgroundColor: checked ? c.primary : 'transparent',
                },
              ]}
            >
              {checked ? <Check size={fs(14)} color="#FFF" strokeWidth={2.8} /> : null}
            </View>

            <View
              style={[
                styles.thumb,
                {
                  width: s(40),
                  height: s(40),
                  borderRadius: s(12),
                  backgroundColor: `${cat.color}28`,
                },
              ]}
            >
              <Text style={{ fontSize: fs(18) }}>{cat.emoji}</Text>
            </View>

            <YStack style={{ flex: 1, minWidth: 0, gap: s(3) }}>
              <Text
                numberOfLines={1}
                style={[
                  settingsType('semibold'),
                  {
                    fontSize: fs(15.5),
                    color: checked ? c.muted : c.ink,
                    letterSpacing: fs(-0.2),
                    textDecorationLine: checked ? 'line-through' : 'none',
                  },
                ]}
              >
                {item.name}
              </Text>
              <Text
                numberOfLines={1}
                style={[settingsType('regular'), { fontSize: fs(12), color: c.muted }]}
              >
                {formatQty(item.quantity)} {item.unit}
                {item.category ? ` · ${cat.name}` : ''}
                {item.is_auto_generated ? ` · ${autoLabel}` : ''}
              </Text>
            </YStack>

            {item.estimatedPrice && item.estimatedPrice > 0 ? (
              <Text style={[settingsType('medium'), { fontSize: fs(13), color: c.inkSoft }]}>
                {formatMoney(item.estimatedPrice * item.quantity)}
              </Text>
            ) : null}
          </XStack>
        </SettingsGlass>
      </Pressable>
    </Animated.View>
  );
}

function formatQty(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}

const styles = StyleSheet.create({
  check: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  thumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(ShoppingItemRow);
