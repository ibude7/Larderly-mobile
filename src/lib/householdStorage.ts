import {
  collection,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { db } from './firebase';
import { DEFAULT_STORAGE_LOCATIONS } from '../shared';

/** Seed default storage locations on a new household (matches web app). */
export async function seedHouseholdStorageLocations(
  householdId: string,
  userId: string,
): Promise<void> {
  const col = collection(db, 'households', householdId, 'storageLocations');
  const existing = await getDocs(col);
  if (!existing.empty) return;

  const batch = writeBatch(db);
  for (const loc of DEFAULT_STORAGE_LOCATIONS) {
    batch.set(doc(col), {
      name: loc.name,
      icon: loc.icon,
      color: loc.color,
      userId,
      createdAt: serverTimestamp(),
    });
  }
  await batch.commit();
}
