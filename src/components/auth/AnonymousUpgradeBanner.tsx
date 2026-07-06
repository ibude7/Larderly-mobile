import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { TabScreenNavigationProp } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';
import Button from '../ui/Button';

export default function AnonymousUpgradeBanner() {
  const { isAnonymous } = useAuth();
  const { online } = useSync();
  const navigation = useNavigation<TabScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  if (!isAnonymous) return null;

  return (
    <View
      style={{ paddingTop: online ? insets.top + 4 : 0 }}
      className="px-5 mb-1"
    >
      <View className="flex-row items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
      <View className="flex-1 pr-3">
        <Text className="font-semibold text-ink dark:text-ink-dark">Guest mode</Text>
        <Text className="text-xs text-muted dark:text-muted-dark">Create an account to keep your data across devices.</Text>
      </View>
      <Button size="sm" label="Upgrade" onPress={() => navigation.navigate('Settings')} />
      </View>
    </View>
  );
}
