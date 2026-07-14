import { useState } from 'react';
import { View } from 'tamagui';
import { collection, getDocs } from '@react-native-firebase/firestore';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../contexts/AuthContext';
import { useHousehold } from '../../contexts/HouseholdContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useShopping } from '../../contexts/ShoppingContext';
import { useToast } from '../../contexts/ToastContext';
import { db } from '../../lib/firebase';
import { exportPantryAsCSV, exportShoppingHistoryAsCSV } from '../../lib/export';
import { useScale } from '../../theme/scale';
import { SettingsActionButton } from './SettingsActionButton';
import { SettingsBodyText } from './SettingsBodyText';
import { describeProvider } from './settingsHelpers';

export function DataExportSection() {
  const { s } = useScale();
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const { profile } = useProfile();
  const { items, locations } = useInventory();
  const { shoppingList, lists } = useShopping();
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);

  const providerLabel = describeProvider(
    user?.providerData?.map((p) => p.providerId) ?? [],
    !!user?.isAnonymous,
  );

  const shareCsv = async (fileName: string, csv: string) => {
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, csv);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
    }
  };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const payload: Record<string, unknown> = {
        exported_at: new Date().toISOString(),
        user: {
          uid: user.uid,
          email: user.email || null,
          display_name: profile?.full_name || user.displayName || null,
          provider: providerLabel,
        },
        pantry_items: items,
        storage_locations: locations,
        shopping_list: shoppingList,
      };
      if (householdId) {
        const [invSnap, listsSnap] = await Promise.all([
          getDocs(collection(db, 'households', householdId, 'inventory')),
          getDocs(collection(db, 'households', householdId, 'shoppingLists')),
        ]);
        payload.household_id = householdId;
        payload.household_inventory = invSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        payload.shopping_lists = listsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      const stamp = new Date().toISOString().slice(0, 10);
      const fileName = `larderly-export-${stamp}.json`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/json', UTI: 'public.json' });
      }
      showToast('Data exported as JSON', 'success');
    } catch (err) {
      console.error('[Larderly] Export failed', err);
      showToast('Export failed — try again in a moment', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPantryCsv = async () => {
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      await shareCsv(`larderly-pantry-${stamp}.csv`, exportPantryAsCSV(items, locations));
      showToast('Export complete', 'success');
    } catch {
      showToast('Could not export pantry CSV', 'error');
    }
  };

  const handleExportShoppingCsv = async () => {
    try {
      const archivedLists = lists.filter((list) => Boolean(list.archivedAt));
      const stamp = new Date().toISOString().slice(0, 10);
      await shareCsv(`larderly-shopping-history-${stamp}.csv`, exportShoppingHistoryAsCSV(archivedLists));
      showToast('Export complete', 'success');
    } catch {
      showToast('Could not export shopping history CSV', 'error');
    }
  };

  return (
    <View style={{ gap: s(10) }}>
      <SettingsBodyText>
        Download a copy of your pantry items, shopping lists, and storage locations. Meal plans are
        not included in this export.
      </SettingsBodyText>
      <SettingsActionButton
        label={exporting ? 'Preparing export…' : 'Export data (JSON)'}
        tone="primary"
        loading={exporting}
        onPress={() => void handleExport()}
      />
      <SettingsActionButton label="Export pantry (CSV)" onPress={() => void handleExportPantryCsv()} />
      <SettingsActionButton
        label="Export shopping history (CSV)"
        onPress={() => void handleExportShoppingCsv()}
      />
    </View>
  );
}
