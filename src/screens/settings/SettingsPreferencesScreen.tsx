import { View } from 'react-native';
import {
  Coins,
  Eye,
  Globe2,
  Palette,
  RotateCcw,
  Ruler,
  Sparkles,
  Type,
  ZapOff,
} from 'lucide-react-native';
import { useGoBack } from '../../navigation/useGoBack';
import { SettingsPageShell } from '../../components/settings/SettingsPageShell';
import { SettingsFieldLabel } from '../../components/settings/SettingsFieldLabel';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { SettingsRowGroup } from '../../components/settings/SettingsRowGroup';
import { SettingsSwitch } from '../../components/settings/SettingsSwitch';
import { SettingsPickerRow } from '../../components/settings/SettingsPickerRow';
import { ThemeToggleRow } from '../../components/settings/ThemeToggleRow';
import { FeatureShortcutsSection } from '../../components/settings/FeatureShortcutsSection';
import { SETTINGS_SECTION_COLORS } from '../../components/settings/settingsHelpers';
import { useConfirm } from '../../contexts/ConfirmContext';
import {
  usePrefs,
  ThemeColor,
  Language,
  FontScale,
} from '../../contexts/PreferencesContext';
import { useToast } from '../../contexts/ToastContext';
import type { Currency } from '../../lib/format';
import { usePreferenceFormatters } from '../../hooks/usePreferenceFormatters';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

const ACCENT = SETTINGS_SECTION_COLORS.preferences;

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'];
const LANGUAGES: { id: Language; name: string }[] = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Español' },
  { id: 'fr', name: 'Français' },
];
const FONT_SCALES: { id: FontScale; label: string }[] = [
  { id: 'sm', label: 'Small' },
  { id: 'md', label: 'Medium' },
  { id: 'lg', label: 'Large' },
];
const THEME_COLOR_HEX: Record<ThemeColor, string> = {
  orange: '#C2662D',
  blue: '#5B7B93',
  green: '#6E8B5A',
  purple: '#8B6B9E',
  rose: '#B5573F',
};
const THEME_COLORS: { id: ThemeColor; label: string; color: string }[] = (
  Object.keys(THEME_COLOR_HEX) as ThemeColor[]
).map((id) => ({ id, label: id[0].toUpperCase() + id.slice(1), color: THEME_COLOR_HEX[id] }));

export default function SettingsPreferencesScreen() {
  const goBack = useGoBack();
  const { s } = useScale();
  const c = useSettingsTheme();
  const { prefs, setPrefs, reset } = usePrefs();
  const formatters = usePreferenceFormatters();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const resetPreferences = async () => {
    const approved = await confirm({
      title: 'Reset preferences?',
      message:
        'This restores appearance, units, notification choices, privacy options, and accessibility settings to their defaults. Account and pantry data are not removed.',
      confirmLabel: 'Reset preferences',
      destructive: true,
    });
    if (!approved) return;
    reset();
    showToast('Preferences reset', 'success');
  };

  return (
    <SettingsPageShell title="Preferences" subtitle="Appearance, region, and privacy" onBack={goBack}>
      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={ACCENT}>Appearance</SettingsFieldLabel>
        <ThemeToggleRow value={prefs.theme} onChange={(theme) => setPrefs({ theme })} />
        <SettingsRowGroup accent={ACCENT}>
          <SettingsPickerRow
            icon={Palette}
            iconColor={ACCENT}
            label="Accent color"
            value={prefs.themeColor}
            valueLabel={THEME_COLORS.find((color) => color.id === prefs.themeColor)?.label ?? 'Orange'}
            options={THEME_COLORS}
            onChange={(themeColor) => setPrefs({ themeColor })}
          />
          <SettingsPickerRow
            icon={Type}
            iconColor={ACCENT}
            label="Text size"
            value={prefs.fontScale}
            valueLabel={FONT_SCALES.find((f) => f.id === prefs.fontScale)?.label ?? 'Medium'}
            options={FONT_SCALES}
            onChange={(fontScale) => setPrefs({ fontScale })}
          />
        </SettingsRowGroup>
      </View>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={ACCENT}>Region</SettingsFieldLabel>
        <SettingsRowGroup accent={ACCENT}>
          <SettingsRow
            icon={Ruler}
            iconColor={ACCENT}
            label="Imperial units"
            subtitle={
              prefs.units === 'imperial'
                ? `lb, oz, °F · e.g. ${formatters.measurement(1, 'mass')}`
                : `kg, g, °C · e.g. ${formatters.measurement(1, 'mass')}`
            }
            trailing={
              <SettingsSwitch
                value={prefs.units === 'imperial'}
                onValueChange={(v) => setPrefs({ units: v ? 'imperial' : 'metric' })}
                accessibilityLabel="Use imperial units"
              />
            }
          />
          <SettingsPickerRow
            icon={Coins}
            iconColor={ACCENT}
            label="Currency"
            value={prefs.currency}
            valueLabel={`${prefs.currency} · ${formatters.currencyValue(12.5)}`}
            options={CURRENCIES.map((id) => ({ id, label: id }))}
            onChange={(currency) => setPrefs({ currency })}
          />
          <SettingsPickerRow
            icon={Globe2}
            iconColor={ACCENT}
            label="Language"
            value={prefs.language}
            valueLabel={LANGUAGES.find((l) => l.id === prefs.language)?.name ?? 'English'}
            options={LANGUAGES.map((l) => ({ id: l.id, label: l.name }))}
            onChange={(language) => setPrefs({ language })}
          />
        </SettingsRowGroup>
      </View>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={ACCENT}>Accessibility</SettingsFieldLabel>
        <SettingsRowGroup accent={ACCENT}>
          <SettingsRow
            icon={ZapOff}
            iconColor={ACCENT}
            label="Reduce motion"
            subtitle="Minimize animations and spring effects."
            trailing={
              <SettingsSwitch
                value={prefs.reduceMotion}
                onValueChange={(reduceMotion) => setPrefs({ reduceMotion })}
                accessibilityLabel="Reduce motion"
              />
            }
          />
          <SettingsRow
            icon={Eye}
            iconColor={c.muted}
            label="Color vision modes"
            subtitle="Not available yet — coming in a future update."
            disabled
          />
        </SettingsRowGroup>
      </View>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={ACCENT}>Privacy</SettingsFieldLabel>
        <SettingsRowGroup accent={ACCENT}>
          <SettingsRow
            icon={Globe2}
            iconColor={ACCENT}
            label="Usage analytics"
            subtitle="Anonymous product usage events."
            trailing={
              <SettingsSwitch
                value={prefs.privacy.analytics}
                onValueChange={(v) =>
                  setPrefs({ privacy: { ...prefs.privacy, analytics: v } })
                }
                accessibilityLabel="Usage analytics"
              />
            }
          />
          <SettingsRow
            icon={Sparkles}
            iconColor={c.muted}
            label="Personalized ads"
            subtitle="Not available — Larderly does not show ads."
            disabled
          />
        </SettingsRowGroup>
      </View>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={c.danger}>Defaults</SettingsFieldLabel>
        <SettingsRowGroup>
          <SettingsRow
            icon={RotateCcw}
            label="Reset preferences"
            subtitle="Restore appearance, units, privacy, and accessibility defaults."
            danger
            onPress={() => void resetPreferences()}
          />
        </SettingsRowGroup>
      </View>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={ACCENT}>Explore</SettingsFieldLabel>
        <FeatureShortcutsSection />
      </View>
    </SettingsPageShell>
  );
}
