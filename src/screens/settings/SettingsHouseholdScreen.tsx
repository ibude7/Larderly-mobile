import { useState } from 'react';
import { Home } from '../../components/ui/Glyph';
import { YStack } from 'tamagui';
import { useGoBack } from '../../navigation/useGoBack';
import { SettingsPageShell } from '../../components/settings/SettingsPageShell';
import { SettingsEmptyState } from '../../components/settings/SettingsEmptyState';
import { SettingsFieldLabel } from '../../components/settings/SettingsFieldLabel';
import { SettingsActionButton } from '../../components/settings/SettingsActionButton';
import { SettingsSurface } from '../../components/settings/SettingsSurface';
import { SettingsTextField } from '../../components/settings/SettingsTextField';
import { HouseholdSection } from '../../components/settings/HouseholdSection';
import { useHouseholdSettings } from '../../hooks/useHouseholdSettings';
import { useToast } from '../../contexts/ToastContext';
import { useScale } from '../../theme/scale';

export default function SettingsHouseholdScreen() {
  const goBack = useGoBack();
  const { s } = useScale();
  const { showToast } = useToast();
  const settings = useHouseholdSettings();
  const { householdId, pendingAction, createHousehold, joinHousehold } = settings;
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const creating = pendingAction === 'create';
  const joining = pendingAction === 'join';

  const handleCreate = async () => {
    try {
      await createHousehold(createName);
      showToast('Household created', 'success');
      setCreateName('');
    } catch (err) {
      if (err instanceof Error) showToast(err.message, 'error');
    }
  };

  const handleJoin = async () => {
    try {
      await joinHousehold(joinCode);
      showToast('Joined household', 'success');
      setJoinCode('');
    } catch (err) {
      if (err instanceof Error) showToast(err.message, 'error');
    }
  };

  return (
    <SettingsPageShell title="Household" subtitle="Access and members" onBack={goBack}>
      {householdId ? (
        <HouseholdSection settings={settings} />
      ) : (
        <YStack style={{ gap: s(16) }}>
          <SettingsEmptyState
            title="No household yet"
            body="Create one for your kitchen or join with an 8-character invite code."
            icon={Home}
          />

          <SettingsSurface contentStyle={{ padding: s(16), gap: s(12) }}>
            <SettingsFieldLabel>Create</SettingsFieldLabel>
            <SettingsTextField
              label="Household name"
              value={createName}
              onChangeText={setCreateName}
              placeholder="e.g. Home kitchen"
              editable={!creating && !joining}
            />
            <SettingsActionButton
              label={creating ? 'Creating…' : 'Create household'}
              tone="primary"
              loading={creating}
              disabled={creating || joining || !createName.trim()}
              onPress={() => void handleCreate()}
            />
          </SettingsSurface>

          <SettingsSurface contentStyle={{ padding: s(16), gap: s(12) }}>
            <SettingsFieldLabel>Join</SettingsFieldLabel>
            <SettingsTextField
              label="Invite code"
              value={joinCode}
              onChangeText={(value) => setJoinCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
              placeholder="8-character code"
              autoCapitalize="characters"
              editable={!creating && !joining}
            />
            <SettingsActionButton
              label={joining ? 'Joining…' : 'Join household'}
              loading={joining}
              disabled={creating || joining || joinCode.trim().length !== 8}
              onPress={() => void handleJoin()}
            />
          </SettingsSurface>
        </YStack>
      )}
    </SettingsPageShell>
  );
}
