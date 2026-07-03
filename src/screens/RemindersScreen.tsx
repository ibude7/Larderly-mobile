import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../lib/firebase';
import { Reminder } from '../types/household';
import { colors } from '../theme';

export default function RemindersScreen() {
  const navigation = useNavigation<any>();
  const { householdId } = useAuth();
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
    <View className="flex-1 bg-canvas">
      <AppHeader title="Reminders" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Button label={showAdd ? 'Cancel' : 'Add reminder'} onPress={() => setShowAdd(!showAdd)} className="mb-4" />
        {showAdd && (
          <View className="mb-6 rounded-2xl border border-line bg-surface p-4">
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
            <View key={r.id} className="mb-2 flex-row items-center gap-3 rounded-2xl border border-line bg-surface p-4">
              <Pressable onPress={() => toggleComplete(r)}>
                <Icon name={r.completed ? 'success' : 'clock'} size={22} color={r.completed ? colors.success : colors.muted} />
              </Pressable>
              <View className="flex-1">
                <Text className={`font-semibold ${r.completed ? 'text-muted line-through' : 'text-ink'}`}>{r.title}</Text>
                <Text className="text-xs capitalize text-muted">{r.type}</Text>
              </View>
              <Pressable onPress={() => deleteReminder(r.id)}>
                <Icon name="trash" size={18} color={colors.danger} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
