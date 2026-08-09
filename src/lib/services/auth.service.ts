import { request } from '../api';
import { clearSession, storeSession } from '../auth';
import type { AuthUser, LoginResponse, VendorType } from '../contract';

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

export interface VendorRegistration {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /** E.164. The backend rejects anything else. */
  phoneNumber: string;
  vendorType: VendorType;
  businessName: string;
  businessAddress: string;
  businessCategory: string;
  businessDescription?: string;
}

export function registerVendor(input: VendorRegistration): Promise<unknown> {
  return request<unknown>('/auth/register/vendor', {
    method: 'POST',
    anonymous: true,
    body: JSON.stringify(input),
  });
}

/** The six-digit code from the email. */
export function verifyEmail(input: {
  email: string;
  code: string;
}): Promise<unknown> {
  return request<unknown>('/auth/verify-email', {
    method: 'POST',
    anonymous: true,
    body: JSON.stringify(input),
  });
}

export function resendVerification(email: string): Promise<unknown> {
  return request<unknown>('/auth/resend-verification', {
    method: 'POST',
    anonymous: true,
    body: JSON.stringify({ email }),
  });
}

// ─── Forgotten passwords ──────────────────────────────────────────────────────

export function forgotPassword(email: string): Promise<unknown> {
  return request<unknown>('/auth/forgot-password', {
    method: 'POST',
    anonymous: true,
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(input: {
  token: string;
  password: string;
}): Promise<unknown> {
  return request<unknown>('/auth/reset-password', {
    method: 'POST',
    anonymous: true,
    body: JSON.stringify(input),
  });
}
