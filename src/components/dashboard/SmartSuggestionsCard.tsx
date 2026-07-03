import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '../ui/Icon';
import { buildSuggestions, type SmartSuggestion, type ActivityEvent, type InventoryItem } from '../../lib/insights';
import { colors } from '../../theme';

const KIND_COLORS: Record<SmartSuggestion['kind'], { bg: string; text: string }> = {
  predictive: { bg: '#eff6ff', text: '#1d4ed8' },
  bundle: { bg: '#fff7ed', text: '#c2410c' },
  price: { bg: '#ecfdf5', text: '#047857' },
  seasonal: { bg: '#fffbeb', text: '#b45309' },
  waste: { bg: '#fef2f2', text: '#dc2626' },
  balance: { bg: '#faf5ff', text: '#7c3aed' },
  eco: { bg: '#ecfdf5', text: '#047857' },
  prep: { bg: '#eef2ff', text: '#4338ca' },
};

interface SmartSuggestionsCardProps {
  inventory: InventoryItem[];
  activity: ActivityEvent[];
  shoppingItems: { productName: string }[];
}

export default function SmartSuggestionsCard({
  inventory,
  activity,
  shoppingItems,
}: SmartSuggestionsCardProps) {
  const navigation = useNavigation<any>();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const suggestions = useMemo(
    () => buildSuggestions(inventory, activity, shoppingItems),
    [inventory, activity, shoppingItems],
  );
  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  if (visible.length === 0) return null;

  return (
    <View className="mt-6 rounded-card border border-line bg-surface p-5">
      <View className="mb-4 flex-row items-center gap-2">
        <Icon name="sparkles" size={20} color={colors.primary} />
        <Text className="text-lg font-bold text-ink">Smart Suggestions</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
        <View className="flex-row gap-3 px-1">
          {visible.map((s) => {
            const palette = KIND_COLORS[s.kind];
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
                <Text className="text-xs leading-5 text-ink/80">{s.body}</Text>
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
