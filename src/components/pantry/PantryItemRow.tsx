import { memo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text, XStack, YStack } from 'tamagui';
import { Minus, Plus } from '../ui/Glyph';
import { SettingsGlass } from '../settings/SettingsGlass';
import { settingsType } from '../settings/settingsFonts';
import { categoryFromName } from '../../lib/categories';
import { locationNameFromId } from '../../lib/inventoryMapper';
import type { PantryItem, StorageLocation } from '../../types';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';
import { getExpiryInfo } from './pantryExpiry';

interface PantryItemRowProps {
  item: PantryItem;
  locations: StorageLocation[];
  index: number;
  canEdit: boolean;
  selected: boolean;
  selecting: boolean;
  expiryLabel: string;
  lowLabel: string;
  onPress: () => void;
  onLongPress: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

function PantryItemRow({
  item,
  locations,
  index,
  canEdit,
  selected,
  selecting,
  expiryLabel,
  lowLabel,
  onPress,
  onLongPress,
  onIncrement,
  onDecrement,
}: PantryItemRowProps) {
  const { s, fs } = useScale();
  const c = useAppColors();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const cat = categoryFromName(item.category || item.name);
  const locName = locationNameFromId(item.location_id, locations);
  const expiry = getExpiryInfo(item.expiry_date);
  const thumb = s(48);
  const isLow = item.quantity <= item.low_stock_threshold;
  const showExpiry = expiry.tone === 'expired' || expiry.tone === 'soon';

  const pillColor =
    expiry.tone === 'expired' ? c.danger : expiry.tone === 'soon' ? c.warning : c.success;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 10) * 36)
        .springify()
        .damping(17)}
      style={pressStyle}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={320}
        onPressIn={() => {
          scale.value = withSpring(0.985, { damping: 18, stiffness: 280 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 16, stiffness: 260 });
        }}
        testID={`pantry-item-${item.id}`}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        <SettingsGlass
          elevated
          interactive={false}
          radius={s(20)}
          contentStyle={{
            paddingHorizontal: s(12),
            paddingVertical: s(11),
          }}
          style={
            selected
              ? {
                  borderWidth: StyleSheet.hairlineWidth * 2,
                  borderColor: `${c.primary}99`,
                }
              : undefined
          }
        >
          <XStack style={{ alignItems: 'center', gap: s(12) }}>
            {selecting ? (
              <View
                style={[
                  styles.check,
                  {
                    width: s(22),
                    height: s(22),
                    borderRadius: s(11),
                    borderColor: selected ? c.primary : c.glassLine,
                    backgroundColor: selected ? c.primary : 'transparent',
                  },
                ]}
              >
                {selected ? (
                  <Text style={[settingsType('bold'), { color: '#FFF', fontSize: fs(12) }]}>✓</Text>
                ) : null}
              </View>
            ) : null}

            <View
              style={[
                styles.thumb,
                {
                  width: thumb,
                  height: thumb,
                  borderRadius: s(14),
                  backgroundColor: `${cat.color}28`,
                },
              ]}
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.thumbImage} />
              ) : (
                <Text style={{ fontSize: fs(22) }}>{cat.emoji}</Text>
              )}
            </View>

            <YStack style={{ flex: 1, minWidth: 0, gap: s(5) }}>
              <Text
                numberOfLines={1}
                style={[
                  settingsType('semibold'),
                  { fontSize: fs(15.5), color: c.ink, letterSpacing: fs(-0.2) },
                ]}
              >
                {item.name}
              </Text>
              <XStack style={{ alignItems: 'center', gap: s(6), flexWrap: 'wrap' }}>
                <Text
                  numberOfLines={1}
                  style={[settingsType('regular'), { fontSize: fs(12), color: c.muted, flexShrink: 1 }]}
                >
                  {locName}
                </Text>
                {isLow ? (
                  <MetaPill label={lowLabel} color={c.warning} />
                ) : null}
                {showExpiry ? (
                  <MetaPill label={expiryLabel} color={pillColor} />
                ) : null}
              </XStack>
            </YStack>

            {canEdit && !selecting ? (
              <YStack style={{ alignItems: 'center', gap: s(2) }}>
                <XStack
                  style={{
                    alignItems: 'center',
                    gap: s(2),
                    backgroundColor: c.surfaceMuted,
                    borderRadius: s(999),
                    paddingHorizontal: s(3),
                    paddingVertical: s(3),
                  }}
                >
                  <Pressable
                    onPress={onDecrement}
                    hitSlop={8}
                    style={[styles.stepBtn, { width: s(28), height: s(28) }]}
                    accessibilityLabel="Decrease quantity"
                    testID={`pantry-qty-dec-${item.id}`}
                  >
                    <Minus size={fs(14)} color={c.ink} strokeWidth={2.4} />
                  </Pressable>
                  <Text
                    style={[
                      settingsType('semibold'),
                      {
                        minWidth: s(26),
                        textAlign: 'center',
                        fontSize: fs(14),
                        color: c.ink,
                      },
                    ]}
                  >
                    {formatQty(item.quantity)}
                  </Text>
                  <Pressable
                    onPress={onIncrement}
                    hitSlop={8}
                    style={[styles.stepBtn, { width: s(28), height: s(28) }]}
                    accessibilityLabel="Increase quantity"
                    testID={`pantry-qty-inc-${item.id}`}
                  >
                    <Plus size={fs(14)} color={c.ink} strokeWidth={2.4} />
                  </Pressable>
                </XStack>
                {item.unit ? (
                  <Text style={[settingsType('medium'), { fontSize: fs(10), color: c.muted }]}>
                    {item.unit}
                  </Text>
                ) : null}
              </YStack>
            ) : (
              <YStack style={{ alignItems: 'flex-end' }}>
                <Text style={[settingsType('semibold'), { fontSize: fs(16), color: c.ink }]}>
                  {formatQty(item.quantity)}
                </Text>
                {item.unit ? (
                  <Text style={[settingsType('medium'), { fontSize: fs(10), color: c.muted }]}>
                    {item.unit}
                  </Text>
                ) : null}
              </YStack>
            )}
          </XStack>
        </SettingsGlass>
      </Pressable>
    </Animated.View>
  );
}

function MetaPill({ label, color }: { label: string; color: string }) {
  const { s, fs } = useScale();
  return (
    <View
      style={{
        paddingHorizontal: s(7),
        paddingVertical: s(2),
        borderRadius: s(999),
        backgroundColor: `${color}22`,
      }}
    >
      <Text
        style={[
          settingsType('semibold'),
          { fontSize: fs(10), color, letterSpacing: 0.2, textTransform: 'uppercase' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function formatQty(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

const styles = StyleSheet.create({
  thumb: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  stepBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  check: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});

export default memo(PantryItemRow);
