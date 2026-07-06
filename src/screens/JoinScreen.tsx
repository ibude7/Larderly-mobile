import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackNavigationProp, RootStackParamList } from '../navigation/types';
import { doc, getDoc } from '@react-native-firebase/firestore';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../lib/firebase';

export default function JoinScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Join'>>();
  const code = route.params?.code?.toUpperCase() ?? '';
  const { user } = useAuth();
  const { joinHousehold } = useHousehold();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [householdName, setHouseholdName] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    getDoc(doc(db, 'inviteCodes', code)).then((snap) => {
      if (snap.exists()) setHouseholdName('a shared household');
    });
  }, [code]);

  const join = async () => {
    if (!user || !code) return;
    setLoading(true);
    try {
      await joinHousehold(code);
      showToast('Welcome to the household!', 'success');
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Join failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas dark:bg-canvas-dark">
        <Text className="text-muted dark:text-muted-dark">Sign in to join a household.</Text>
        <Button label="Sign in" className="mt-4" onPress={() => navigation.navigate('Auth')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}>
        <Text className="text-center font-display text-3xl text-ink dark:text-ink-dark">Join household</Text>
        <Text className="mt-2 text-center text-muted dark:text-muted-dark">
          Invite code <Text className="font-mono font-bold text-ink dark:text-ink-dark">{code || '—'}</Text>
        </Text>
        {householdName && <Text className="mt-1 text-center text-sm text-muted dark:text-muted-dark">You're joining {householdName}</Text>}
        <View className="mt-8">
          <Button label="Join now" onPress={join} loading={loading} disabled={code.length !== 8} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
