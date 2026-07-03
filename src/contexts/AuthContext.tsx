import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { Platform } from 'react-native';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithCredential,
  linkWithCredential,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as updateFbProfile,
  GoogleAuthProvider,
  AppleAuthProvider,
  EmailAuthProvider,
  deleteUser,
  signInWithPhoneNumber,
  multiFactor,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
} from '@react-native-firebase/auth';
import type { MultiFactorResolver } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
} from '@react-native-firebase/firestore';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { auth, db } from '../lib/firebase';
import { toISOString } from '../lib/firestore';
import { Profile } from '../types';
import { Role, UserProfile } from '../types/household';
import { recordDailyVisit } from '../lib/achievements';
import { initPush } from '../lib/push';

// Derive the user type from the modular SDK's own return type so it always
// matches what onAuthStateChanged / signInWithCredential produce (the fuller
// @firebase/auth User, not the legacy namespaced one).
type FbUser = Awaited<ReturnType<typeof signInWithCredential>>['user'];

interface AuthResult {
  error: Error | null;
  mfaRequired?: boolean;
}

export type MfaFactorInfo = {
  uid: string;
  displayName: string | null;
  phoneNumber?: string;
  factorId: 'phone';
  enrollmentTime: string;
};

interface AuthContextType {
  user: FbUser | null;
  profile: Profile | null;
  userProfile: UserProfile | null;
  householdId: string | null;
  role: Role;
  isAnonymous: boolean;
  loading: boolean;
  /** True when a native Google Sign-In client is configured (web client id set). */
  googleAvailable: boolean;
  /** True when Sign in with Apple is available (iOS 13+ with capability). */
  appleAvailable: boolean;
  setHouseholdId: (id: string | null) => void;
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
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: Error | null; needsVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithApple: () => Promise<AuthResult>;
  startPhoneSignIn: (phoneE164: string) => Promise<AuthResult>;
  confirmPhoneSignIn: (code: string) => Promise<AuthResult>;
  continueAsGuest: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updateProfile: (updates: Partial<Profile>) => Promise<AuthResult>;
  sendVerificationEmail: () => Promise<AuthResult>;
  upgradeAnonymous: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  upgradeAnonymousWithGoogle: () => Promise<AuthResult>;
  revokeAllSessions: () => Promise<AuthResult>;
  deleteAccount: () => Promise<AuthResult>;
  mfaResolver: MultiFactorResolver | null;
  startMfaEnrollment: (phoneE164: string) => Promise<void>;
  completeMfaEnrollment: (code: string, displayName: string) => Promise<void>;
  startMfaChallenge: (factorIndex?: number) => Promise<void>;
  completeMfaChallenge: (code: string) => Promise<void>;
  clearMfaResolver: () => void;
  getEnrolledMfaFactors: () => MfaFactorInfo[];
  unenrollMfaFactor: (factorUid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let phoneConfirmation: Awaited<ReturnType<typeof signInWithPhoneNumber>> | null = null;
let mfaEnrollmentVerificationId: string | null = null;
let mfaChallengeVerificationId: string | null = null;

// Default storage locations mirror the old Supabase `handle_new_user` trigger.
const DEFAULT_STORAGE_LOCATIONS = [
  { name: 'Fridge', icon: 'thermometer', color: '#3b82f6' },
  { name: 'Freezer', icon: 'snowflake', color: '#06b6d4' },
  { name: 'Pantry', icon: 'warehouse', color: '#f59e0b' },
  { name: 'Cabinet', icon: 'layout-grid', color: '#8b5cf6' },
];

// ── Google Sign-In config ────────────────────────────────────────────────────
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
let googleConfigured = false;
function ensureGoogleConfigured(): boolean {
  if (!GOOGLE_WEB_CLIENT_ID) return false;
  if (!googleConfigured) {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    googleConfigured = true;
  }
  return true;
}

/** Fetch a Google ID token via the native sign-in sheet. Throws a friendly
 * error if Google Sign-In isn't configured or the user cancels. */
async function getGoogleIdToken(): Promise<string> {
  if (!ensureGoogleConfigured()) {
    throw new Error(
      'Google Sign-In is not configured yet. Add your web client ID to enable it.',
    );
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // The response envelope shape shifted across @react-native-google-signin
  // versions; read the token defensively from either location.
  const response = (await GoogleSignin.signIn()) as {
    type?: string;
    idToken?: string;
    data?: { idToken?: string };
  };
  if (response?.type === 'cancelled') {
    throw new Error('Sign-in cancelled.');
  }
  const idToken = response?.data?.idToken ?? response?.idToken;
  if (!idToken) throw new Error('Google did not return an ID token.');
  return idToken;
}

/** Build a random nonce + its SHA-256 hash for Sign in with Apple. Apple
 * receives the hashed nonce; Firebase receives the raw nonce. */
async function makeAppleNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = `${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, '');
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  return { raw, hashed };
}

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

// Creates the user profile document and default storage locations on first
// sign-in. Safe to call multiple times — the initial getDoc() short-circuits
// if the profile already exists.
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

  // Seed default storage locations in a single batch write.
  const batch = writeBatch(db);
  const locationsCol = collection(db, 'users', userId, 'storage_locations');
  for (const loc of DEFAULT_STORAGE_LOCATIONS) {
    const locRef = doc(locationsCol);
    batch.set(locRef, {
      user_id: userId,
      name: loc.name,
      icon: loc.icon,
      color: loc.color,
      created_at: serverTimestamp(),
    });
  }
  await batch.commit();

  const now = new Date().toISOString();
  return {
    id: userId,
    full_name: fullName,
    avatar_url: '',
    created_at: now,
    updated_at: now,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FbUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [householdId, setHouseholdIdState] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('admin');
  const [loading, setLoading] = useState(true);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);

  const setHouseholdId = useCallback((id: string | null) => {
    setHouseholdIdState(id);
  }, []);

  useEffect(() => {
    // Sign in with Apple is iOS-only and requires the capability.
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAvailable)
        .catch(() => setAppleAvailable(false));
    }
  }, []);

  useEffect(() => {
    // Safety net: if onAuthStateChanged never fires (bad Firebase config or a
    // transient issue) the app would otherwise hang on the loading spinner
    // forever. Force-release after 4s so the auth page can at least render.
    const bailout = setTimeout(() => {
      setLoading((prev) => {
        if (prev)
          console.warn(
            '[Larderly] Firebase auth did not initialize within 4s — rendering auth page with no session.',
          );
        return false;
      });
    }, 4000);

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      clearTimeout(bailout);
      setUser(fbUser);
      if (!fbUser) {
        setProfile(null);
        setUserProfile(null);
        setHouseholdIdState(null);
        setRole('admin');
        setLoading(false);
        return;
      }
      try {
        const displayName = fbUser.displayName ?? '';
        const p = await initializeNewUser(fbUser.uid, displayName);
        setProfile(p);
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        const data = snap.data() ?? {};
        setUserProfile(toUserProfile(data));
        setHouseholdIdState((data.householdId as string) || null);
        recordDailyVisit(fbUser.uid).catch(() => {});
        if (!fbUser.isAnonymous) {
          initPush(fbUser.uid).catch(() => {});
          const sessionKey = `larderly:session:${fbUser.uid}`;
          AsyncStorage.getItem(sessionKey).then((seen) => {
            if (!seen) {
              AsyncStorage.setItem(sessionKey, '1').catch(() => {});
              addDoc(collection(db, 'users', fbUser.uid, 'loginEvents'), {
                at: serverTimestamp(),
                device: `${Platform.OS} device`,
                platform: Platform.OS,
              }).catch(() => {});
            }
          });
        }
      } catch (err) {
        console.error('[Larderly] Failed to initialize user profile', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(bailout);
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!user || !householdId) return;
    const unsub = onSnapshot(doc(db, 'households', householdId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() ?? {};
      const roles = (data.memberRoles ?? {}) as Record<string, Role>;
      if (data.ownerId === user.uid) setRole('admin');
      else setRole(roles[user.uid] ?? 'editor');
    });
    return () => unsub();
  }, [user, householdId]);

  useEffect(() => {
    if (!user || user.isAnonymous) return;
    const localVersionKey = `larderly:av:${user.uid}`;
    const unsub = onSnapshot(doc(db, 'users', user.uid), async (snap) => {
      if (!snap.exists()) return;
      const serverVersion = snap.data()?.authVersion ?? 0;
      const localVersion = Number((await AsyncStorage.getItem(localVersionKey)) ?? '0');
      if (serverVersion > localVersion) {
        await fbSignOut(auth);
      }
    });
    return unsub;
  }, [user]);

  const updateUserProfile = async (updates: {
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
          : prev,
      );
      if (fullName) {
        setProfile((prev) => (prev ? { ...prev, full_name: fullName } : prev));
      }
      if (updates.profilePictureUrl !== undefined) {
        await updateFbProfile(user, { photoURL: updates.profilePictureUrl || null });
        setProfile((prev) =>
          prev ? { ...prev, avatar_url: updates.profilePictureUrl ?? prev.avatar_url } : prev,
        );
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const updateUserPreferences = async (prefs: {
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
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateFbProfile(cred.user, { displayName: fullName });
      await initializeNewUser(cred.user.uid, fullName);
      // Fire-and-forget verification email; the user is already signed in so
      // we don't gate the UI on the email being verified.
      sendEmailVerification(cred.user).catch(() => {
        /* noop */
      });
      return { error: null, needsVerification: !cred.user.emailVerified };
    } catch (err) {
      return { error: err as Error, needsVerification: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null, mfaRequired: false };
    } catch (err) {
      const e = err as { code?: string };
      if (e.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, err as never);
        if (resolver) setMfaResolver(resolver);
        return { error: null, mfaRequired: true };
      }
      return { error: err as Error, mfaRequired: false };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const idToken = await getGoogleIdToken();
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const startPhoneSignIn = async (phoneE164: string) => {
    try {
      phoneConfirmation = await signInWithPhoneNumber(auth, phoneE164);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const confirmPhoneSignIn = async (code: string) => {
    try {
      if (!phoneConfirmation) throw new Error('No phone verification in progress.');
      await phoneConfirmation.confirm(code);
      phoneConfirmation = null;
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signInWithApple = async () => {
    try {
      const { raw, hashed } = await makeAppleNonce();
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashed,
      });
      if (!appleCredential.identityToken) {
        throw new Error('Apple did not return an identity token.');
      }
      const credential = AppleAuthProvider.credential(appleCredential.identityToken, raw);
      const result = await signInWithCredential(auth, credential);

      // Apple only returns the full name on the very first authorization.
      // Persist it so the account looks like a normal sign-up.
      const { givenName, familyName } = appleCredential.fullName ?? {};
      const fullName = [givenName, familyName].filter(Boolean).join(' ').trim();
      if (fullName && !result.user.displayName) {
        try {
          await updateFbProfile(result.user, { displayName: fullName });
          await updateDoc(doc(db, 'users', result.user.uid), {
            full_name: fullName,
            updated_at: serverTimestamp(),
          });
          setProfile((prev) =>
            prev ? { ...prev, full_name: fullName, updated_at: new Date().toISOString() } : prev,
          );
        } catch {
          /* noop */
        }
      }
      return { error: null };
    } catch (err) {
      const e = err as { code?: string };
      // User tapped cancel on the Apple sheet — not a real error.
      if (e?.code === 'ERR_REQUEST_CANCELED') return { error: null };
      return { error: err as Error };
    }
  };

  const continueAsGuest = async () => {
    try {
      await signInAnonymously(auth);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    setMfaResolver(null);
    mfaEnrollmentVerificationId = null;
    mfaChallengeVerificationId = null;
    // Best-effort sign out of the native Google session too so the next
    // Google sign-in shows the account picker.
    if (googleConfigured) {
      try {
        await GoogleSignin.signOut();
      } catch {
        /* noop */
      }
    }
    await fbSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...updates,
        updated_at: serverTimestamp(),
      });
      setProfile((prev) =>
        prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : prev,
      );
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const sendVerificationEmail = async () => {
    const current = auth.currentUser;
    if (!current) return { error: new Error('Not authenticated') };
    if (current.emailVerified) return { error: new Error('Email is already verified') };
    try {
      await sendEmailVerification(current);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const upgradeAnonymous = async (email: string, password: string, fullName: string) => {
    const current = auth.currentUser;
    if (!current) return { error: new Error('Not authenticated') };
    if (!current.isAnonymous) return { error: new Error('Account is already linked') };
    try {
      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(current, credential);
      if (fullName) {
        try {
          await updateFbProfile(result.user, { displayName: fullName });
        } catch {
          /* noop */
        }
        try {
          await updateDoc(doc(db, 'users', result.user.uid), {
            full_name: fullName,
            updated_at: serverTimestamp(),
          });
          setProfile((prev) =>
            prev ? { ...prev, full_name: fullName, updated_at: new Date().toISOString() } : prev,
          );
        } catch {
          /* noop */
        }
      }
      setUser(result.user);
      sendEmailVerification(result.user).catch(() => {
        /* noop */
      });
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const upgradeAnonymousWithGoogle = async () => {
    const current = auth.currentUser;
    if (!current) return { error: new Error('Not authenticated') };
    if (!current.isAnonymous) return { error: new Error('Account is already linked') };
    try {
      const idToken = await getGoogleIdToken();
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await linkWithCredential(current, credential);
      const googleName = result.user.displayName || '';
      if (googleName) {
        try {
          await updateDoc(doc(db, 'users', result.user.uid), {
            full_name: googleName,
            updated_at: serverTimestamp(),
          });
          setProfile((prev) =>
            prev
              ? { ...prev, full_name: prev.full_name || googleName, updated_at: new Date().toISOString() }
              : prev,
          );
        } catch {
          /* noop */
        }
      }
      setUser(result.user);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const revokeAllSessions = async () => {
    if (!user) return { error: new Error('Not authenticated') };
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const currentVersion = (snap.data()?.authVersion as number) ?? 0;
      const newVersion = currentVersion + 1;
      await updateDoc(userRef, { authVersion: newVersion, updated_at: serverTimestamp() });
      await AsyncStorage.setItem(`larderly:av:${user.uid}`, String(newVersion));
      await fbSignOut(auth);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const deleteAccount = async () => {
    const current = auth.currentUser;
    if (!current) return { error: new Error('Not authenticated') };
    try {
      await deleteUser(current);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const getEnrolledMfaFactors = (): MfaFactorInfo[] => {
    const current = auth.currentUser;
    if (!current) return [];
    try {
      return multiFactor(current).enrolledFactors.map((f) => ({
        uid: f.uid,
        displayName: f.displayName ?? null,
        factorId: 'phone' as const,
        enrollmentTime: f.enrollmentTime,
        phoneNumber: (f as { phoneNumber?: string }).phoneNumber,
      }));
    } catch {
      return [];
    }
  };

  const startMfaEnrollment = async (phoneE164: string) => {
    const current = auth.currentUser;
    if (!current) throw new Error('Sign in first.');
    const session = await multiFactor(current).getSession();
    const provider = new PhoneAuthProvider(auth);
    mfaEnrollmentVerificationId = await provider.verifyPhoneNumber({
      phoneNumber: phoneE164,
      session,
    });
  };

  const completeMfaEnrollment = async (code: string, displayName: string) => {
    const current = auth.currentUser;
    if (!current || !mfaEnrollmentVerificationId) {
      throw new Error('No enrollment in progress.');
    }
    const credential = PhoneAuthProvider.credential(mfaEnrollmentVerificationId, code);
    const assertion = PhoneMultiFactorGenerator.assertion(credential);
    await multiFactor(current).enroll(assertion, displayName.trim() || 'My phone');
    mfaEnrollmentVerificationId = null;
  };

  const unenrollMfaFactor = async (factorUid: string) => {
    const current = auth.currentUser;
    if (!current) throw new Error('Sign in first.');
    await multiFactor(current).unenroll(factorUid);
  };

  const startMfaChallenge = async (factorIndex = 0) => {
    if (!mfaResolver) throw new Error('No MFA challenge in progress.');
    const hint = mfaResolver.hints[factorIndex];
    if (!hint) throw new Error('Invalid second-factor selection.');
    const provider = new PhoneAuthProvider(auth);
    mfaChallengeVerificationId = await provider.verifyPhoneNumber({
      multiFactorHint: hint,
      session: mfaResolver.session,
    });
  };

  const completeMfaChallenge = async (code: string) => {
    if (!mfaResolver || !mfaChallengeVerificationId) {
      throw new Error('No MFA challenge in progress.');
    }
    const credential = PhoneAuthProvider.credential(mfaChallengeVerificationId, code);
    const assertion = PhoneMultiFactorGenerator.assertion(credential);
    await mfaResolver.resolveSignIn(assertion);
    setMfaResolver(null);
    mfaChallengeVerificationId = null;
  };

  const clearMfaResolver = () => {
    setMfaResolver(null);
    mfaChallengeVerificationId = null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        userProfile,
        householdId,
        role,
        isAnonymous: Boolean(user?.isAnonymous),
        loading,
        googleAvailable: !!GOOGLE_WEB_CLIENT_ID,
        appleAvailable,
        setHouseholdId,
        updateUserProfile,
        updateUserPreferences,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithApple,
        startPhoneSignIn,
        confirmPhoneSignIn,
        continueAsGuest,
        signOut,
        resetPassword,
        updateProfile,
        sendVerificationEmail,
        upgradeAnonymous,
        upgradeAnonymousWithGoogle,
        revokeAllSessions,
        deleteAccount,
        mfaResolver,
        startMfaEnrollment,
        completeMfaEnrollment,
        startMfaChallenge,
        completeMfaChallenge,
        clearMfaResolver,
        getEnrolledMfaFactors,
        unenrollMfaFactor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// statusCodes is re-exported for screens that want to special-case Google
// cancellation / in-progress states.
export { statusCodes as googleStatusCodes };

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
