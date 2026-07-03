import { View, Text } from 'react-native';
import AppLogo from '../components/ui/AppLogo';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-canvas px-6">
      <View className="w-full max-w-sm items-center rounded-card border border-line bg-surface p-8">
        <Text className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">
          Getting everything ready
        </Text>
        <AppLogo size="lg" showWordmark={false} animated />
        <View className="mt-5">
          <LoadingSpinner size="md" />
        </View>
        <Text className="mt-4 text-sm font-medium text-ink">Loading Larderly…</Text>
        <Text className="mt-1 text-xs text-muted">Syncing your pantry, plans, and list.</Text>
      </View>
    </View>
  );
}
