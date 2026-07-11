import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  doc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  updateDoc,
  setDoc,
  collection,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteField,
  writeBatch,
  increment,
} from '@react-native-firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Role } from '../types/household';
import { recordActivity } from '../lib/activity';
import { seedHouseholdStorageLocations } from '../lib/householdStorage';
import { useInvite } from '../hooks/useInvite';

interface HouseholdContextType {
  householdId: string | null;
  role: Role;
  canEdit: boolean;
  createHousehold: (name: string) => Promise<string>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
  setHouseholdId: (id: string | null) => void;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

function inviteRateLimitKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function inviteExpiryDate(date = new Date()): Date {
  const expires = new Date(date);
  expires.setDate(expires.getDate() + 30);
  return expires;
}

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profileHouseholdId, setProfileHouseholdId] = useState<string | null>(null);
  const [householdId, setHouseholdIdState] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('admin');
  const { generateInviteCode } = useInvite();

  const setHouseholdId = useCallback((id: string | null) => {
    setProfileHouseholdId(id);
    setHouseholdIdState(id);
  }, []);

  const canEdit = role !== 'viewer';

  const clearInvalidHousehold = useCallback(() => {
    setProfileHouseholdId(null);
    setHouseholdIdState(null);
    setRole('admin');
  }, []);

  // Listen to the user's document to get the householdId
  useEffect(() => {
    if (!user) {
      setProfileHouseholdId(null);
      setHouseholdIdState(null);
      setRole('admin');
      return;
    }
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (!snap?.exists()) {
        setProfileHouseholdId(null);
        setHouseholdIdState(null);
        return;
      }
      const data = snap.data() ?? {};
      const nextHouseholdId = (data.householdId as string) || null;
      setProfileHouseholdId(nextHouseholdId);
      if (!nextHouseholdId) setHouseholdIdState(null);
    });
    return unsubUser;
  }, [user]);

  // Validate the profile household id before exposing it to app data hooks.
  useEffect(() => {
    if (!user || !profileHouseholdId) {
      setHouseholdIdState(null);
      setRole('admin');
      return;
    }

    setHouseholdIdState(null);
    setRole('admin');

    let active = true;
    let unsubHousehold: (() => void) | undefined;
    const householdRef = doc(db, 'households', profileHouseholdId);

    const applyHousehold = (data: Record<string, unknown>) => {
      const members = (data.members ?? []) as string[];
      if (!members.includes(user.uid)) {
        clearInvalidHousehold();
        return false;
      }

      const roles = (data.memberRoles ?? {}) as Record<string, Role>;
      setHouseholdIdState(profileHouseholdId);
      if (data.ownerId === user.uid) {
        setRole('admin');
      } else {
        setRole(roles[user.uid] ?? 'editor');
      }
      return true;
    };

    const validateAndListen = async () => {
      try {
        const serverSnap = await getDocFromServer(householdRef);
        if (!active) return;
        if (!serverSnap.exists() || !applyHousehold(serverSnap.data() ?? {})) return;

        unsubHousehold = onSnapshot(
          householdRef,
          (snap) => {
            if (!snap?.exists()) {
              clearInvalidHousehold();
              return;
            }
            applyHousehold(snap.data() ?? {});
          },
          () => {
            clearInvalidHousehold();
          },
        );
      } catch {
        if (active) clearInvalidHousehold();
      }
    };

    validateAndListen();

    return () => {
      active = false;
      if (unsubHousehold) unsubHousehold();
    };
  }, [user, profileHouseholdId, clearInvalidHousehold]);

  const createHousehold = useCallback(async (name: string): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const newHouseholdRef = doc(collection(db, 'households'));
    const newHouseholdId = newHouseholdRef.id;
    const shouldCreateInviteCode = !user.isAnonymous;
    const code = shouldCreateInviteCode ? generateInviteCode() : '';
    const rateLimitKey = shouldCreateInviteCode ? inviteRateLimitKey() : '';
    const batch = writeBatch(db);

    batch.set(newHouseholdRef, {
      name: name.trim(),
      ownerId: user.uid,
      members: [user.uid],
      memberRoles: { [user.uid]: 'admin' },
      memberNames: { [user.uid]: user.displayName || user.email || 'Owner' },
      inviteCode: code || null,
      dietaryPrefs: [],
      allergies: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (shouldCreateInviteCode) {
      batch.set(doc(db, 'inviteCodes', code), {
        householdId: newHouseholdId,
        ownerId: user.uid,
        rateLimitKey,
        createdAt: serverTimestamp(),
        expiresAt: inviteExpiryDate(),
      });

      batch.set(
        doc(db, 'users', user.uid, 'inviteCodeCounters', rateLimitKey),
        {
          ownerId: user.uid,
          count: increment(1),
          windowStart: new Date(`${rateLimitKey}T00:00:00.000Z`),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    batch.update(doc(db, 'users', user.uid), {
      householdId: newHouseholdId,
      updated_at: serverTimestamp(),
    });

    await batch.commit();

    await seedHouseholdStorageLocations(newHouseholdId, user.uid);

    await recordActivity(newHouseholdId, {
      verb: 'member.joined',
      target: name.trim(),
      actorId: user.uid,
      actorName: user.displayName || user.email || 'Owner',
    });
    
    setProfileHouseholdId(newHouseholdId);
    setHouseholdIdState(newHouseholdId);
    return code;
  }, [user, generateInviteCode]);

  const joinHousehold = useCallback(async (inviteCode: string) => {
    if (!user) throw new Error('Not authenticated');
    const code = inviteCode.trim().toUpperCase();
    const codeSnap = await getDoc(doc(db, 'inviteCodes', code));
    if (!codeSnap.exists()) {
      throw new Error('Invalid invite code');
    }
    const targetHouseholdId = codeSnap.data()?.householdId as string;
    await updateDoc(doc(db, 'households', targetHouseholdId), {
      members: arrayUnion(user.uid),
      [`memberRoles.${user.uid}`]: 'editor',
      [`memberNames.${user.uid}`]: user.displayName || user.email || 'Member',
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'users', user.uid), {
      householdId: targetHouseholdId,
      updated_at: serverTimestamp(),
    });
    await recordActivity(targetHouseholdId, {
      verb: 'member.joined',
      target: 'household',
      actorId: user.uid,
      actorName: user.displayName || user.email || 'Member',
    });
    setProfileHouseholdId(targetHouseholdId);
    setHouseholdIdState(targetHouseholdId);
  }, [user]);

  const leaveHousehold = useCallback(async () => {
    if (!user || !householdId) throw new Error('No active household or not authenticated');
    const uid = user.uid;

    const householdRef = doc(db, 'households', householdId);
    const userRef = doc(db, 'users', uid);
    const [householdSnap, userSnap] = await Promise.all([getDoc(householdRef), getDoc(userRef)]);
    if (!householdSnap.exists()) throw new Error('The household is no longer available.');
    if (householdSnap.data()?.ownerId === uid) {
      throw new Error(
        'The household owner cannot leave. Ownership transfer or household deletion is required, and is not supported here.',
      );
    }

    const userData = userSnap.data() ?? {};
    const name = userData.firstName || user.displayName || user.email || 'Member';

    const batch = writeBatch(db);
    batch.update(householdRef, {
      members: arrayRemove(uid),
      [`memberRoles.${uid}`]: deleteField(),
      [`memberNames.${uid}`]: deleteField(),
      updatedAt: serverTimestamp(),
    });
    batch.update(userRef, {
      householdId: '',
      updated_at: serverTimestamp(),
    });
    await batch.commit();

    recordActivity(householdId, {
      verb: 'member.removed',
      target: 'household',
      actorId: uid,
      actorName: name,
    }).catch(() => {});

    setProfileHouseholdId(null);
    setHouseholdIdState(null);
  }, [user, householdId]);

  return (
    <HouseholdContext.Provider
      value={{
        householdId,
        role,
        canEdit,
        createHousehold,
        joinHousehold,
        leaveHousehold,
        setHouseholdId,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider');
  return ctx;
}
