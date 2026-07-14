import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { FeaturePageShell } from '../components/main/FeaturePageShell';
import { SettingsGlass } from '../components/settings/SettingsGlass';
import { SettingsTextField } from '../components/settings/SettingsTextField';
import { SettingsChoiceChip } from '../components/settings/SettingsChoiceChip';
import { settingsType } from '../components/settings/settingsFonts';
import { GlassButton } from '../components/landing/GlassButton';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { useToast } from '../contexts/ToastContext';
import { useGoBack } from '../navigation/useGoBack';
import { useAppColors } from '../hooks/useAppColors';
import { useScale } from '../theme/scale';
import type { Reminder } from '../types/household';

type ReminderDraft = Omit<Reminder, 'id'>;

const PRESETS: Array<{ title: string; type: Reminder['type']; recurringFrequency?: Reminder['recurringFrequency'] }> = [
  { title: 'Check expiring items', type: 'recurring', recurringFrequency: 'daily' },
  { title: 'Weekly grocery run', type: 'recurring', recurringFrequency: 'weekly' },
  { title: 'Restock fridge', type: 'time' },
];

export default function RemindersScreen() {
  const goBack = useGoBack();
  const { s, fs } = useScale();
  const c = useAppColors();
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const { showToast } = useToast();
  const [items, setItems] = useState<Reminder[]>([]);
  const [title, setTitle] = useState('');
  const [freq, setFreq] = useState<Reminder['recurringFrequency']>('daily');
  const storageKey = `larderly:reminders:${householdId ?? user?.uid ?? 'local'}`;

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!alive || !raw) return;
        try {
          setItems(JSON.parse(raw) as Reminder[]);
        } catch {
          // ignore
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [storageKey]);

  const persist = useCallback(
    async (next: Reminder[]) => {
      setItems(next);
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    },
    [storageKey],
  );

  const addReminder = async (draft: ReminderDraft) => {
    const next: Reminder = {
      ...draft,
      id: `r_${Date.now().toString(36)}`,
    };
    await persist([next, ...items]);
    setTitle('');
    showToast('Reminder saved', 'success');
  };

  const toggle = async (id: string) => {
    await persist(items.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)));
  };

  const remove = async (id: string) => {
    await persist(items.filter((r) => r.id !== id));
  };

  return (
    <FeaturePageShell title="Reminders" subtitle="Kitchen schedules" onBack={goBack} variant="stack">
      <SettingsGlass
        elevated
        interactive={false}
        radius={s(18)}
        contentStyle={{ padding: s(14), gap: s(12) }}
      >
        <SettingsTextField
          label="New reminder"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Defrost chicken"
        />
        <XStack style={{ gap: s(8), flexWrap: 'wrap' }}>
          {(['daily', 'weekly', 'monthly'] as const).map((f) => (
            <SettingsChoiceChip
              key={f}
              label={f}
              selected={freq === f}
              onPress={() => setFreq(f)}
            />
          ))}
        </XStack>
        <GlassButton
          label="Add reminder"
          variant="amber"
          onPress={() => {
            const t = title.trim();
            if (!t) {
              showToast('Enter a title', 'warning');
              return;
            }
            void addReminder({
              title: t,
              type: 'recurring',
              recurringFrequency: freq,
              completed: false,
              time: Date.now(),
            });
          }}
        />
      </SettingsGlass>

      <Text style={[settingsType('semibold'), { fontSize: fs(14), color: c.muted }]}>Presets</Text>
      <XStack style={{ gap: s(8), flexWrap: 'wrap' }}>
        {PRESETS.map((p) => (
          <GlassButton
            key={p.title}
            label={p.title}
            variant="light"
            frosted
            onPress={() =>
              void addReminder({
                title: p.title,
                type: p.type,
                recurringFrequency: p.recurringFrequency,
                completed: false,
                time: Date.now(),
              })
            }
          />
        ))}
      </XStack>

      {items.length === 0 ? (
        <Text style={[settingsType('regular'), { fontSize: fs(14), color: c.muted }]}>
          No reminders yet — add one above.
        </Text>
      ) : (
        items.map((r) => (
          <Pressable key={r.id} onPress={() => void toggle(r.id)} onLongPress={() => void remove(r.id)}>
            <SettingsGlass
              elevated
              interactive={false}
              radius={s(16)}
              contentStyle={{ padding: s(14), gap: s(4), opacity: r.completed ? 0.55 : 1 }}
            >
              <XStack style={{ justifyContent: 'space-between', gap: s(8) }}>
                <YStack style={{ flex: 1, minWidth: 0, gap: s(2) }}>
                  <Text
                    style={[
                      settingsType('semibold'),
                      {
                        fontSize: fs(15),
                        color: c.ink,
                        textDecorationLine: r.completed ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {r.title}
                  </Text>
                  <Text style={[settingsType('medium'), { fontSize: fs(12), color: c.muted }]}>
                    {r.recurringFrequency ?? r.type}
                    {r.completed ? ' · done' : ''}
                  </Text>
                </YStack>
                <Text style={[settingsType('semibold'), { fontSize: fs(12), color: c.primary }]}>
                  {r.completed ? 'Undo' : 'Done'}
                </Text>
              </XStack>
            </SettingsGlass>
          </Pressable>
        ))
      )}
    </FeaturePageShell>
  );
}
