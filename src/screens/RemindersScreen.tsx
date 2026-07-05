import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../navigation/types';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import AppHeader from '../components/layout/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import SelectField from '../components/ui/SelectField';
import { Icon } from '../components/ui/Icon';
import { useHousehold } from '../contexts/HouseholdContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../lib/firebase';
import { Reminder } from '../types/household';
import { useAppColors } from '../hooks/useAppColors';

export default function RemindersScreen() {
  const c = useAppColors();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { householdId } = useHousehold();
  const { showToast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Reminder['type']>('time');

  useEffect(() => {
    if (!householdId) return;
    const q = query(collection(db, 'households', householdId, 'reminders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setReminders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reminder)));
    }, () => {
      onSnapshot(collection(db, 'households', householdId, 'reminders'), (snap) => {
        setReminders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reminder)));
      });
    });
    return unsub;
  }, [householdId]);

  const handleAdd = async () => {
    if (!householdId || !title.trim()) return;
    try {
      await addDoc(collection(db, 'households', householdId, 'reminders'), {
        title: title.trim(),
        type,
        completed: false,
        time: type === 'time' || type === 'recurring' ? Date.now() + 86400000 : undefined,
        recurringFrequency: type === 'recurring' ? 'weekly' : undefined,
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setShowAdd(false);
      showToast('Reminder added', 'success');
    } catch {
      showToast('Failed to add reminder', 'error');
    }
  };

  const toggleComplete = async (r: Reminder) => {
    if (!householdId) return;
    await updateDoc(doc(db, 'households', householdId, 'reminders', r.id), { completed: !r.completed });
  };

  const deleteReminder = async (id: string) => {
    if (!householdId) return;
    await deleteDoc(doc(db, 'households', householdId, 'reminders', id));
  };

  return (
    <View className="flex-1 bg-canvas dark:bg-[#0F0F13]">
      <AppHeader title="Reminders" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Button label={showAdd ? 'Cancel' : 'Add reminder'} onPress={() => setShowAdd(!showAdd)} className="mb-4" />
        {showAdd && (
          <View className="mb-6 rounded-2xl border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22] p-4">
            <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Check expiry dates" />
            <SelectField
              label="Type"
              value={type}
              onChange={(v) => setType(v as Reminder['type'])}
              options={[
                { label: 'Time', value: 'time' },
                { label: 'Recurring', value: 'recurring' },
                { label: 'Location', value: 'location' },
                { label: 'Recipe', value: 'recipe' },
              ]}
            />
            <Button label="Save" onPress={handleAdd} disabled={!title.trim()} className="mt-2" />
          </View>
        )}
        {reminders.length === 0 ? (
          <EmptyState icon="clock" title="No reminders" description="Add a reminder to stay on top of your kitchen." />
        ) : (
          reminders.map((r) => (
            <View key={r.id} className="mb-2 flex-row items-center gap-3 rounded-2xl border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22] p-4">
              <Pressable onPress={() => toggleComplete(r)}>
                <Icon name={r.completed ? 'success' : 'clock'} size={22} color={r.completed ? c.success : c.muted} />
              </Pressable>
              <View className="flex-1">
                <Text className={`font-semibold ${r.completed ? 'text-muted dark:text-[#6B6878] line-through' : 'text-ink dark:text-[#F0EEE9]'}`}>{r.title}</Text>
                <Text className="text-xs capitalize text-muted dark:text-[#6B6878]">{r.type}</Text>
              </View>
              <Pressable onPress={() => deleteReminder(r.id)}>
                <Icon name="trash" size={18} color={c.danger} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
