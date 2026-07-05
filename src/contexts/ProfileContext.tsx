import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfile as updateFbProfile } from '@react-native-firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp, onSnapshot } from '@react-native-firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { toISOString } from '../lib/firestore';
import { Profile } from '../types';
import { UserProfile } from '../types/household';
import { recordDailyVisit } from '../lib/achievements';
import { initPush } from '../lib/push';

interface AuthResult {
  error: Error | null;
}

interface ProfileContextType {
  profile: Profile | null;
  userProfile: UserProfile | null;
  displayName: string;
  updateProfile: (updates: Partial<Profile>) => Promise<AuthResult>;
  updateUserProfile: (updates: {
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
    timezone?: string;
  }) => Promise<AuthResult>;
  updateUserPreferences: (prefs: {
    dietaryPreferences?: string[];
    personalAllergies?: string;
    preferredStores?: string[];
    onboardingCompleted?: boolean;
    notificationPrefs?: Record<string, unknown>;
  }) => Promise<AuthResult>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

function toUserProfile(data: Record<string, unknown>): UserProfile {
  const firstName = (data.firstName as string) ?? (data.full_name as string)?.split(' ')[0] ?? '';
  const lastName = (data.lastName as string) ?? (data.full_name as string)?.split(' ').slice(1).join(' ') ?? '';
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

function toProfile(userId: string, data: Record<string, unknown>): Profile {
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

async function initializeNewUser(userId: string, fullName: string): Promise<Profile> {
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

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const displayName = profile?.full_name || user?.displayName || user?.email || '';

  // Initialize and listen to profile data when the user signs in
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setUserProfile(null);
      return;
    }

    let unsub: () => void = () => {};

    const initAndListen = async () => {
      try {
        const dName = user.displayName ?? '';
        const p = await initializeNewUser(user.uid, dName);
        setProfile(p);

        unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
          if (!snap.exists()) return;
          const data = snap.data() ?? {};
          setUserProfile(toUserProfile(data));

          const fullName = (data.full_name as string) ?? [data.firstName, data.lastName].filter(Boolean).join(' ');
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  full_name: fullName,
                  avatar_url: (data.profilePictureUrl as string) ?? '',
                  updated_at: toISOString(data.updated_at ?? data.updatedAt),
                }
              : prev
          );
        });

        recordDailyVisit(user.uid).catch(() => {});

        if (!user.isAnonymous) {
          initPush(user.uid).catch(() => {});
          const sessionKey = `larderly:session:${user.uid}`;
          AsyncStorage.getItem(sessionKey).then((seen) => {
            if (!seen) {
              AsyncStorage.setItem(sessionKey, '1').catch(() => {});
              addDoc(collection(db, 'users', user.uid, 'loginEvents'), {
                at: serverTimestamp(),
                device: `${Platform.OS} device`,
                platform: Platform.OS,
              }).catch(() => {});
            }
          });
        }
      } catch (err) {
        console.error('[Larderly] Failed to initialize user profile', err);
      }
    };

    initAndListen();

    return () => {
      unsub();
    };
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...updates,
        updated_at: serverTimestamp(),
      });
      setProfile((prev) =>
        prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : prev
      );
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [user]);

  const updateUserProfile = useCallback(async (updates: {
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
    timezone?: string;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };
    try {
      const fullName = [updates.firstName ?? userProfile?.firstName, updates.lastName ?? userProfile?.lastName]
        .filter(Boolean)
        .join(' ');
      await updateDoc(doc(db, 'users', user.uid), {
        ...updates,
        ...(fullName ? { full_name: fullName } : {}),
        updated_at: serverTimestamp(),
      });
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              ...updates,
              firstName: updates.firstName ?? prev.firstName,
              lastName: updates.lastName ?? prev.lastName,
            }
          : prev
      );
      if (fullName) {
        setProfile((prev) => (prev ? { ...prev, full_name: fullName } : prev));
      }
      if (updates.profilePictureUrl !== undefined) {
        await updateFbProfile(user, { photoURL: updates.profilePictureUrl || null });
        setProfile((prev) =>
          prev ? { ...prev, avatar_url: updates.profilePictureUrl ?? prev.avatar_url } : prev
        );
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [user, userProfile]);

  const updateUserPreferences = useCallback(async (prefs: {
    dietaryPreferences?: string[];
    personalAllergies?: string;
    preferredStores?: string[];
    onboardingCompleted?: boolean;
    notificationPrefs?: Record<string, unknown>;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };
    try {
      await updateDoc(doc(db, 'users', user.uid), { ...prefs, updated_at: serverTimestamp() });
      setUserProfile((prev) => (prev ? { ...prev, ...prefs } : prev));
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [user]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        userProfile,
        displayName,
        updateProfile,
        updateUserProfile,
        updateUserPreferences,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
