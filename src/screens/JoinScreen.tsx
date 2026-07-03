import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion } from '@react-native-firebase/firestore';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../lib/firebase';
import { recordActivity } from '../lib/activity';

export default function JoinScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const code = (route.params?.code as string | undefined)?.toUpperCase() ?? '';
  const { user, setHouseholdId } = useAuth();
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
      const codeSnap = await getDoc(doc(db, 'inviteCodes', code));
      if (!codeSnap.exists()) {
        showToast('Invalid or expired invite code', 'error');
        return;
      }
      const householdId = codeSnap.data()?.householdId as string;
      await updateDoc(doc(db, 'households', householdId), {
        members: arrayUnion(user.uid),
        [`memberRoles.${user.uid}`]: 'editor',
        [`memberNames.${user.uid}`]: user.displayName || user.email || 'Member',
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'users', user.uid), {
        householdId,
        updated_at: serverTimestamp(),
      });
      await recordActivity(householdId, {
        verb: 'member.joined',
        target: 'household',
        actorId: user.uid,
        actorName: user.displayName || user.email || 'Member',
      });
      setHouseholdId(householdId);
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
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas">
        <Text className="text-muted">Sign in to join a household.</Text>
        <Button label="Sign in" className="mt-4" onPress={() => navigation.navigate('Auth')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }}>
        <Text className="text-center text-2xl font-bold text-ink">Join household</Text>
        <Text className="mt-2 text-center text-muted">
          Invite code <Text className="font-mono font-bold text-ink">{code || '—'}</Text>
        </Text>
        {householdName && <Text className="mt-1 text-center text-sm text-muted">You're joining {householdName}</Text>}
        <View className="mt-8">
          <Button label="Join now" onPress={join} loading={loading} disabled={code.length !== 8} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
