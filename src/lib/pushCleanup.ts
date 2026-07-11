export type PushTokenUnregister = (uid: string) => Promise<void>;

export async function bestEffortPushCleanup(
  uid: string,
  unregister: PushTokenUnregister,
  warn: (message: string, error: unknown) => void = console.warn,
): Promise<void> {
  if (!uid) return;
  try {
    await unregister(uid);
  } catch (error) {
    warn('[Larderly] Push cleanup failed', error);
  }
}
