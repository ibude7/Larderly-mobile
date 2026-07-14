import { useState } from 'react';
import { Pressable } from 'react-native';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
  writeBatch,
} from '@react-native-firebase/firestore';
import { Trash2 } from '../ui/Glyph';
import { View, XStack, YStack } from 'tamagui';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { useHousehold } from '../../contexts/HouseholdContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useToast } from '../../contexts/ToastContext';
import { db } from '../../lib/firebase';
import { resolveStorageLocationIcon } from '../../lib/appIcons';
import { StorageLocation } from '../../types';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { SettingsActionButton } from './SettingsActionButton';
import { SettingsBodyText } from './SettingsBodyText';
import { SettingsFieldLabel } from './SettingsFieldLabel';
import { SettingsSurface } from './SettingsSurface';
import { SettingsTextField } from './SettingsTextField';
import { LOCATION_COLORS } from './settingsHelpers';

interface StorageLocationsSectionProps {
  onRequestDelete: (location: { id: string; name: string }) => void;
}

export function StorageLocationsSection({ onRequestDelete }: StorageLocationsSectionProps) {
  const { s, fs } = useScale();
  const c = useSettingsTheme();
  const { user } = useAuth();
  const { householdId, role, canEdit } = useHousehold();
  const { locations, refetch } = useInventory();
  const { showToast } = useToast();
  const [newLocName, setNewLocName] = useState('');
  const [newLocColor, setNewLocColor] = useState<string>(LOCATION_COLORS[2]);
  const [addingLoc, setAddingLoc] = useState(false);

  const handleAddLocation = async () => {
    if (!newLocName.trim() || !user || !householdId) return;
    if (!canEdit || role === 'viewer') {
      showToast('View-only access', 'warning');
      return;
    }
    try {
      const colRef = collection(db, 'households', householdId, 'storageLocations');
      const ref = doc(colRef);
      await setDoc(ref, {
        userId: user.uid,
        name: newLocName.trim(),
        icon: 'package',
        color: newLocColor,
        createdAt: serverTimestamp(),
      });
      showToast(`${newLocName} location added`, 'success');
      setNewLocName('');
      setAddingLoc(false);
      refetch();
    } catch {
      showToast('Failed to add location', 'error');
    }
  };

  return (
    <YStack style={{ gap: s(12) }}>
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: s(8) }}>
        <SettingsBodyText style={{ flex: 1 }}>Pantry, fridge, freezer, and more.</SettingsBodyText>
        {canEdit ? (
          <SettingsActionButton
            label={addingLoc ? 'Cancel' : 'Add'}
            onPress={() => setAddingLoc((v) => !v)}
            style={{ paddingHorizontal: s(12), paddingVertical: s(6), minHeight: undefined }}
          />
        ) : null}
      </XStack>

      {!canEdit ? (
        <SettingsBodyText>View-only members cannot add or delete storage locations.</SettingsBodyText>
      ) : null}

      {addingLoc && canEdit ? (
        <SettingsSurface contentStyle={{ padding: s(12), gap: s(12) }}>
          <SettingsTextField
            label="Location name"
            value={newLocName}
            onChangeText={setNewLocName}
            placeholder="Location name…"
          />
          <SettingsFieldLabel>Color</SettingsFieldLabel>
          <XStack style={{ flexWrap: 'wrap', gap: s(8) }}>
            {LOCATION_COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => setNewLocColor(color)}
                accessibilityRole="button"
                accessibilityLabel={`Color ${color}`}
                accessibilityState={{ selected: newLocColor === color }}
                style={{
                  width: s(36),
                  height: s(36),
                  borderRadius: s(18),
                  backgroundColor: color,
                  borderWidth: newLocColor === color ? 2 : 0,
                  borderColor: c.ink,
                }}
              />
            ))}
          </XStack>
          <SettingsActionButton
            label="Add location"
            tone="primary"
            disabled={!newLocName.trim()}
            onPress={() => void handleAddLocation()}
          />
        </SettingsSurface>
      ) : null}

      {locations.length === 0 ? (
        <SettingsBodyText style={{ textAlign: 'center' }}>
          No storage locations yet
          {canEdit ? '. Tap Add to create one.' : '.'}
        </SettingsBodyText>
      ) : (
        <YStack style={{ gap: s(8) }}>
          {locations.map((loc) => (
            <LocationRow
              key={loc.id}
              location={loc}
              canDelete={canEdit && role !== 'viewer'}
              onDelete={() => onRequestDelete({ id: loc.id, name: loc.name })}
            />
          ))}
        </YStack>
      )}
    </YStack>
  );
}

function LocationRow({
  location,
  canDelete,
  onDelete,
}: {
  location: StorageLocation;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const { s, fs } = useScale();
  const c = useSettingsTheme();
  return (
    <SettingsSurface
      contentStyle={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(12),
        padding: s(12),
      }}
    >
      <View
        style={{
          width: s(44),
          height: s(44),
          borderRadius: s(12),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${location.color}18`,
          borderWidth: 1,
          borderColor: `${location.color}40`,
        }}
      >
        <Icon name={resolveStorageLocationIcon(location)} size={fs(18)} color={location.color} />
      </View>
      <SettingsBodyText accent style={{ flex: 1 }}>
        {location.name}
      </SettingsBodyText>
      <View
        style={{
          width: s(14),
          height: s(14),
          borderRadius: s(7),
          backgroundColor: location.color,
        }}
      />
      {canDelete ? (
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${location.name}`}
          style={{ padding: s(4) }}
        >
          <Trash2 size={fs(16)} color={c.ink} strokeWidth={2} />
        </Pressable>
      ) : null}
    </SettingsSurface>
  );
}

export async function deleteStorageLocation(
  householdId: string,
  locationId: string,
  locationName: string,
  role: string,
  refetch: () => void,
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void,
) {
  if (role === 'viewer') {
    showToast('View-only access', 'warning');
    return false;
  }
  try {
    const pantryQ = query(
      collection(db, 'households', householdId, 'inventory'),
      where('locationId', '==', locationId),
    );
    const pantrySnap = await getDocs(pantryQ);
    const batch = writeBatch(db);
    pantrySnap.docs.forEach((d) =>
      batch.update(d.ref, { locationId: null, updatedAt: serverTimestamp() }),
    );
    batch.delete(doc(db, 'households', householdId, 'storageLocations', locationId));
    await batch.commit();
    showToast(`${locationName} location removed`, 'success');
    refetch();
    return true;
  } catch {
    showToast('Failed to delete location', 'error');
    return false;
  }
}
