import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from '@react-native-firebase/firestore';
import { db } from '../lib/firebase';
import { useHousehold } from '../contexts/HouseholdContext';
import type { ActivityEvent } from '../lib/insights';

function mapHouseholdActivity(id: string, data: Record<string, unknown>): ActivityEvent & { id: string } {
  let createdAt: { toMillis?: () => number } | undefined;
  const raw = data.createdAt;
  if (typeof raw === 'object' && raw !== null && 'toDate' in raw) {
    try {
      const ms = (raw as { toDate: () => Date }).toDate().getTime();
      createdAt = { toMillis: () => ms };
    } catch {
      createdAt = undefined;
    }
  }
  return {
    id,
    verb: (data.verb as string) ?? '',
    target: (data.target as string) ?? '',
    actorId: (data.actorId as string) ?? '',
    actorName: (data.actorName as string) ?? '',
    createdAt,
  };
}

export function useActivity(limitCount = 50): ActivityEvent[] {
  const { householdId } = useHousehold();
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    if (!householdId) {
      setActivity([]);
      return;
    }
    const unsub = onSnapshot(
      query(
        collection(db, 'households', householdId, 'activity'),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      ),
      (snap) => {
        setActivity(snap.docs.map((d) => mapHouseholdActivity(d.id, d.data() ?? {})));
      },
      () => {
        onSnapshot(collection(db, 'households', householdId, 'activity'), (snap) => {
          setActivity(snap.docs.map((d) => mapHouseholdActivity(d.id, d.data() ?? {})).slice(0, limitCount));
        });
      },
    );
    return unsub;
  }, [householdId, limitCount]);

  return activity;
}
