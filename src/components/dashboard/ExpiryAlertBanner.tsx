import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../ui/Icon';
import { useAppColors } from '../../hooks/useAppColors';
import type { PantryItem } from '../../types';

interface ExpiryAlertBannerProps {
  items: PantryItem[];
  onPress: () => void;
}

const MAX_PREVIEW = 3;

export default function ExpiryAlertBanner({ items, onPress }: ExpiryAlertBannerProps) {
  const c = useAppColors();
  const count = items.length;

  if (count === 0) return null;

  const preview = items.slice(0, MAX_PREVIEW).map((i) => i.name).join(', ');
  const extra = count > MAX_PREVIEW ? ` +${count - MAX_PREVIEW} more` : '';
  const headline = count === 1 ? '1 item expiring soon' : `${count} items expiring soon`;

  return (
    <Pressable
      onPress={onPress}
      testID="expiry-alert-banner"
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.94 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          marginTop: 24,
          borderRadius: 28,
          shadowColor: c.primary,
          shadowOpacity: 0.35,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 8,
        },
      ]}
    >
      <LinearGradient
        colors={[c.primary, '#FF7A3D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 28,
          borderTopRightRadius: 10,
          padding: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.22)',
            width: 46,
            height: 46,
            borderRadius: 23,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="calendar" size={22} color="#FFFFFF" />
        </View>

        <View className="flex-1">
          <Text style={{ fontFamily: 'Fraunces_600SemiBold', fontSize: 17, color: '#FFFFFF' }}>
            {headline}
          </Text>
          {preview ? (
            <Text
              numberOfLines={1}
              style={{ marginTop: 2, fontSize: 12, fontFamily: 'Outfit_500Medium', color: 'rgba(255,255,255,0.85)' }}
            >
              {preview}
              {extra}
            </Text>
          ) : null}
        </View>

        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.22)',
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="chevron-right" size={16} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}
