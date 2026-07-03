import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSync } from '../../contexts/SyncContext';

export default function OfflineBanner() {
  const { online } = useSync();
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <View style={{ paddingTop: insets.top }} className="bg-ink px-4 py-2">
      <Text className="text-center text-xs font-semibold text-white">You're offline — changes sync when reconnected</Text>
    </View>
  );
}
