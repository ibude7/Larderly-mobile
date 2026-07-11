import { useState } from 'react';
import { View } from 'react-native';
import { useGoBack } from '../../navigation/useGoBack';
import { SettingsPageShell } from '../../components/settings/SettingsPageShell';
import { SettingsFieldLabel } from '../../components/settings/SettingsFieldLabel';
import { SettingsBodyText } from '../../components/settings/SettingsBodyText';
import { StorageLocationsSection, deleteStorageLocation } from '../../components/settings/StorageLocationsSection';
import { DataExportSection } from '../../components/settings/DataExportSection';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { SETTINGS_SECTION_COLORS } from '../../components/settings/settingsHelpers';
import { useHousehold } from '../../contexts/HouseholdContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useToast } from '../../contexts/ToastContext';
import { useScale } from '../../theme/scale';

const ACCENT = SETTINGS_SECTION_COLORS.data;

export default function SettingsDataScreen() {
  const goBack = useGoBack();
  const { s } = useScale();
  const { householdId, role, canEdit } = useHousehold();
  const { refetch } = useInventory();
  const { showToast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!pendingDelete || !householdId) return;
    if (!canEdit || role === 'viewer') {
      showToast('View-only access', 'warning');
      setPendingDelete(null);
      return;
    }
    setDeleting(true);
    const ok = await deleteStorageLocation(
      householdId,
      pendingDelete.id,
      pendingDelete.name,
      role,
      refetch,
      showToast,
    );
    setDeleting(false);
    if (ok) setPendingDelete(null);
  };

  return (
    <SettingsPageShell title="Data & export" subtitle="Locations and backups" onBack={goBack}>
      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={ACCENT}>Storage locations</SettingsFieldLabel>
        {householdId ? (
          <StorageLocationsSection
            onRequestDelete={(location) => {
              if (!canEdit || role === 'viewer') {
                showToast('View-only access', 'warning');
                return;
              }
              setPendingDelete(location);
            }}
          />
        ) : (
          <SettingsBodyText>
            Join or create a household first — storage locations are shared with your household.
          </SettingsBodyText>
        )}
      </View>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={ACCENT}>Export</SettingsFieldLabel>
        <DataExportSection />
      </View>

      <ConfirmDialog
        isOpen={!!pendingDelete}
        onClose={() => !deleting && setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
        busy={deleting}
        title="Delete storage location"
        description={`Delete ${pendingDelete?.name}? Items stored there will be unassigned.`}
        confirmLabel="Delete location"
        cancelLabel="Keep"
      />
    </SettingsPageShell>
  );
}
