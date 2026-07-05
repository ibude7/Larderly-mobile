import { useCallback } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion } from '@react-native-firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { recordActivity } from '../lib/activity';

export function useInvite() {
  const { user } = useAuth();

  const generateInviteCode = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 8; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }, []);

  const validateInviteCode = useCallback(async (code: string): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return false;
    const snap = await getDoc(doc(db, 'inviteCodes', cleanCode));
    return snap.exists();
  }, []);

  const redeemInviteCode = useCallback(async (code: string): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const cleanCode = code.trim().toUpperCase();
    const codeSnap = await getDoc(doc(db, 'inviteCodes', cleanCode));
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

    return targetHouseholdId;
  }, [user]);

  return {
    generateInviteCode,
    validateInviteCode,
    redeemInviteCode,
  };
}
