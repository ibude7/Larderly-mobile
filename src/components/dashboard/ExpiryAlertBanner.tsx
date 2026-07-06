import { View, Text, Pressable } from 'react-native';
import { Icon } from '../ui/Icon';
import { useAppColors } from '../../hooks/useAppColors';
import { useTheme } from '../../hooks/useTheme';
import type { PantryItem } from '../../types';

interface ExpiryAlertBannerProps {
  items: PantryItem[];
  onPress: () => void;
}

const MAX_PREVIEW = 3;

export default function ExpiryAlertBanner({ items, onPress }: ExpiryAlertBannerProps) {
  const c = useAppColors();
  const theme = useTheme();
  const count = items.length;

  if (count === 0) return null;

  const preview = items.slice(0, MAX_PREVIEW).map((i) => i.name).join(', ');
  const extra = count > MAX_PREVIEW ? ` +${count - MAX_PREVIEW} more` : '';
  const headline = count === 1 ? '1 item expiring soon' : `${count} items expiring soon`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
      className="mt-6 flex-row items-center gap-3 rounded-card border p-5"
    >
      <View
        style={{
          backgroundColor: `${c.danger}18`,
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="calendar" size={20} color={c.danger} />
      </View>

      <View className="flex-1">
        <Text className="text-sm font-bold text-ink dark:text-[#F6F1EA]">{headline}</Text>
        {preview ? (
          <Text numberOfLines={1} className="mt-0.5 text-xs font-medium text-muted dark:text-[#9A948D]">
            {preview}
            {extra}
          </Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-1">
        <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: c.danger }}>
          View in pantry
        </Text>
        <Icon name="chevron-right" size={14} color={c.danger} />
      </View>
    </Pressable>
  );
}
