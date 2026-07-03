import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
} from '@react-native-firebase/firestore';
import AppHeader from '../components/layout/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../lib/firebase';
import { relativeTime } from '../lib/format';
import type { NotificationKind } from '../lib/notifications';
import { colors } from '../theme';

interface NotifItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  createdAt?: { toMillis?: () => number };
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<NotifItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotifItem)));
    });
    return unsub;
  }, [user]);

  const visible = filter === 'unread' ? items.filter((i) => !i.read) : items;

  const markRead = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { read: true });
  };

  const markAllRead = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    items.filter((i) => !i.read).forEach((i) => batch.update(doc(db, 'users', user.uid, 'notifications', i.id), { read: true }));
    await batch.commit();
    showToast('All marked as read', 'success');
  };

  const clearAll = async () => {
    if (!user) return;
    const snap = await getDocs(collection(db, 'users', user.uid, 'notifications'));
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    showToast('Notifications cleared', 'info');
  };

  return (
    <View className="flex-1 bg-canvas">
      <AppHeader title="Notifications" onBack={() => navigation.goBack()} />
      <View className="flex-row gap-2 px-5 py-3">
        {(['all', 'unread'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className={`rounded-full px-4 py-2 ${filter === f ? 'bg-ink' : 'border border-line bg-surface'}`}
          >
            <Text className={`text-sm font-semibold capitalize ${filter === f ? 'text-white' : 'text-ink'}`}>{f}</Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row gap-2 px-5 pb-3">
        <Button size="sm" label="Mark all read" variant="secondary" onPress={markAllRead} />
        <Button size="sm" label="Clear" variant="ghost" onPress={clearAll} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {visible.length === 0 ? (
          <EmptyState icon="bell" title="No notifications" description="You're all caught up." />
        ) : (
          visible.map((n) => (
            <Pressable
              key={n.id}
              onPress={() => markRead(n.id)}
              className={`mb-2 rounded-2xl border p-4 ${n.read ? 'border-line bg-surface' : 'border-primary/30 bg-primary/5'}`}
            >
              <View className="flex-row items-start gap-3">
                <Icon name="bell" size={18} color={colors.primary} />
                <View className="flex-1">
                  <Text className="font-semibold text-ink">{n.title}</Text>
                  <Text className="mt-1 text-sm text-muted">{n.body}</Text>
                  <Text className="mt-2 text-xs text-muted">{relativeTime(n.createdAt)}</Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
