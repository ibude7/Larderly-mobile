import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { db } from '../lib/firebase';
import { mapDoc } from '../lib/firestore';
import { MealPlan } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { useProfile } from '../contexts/ProfileContext';
import { bumpCounter } from '../lib/achievements';

export function useMealPlans() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { householdId } = useHousehold();
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMeals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      query(collection(db, 'users', user.uid, 'meal_plans'), orderBy('date', 'asc')),
      (snap) => {
        setMeals(snap.docs.map((d) => mapDoc<MealPlan>(d)));
        setLoading(false);
      },
      (err) => {
        console.error('[Larderly] meal_plans subscription failed', err);
        setLoading(false);
      },
    );
    return unsub;
  }, [user]);

  const refetch = useCallback(async () => {
    /* live-subscribed */
  }, []);

  const addMeal = async (meal: Omit<MealPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };
    try {
      const colRef = collection(db, 'users', user.uid, 'meal_plans');
      const ref = doc(colRef);
      await setDoc(ref, {
        ...meal,
        user_id: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      const actorName = profile?.full_name?.trim() || user.displayName || 'You';
      bumpCounter(user.uid, householdId, actorName, 'recipesCooked').catch(() => {});
      return {
        data: {
          ...(meal as MealPlan),
          id: ref.id,
          user_id: user.uid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updateMeal = async (id: string, updates: Partial<MealPlan>) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };
    try {
      await updateDoc(doc(db, 'users', user.uid, 'meal_plans', id), {
        ...updates,
        updated_at: serverTimestamp(),
      });
      const existing = meals.find((m) => m.id === id);
      const data: MealPlan | null = existing
        ? { ...existing, ...updates, updated_at: new Date().toISOString() }
        : null;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const deleteMeal = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'meal_plans', id));
    } catch (err) {
      console.error('[Larderly] Failed to delete meal plan', err);
    }
  };

  return { meals, loading, refetch, addMeal, updateMeal, deleteMeal };
}
