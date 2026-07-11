import { ReactNode } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LandingLogoMark } from '../landing/LandingLogoMark';
import { useScale } from '../../theme/scale';
import { landing, landingFonts as SF } from '../../theme/landing';
import { useAccent } from '../../theme/accent';

interface AuthTopBarProps {
  onBack?: () => void;
  backLabel?: string;
  rightSlot?: ReactNode;
  /** When true, bar is absolutely positioned like Landing. */
  floating?: boolean;
}

export function AuthTopBar({
  onBack,
  backLabel = 'Back',
  rightSlot,
  floating = true,
}: AuthTopBarProps) {
  const insets = useSafeAreaInsets();
  const { s, fs } = useScale();
  const accent = useAccent();

  return (
    <View
      style={[
        styles.row,
        floating && styles.floating,
        {
          top: floating ? insets.top + s(12) : undefined,
          paddingTop: floating ? 0 : insets.top + s(12),
          paddingHorizontal: s(24),
        },
      ]}
    >
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={[{ width: s(64) }, styles.backBtn]}>
          <Text style={[styles.backText, { fontSize: fs(14) }]}>{backLabel}</Text>
        </Pressable>
      ) : (
        <View style={{ width: s(64) }} />
      )}
      <LandingLogoMark size="lg" color={accent} />
      {rightSlot ?? <View style={{ width: s(64) }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floating: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backBtn: {
    alignItems: 'flex-start',
  },
  backText: {
    fontFamily: SF.semibold,
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
    color: landing.muted,
  },
});
