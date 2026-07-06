import { useEffect, useState } from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  arrayRemove,
} from '@react-native-firebase/firestore';
import TextField from '../ui/TextField';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useHousehold } from '../../contexts/HouseholdContext';
import { useProfile } from '../../contexts/ProfileContext';
import type { Role } from '../../types/household';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { db } from '../../lib/firebase';
import { recordActivity } from '../../lib/activity';

const DIET_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Paleo', 'Pescatarian', 'Halal', 'Kosher'];

export default function HouseholdSettingsSection() {
  const { user } = useAuth();
  const { householdId, role } = useHousehold();
  const { updateUserPreferences } = useProfile();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [household, setHousehold] = useState<{
    name: string;
    inviteCode: string;
    allergies: string;
    dietaryPrefs: string[];
    members: string[];
    memberRoles: Record<string, Role>;
    memberNames: Record<string, string>;
  } | null>(null);
  const [draftAllergies, setDraftAllergies] = useState('');
  const [draftDiet, setDraftDiet] = useState<string[]>([]);

  useEffect(() => {
    if (!householdId) return;
    const unsub = onSnapshot(doc(db, 'households', householdId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() ?? {};
      setHousehold({
        name: (data.name as string) ?? '',
        inviteCode: (data.inviteCode as string) ?? '',
        allergies: (data.allergies as string) ?? '',
        dietaryPrefs: (data.dietaryPrefs as string[]) ?? [],
        members: (data.members as string[]) ?? [],
        memberRoles: (data.memberRoles as Record<string, Role>) ?? {},
        memberNames: (data.memberNames as Record<string, string>) ?? {},
      });
      setDraftAllergies((data.allergies as string) ?? '');
      setDraftDiet((data.dietaryPrefs as string[]) ?? []);
    });
    return unsub;
  }, [householdId]);

  const copyInvite = async () => {
    if (!household?.inviteCode) return;
    await Share.share({ message: household.inviteCode });
    showToast('Invite code shared', 'success');
  };

  const shareInvite = async () => {
    if (!household?.inviteCode) return;
    await Share.share({ message: `Join my Larderly household with code: ${household.inviteCode}` });
  };

  const saveHousehold = async () => {
    if (!householdId) return;
    await updateDoc(doc(db, 'households', householdId), {
      allergies: draftAllergies,
      dietaryPrefs: draftDiet,
      updatedAt: serverTimestamp(),
    });
    showToast('Household preferences saved', 'success');
  };


  const changeRole = async (uid: string, newRole: Role) => {
    if (!householdId || role !== 'admin') return;
    await updateDoc(doc(db, 'households', householdId), {
      [`memberRoles.${uid}`]: newRole,
      updatedAt: serverTimestamp(),
    });
    showToast('Role updated', 'success');
  };

  const removeMember = async (uid: string, name: string) => {
    if (!householdId || role !== 'admin') return;
    const ok = await confirm({
      title: `Remove ${name}?`,
      message: 'They will lose access to shared inventory.',
      destructive: true,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    await updateDoc(doc(db, 'households', householdId), {
      members: arrayRemove(uid),
      updatedAt: serverTimestamp(),
    });
    if (user) {
      recordActivity(householdId, {
        verb: 'member.removed',
        target: name,
        actorId: user.uid,
        actorName: user.displayName || 'Admin',
      });
    }
    showToast('Member removed', 'info');
  };

  if (!household) return null;

  const members = household.members.map((uid) => ({
    uid,
    name: household.memberNames[uid] ?? 'Member',
    role: household.memberRoles[uid] ?? 'editor',
  }));

  return (
    <View className="gap-4">
      <Text className="text-lg font-bold text-ink dark:text-[#F6F1EA]">Household</Text>
      <TextField label="Household name" value={household.name} onChangeText={() => {}} editable={false} />
      {household.inviteCode ? (
        <View className="flex-row gap-2">
          <View className="flex-1 rounded-xl border border-line dark:border-[#303541] bg-canvas dark:bg-[#090A0D] px-4 py-3">
            <Text className="text-xs text-muted dark:text-[#9A948D]">Invite code</Text>
            <Text className="font-mono text-lg font-bold tracking-widest text-ink dark:text-[#F6F1EA]">{household.inviteCode}</Text>
          </View>
          <Button label="Copy" size="sm" variant="secondary" onPress={copyInvite} />
          <Button label="Share" size="sm" variant="secondary" onPress={shareInvite} />
        </View>
      ) : null}

      <Text className="text-sm font-semibold text-ink dark:text-[#F6F1EA]">Members</Text>
      {members.map((m) => (
        <View key={m.uid} className="flex-row items-center justify-between rounded-xl border border-line dark:border-[#303541] px-3 py-2">
          <View>
            <Text className="font-medium text-ink dark:text-[#F6F1EA]">{m.name}</Text>
            <Text className="text-xs capitalize text-muted dark:text-[#9A948D]">{m.role}</Text>
          </View>
          {role === 'admin' && m.uid !== user?.uid && (
            <View className="flex-row gap-1">
              {(['editor', 'viewer'] as Role[]).map((r) => (
                <Pressable key={r} onPress={() => changeRole(m.uid, r)} className="rounded-full border border-line dark:border-[#303541] px-2 py-1">
                  <Text className="text-xs capitalize text-ink dark:text-[#F6F1EA]">{r}</Text>
                </Pressable>
              ))}
              <Button label="Remove" size="sm" variant="danger" onPress={() => removeMember(m.uid, m.name)} />
            </View>
          )}
        </View>
      ))}

      <Text className="text-sm font-semibold text-ink dark:text-[#F6F1EA]">Household dietary prefs</Text>
      <View className="flex-row flex-wrap gap-2">
        {DIET_OPTIONS.map((d) => (
          <Pressable
            key={d}
            onPress={() => setDraftDiet((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))}
            className={`rounded-full px-3 py-1.5 ${draftDiet.includes(d) ? 'bg-primary' : 'border border-line dark:border-[#303541]'}`}
          >
            <Text className={`text-xs font-semibold ${draftDiet.includes(d) ? 'text-white' : 'text-ink dark:text-[#F6F1EA]'}`}>{d}</Text>
          </Pressable>
        ))}
      </View>
      <TextField label="Household allergies" value={draftAllergies} onChangeText={setDraftAllergies} />
      <Button label="Save household prefs" variant="secondary" onPress={saveHousehold} />
    </View>
  );
}
