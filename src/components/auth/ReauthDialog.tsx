import React, {
  createContext,
  useContext,
  useRef,
  useState,
  ReactNode,
} from "react";
import { View, Text } from "react-native";
import Modal from "../ui/Modal";
import TextField from "../ui/TextField";
import Button from "../ui/Button";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  GoogleAuthProvider,
  signInWithCredential,
} from "@react-native-firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useScale } from "../../theme/scale";

type Resolver = (success: boolean) => void;

const ReauthContext = createContext<
  ((reason?: string) => Promise<boolean>) | null
>(null);

export function ReauthProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>();
  const resolverRef = useRef<Resolver | null>(null);

  const request = (r?: string) =>
    new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setReason(r);
      setOpen(true);
    });

  const close = (success: boolean) => {
    setOpen(false);
    resolverRef.current?.(success);
    resolverRef.current = null;
  };

  return (
    <ReauthContext.Provider value={request}>
      {children}
      {open && user && (
        <ReauthForm user={user} reason={reason} onResult={close} />
      )}
    </ReauthContext.Provider>
  );
}

function ReauthForm({
  user,
  reason,
  onResult,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  reason?: string;
  onResult: (ok: boolean) => void;
}) {
  const { s, fs } = useScale();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasPassword = user.providerData.some(
    (p: { providerId: string }) => p.providerId === "password",
  );
  const hasGoogle = user.providerData.some(
    (p: { providerId: string }) => p.providerId === "google.com",
  );

  const handleEmail = async () => {
    if (!user.email) return;
    setSubmitting(true);
    setError(null);
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      onResult(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = (response as { data?: { idToken?: string } }).data
        ?.idToken;
      if (!idToken) throw new Error("Google sign-in cancelled");
      const credential = GoogleAuthProvider.credential(idToken);
      await reauthenticateWithCredential(user, credential);
      onResult(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Google verification failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => onResult(false)}
      title="Confirm it's you"
      scroll={false}
    >
      <View style={{ padding: s(8) }}>
        {reason ? (
          <Text
            className="text-muted dark:text-muted-dark"
            style={{ marginBottom: s(16), fontSize: fs(14) }}
          >
            {reason}
          </Text>
        ) : null}
        {error ? (
          <Text
            className="text-danger"
            style={{ marginBottom: s(12), fontSize: fs(14) }}
          >
            {error}
          </Text>
        ) : null}
        {hasPassword && (
          <>
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <View style={{ marginTop: s(12) }}>
              <Button
                label="Verify with password"
                onPress={handleEmail}
                loading={submitting}
              />
            </View>
          </>
        )}
        {hasGoogle && (
          <View style={{ marginTop: s(12) }}>
            <Button
              label="Verify with Google"
              variant="secondary"
              onPress={handleGoogle}
              loading={submitting}
            />
          </View>
        )}
        <View style={{ marginTop: s(8) }}>
          <Button
            label="Cancel"
            variant="ghost"
            onPress={() => onResult(false)}
          />
        </View>
      </View>
    </Modal>
  );
}

export function useReauth() {
  const ctx = useContext(ReauthContext);
  if (!ctx) throw new Error("useReauth must be used within ReauthProvider");
  return ctx;
}

export async function withReauth<T>(
  fn: () => Promise<T>,
  reauth: (reason?: string) => Promise<boolean>,
  reason?: string,
): Promise<T> {
  const ok = await reauth(reason);
  if (!ok) throw new Error("Re-authentication cancelled.");
  return fn();
}
