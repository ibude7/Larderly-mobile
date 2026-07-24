import {
  Eye,
  Globe2,
  Palette,
  RotateCcw,
  Ruler,
  Sparkles,
  Type,
  Wallet,
  ZapOff,
} from '../../components/ui/Glyph';
import { YStack } from 'tamagui';
import { useGoBack } from '../../navigation/useGoBack';
import { SettingsPageShell } from '../../components/settings/SettingsPageShell';
import { SettingsFieldLabel } from '../../components/settings/SettingsFieldLabel';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { SettingsRowGroup } from '../../components/settings/SettingsRowGroup';
import { SettingsSwitch } from '../../components/settings/SettingsSwitch';
import { SettingsPickerRow } from '../../components/settings/SettingsPickerRow';
import { ThemeToggleRow } from '../../components/settings/ThemeToggleRow';
import { FeatureShortcutsSection } from '../../components/settings/FeatureShortcutsSection';
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
import { THEME_COLOR_TOKENS } from '../../theme/accent';

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
  orange: THEME_COLOR_TOKENS.orange.primary,
  blue: THEME_COLOR_TOKENS.blue.primary,
  green: THEME_COLOR_TOKENS.green.primary,
  purple: THEME_COLOR_TOKENS.purple.primary,
  rose: THEME_COLOR_TOKENS.rose.primary,
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
      <YStack style={{ gap: s(8) }}>
        <SettingsFieldLabel>Appearance</SettingsFieldLabel>
        <ThemeToggleRow value={prefs.theme} onChange={(theme) => setPrefs({ theme })} />
        <SettingsRowGroup>
          <SettingsPickerRow
            icon={Palette}
            label="Accent color"
            value={prefs.themeColor}
            valueLabel={THEME_COLORS.find((color) => color.id === prefs.themeColor)?.label ?? 'Orange'}
            options={THEME_COLORS}
            onChange={(themeColor) => setPrefs({ themeColor })}
          />
          <SettingsPickerRow
            icon={Type}
            label="Text size"
            value={prefs.fontScale}
            valueLabel={FONT_SCALES.find((f) => f.id === prefs.fontScale)?.label ?? 'Medium'}
            options={FONT_SCALES}
            onChange={(fontScale) => setPrefs({ fontScale })}
          />
        </SettingsRowGroup>
      </YStack>

      <YStack style={{ gap: s(8) }}>
        <SettingsFieldLabel>Region</SettingsFieldLabel>
        <SettingsRowGroup>
          <SettingsRow
            icon={Ruler}
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
            icon={Wallet}
            label="Currency"
            value={prefs.currency}
            valueLabel={`${prefs.currency} · ${formatters.currencyValue(12.5)}`}
            options={CURRENCIES.map((id) => ({ id, label: id }))}
            onChange={(currency) => setPrefs({ currency })}
          />
          <SettingsPickerRow
            icon={Globe2}
            label="Language"
            value={prefs.language}
            valueLabel={LANGUAGES.find((l) => l.id === prefs.language)?.name ?? 'English'}
            options={LANGUAGES.map((l) => ({ id: l.id, label: l.name }))}
            onChange={(language) => setPrefs({ language })}
          />
        </SettingsRowGroup>
      </YStack>

      <YStack style={{ gap: s(8) }}>
        <SettingsFieldLabel>Accessibility</SettingsFieldLabel>
        <SettingsRowGroup>
          <SettingsRow
            icon={ZapOff}
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
      </YStack>

      <YStack style={{ gap: s(8) }}>
        <SettingsFieldLabel>Privacy</SettingsFieldLabel>
        <SettingsRowGroup>
          <SettingsRow
            icon={Globe2}
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
      </YStack>

      <YStack style={{ gap: s(8) }}>
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
      </YStack>

      <YStack style={{ gap: s(8) }}>
        <SettingsFieldLabel>Explore</SettingsFieldLabel>
        <FeatureShortcutsSection />
      </YStack>
    </SettingsPageShell>
  );
}
