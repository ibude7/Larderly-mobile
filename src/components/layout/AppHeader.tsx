import { useEffect, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { type SyncStatus, useSync, useSyncContext } from '../../contexts/SyncContext';
import { AppLogoMark } from '../ui/AppLogo';
import { Icon } from '../ui/Icon';
import { useAppColors } from '../../hooks/useAppColors';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function todayLabel(): string {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** True when RootNavigator renders a banner that already consumes the top safe area. */
function useHasTopBanner(): boolean {
  const { online } = useSync();
  const { user, isAnonymous } = useAuth();
  if (!online) return true;
  if (isAnonymous) return true;
  const isEmailUser = user?.providerData?.some((p) => p.providerId === 'password');
  return Boolean(user && isEmailUser && !user.emailVerified);
}

const SYNC_STATUS_META: Record<SyncStatus, { color: string; halo: string; label: string }> = {
  synced: {
    color: '#16A34A',
    halo: 'rgba(22, 163, 74, 0.22)',
    label: 'Sync live',
  },
  syncing: {
    color: '#2563EB',
    halo: 'rgba(37, 99, 235, 0.16)',
    label: 'Syncing',
  },
  error: {
    color: '#DC2626',
    halo: 'rgba(220, 38, 38, 0.2)',
    label: 'Sync error',
  },
  offline: {
    color: '#9CA3AF',
    halo: 'rgba(156, 163, 175, 0.2)',
    label: 'Offline',
  },
};

function SyncIndicator() {
  const { syncState } = useSyncContext();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const meta = SYNC_STATUS_META[syncState.status];

  useEffect(() => {
    if (syncState.status === 'synced') {
      pulseScale.value = 1;
      pulseOpacity.value = 0.3;
      pulseScale.value = withRepeat(
        withTiming(1.9, { duration: 1400, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      );
      pulseOpacity.value = withRepeat(
        withTiming(0, { duration: 1400, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      );
      return;
    }

    pulseScale.value = withTiming(1, { duration: 160 });
    pulseOpacity.value = withTiming(syncState.status === 'offline' ? 0.12 : 0.18, { duration: 160 });
  }, [pulseOpacity, pulseScale, syncState.status]);

  useEffect(() => {
    if (syncState.status === 'syncing') {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(360, { duration: 900, easing: Easing.linear }),
        -1,
        false,
      );
      return;
    }

    rotation.value = withTiming(0, { duration: 160 });
  }, [rotation, syncState.status]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View
      style={styles.syncIndicator}
      accessible
      accessibilityRole="image"
      accessibilityLabel={meta.label}
    >
      {syncState.status === 'syncing' ? (
        <Animated.View style={[styles.syncSpinner, spinStyle]}>
          <View style={[styles.syncSpinnerDot, { backgroundColor: meta.color }]} />
        </Animated.View>
      ) : (
        <>
          <Animated.View style={[styles.syncPulse, { backgroundColor: meta.color }, pulseStyle]} />
          <View style={[styles.syncDot, { backgroundColor: meta.color, shadowColor: meta.color }]} />
        </>
      )}
      <View style={[styles.syncHalo, { backgroundColor: meta.halo }]} />
    </View>
  );
}

interface AppHeaderProps {
  title?: string;
  onBack?: () => void;
  /** Called when the avatar is tapped (navigates to settings on the web app). */
  onOpenSettings?: () => void;
  /** Optional trailing element rendered instead of the avatar. */
  right?: ReactNode;
}

export default function AppHeader({ title, onBack, onOpenSettings, right }: AppHeaderProps) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile } = useProfile();
  const hasTopBanner = useHasTopBanner();
  const mainHeaderTop = hasTopBanner ? 8 : insets.top + 8;

  if (title || onBack) {
    return (
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: insets.top + 8,
            borderBottomColor: c.lineStrong,
            backgroundColor: c.canvas,
          },
        ]}
      >
        {onBack ? (
          <Pressable onPress={onBack} className="h-10 w-10 items-center justify-center rounded-field border border-line dark:border-line-dark bg-surface dark:bg-surface-dark">
            <Icon name="chevron-left" size={20} color={c.ink} />
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
        <Text className="flex-1 font-display text-xl text-ink dark:text-ink-dark">{title}</Text>
        <View className="w-10">{right}</View>
      </View>
    );
  }

  const displaySource = profile?.full_name || user?.displayName || user?.email || '';
  const firstName = displaySource.split(/[\s@]/)[0] || 'there';
  const initial = (displaySource || 'U').trim().charAt(0).toUpperCase() || 'U';
  const avatarUrl = profile?.avatar_url || user?.photoURL || '';
  const trailing = right ?? (
    onOpenSettings ? (
      <Pressable
        onPress={onOpenSettings}
        className="h-10 w-10 items-center justify-center overflow-hidden rounded-field border border-line dark:border-line-dark bg-surface dark:bg-surface-dark"
        accessibilityRole="button"
        accessibilityLabel="Open settings"
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} className="h-full w-full" />
        ) : (
          <Text className="text-sm font-bold text-ink dark:text-ink-dark">{initial}</Text>
        )}
      </Pressable>
    ) : null
  );

  return (
    <View
      style={[
        styles.headerBar,
        {
          paddingTop: mainHeaderTop,
          borderBottomColor: c.lineStrong,
          backgroundColor: c.canvas,
        },
      ]}
    >
      <View className="flex-row items-center gap-3">
        <AppLogoMark size="sm" />
        <View>
          <Text className="font-display text-lg text-ink dark:text-ink-dark">Hello {firstName}</Text>
          <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted dark:text-muted-dark">
            {todayLabel()}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <SyncIndicator />
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    alignItems: 'center',
    borderBottomWidth: 1.5,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  syncIndicator: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    position: 'relative',
    width: 24,
  },
  syncHalo: {
    borderRadius: 8,
    height: 16,
    position: 'absolute',
    width: 16,
  },
  syncDot: {
    borderRadius: 4,
    height: 8,
    shadowOpacity: 0.22,
    shadowRadius: 4,
    width: 8,
    zIndex: 2,
  },
  syncPulse: {
    borderRadius: 4,
    height: 8,
    position: 'absolute',
    width: 8,
    zIndex: 1,
  },
  syncSpinner: {
    alignItems: 'center',
    height: 16,
    justifyContent: 'flex-start',
    width: 16,
    zIndex: 2,
  },
  syncSpinnerDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
});
