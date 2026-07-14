import { Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { SettingsGlass } from '../settings/SettingsGlass';
import { settingsType } from '../settings/settingsFonts';
import { categoryFromName } from '../../lib/categories';
import type { PantryItem } from '../../types';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

interface ShoppingSmartRailProps {
  suggestions: PantryItem[];
  title: string;
  addAllLabel: string;
  onAddOne: (item: PantryItem) => void;
  onAddAll: () => void;
}

/** Horizontal smart-restock suggestions from low-stock pantry. */
export function ShoppingSmartRail({
  suggestions,
  title,
  addAllLabel,
  onAddOne,
  onAddAll,
}: ShoppingSmartRailProps) {
  const { s, fs } = useScale();
  const c = useAppColors();

  if (suggestions.length === 0) return null;

  return (
    <YStack style={{ gap: s(8), marginBottom: s(8) }}>
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[settingsType('semibold'), { fontSize: fs(12), letterSpacing: 0.5, color: c.muted, textTransform: 'uppercase' }]}>
          {title}
        </Text>
        <Pressable onPress={onAddAll} hitSlop={8} testID="shopping-smart-add-all">
          <Text style={[settingsType('semibold'), { fontSize: fs(13), color: c.primary }]}>
            {addAllLabel}
          </Text>
        </Pressable>
      </XStack>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: s(8) }}>
        {suggestions.map((item) => {
          const cat = categoryFromName(item.category || item.name);
          return (
            <Pressable
              key={item.id}
              onPress={() => onAddOne(item)}
              testID={`shopping-smart-${item.id}`}
            >
              <SettingsGlass
                elevated
                interactive={false}
                radius={s(16)}
                contentStyle={{
                  paddingHorizontal: s(12),
                  paddingVertical: s(10),
                  minWidth: s(120),
                  gap: s(4),
                }}
              >
                <Text style={{ fontSize: fs(18) }}>{cat.emoji}</Text>
                <Text
                  numberOfLines={1}
                  style={[settingsType('semibold'), { fontSize: fs(13), color: c.ink, maxWidth: s(110) }]}
                >
                  {item.name}
                </Text>
                <Text style={[settingsType('regular'), { fontSize: fs(11), color: c.muted }]}>
                  +{Math.max(1, item.low_stock_threshold - item.quantity + 1)} {item.unit}
                </Text>
              </SettingsGlass>
            </Pressable>
          );
        })}
      </ScrollView>
    </YStack>
  );
}
