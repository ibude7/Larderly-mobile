import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon } from '../ui/Icon';
import { CATEGORIES } from '../../lib/categories';
import { useAppColors } from '../../hooks/useAppColors';
import { ShoppingListItem } from '../../types';

interface SwipeableShoppingRowProps {
  item: ShoppingListItem;
  canEdit: boolean;
  shopMode: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function SwipeableShoppingRow({
  item,
  canEdit,
  shopMode,
  onToggle,
  onDelete,
}: SwipeableShoppingRowProps) {
  const c = useAppColors();
  const swipeableRef = useRef<Swipeable>(null);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handleToggle = () => {
    scale.value = withTiming(0.97, { duration: 150 });
    opacity.value = withTiming(0.7, { duration: 150 }, (finished) => {
      if (finished) {
        runOnJS(onToggle)(item.id);
        // Reset animation values for the new location/state
        scale.value = 1;
        opacity.value = 1;
      }
    });
  };

  const handleLeftOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleToggle();
    swipeableRef.current?.close();
  };

  const handleRightOpen = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete(item.id);
    swipeableRef.current?.close();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const catColor = CATEGORIES.find((cat) => cat.id === item.category)?.color || '#9ca3af';

  const renderLeftActions = () => (
    <View style={[styles.actionContainer, { backgroundColor: c.success, marginRight: 8 }]}>
      <Text style={styles.actionText}>✓ Got it</Text>
    </View>
  );

  const renderRightActions = () => (
    <View style={[styles.actionContainer, { backgroundColor: c.danger, marginLeft: 8 }]}>
      <Text style={styles.actionText}>🗑 Remove</Text>
    </View>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={canEdit && !shopMode ? renderLeftActions : undefined}
      renderRightActions={canEdit && !shopMode ? renderRightActions : undefined}
      onSwipeableLeftOpen={handleLeftOpen}
      onSwipeableRightOpen={handleRightOpen}
      containerStyle={styles.swipeableContainer}
      friction={2}
      leftThreshold={60}
      rightThreshold={60}
    >
      <Pressable onPress={() => handleToggle()}>
        <Animated.View
          style={[animatedStyle]}
          className={`flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3`}
        >
          {/* Subtle left-side category color dot */}
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: catColor,
            }}
          />

          <Icon
            name={item.is_checked ? 'success' : 'cart'}
            size={20}
            color={item.is_checked ? c.success : c.primary}
          />

          <View className="flex-1">
            <Text className={`font-semibold ${item.is_checked ? 'text-muted line-through' : 'text-ink'}`}>
              {item.name}
            </Text>
            <Text className="text-xs text-muted">
              {item.quantity} {item.unit}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeableContainer: {
    marginBottom: 8,
  },
  actionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    minWidth: 100,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
