import { config } from './config';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  storeSession,
} from './auth';
import type { ApiEnvelope, AuthUser } from './contract';

/**
 * The REST client.
 *
 * Two things it does that callers should never have to think about:
 *
 * 1. **Unwraps the envelope.** Every backend response is `{ success, message, data }`;
 *    callers get `data`.
 * 2. **Refreshes an expired token once, and retries.** A vendor mid-service must not be
 *    logged out because a token turned over between taps.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Extra fields the backend attached — e.g. `code` and `changes` on a 409. */
    readonly detail?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions extends RequestInit {
  /** Skips the Authorization header. For login, signup and password reset. */
  anonymous?: boolean;
}

/**
 * One refresh at a time.
 *
 * A screen firing three requests that all 401 must not start three refreshes: two of
 * them would be spending an already-rotated token and would log the vendor out.
 */
let refreshing: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshing) return refreshing;

  const token = getRefreshToken();
  if (!token) return false;

  refreshing = (async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      });
      if (!response.ok) return false;

      const body = (await response.json()) as ApiEnvelope<{
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      }>;
      if (!body?.data?.accessToken) return false;

      storeSession(body.data);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const { anonymous, ...init } = options;
  const token = anonymous ? null : getAccessToken();

  return fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      // FormData sets its own boundary, so never override its content type.
      ...(init.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  let response = await send(path, options);

  // One retry, and only on a 401 — a 403 means the role is wrong, which refreshing
  // cannot fix, and retrying it would just be slower.
  if (response.status === 401 && !options.anonymous) {
    if (await refreshAccessToken()) {
      response = await send(path, options);
    } else {
      clearSession();
    }
  }

  const body = (await response.json().catch(() => null)) as
    (ApiEnvelope<T> & Record<string, unknown>) | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      (body?.message as string) ?? `Request failed (${response.status})`,
      body ?? undefined,
    );
  }

  return body?.data as T;
}
