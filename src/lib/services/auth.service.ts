import { request } from '../api';
import { clearSession, storeSession } from '../auth';
import type { AuthUser, LoginResponse } from '../contract';

/**
 * Signing in.
 *
 * **The API authenticates by email, not phone.** The reference design shows a phone
 * field with a +234 selector; `loginSchema` on the backend is `{ email, password }` and
 * there is no phone lookup anywhere in `auth.service.ts`. Building the phone field would
 * produce a login screen that cannot log anyone in, so this follows the API.
 *
 * If phone login is wanted it is a backend change first — resolve the number to a user,
 * decide what happens when two accounts share one, and only then move the field.
 */
export async function login(credentials: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  const session = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    anonymous: true,
    body: JSON.stringify(credentials),
  });

  storeSession(session);
  return session;
}

/**
 * Whoever the stored token belongs to.
 *
 * Used on boot to confirm a token is still good before showing the app. A stale token
 * that fails here is better found now than when a vendor taps "Ready for pickup".
 */
export function fetchProfile(): Promise<AuthUser> {
  return request<AuthUser>('/auth/profile');
}

export async function logout(): Promise<void> {
  try {
    await request<null>('/auth/logout', { method: 'POST' });
  } catch {
    // A failed server-side logout must not strand the vendor in a signed-in shell.
    // Clearing locally is what actually signs them out of this device.
  } finally {
    clearSession();
  }
}
