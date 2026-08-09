import type { AuthUser } from './contract';

/**
 * Where the vendor's session lives.
 *
 * Storage only — nothing here talks to the network, so `api.ts` can depend on it without
 * a cycle. Deliberately synchronous, which is also what makes swapping `localStorage`
 * for React Native's `SecureStore` a contained change later.
 */

const ACCESS_KEY = 'recommend.vendor.accessToken';
const REFRESH_KEY = 'recommend.vendor.refreshToken';
const USER_KEY = 'recommend.vendor.user';

/** Some browsers throw on storage in private mode rather than returning null. */
function safeStorage(): Storage | null {
  try {
    const probe = '__recommend_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

/** In-memory fallback so a private-mode vendor still gets a working session per tab. */
const memory: Record<string, string> = {};

function read(key: string): string | null {
  const storage = safeStorage();
  if (!storage) return memory[key] ?? null;
  return storage.getItem(key);
}

function write(key: string, value: string): void {
  memory[key] = value;
  safeStorage()?.setItem(key, value);
}

function drop(key: string): void {
  delete memory[key];
  safeStorage()?.removeItem(key);
}

export function getAccessToken(): string | null {
  return read(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return read(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = read(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    // Corrupted by a half-written storage quota or an older shape. Drop it rather than
    // crash on every render.
    drop(USER_KEY);
    return null;
  }
}

export function storeSession(session: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}): void {
  write(ACCESS_KEY, session.accessToken);
  write(REFRESH_KEY, session.refreshToken);
  write(USER_KEY, JSON.stringify(session.user));
}

/** Used on logout, and whenever a refresh fails — a half-cleared session is worse. */
export function clearSession(): void {
  drop(ACCESS_KEY);
  drop(REFRESH_KEY);
  drop(USER_KEY);
}
