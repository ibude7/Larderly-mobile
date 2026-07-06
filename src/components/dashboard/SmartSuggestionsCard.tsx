import { memo, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { TabScreenNavigationProp } from '../../navigation/types';
import { Icon } from '../ui/Icon';
import { buildSuggestions, type SmartSuggestion, type ActivityEvent, type InventoryItem } from '../../lib/insights';
import { useAppColors } from '../../hooks/useAppColors';
import type { ColorTokens } from '../../theme';

function kindColors(c: ColorTokens): Record<SmartSuggestion['kind'], { bg: string; text: string }> {
  return {
    predictive: { bg: `${c.info}18`, text: c.info },
    bundle: { bg: `${c.primary}33`, text: c.primaryDark },
    price: { bg: `${c.success}18`, text: c.success },
    seasonal: { bg: `${c.warning}18`, text: c.warning },
    waste: { bg: `${c.danger}18`, text: c.danger },
    balance: { bg: `${c.info}18`, text: c.info },
    eco: { bg: `${c.success}18`, text: c.success },
    prep: { bg: `${c.info}18`, text: c.info },
  };
}

interface SmartSuggestionsCardProps {
  inventory: InventoryItem[];
  activity: ActivityEvent[];
  shoppingItems: { productName: string }[];
}

function SmartSuggestionsCard({
  inventory,
  activity,
  shoppingItems,
}: SmartSuggestionsCardProps) {
  const c = useAppColors();
  const paletteMap = useMemo(() => kindColors(c), [c]);
  const navigation = useNavigation<TabScreenNavigationProp>();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const suggestions = useMemo(
    () => buildSuggestions(inventory, activity, shoppingItems),
    [inventory, activity, shoppingItems],
  );
  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  if (visible.length === 0) return null;

  return (
    <View className="mt-6 rounded-card border border-line dark:border-line-dark bg-surface dark:bg-surface-dark p-5">
      <View className="mb-4 flex-row items-center gap-2">
        <Icon name="sparkles" size={20} color={c.primary} />
        <Text className="font-display text-xl text-ink dark:text-ink-dark">Smart Suggestions</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
        <View className="flex-row gap-3 px-1">
          {visible.map((s) => {
            const palette = paletteMap[s.kind];
            return (
              <View
                key={s.id}
                style={{ backgroundColor: palette.bg, width: 260 }}
                className="rounded-2xl p-4"
              >
                <View className="mb-2 flex-row items-start justify-between gap-2">
                  <Text style={{ color: palette.text }} className="flex-1 text-sm font-bold">
                    {s.title}
                  </Text>
                  <Pressable
                    onPress={() => setDismissed((prev) => new Set(prev).add(s.id))}
                    hitSlop={8}
                  >
                    <Text style={{ color: palette.text }} className="text-xs opacity-60">
                      ✕
                    </Text>
                  </Pressable>
                </View>
                <Text className="text-xs leading-5 text-ink/80 dark:text-ink-dark">{s.body}</Text>
                {s.kind === 'predictive' || s.kind === 'bundle' ? (
                  <Pressable
                    onPress={() => navigation.navigate('Shopping')}
                    className="mt-3 self-start"
                  >
                    <Text style={{ color: palette.text }} className="text-xs font-bold uppercase">
                      Go to list →
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default memo(SmartSuggestionsCard, (prev, next) => (
  prev.inventory.length === next.inventory.length
  && prev.activity.length === next.activity.length
  && prev.shoppingItems.length === next.shoppingItems.length
));
