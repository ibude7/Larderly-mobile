export type AuthErrorMode = 'signin' | 'signup' | 'reset' | 'phone';

export function friendlyAuthError(message: string, mode: AuthErrorMode): string {
  const m = message.toLowerCase();
  if (
    m.includes('auth/invalid-credential') ||
    m.includes('auth/wrong-password') ||
    m.includes('auth/user-not-found') ||
    m.includes('invalid login credentials')
  ) {
    return 'That email and password combination did not match our records.';
  }
  if (m.includes('auth/user-disabled')) {
    return 'This account has been disabled. Contact support.';
  }
  if (m.includes('auth/email-already-in-use') || m.includes('already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (m.includes('auth/weak-password') || m.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (m.includes('auth/invalid-email') || m.includes('that email address')) {
    return 'That email address does not look valid.';
  }
  if (m.includes('auth/too-many-requests') || m.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (m.includes('auth/operation-not-allowed') || m.includes('auth/admin-restricted-operation')) {
    return 'This sign-in method is not enabled for this project.';
  }
  if (m.includes('auth/network-request-failed') || m.includes('network')) {
    return 'Network error. Check your connection and try again.';
  }
  return mode === 'signin'
    ? 'Sign in failed. Please try again.'
    : message || 'Something went wrong. Please try again.';
}
