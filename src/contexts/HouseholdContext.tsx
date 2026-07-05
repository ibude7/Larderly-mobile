import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { doc, getDoc, onSnapshot, updateDoc, setDoc, collection, serverTimestamp, arrayUnion, arrayRemove, deleteField } from '@react-native-firebase/firestore';
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

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [householdId, setHouseholdIdState] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('admin');
  const { generateInviteCode } = useInvite();

  const setHouseholdId = useCallback((id: string | null) => {
    setHouseholdIdState(id);
  }, []);

  const canEdit = role !== 'viewer';

  // Listen to the user's document to get the householdId
  useEffect(() => {
    if (!user) {
      setHouseholdIdState(null);
      setRole('admin');
      return;
    }
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() ?? {};
      setHouseholdIdState((data.householdId as string) || null);
    });
    return unsubUser;
  }, [user]);

  // Listen to the household document to get the member roles and compute the role
  useEffect(() => {
    if (!user || !householdId) {
      setRole('admin');
      return;
    }
    const unsubHousehold = onSnapshot(doc(db, 'households', householdId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() ?? {};
      const roles = (data.memberRoles ?? {}) as Record<string, Role>;
      if (data.ownerId === user.uid) {
        setRole('admin');
      } else {
        setRole(roles[user.uid] ?? 'editor');
      }
    });
    return unsubHousehold;
  }, [user, householdId]);

  const createHousehold = useCallback(async (name: string): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const newHouseholdRef = doc(collection(db, 'households'));
    const newHouseholdId = newHouseholdRef.id;
    const code = generateInviteCode();

    await setDoc(newHouseholdRef, {
      name: name.trim(),
      ownerId: user.uid,
      members: [user.uid],
      memberRoles: { [user.uid]: 'admin' },
      memberNames: { [user.uid]: user.displayName || user.email || 'Owner' },
      inviteCode: code,
      dietaryPrefs: [],
      allergies: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'inviteCodes', code), {
      householdId: newHouseholdId,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'users', user.uid), {
      householdId: newHouseholdId,
      updated_at: serverTimestamp(),
    });

    await seedHouseholdStorageLocations(newHouseholdId, user.uid);

    await recordActivity(newHouseholdId, {
      verb: 'member.joined',
      target: name.trim(),
      actorId: user.uid,
      actorName: user.displayName || user.email || 'Owner',
    });
    
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
    setHouseholdIdState(targetHouseholdId);
  }, [user]);

  const leaveHousehold = useCallback(async () => {
    if (!user || !householdId) throw new Error('No active household or not authenticated');
    const uid = user.uid;
    
    const userSnap = await getDoc(doc(db, 'users', uid));
    const userData = userSnap.data() ?? {};
    const name = userData.firstName || user.displayName || user.email || 'Member';

    await updateDoc(doc(db, 'households', householdId), {
      members: arrayRemove(uid),
      [`memberRoles.${uid}`]: deleteField(),
      [`memberNames.${uid}`]: deleteField(),
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'users', uid), {
      householdId: '',
      updated_at: serverTimestamp(),
    });

    await recordActivity(householdId, {
      verb: 'member.removed',
      target: 'household',
      actorId: uid,
      actorName: name,
    });

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
