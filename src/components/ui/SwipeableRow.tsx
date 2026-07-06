import { type ReactNode, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Haptics from 'expo-haptics';
import { Icon, type IconName } from './Icon';

interface SwipeAction {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface SwipeableRowProps {
  children: ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export default function SwipeableRow({
  children,
  leftAction,
  rightAction,
  onSwipeLeft,
  onSwipeRight,
}: SwipeableRowProps) {
  const ref = useRef<Swipeable>(null);
  const handling = useRef(false);

  const runAction = (action: SwipeAction | undefined, onSwipe?: () => void) => {
    if (!action || handling.current) return;
    handling.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSwipe?.();
    action.onPress();
    ref.current?.close();
    setTimeout(() => {
      handling.current = false;
    }, 280);
  };

  const renderAction = (action: SwipeAction, side: 'left' | 'right') => (
    <Pressable
      onPress={() => runAction(action, side === 'left' ? onSwipeLeft : onSwipeRight)}
      style={[
        styles.action,
        side === 'left' ? styles.leftAction : styles.rightAction,
        { backgroundColor: action.color },
      ]}
    >
      <View style={styles.actionContent}>
        <Icon name={action.icon as IconName} size={18} color="#FFFFFF" />
        <Text numberOfLines={1} style={styles.actionText}>
          {action.label}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <Swipeable
      ref={ref}
      friction={2}
      leftThreshold={64}
      rightThreshold={64}
      overshootFriction={8}
      renderLeftActions={leftAction ? () => renderAction(leftAction, 'left') : undefined}
      renderRightActions={rightAction ? () => renderAction(rightAction, 'right') : undefined}
      onSwipeableLeftOpen={() => runAction(leftAction, onSwipeLeft)}
      onSwipeableRightOpen={() => runAction(rightAction, onSwipeRight)}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 120,
  },
  leftAction: {
    borderBottomLeftRadius: 18,
    borderTopLeftRadius: 18,
    marginRight: 8,
  },
  rightAction: {
    borderBottomRightRadius: 18,
    borderTopRightRadius: 18,
    marginLeft: 8,
  },
  actionContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
