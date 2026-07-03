import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from '@react-native-firebase/firestore';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../lib/firebase';
import { recordActivity } from '../lib/activity';
import { colors } from '../theme';

type Mode = 'choice' | 'create' | 'join';

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function HouseholdSetupScreen() {
  const { user, setHouseholdId } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>('choice');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const createHousehold = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    try {
      const newHouseholdRef = doc(collection(db, 'households'));
      const householdId = newHouseholdRef.id;
      const code = generateInviteCode();

      await setDoc(newHouseholdRef, {
        name: name.trim(),
        ownerId: user.uid,
        members: [user.uid],
        memberRoles: { [user.uid]: 'admin' },
        memberNames: { [user.uid]: user.displayName || user.email || 'Owner' },
        inviteCode: code,
        dietaryPrefs: [],
        allergies: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'inviteCodes', code), {
        householdId,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'users', user.uid), {
        householdId,
        updated_at: serverTimestamp(),
      });

      await recordActivity(householdId, {
        verb: 'member.joined',
        target: name.trim(),
        actorId: user.uid,
        actorName: user.displayName || user.email || 'Owner',
      });

      setHouseholdId(householdId);
      showToast(`Household ready — invite code: ${code}`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not create household', 'error');
    } finally {
      setLoading(false);
    }
  };

  const joinHousehold = async () => {
    if (!inviteCode.trim() || !user) return;
    setLoading(true);
    try {
      const code = inviteCode.trim().toUpperCase();
      const codeSnap = await getDoc(doc(db, 'inviteCodes', code));
      if (!codeSnap.exists()) {
        showToast('Invalid invite code', 'error');
        return;
      }
      const targetHouseholdId = codeSnap.data()?.householdId as string;
      await updateDoc(doc(db, 'households', targetHouseholdId), {
        members: arrayUnion(user.uid),
        [`memberRoles.${user.uid}`]: 'editor',
        [`memberNames.${user.uid}`]: user.displayName || user.email || 'Member',
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'users', user.uid), {
        householdId: targetHouseholdId,
        updated_at: serverTimestamp(),
      });
      await recordActivity(targetHouseholdId, {
        verb: 'member.joined',
        target: 'household',
        actorId: user.uid,
        actorName: user.displayName || user.email || 'Member',
      });
      setHouseholdId(targetHouseholdId);
      showToast('Joined household', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not join household', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <View className="flex-1 justify-center px-6">
        <View className="rounded-3xl border border-line bg-surface p-8">
          {mode === 'choice' && (
            <>
              <View className="mb-6 items-center">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon name="dashboard" size={32} color={colors.primary} />
                </View>
                <Text className="text-center text-2xl font-bold text-ink">Set up your kitchen</Text>
                <Text className="mt-2 text-center text-sm text-muted">
                  Create a household or join with an invite code.
                </Text>
              </View>
              <Pressable
                onPress={() => setMode('create')}
                className="mb-3 flex-row items-center justify-between rounded-2xl border-2 border-primary/30 bg-primary/5 p-5"
              >
                <View className="flex-row items-center gap-4">
                  <View className="h-12 w-12 items-center justify-center rounded-xl bg-surface">
                    <Icon name="plus" size={22} color={colors.primary} />
                  </View>
                  <View>
                    <Text className="font-bold text-ink">Create household</Text>
                    <Text className="text-xs text-muted">Start fresh and invite family</Text>
                  </View>
                </View>
              </Pressable>
              <Pressable
                onPress={() => setMode('join')}
                className="flex-row items-center justify-between rounded-2xl border border-line bg-canvas p-5"
              >
                <View className="flex-row items-center gap-4">
                  <View className="h-12 w-12 items-center justify-center rounded-xl bg-line/50">
                    <Icon name="user" size={22} color={colors.ink} />
                  </View>
                  <View>
                    <Text className="font-bold text-ink">Join household</Text>
                    <Text className="text-xs text-muted">8-character invite code</Text>
                  </View>
                </View>
              </Pressable>
            </>
          )}

          {mode === 'create' && (
            <>
              <Text className="mb-2 text-center text-2xl font-bold text-ink">Name your household</Text>
              <TextField
                label="Household name"
                value={name}
                onChangeText={setName}
                placeholder="e.g. The Smith Family"
              />
              <View className="mt-4 gap-2">
                <Button label="Create household" onPress={createHousehold} loading={loading} disabled={!name.trim()} />
                <Button label="Back" variant="ghost" onPress={() => setMode('choice')} />
              </View>
            </>
          )}

          {mode === 'join' && (
            <>
              <Text className="mb-2 text-center text-2xl font-bold text-ink">Enter invite code</Text>
              <TextField
                label="Invite code"
                value={inviteCode}
                onChangeText={(t) => setInviteCode(t.toUpperCase())}
                placeholder="ABC12345"
                autoCapitalize="characters"
                maxLength={8}
              />
              <View className="mt-4 gap-2">
                <Button label="Join household" onPress={joinHousehold} loading={loading} disabled={inviteCode.length !== 8} />
                <Button label="Back" variant="ghost" onPress={() => setMode('choice')} />
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
