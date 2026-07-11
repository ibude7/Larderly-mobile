import { useCallback, useEffect, useRef, useState } from 'react';
import {
  arrayRemove,
  deleteField,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from '@react-native-firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { recordActivity } from '../lib/activity';
import { db } from '../lib/firebase';
import {
  canChangeHouseholdMemberRole,
  canLeaveHousehold,
  canManageHouseholdMembers,
  canRemoveHouseholdMember,
  parseHouseholdSettings,
  type HouseholdSettingsData,
} from '../lib/householdSettings';
import type { Role } from '../types/household';

export type HouseholdSettingsAction =
  | 'create'
  | 'join'
  | 'leave'
  | 'preferences'
  | 'role'
  | 'remove';

function mutationError(message: string): never {
  throw new Error(message);
}

export function useHouseholdSettings() {
  const { user } = useAuth();
  const {
    householdId,
    role,
    canEdit,
    createHousehold: createFromContext,
    joinHousehold: joinFromContext,
    leaveHousehold: leaveFromContext,
  } = useHousehold();
  const [household, setHousehold] = useState<HouseholdSettingsData | null>(null);
  const [loading, setLoading] = useState(Boolean(householdId));
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<HouseholdSettingsAction | null>(null);
  const mutationLock = useRef(false);

  useEffect(() => {
    setHousehold(null);
    setError(null);
    if (!householdId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    return onSnapshot(
      doc(db, 'households', householdId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setHousehold(null);
          setError('This household is no longer available.');
          setLoading(false);
          return;
        }

        const parsed = parseHouseholdSettings(snapshot.id, snapshot.data());
        if (!parsed) {
          setHousehold(null);
          setError('The household data could not be read safely.');
        } else {
          setHousehold(parsed);
          setError(null);
        }
        setLoading(false);
      },
      () => {
        setHousehold(null);
        setError('Could not load household. Check your connection and try again.');
        setLoading(false);
      },
    );
  }, [householdId]);

  const runMutation = useCallback(
    async <T,>(action: HouseholdSettingsAction, mutation: () => Promise<T>): Promise<T> => {
      if (mutationLock.current) mutationError('Another household change is already in progress.');
      mutationLock.current = true;
      setPendingAction(action);
      setError(null);
      try {
        return await mutation();
      } catch (mutationFailure) {
        const message =
          mutationFailure instanceof Error ? mutationFailure.message : 'The household change failed.';
        setError(message);
        throw mutationFailure;
      } finally {
        mutationLock.current = false;
        setPendingAction(null);
      }
    },
    [],
  );

  const createHousehold = useCallback(
    (name: string) =>
      runMutation('create', async () => {
        if (!user) mutationError('Sign in before creating a household.');
        if (householdId) mutationError('Leave your current household before creating another.');
        const trimmedName = name.trim();
        if (!trimmedName) mutationError('Enter a household name.');
        return createFromContext(trimmedName);
      }),
    [createFromContext, householdId, runMutation, user],
  );

  const joinHousehold = useCallback(
    (inviteCode: string) =>
      runMutation('join', async () => {
        if (!user) mutationError('Sign in before joining a household.');
        if (householdId) mutationError('Leave your current household before joining another.');
        const code = inviteCode.trim().toUpperCase();
        if (code.length !== 8) mutationError('Enter the 8-character invite code.');
        await joinFromContext(code);
      }),
    [householdId, joinFromContext, runMutation, user],
  );

  const savePreferences = useCallback(
    (allergies: string, dietaryPrefs: string[]) =>
      runMutation('preferences', async () => {
        if (!householdId || !household) mutationError('No household is available.');
        if (!canEdit || role === 'viewer') mutationError('View-only members cannot edit preferences.');
        await updateDoc(doc(db, 'households', householdId), {
          allergies: allergies.trim(),
          dietaryPrefs: [...new Set(dietaryPrefs.filter((value) => typeof value === 'string'))],
          updatedAt: serverTimestamp(),
        });
      }),
    [canEdit, household, householdId, role, runMutation],
  );

  const changeRole = useCallback(
    (uid: string, nextRole: Role) =>
      runMutation('role', async () => {
        if (!user || !householdId || !household) mutationError('No household is available.');
        if (
          !canChangeHouseholdMemberRole({
            currentUid: user.uid,
            targetUid: uid,
            ownerId: household.ownerId,
            currentRole: role,
            canEdit,
            nextRole,
          })
        ) {
          mutationError('You cannot change this member’s role.');
        }
        if (!household.members.includes(uid)) mutationError('That member is no longer in the household.');

        await updateDoc(doc(db, 'households', householdId), {
          [`memberRoles.${uid}`]: nextRole,
          updatedAt: serverTimestamp(),
        });
      }),
    [canEdit, household, householdId, role, runMutation, user],
  );

  const removeMember = useCallback(
    (uid: string) =>
      runMutation('remove', async () => {
        if (!user || !householdId || !household) mutationError('No household is available.');
        if (
          !canRemoveHouseholdMember({
            currentUid: user.uid,
            targetUid: uid,
            ownerId: household.ownerId,
            currentRole: role,
            canEdit,
          })
        ) {
          mutationError('You cannot remove this member.');
        }
        if (!household.members.includes(uid)) mutationError('That member is no longer in the household.');

        const householdRef = doc(db, 'households', householdId);
        const memberRef = doc(db, 'users', uid);
        const householdChanges = {
          members: arrayRemove(uid),
          [`memberRoles.${uid}`]: deleteField(),
          [`memberNames.${uid}`]: deleteField(),
          updatedAt: serverTimestamp(),
        };

        try {
          const batch = writeBatch(db);
          batch.update(householdRef, householdChanges);
          batch.update(memberRef, {
            householdId: '',
            updated_at: serverTimestamp(),
          });
          await batch.commit();
        } catch (atomicCleanupError) {
          // Older deployed rules may not yet permit the guarded cross-user cleanup.
          // Keep the household internally consistent, while surfacing diagnostics for rollout.
          console.warn('[Larderly] Atomic member profile cleanup unavailable', atomicCleanupError);
          await updateDoc(householdRef, householdChanges);
        }

        const memberName = household.memberNames[uid] ?? 'Member';
        recordActivity(householdId, {
          verb: 'member.removed',
          target: memberName,
          actorId: user.uid,
          actorName: user.displayName || 'Admin',
        }).catch(() => {});
      }),
    [canEdit, household, householdId, role, runMutation, user],
  );

  const leaveHousehold = useCallback(
    () =>
      runMutation('leave', async () => {
        if (!user || !householdId || !household) mutationError('No household is available.');
        if (!canLeaveHousehold(user.uid, household.ownerId)) {
          mutationError(
            'The household owner cannot leave. Ownership transfer or household deletion is required, and is not supported here.',
          );
        }
        await leaveFromContext();
      }),
    [household, householdId, leaveFromContext, runMutation, user],
  );

  return {
    householdId,
    household,
    role,
    canEdit,
    canManageMembers: canManageHouseholdMembers(role, canEdit),
    isOwner: Boolean(user && household?.ownerId === user.uid),
    loading,
    error,
    pendingAction,
    createHousehold,
    joinHousehold,
    leaveHousehold,
    savePreferences,
    changeRole,
    removeMember,
  };
}
