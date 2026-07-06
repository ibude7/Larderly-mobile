import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { useHousehold } from '../contexts/HouseholdContext';
import { useToast } from '../contexts/ToastContext';
import { useAppColors } from '../hooks/useAppColors';

type Mode = 'choice' | 'create' | 'join';

export default function HouseholdSetupScreen() {
  const c = useAppColors();
  const { createHousehold: ctxCreateHousehold, joinHousehold: ctxJoinHousehold } = useHousehold();
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>('choice');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const createHousehold = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const code = await ctxCreateHousehold(name);
      showToast(`Household ready — invite code: ${code}`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not create household', 'error');
    } finally {
      setLoading(false);
    }
  };

  const joinHousehold = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    try {
      await ctxJoinHousehold(inviteCode);
      showToast('Joined household', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not join household', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <View className="flex-1 justify-center px-6">
        <View className="rounded-3xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark p-8">
          {mode === 'choice' && (
            <>
              <View className="mb-6 items-center">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon name="dashboard" size={32} color={c.primary} />
                </View>
                <Text className="text-center font-display text-3xl text-ink dark:text-ink-dark">Set up your kitchen</Text>
                <Text className="mt-2 text-center text-sm text-muted dark:text-muted-dark">
                  Create a household or join with an invite code.
                </Text>
              </View>
              <Pressable
                onPress={() => setMode('create')}
                className="mb-3 flex-row items-center justify-between rounded-2xl border-2 border-primary/30 bg-primary/5 p-5"
              >
                <View className="flex-row items-center gap-4">
                  <View className="h-12 w-12 items-center justify-center rounded-xl bg-surface dark:bg-surface-dark">
                    <Icon name="plus" size={22} color={c.primary} />
                  </View>
                  <View>
                    <Text className="font-bold text-ink dark:text-ink-dark">Create household</Text>
                    <Text className="text-xs text-muted dark:text-muted-dark">Start fresh and invite family</Text>
                  </View>
                </View>
              </Pressable>
              <Pressable
                onPress={() => setMode('join')}
                className="flex-row items-center justify-between rounded-2xl border border-line dark:border-line-dark bg-canvas dark:bg-canvas-dark p-5"
              >
                <View className="flex-row items-center gap-4">
                  <View className="h-12 w-12 items-center justify-center rounded-xl bg-line/50">
                    <Icon name="user" size={22} color={c.ink} />
                  </View>
                  <View>
                    <Text className="font-bold text-ink dark:text-ink-dark">Join household</Text>
                    <Text className="text-xs text-muted dark:text-muted-dark">8-character invite code</Text>
                  </View>
                </View>
              </Pressable>
            </>
          )}

          {mode === 'create' && (
            <>
              <Text className="mb-2 text-center font-display text-3xl text-ink dark:text-ink-dark">Name your household</Text>
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
              <Text className="mb-2 text-center font-display text-3xl text-ink dark:text-ink-dark">Enter invite code</Text>
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
