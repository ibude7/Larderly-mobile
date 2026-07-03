import { View, Text, Pressable } from 'react-native';
import { usePrefs, Theme, ThemeColor, Language, FontScale } from '../../contexts/PreferencesContext';
import { Currency, UnitSystem } from '../../lib/format';
import { requestNotificationPermission } from '../../lib/push';
import { useToast } from '../../contexts/ToastContext';
import Button from '../ui/Button';

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'];
const THEME_COLORS: ThemeColor[] = ['orange', 'blue', 'green', 'purple', 'rose'];
const LANGUAGES: { id: Language; name: string }[] = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Español' },
  { id: 'fr', name: 'Français' },
];

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-3 py-2 ${active ? 'bg-primary' : 'border border-line bg-canvas'}`}
    >
      <Text className={`text-xs font-bold ${active ? 'text-white' : 'text-ink'}`}>{label}</Text>
    </Pressable>
  );
}

export default function PreferencesSection() {
  const { prefs, setPrefs, setNotificationPref } = usePrefs();
  const { showToast } = useToast();

  const enablePush = async () => {
    const ok = await requestNotificationPermission();
    if (ok) showToast('Notifications enabled', 'success');
    else showToast('Enable notifications in system settings', 'warning');
  };

  return (
    <View className="gap-5">
      <View>
        <Text className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Appearance</Text>
        <View className="flex-row flex-wrap gap-2">
          <Chip label="Light" active={prefs.theme === 'light'} onPress={() => setPrefs({ theme: 'light' as Theme })} />
          <Chip label="Dark" active={prefs.theme === 'dark'} onPress={() => setPrefs({ theme: 'dark' as Theme })} />
        </View>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {THEME_COLORS.map((c) => (
            <Chip key={c} label={c} active={prefs.themeColor === c} onPress={() => setPrefs({ themeColor: c })} />
          ))}
        </View>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {(['sm', 'md', 'lg'] as FontScale[]).map((s) => (
            <Chip key={s} label={`Text ${s}`} active={prefs.fontScale === s} onPress={() => setPrefs({ fontScale: s })} />
          ))}
        </View>
      </View>

      <View>
        <Text className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Region</Text>
        <View className="flex-row flex-wrap gap-2">
          {CURRENCIES.map((c) => (
            <Chip key={c} label={c} active={prefs.currency === c} onPress={() => setPrefs({ currency: c })} />
          ))}
        </View>
        <View className="mt-2 flex-row gap-2">
          <Chip
            label="Imperial"
            active={prefs.units === 'imperial'}
            onPress={() => setPrefs({ units: 'imperial' as UnitSystem })}
          />
          <Chip
            label="Metric"
            active={prefs.units === 'metric'}
            onPress={() => setPrefs({ units: 'metric' as UnitSystem })}
          />
        </View>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <Chip key={l.id} label={l.name} active={prefs.language === l.id} onPress={() => setPrefs({ language: l.id })} />
          ))}
        </View>
      </View>

      <View>
        <Text className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Notifications</Text>
        <Button label="Enable push notifications" variant="secondary" size="sm" onPress={enablePush} />
        <View className="mt-3 gap-2">
          {(
            [
              ['expiration', 'Expiration alerts'],
              ['lowStock', 'Low stock'],
              ['activity', 'Household activity'],
              ['recipes', 'Recipe ideas'],
              ['budget', 'Budget alerts'],
              ['achievements', 'Achievements'],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setNotificationPref(key, !prefs.notifications[key])}
              className="flex-row items-center justify-between rounded-xl border border-line bg-canvas px-3 py-2.5"
            >
              <Text className="text-sm text-ink">{label}</Text>
              <Text className="text-xs font-bold text-primary">{prefs.notifications[key] ? 'On' : 'Off'}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Privacy</Text>
        <Pressable
          onPress={() => setPrefs({ privacy: { ...prefs.privacy, analytics: !prefs.privacy.analytics } })}
          className="flex-row items-center justify-between rounded-xl border border-line bg-canvas px-3 py-2.5"
        >
          <Text className="text-sm text-ink">Usage analytics</Text>
          <Text className="text-xs font-bold text-primary">{prefs.privacy.analytics ? 'On' : 'Off'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
