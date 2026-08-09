import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getAccessToken, getStoredUser } from '../lib/auth';
import {
  fetchProfile,
  login as loginRequest,
  logout as logoutRequest,
} from '../lib/services/auth.service';
import type { AuthUser } from '../lib/contract';

interface Session {
  user: AuthUser | null;
  /** True until the stored token has been checked, so the app never flashes the login screen. */
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

/**
 * Who is signed in.
 *
 * The stored user is shown immediately and confirmed against the server in the
 * background: a vendor opening the app on a bus should see their orders, not a spinner,
 * and a token that turns out to be dead drops them to login a moment later.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(() => !!getAccessToken());

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const fresh = await fetchProfile();
        if (!cancelled) setUser(fresh);
      } catch {
        if (!cancelled && !getAccessToken()) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const session = await loginRequest(credentials);
      setUser(session.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error('useSession must be used inside a SessionProvider');
  }
  return session;
}
