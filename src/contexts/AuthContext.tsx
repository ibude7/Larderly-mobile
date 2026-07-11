import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
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
  getDocs,
  setDoc,
  updateDoc,
  collection,
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
import { analytics, auth, crashlytics, db } from '../lib/firebase';
import { isAnalyticsPreferenceEnabled } from '../lib/analytics';
import { bestEffortPushCleanup } from '../lib/pushCleanup';
import { unregisterPush } from '../lib/push';
import { initializeNewUser } from '../lib/userProfile';

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
  isAnonymous: boolean;
  loading: boolean;
  signInFailCount: number;
  signInLockedUntil: number;
  googleAvailable: boolean;
  appleAvailable: boolean;
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

async function getGoogleIdToken(): Promise<string> {
  if (!ensureGoogleConfigured()) {
    throw new Error(
      'Google Sign-In is not configured yet. Add your web client ID to enable it.',
    );
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
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

async function makeAppleNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = `${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, '');
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  return { raw, hashed };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const phoneConfirmationRef = useRef<Awaited<ReturnType<typeof signInWithPhoneNumber>> | null>(
    null,
  );
  const mfaEnrollmentVerificationIdRef = useRef<string | null>(null);
  const mfaChallengeVerificationIdRef = useRef<string | null>(null);

  const [user, setUser] = useState<FbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInFailCount, setSignInFailCount] = useState(0);
  const [signInLockedUntil, setSignInLockedUntil] = useState(0);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAvailable)
        .catch(() => setAppleAvailable(false));
    }
  }, []);

  useEffect(() => {
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
        await crashlytics().setUserId('');
        if (isAnalyticsPreferenceEnabled()) {
          await analytics().setUserId(null);
        }
        setLoading(false);
        return;
      }
      try {
        await crashlytics().setUserId(fbUser.uid);
        if (isAnalyticsPreferenceEnabled()) {
          await analytics().setUserId(fbUser.uid);
        }
        const displayName = fbUser.displayName ?? '';
        await initializeNewUser(fbUser.uid, displayName);
      } catch (err) {
        console.error('[Larderly] Failed to initialize user profile', err);
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
    if (!user || user.isAnonymous) return;
    const localVersionKey = `larderly:av:${user.uid}`;
    const unsub = onSnapshot(doc(db, 'users', user.uid), async (snap) => {
      if (!snap.exists()) return;
      const serverVersion = snap.data()?.authVersion ?? 0;
      const localVersion = Number((await AsyncStorage.getItem(localVersionKey)) ?? '0');
      if (serverVersion > localVersion) {
        await bestEffortPushCleanup(user.uid, unregisterPush);
        await fbSignOut(auth);
      }
    });
    return unsub;
  }, [user]);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateFbProfile(cred.user, { displayName: fullName });
      await initializeNewUser(cred.user.uid, fullName);
      sendEmailVerification(cred.user).catch(() => {});
      return { error: null, needsVerification: !cred.user.emailVerified };
    } catch (err) {
      return { error: err as Error, needsVerification: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (Date.now() < signInLockedUntil) {
      return { error: new Error('Too many attempts. Please wait 30 seconds.'), mfaRequired: false };
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSignInFailCount(0);
      return { error: null, mfaRequired: false };
    } catch (err) {
      const e = err as { code?: string };
      if (e.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, err as never);
        if (resolver) setMfaResolver(resolver);
        return { error: null, mfaRequired: true };
      }
      setSignInFailCount((prev) => {
        const next = prev + 1;
        if (next >= 5) {
          setSignInLockedUntil(Date.now() + 30_000);
          return 0;
        }
        return next;
      });
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
      phoneConfirmationRef.current = await signInWithPhoneNumber(auth, phoneE164);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const confirmPhoneSignIn = async (code: string) => {
    try {
      if (!phoneConfirmationRef.current) throw new Error('No phone verification in progress.');
      await phoneConfirmationRef.current.confirm(code);
      phoneConfirmationRef.current = null;
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

      const { givenName, familyName } = appleCredential.fullName ?? {};
      const fullName = [givenName, familyName].filter(Boolean).join(' ').trim();
      if (fullName && !result.user.displayName) {
        try {
          await updateFbProfile(result.user, { displayName: fullName });
          await updateDoc(doc(db, 'users', result.user.uid), {
            full_name: fullName,
            updated_at: serverTimestamp(),
          });
        } catch {
          /* noop */
        }
      }
      return { error: null };
    } catch (err) {
      const e = err as { code?: string };
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
    const uid = auth.currentUser?.uid;
    setMfaResolver(null);
    mfaEnrollmentVerificationIdRef.current = null;
    mfaChallengeVerificationIdRef.current = null;
    if (uid) {
      await bestEffortPushCleanup(uid, unregisterPush);
    }
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
        } catch {
          /* noop */
        }
      }
      setUser(result.user);
      sendEmailVerification(result.user).catch(() => {});
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
      const uid = user.uid;
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      const currentVersion = (snap.data()?.authVersion as number) ?? 0;
      const newVersion = currentVersion + 1;
      await updateDoc(userRef, { authVersion: newVersion, updated_at: serverTimestamp() });
      await AsyncStorage.setItem(`larderly:av:${uid}`, String(newVersion));
      await bestEffortPushCleanup(uid, unregisterPush);
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
      const uid = current.uid;
      await bestEffortPushCleanup(uid, unregisterPush);
      try {
        const batch = writeBatch(db);
        const storageLocationsSnap = await getDocs(
          collection(db, 'users', uid, 'storage_locations'),
        );
        storageLocationsSnap.docs.forEach((d) => batch.delete(d.ref));
        const legacyPantrySnap = await getDocs(collection(db, 'users', uid, 'pantry_items'));
        legacyPantrySnap.docs.forEach((d) => batch.delete(d.ref));
        const loginEventsSnap = await getDocs(collection(db, 'users', uid, 'loginEvents'));
        loginEventsSnap.docs.forEach((d) => batch.delete(d.ref));
        batch.delete(doc(db, 'users', uid));
        await batch.commit();
      } catch (batchErr) {
        console.warn('[Larderly] Failed to delete user Firestore data', batchErr);
      }
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
    mfaEnrollmentVerificationIdRef.current = await provider.verifyPhoneNumber({
      phoneNumber: phoneE164,
      session,
    });
  };

  const completeMfaEnrollment = async (code: string, displayName: string) => {
    const current = auth.currentUser;
    if (!current || !mfaEnrollmentVerificationIdRef.current) {
      throw new Error('No enrollment in progress.');
    }
    const credential = PhoneAuthProvider.credential(
      mfaEnrollmentVerificationIdRef.current,
      code,
    );
    const assertion = PhoneMultiFactorGenerator.assertion(credential);
    await multiFactor(current).enroll(assertion, displayName.trim() || 'My phone');
    mfaEnrollmentVerificationIdRef.current = null;
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
    mfaChallengeVerificationIdRef.current = await provider.verifyPhoneNumber({
      multiFactorHint: hint,
      session: mfaResolver.session,
    });
  };

  const completeMfaChallenge = async (code: string) => {
    if (!mfaResolver || !mfaChallengeVerificationIdRef.current) {
      throw new Error('No MFA challenge in progress.');
    }
    const credential = PhoneAuthProvider.credential(mfaChallengeVerificationIdRef.current, code);
    const assertion = PhoneMultiFactorGenerator.assertion(credential);
    await mfaResolver.resolveSignIn(assertion);
    setMfaResolver(null);
    mfaChallengeVerificationIdRef.current = null;
  };

  const clearMfaResolver = () => {
    setMfaResolver(null);
    mfaChallengeVerificationIdRef.current = null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAnonymous: Boolean(user?.isAnonymous),
        loading,
        signInFailCount,
        signInLockedUntil,
        googleAvailable: !!GOOGLE_WEB_CLIENT_ID,
        appleAvailable,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithApple,
        startPhoneSignIn,
        confirmPhoneSignIn,
        continueAsGuest,
        signOut,
        resetPassword,
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

export { statusCodes as googleStatusCodes };

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
