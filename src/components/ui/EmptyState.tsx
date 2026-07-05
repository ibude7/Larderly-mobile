import React, { useEffect, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { Icon, IconName } from './Icon';
import Button from './Button';
import { useAppColors } from '../../hooks/useAppColors';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'card' | 'inline';
  extra?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
  extra,
  className = '',
}: EmptyStateProps) {
  const c = useAppColors();
  
  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(withTiming(-6, { duration: 1500 }), withTiming(6, { duration: 1500 })),
      -1,
      true
    );
  }, [floatY]);
  
  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));

  const renderIllustration = (size = 40) => {
    const isIllustration = icon === 'pantry' || icon === 'shopping' || icon === 'search';
    
    if (isIllustration) {
      let emoji = '🔍';
      let spacing = 0;
      if (icon === 'pantry') { emoji = '🥦 🥕 🧅'; spacing = 8; }
      if (icon === 'shopping') { emoji = '🛒 ✨'; spacing = 4; }
      
      return (
        <Animated.Text style={[{ fontSize: 32, letterSpacing: spacing }, animStyle]}>
          {emoji}
        </Animated.Text>
      );
    }
    return <Icon name={icon} size={size} color={c.primary} />;
  };

  if (variant === 'inline') {
    return (
      <View style={[styles.inlineContainer, { paddingVertical: 24 }]} className={className}>
        <View style={[styles.inlineIconWrapper, { backgroundColor: c.surfaceMuted }]}>
          {renderIllustration(32)}
        </View>
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: c.ink }}>{title}</Text>
          {actionLabel && onAction && (
            <Text onPress={onAction} style={{ fontSize: 13, fontWeight: '600', color: c.primary, marginTop: 4 }}>
              {actionLabel}
            </Text>
          )}
        </View>
      </View>
    );
  }

  const isCard = variant === 'card';
  // Use a simple View if it's default variant, or BlurView if it's card
  const Container: any = isCard ? BlurView : View;
  
  return (
    <Container 
      tint={isCard ? c.blurTint : undefined} 
      intensity={isCard ? c.blurIntensity : undefined}
      style={[
        styles.mainContainer, 
        isCard && { 
          borderRadius: 24, 
          borderWidth: 1, 
          borderColor: c.lineStrong,
          overflow: 'hidden',
          backgroundColor: c.blurTint === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)',
        },
        !isCard && {
          borderRadius: 24,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: c.line,
          backgroundColor: c.canvas,
        }
      ]} 
      className={className}
    >
      <View style={[styles.circleGradient, { backgroundColor: c.surface }]}>
        <LinearGradient 
          colors={[c.primaryGlow, 'transparent']} 
          style={StyleSheet.absoluteFillObject} 
          start={{x:0.5, y:0}} end={{x:0.5, y:1}}
        />
        {renderIllustration(40)}
      </View>
      
      <Text style={[styles.title, { color: c.ink }]}>{title}</Text>
      
      {description ? (
        <Text style={[styles.description, { color: c.muted }]}>{description}</Text>
      ) : null}
      
      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.actionsContainer}>
          {actionLabel && onAction ? (
            <Button 
              label={actionLabel} 
              onPress={onAction} 
              variant="primary" 
              style={{ shadowColor: c.primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}
            />
          ) : null}
          {secondaryActionLabel && onSecondaryAction ? (
            <Button label={secondaryActionLabel} onPress={onSecondaryAction} variant="secondary" />
          ) : null}
        </View>
      )}
      {extra ? <View style={{ marginTop: 16 }}>{extra}</View> : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inlineIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 24,
  },
  actionsContainer: {
    marginTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  }
});
