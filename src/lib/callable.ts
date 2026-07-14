/**
 * Shared Firebase Callable helpers for the mobile client.
 *
 * Normalizes RNFirebase callable results and surfaces `HttpsError` codes as
 * readable Error messages for UI toasts.
 */

import { httpsCallable, type HttpsCallable } from '@react-native-firebase/functions';
import { functions } from './firebase';

export class CallableError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'CallableError';
    this.code = code;
  }
}

function toCallableError(err: unknown): CallableError {
  if (err && typeof err === 'object') {
    const e = err as { code?: string; message?: string; nativeErrorMessage?: string };
    const code = typeof e.code === 'string' ? e.code.replace(/^functions\//, '') : 'unknown';
    const message =
      (typeof e.message === 'string' && e.message) ||
      (typeof e.nativeErrorMessage === 'string' && e.nativeErrorMessage) ||
      'Cloud Function request failed';
    return new CallableError(code, message);
  }
  return new CallableError('unknown', err instanceof Error ? err.message : 'Cloud Function request failed');
}

/** Typed callable bound to the shared `us-central1` Functions instance. */
export function callable<TRequest, TResponse>(name: string): HttpsCallable<TRequest, TResponse> {
  return httpsCallable<TRequest, TResponse>(functions, name);
}

/** Invoke a callable and unwrap `.data`, remapping Firebase errors. */
export async function callFunction<TRequest, TResponse>(
  fn: HttpsCallable<TRequest, TResponse>,
  payload: TRequest,
): Promise<TResponse> {
  try {
    const result = await fn(payload);
    return result.data;
  } catch (err) {
    throw toCallableError(err);
  }
}
