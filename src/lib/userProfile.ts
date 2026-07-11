import { doc, getDoc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { db } from './firebase';
import { toISOString } from './firestore';
import { Profile } from '../types';
import { UserProfile } from '../types/household';

export function toUserProfile(data: Record<string, unknown>): UserProfile {
  const firstName = (data.firstName as string) ?? (data.full_name as string)?.split(' ')[0] ?? '';
  const lastName =
    (data.lastName as string) ?? (data.full_name as string)?.split(' ').slice(1).join(' ') ?? '';
  return {
    firstName,
    lastName,
    profilePictureUrl: (data.profilePictureUrl as string) ?? (data.avatar_url as string) ?? '',
    dietaryPreferences: (data.dietaryPreferences as string[]) ?? [],
    personalAllergies: (data.personalAllergies as string) ?? '',
    preferredStores: (data.preferredStores as string[]) ?? [],
    onboardingCompleted: data.onboardingCompleted !== false,
    notificationPrefs: data.notificationPrefs as Record<string, unknown> | undefined,
    timezone: (data.timezone as string) ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export function toProfile(userId: string, data: Record<string, unknown>): Profile {
  const up = toUserProfile(data);
  const fullName = (data.full_name as string) ?? [up.firstName, up.lastName].filter(Boolean).join(' ');
  return {
    id: userId,
    full_name: fullName,
    avatar_url: up.profilePictureUrl,
    created_at: toISOString(data.created_at ?? data.createdAt),
    updated_at: toISOString(data.updated_at ?? data.updatedAt),
  };
}

export async function initializeNewUser(userId: string, fullName: string): Promise<Profile> {
  const profileRef = doc(db, 'users', userId);
  const existing = await getDoc(profileRef);

  if (existing.exists()) {
    const data = existing.data() ?? {};
    return toProfile(userId, data);
  }

  const [firstName, ...rest] = fullName.split(' ');
  const lastName = rest.join(' ');
  await setDoc(profileRef, {
    full_name: fullName,
    firstName: firstName || (fullName ? 'User' : 'Guest'),
    lastName,
    avatar_url: '',
    profilePictureUrl: '',
    householdId: '',
    dietaryPreferences: [],
    personalAllergies: '',
    preferredStores: [],
    onboardingCompleted: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  const now = new Date().toISOString();
  return {
    id: userId,
    full_name: fullName,
    avatar_url: '',
    created_at: now,
    updated_at: now,
  };
}
