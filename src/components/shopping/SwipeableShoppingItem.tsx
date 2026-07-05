import React, { useEffect, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Icon } from '../ui/Icon';
import { useAppColors } from '../../hooks/useAppColors';

interface SwipeableShoppingItemProps {
  item: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    is_checked: boolean;
  };
  canEdit: boolean;
  shopMode: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPantryAdd: (item: any) => void;
}

export default function SwipeableShoppingItem({
  item,
  canEdit,
  shopMode,
  onToggle,
  onDelete,
  onPantryAdd,
}: SwipeableShoppingItemProps) {
  const c = useAppColors();
  const offset = useSharedValue(item.is_checked ? 6 : 0);
  const opacity = useSharedValue(item.is_checked ? 0.4 : 1);

  useEffect(() => {
    offset.value = withTiming(item.is_checked ? 6 : 0, { duration: 200 });
    opacity.value = withTiming(item.is_checked ? 0.4 : 1, { duration: 200 });
  }, [item.is_checked, offset, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
    opacity: opacity.value,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
  }));

  const renderRightActions = useCallback(() => (
    <Pressable
      onPress={() => onDelete(item.id)}
      style={{
        backgroundColor: c.danger,
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        borderRadius: 16,
        marginLeft: 8,
        marginBottom: 8,
      }}
    >
      <Icon name="trash" size={20} color="#FFF" />
    </Pressable>
  ), [onDelete, item.id, c.danger]);

  const renderLeftActions = useCallback(() => (
    <Pressable
      onPress={() => onPantryAdd(item)}
      style={{
        backgroundColor: c.success,
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Icon name="pantry" size={20} color="#FFF" />
    </Pressable>
  ), [onPantryAdd, item, c.success]);

  return (
    <Swipeable
      renderRightActions={canEdit && !shopMode ? renderRightActions : undefined}
      renderLeftActions={canEdit && !shopMode ? renderLeftActions : undefined}
      containerStyle={{ marginBottom: 8, overflow: 'visible' }}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}
    >
      <Pressable onPress={() => onToggle(item.id)}>
        <Animated.View style={animatedStyle}>
          {item.is_checked ? (
            <Icon name="success" size={20} color={c.success} />
          ) : (
            <Icon name="cart" size={20} color={c.primary} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: c.ink, fontSize: 15 }}>
              {item.name}
            </Text>
            <Text style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>
              {item.quantity} {item.unit}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Swipeable>
  );
}
