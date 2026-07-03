import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';
import { useToast } from '../../contexts/ToastContext';
import { Icon } from '../ui/Icon';
import { colors } from '../../theme';

export default function EmailVerificationBanner() {
  const { user, sendVerificationEmail, isAnonymous } = useAuth();
  const { online } = useSync();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  const isEmailUser = user?.providerData?.some((p) => p.providerId === 'password');
  if (!user || !isEmailUser || user.emailVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      const { error } = await sendVerificationEmail();
      if (error) throw error;
      showToast(`Verification email sent — check ${user.email}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not resend verification email', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <View
      style={{ paddingTop: online && !isAnonymous ? insets.top + 4 : 0 }}
      className="px-5 mb-3"
    >
      <View className="flex-row items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <View className="min-w-0 flex-1 flex-row items-center gap-2">
        <Icon name="mail" size={16} color="#b45309" />
        <Text numberOfLines={2} className="flex-1 text-sm text-amber-900">
          Verify your email — <Text className="font-bold">{user.email}</Text>
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Pressable onPress={handleResend} disabled={sending} className="px-2 py-1">
          {sending ? (
            <ActivityIndicator size="small" color="#b45309" />
          ) : (
            <Text className="text-xs font-bold text-amber-800">Resend</Text>
          )}
        </Pressable>
        <Pressable onPress={() => setDismissed(true)} hitSlop={8}>
          <Text style={{ color: colors.muted }} className="text-sm">
            ✕
          </Text>
        </Pressable>
      </View>
    </View>
    </View>
  );
}
