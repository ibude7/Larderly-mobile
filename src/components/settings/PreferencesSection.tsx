import { View, Text, Pressable, useColorScheme } from 'react-native';
import { usePrefs, Theme, ThemeColor, Language, FontScale } from '../../contexts/PreferencesContext';
import { Currency, UnitSystem } from '../../lib/format';
import { requestNotificationPermission } from '../../lib/push';
import { useToast } from '../../contexts/ToastContext';
import { useAppColors } from '../../hooks/useAppColors';
import { Icon, IconName } from '../ui/Icon';
import Button from '../ui/Button';

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'];
const THEME_COLORS: ThemeColor[] = ['orange', 'blue', 'green', 'purple', 'rose'];
const LANGUAGES: { id: Language; name: string }[] = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Español' },
  { id: 'fr', name: 'Français' },
];

const THEME_OPTIONS: { value: Theme; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'phone' },
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
      className={`rounded-full px-3 py-2 ${active ? 'bg-primary' : 'border border-line dark:border-[#303541] bg-canvas dark:bg-[#090A0D]'}`}
    >
      <Text className={`text-xs font-bold ${active ? 'text-white' : 'text-ink dark:text-[#F6F1EA]'}`}>{label}</Text>
    </Pressable>
  );
}

export default function PreferencesSection() {
  const { prefs, setPrefs, setNotificationPref } = usePrefs();
  const { showToast } = useToast();
  const c = useAppColors();
  const systemScheme = useColorScheme();

  const enablePush = async () => {
    const ok = await requestNotificationPermission();
    if (ok) showToast('Notifications enabled', 'success');
    else showToast('Enable notifications in system settings', 'warning');
  };

  return (
    <View className="gap-5">
      <View>
        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-[#9A948D]">Appearance</Text>
        <View className="gap-2">
          {THEME_OPTIONS.map((opt) => {
            const active = prefs.theme === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setPrefs({ theme: opt.value })}
                className={`flex-row items-center gap-3 rounded-xl border px-3 py-2.5 ${
                  active ? 'border-primary bg-primary/10' : 'border-line dark:border-[#303541] bg-canvas dark:bg-[#090A0D]'
                }`}
              >
                <Icon name={opt.icon} size={18} color={active ? c.primary : c.muted} />
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: active ? c.primary : c.ink }}
                  >
                    {opt.label}
                  </Text>
                  {opt.value === 'system' ? (
                    <Text style={{ fontSize: 11, color: c.muted }}>
                      Currently {systemScheme ?? 'unknown'}
                    </Text>
                  ) : null}
                </View>
                {active ? <Icon name="check" size={16} color={c.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {THEME_COLORS.map((color) => (
            <Chip key={color} label={color} active={prefs.themeColor === color} onPress={() => setPrefs({ themeColor: color })} />
          ))}
        </View>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {(['sm', 'md', 'lg'] as FontScale[]).map((s) => (
            <Chip key={s} label={`Text ${s}`} active={prefs.fontScale === s} onPress={() => setPrefs({ fontScale: s })} />
          ))}
        </View>
      </View>

      <View>
        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-[#9A948D]">Region</Text>
        <View className="flex-row flex-wrap gap-2">
          {CURRENCIES.map((currency) => (
            <Chip key={currency} label={currency} active={prefs.currency === currency} onPress={() => setPrefs({ currency: currency })} />
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
        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-[#9A948D]">Notifications</Text>
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
              className="flex-row items-center justify-between rounded-xl border border-line dark:border-[#303541] bg-canvas dark:bg-[#090A0D] px-3 py-2.5"
            >
              <Text className="text-sm text-ink dark:text-[#F6F1EA]">{label}</Text>
              <Text className="text-xs font-bold text-primary">{prefs.notifications[key] ? 'On' : 'Off'}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-[#9A948D]">Privacy</Text>
        <Pressable
          onPress={() => setPrefs({ privacy: { ...prefs.privacy, analytics: !prefs.privacy.analytics } })}
          className="flex-row items-center justify-between rounded-xl border border-line dark:border-[#303541] bg-canvas dark:bg-[#090A0D] px-3 py-2.5"
        >
          <Text className="text-sm text-ink dark:text-[#F6F1EA]">Usage analytics</Text>
          <Text className="text-xs font-bold text-primary">{prefs.privacy.analytics ? 'On' : 'Off'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
