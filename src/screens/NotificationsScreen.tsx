import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
  doc,
  updateDoc,
} from '@react-native-firebase/firestore';
import { Text, XStack, YStack } from 'tamagui';
import { FeaturePageShell } from '../components/main/FeaturePageShell';
import { SettingsGlass } from '../components/settings/SettingsGlass';
import { settingsType } from '../components/settings/settingsFonts';
import { GlassButton } from '../components/landing/GlassButton';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import type { NotificationKind } from '../lib/notifications';
import { useGoBack } from '../navigation/useGoBack';
import { useAppColors } from '../hooks/useAppColors';
import { useScale } from '../theme/scale';
import { useNavigation } from '@react-navigation/native';
import type { MainStackNavigationProp } from '../navigation/types';

interface InboxItem {
  id: string;
  kind: NotificationKind | string;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt?: number;
}

export default function NotificationsScreen() {
  const goBack = useGoBack();
  const navigation = useNavigation<MainStackNavigationProp>();
  const { s, fs } = useScale();
  const c = useAppColors();
  const { user } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(
          snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            const created = data.createdAt as { toMillis?: () => number } | undefined;
            return {
              id: d.id,
              kind: String(data.kind ?? 'system'),
              title: String(data.title ?? 'Notification'),
              body: String(data.body ?? ''),
              read: Boolean(data.read),
              link: typeof data.link === 'string' ? data.link : undefined,
              createdAt: created?.toMillis?.(),
            };
          }),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [user?.uid]);

  const markRead = async (id: string) => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { read: true });
    } catch {
      // ignore
    }
  };

  const unread = items.filter((i) => !i.read).length;

  return (
    <FeaturePageShell
      title="Notifications"
      subtitle={loading ? 'Loading…' : unread ? `${unread} unread` : 'All caught up'}
      onBack={goBack}
      variant="stack"
    >
      <GlassButton
        label="Notification settings"
        variant="light"
        frosted
        onPress={() => navigation.navigate('SettingsNotifications')}
      />

      {items.length === 0 && !loading ? (
        <SettingsGlass
          elevated
          interactive={false}
          radius={s(18)}
          contentStyle={{ padding: s(16), gap: s(6) }}
        >
          <Text style={[settingsType('semibold'), { fontSize: fs(16), color: c.ink }]}>
            Inbox is quiet
          </Text>
          <Text style={[settingsType('regular'), { fontSize: fs(14), color: c.muted, lineHeight: fs(20) }]}>
            Expiry alerts, household activity, and achievements will show up here.
          </Text>
        </SettingsGlass>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (!item.read) void markRead(item.id);
            }}
          >
            <SettingsGlass
              elevated
              interactive={false}
              radius={s(16)}
              contentStyle={{
                padding: s(14),
                gap: s(4),
                opacity: item.read ? 0.72 : 1,
              }}
            >
              <XStack style={{ justifyContent: 'space-between', gap: s(8) }}>
                <Text
                  style={[settingsType('semibold'), { fontSize: fs(14), color: c.ink, flex: 1 }]}
                >
                  {item.title}
                </Text>
                {!item.read ? (
                  <XStack
                    style={{
                      width: s(8),
                      height: s(8),
                      borderRadius: s(99),
                      backgroundColor: c.primary,
                      marginTop: s(4),
                    }}
                  />
                ) : null}
              </XStack>
              {item.body ? (
                <Text style={[settingsType('regular'), { fontSize: fs(13), color: c.muted }]}>
                  {item.body}
                </Text>
              ) : null}
              <Text
                style={[
                  settingsType('medium'),
                  { fontSize: fs(11), color: c.muted, textTransform: 'capitalize' },
                ]}
              >
                {item.kind.replace(/_/g, ' ')}
              </Text>
            </SettingsGlass>
          </Pressable>
        ))
      )}
    </FeaturePageShell>
  );
}
