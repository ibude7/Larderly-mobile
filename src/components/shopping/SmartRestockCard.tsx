import { memo, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../ui/Icon';
import { useAppColors } from '../../hooks/useAppColors';
import type { PantryItem } from '../../types';

interface SmartRestockCardProps {
  pantryItems: PantryItem[];
  existingNames: string[];
  onRestock: (items: PantryItem[]) => void;
}

function SmartRestockCard({ pantryItems, existingNames, onRestock }: SmartRestockCardProps) {
  const c = useAppColors();

  const candidates = useMemo(() => {
    const existing = new Set(existingNames.map((n) => n.trim().toLowerCase()));
    return pantryItems.filter(
      (i) => i.quantity <= i.low_stock_threshold && !existing.has(i.name.trim().toLowerCase()),
    );
  }, [pantryItems, existingNames]);

  if (candidates.length === 0) return null;

  const preview = candidates.slice(0, 3).map((i) => i.name).join(', ');
  const extra = candidates.length > 3 ? ` +${candidates.length - 3} more` : '';

  return (
    <View
      style={{
        marginBottom: 16,
        borderRadius: 28,
        borderTopLeftRadius: 10,
        overflow: 'hidden',
        shadowColor: c.teal,
        shadowOpacity: 0.3,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
      testID="smart-restock-card"
    >
      <LinearGradient
        colors={[c.teal, c.success]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <View className="flex-row items-center gap-3">
          <View
            style={{
              backgroundColor: 'rgba(4,35,26,0.14)',
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="sparkles" size={20} color="#04231A" />
          </View>
          <View className="flex-1">
            <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 17, color: '#04231A' }}>
              Smart Restock
            </Text>
            <Text
              numberOfLines={1}
              style={{ marginTop: 2, fontSize: 12, fontFamily: 'Outfit_500Medium', color: 'rgba(4,35,26,0.7)' }}
            >
              {candidates.length} running low: {preview}
              {extra}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => onRestock(candidates)}
          testID="smart-restock-add-all"
          style={({ pressed }) => [
            {
              marginTop: 14,
              backgroundColor: '#04231A',
              borderRadius: 999,
              paddingVertical: 11,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text style={{ color: '#FFFFFF', fontFamily: 'Outfit_700Bold', fontSize: 13 }}>
            Add all {candidates.length} to list
          </Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

export default memo(SmartRestockCard);
