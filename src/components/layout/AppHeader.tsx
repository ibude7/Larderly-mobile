import { View, Text, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';
import { AppLogoMark } from '../ui/AppLogo';
import { Icon } from '../ui/Icon';
import { colors } from '../../theme';

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

interface AppHeaderProps {
  title?: string;
  onBack?: () => void;
  /** Called when the avatar is tapped (navigates to settings on the web app). */
  onOpenSettings?: () => void;
  /** Optional trailing element rendered instead of the avatar. */
  right?: React.ReactNode;
}

export default function AppHeader({ title, onBack, onOpenSettings, right }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const hasTopBanner = useHasTopBanner();
  const mainHeaderTop = hasTopBanner ? 8 : insets.top + 8;

  if (title || onBack) {
    return (
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center gap-3 border-b border-line bg-canvas px-5 pb-3"
      >
        {onBack ? (
          <Pressable onPress={onBack} className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface">
            <Icon name="chevron-left" size={20} color={colors.ink} />
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
        <Text className="flex-1 text-lg font-bold text-ink">{title}</Text>
        <View className="w-10">{right}</View>
      </View>
    );
  }

  const displaySource = profile?.full_name || user?.displayName || user?.email || '';
  const firstName = displaySource.split(/[\s@]/)[0] || 'there';
  const initial = (displaySource || 'U').trim().charAt(0).toUpperCase() || 'U';
  const avatarUrl = profile?.avatar_url || user?.photoURL || '';

  return (
    <View
      style={{ paddingTop: mainHeaderTop }}
      className="flex-row items-center justify-between border-b border-line bg-canvas px-5 pb-3"
    >
      <View className="flex-row items-center gap-3">
        <AppLogoMark size="sm" />
        <View>
          <Text className="text-sm font-bold text-ink">Hello {firstName},</Text>
          <Text className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {todayLabel()}
          </Text>
        </View>
      </View>

      {right ??
        (onOpenSettings ? (
          <Pressable
            onPress={onOpenSettings}
            className="h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line bg-surface"
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="h-full w-full" />
            ) : (
              <Text className="text-sm font-bold text-ink">{initial}</Text>
            )}
          </Pressable>
        ) : null)}
    </View>
  );
}
