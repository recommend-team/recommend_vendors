import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { SessionProvider, useSession } from './hooks/useSession';
import { BottomNav } from './components/layout/BottomNav';
import { UpdateToast } from './components/UpdateToast';
import { Welcome } from './screens/Welcome';
import { Login } from './screens/Login';
import { Orders } from './screens/Orders';
import { OrderDetail } from './screens/OrderDetail';

export function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        {/* Width-capped so the phone layout still reads on a desktop browser, which is
            where most of the testing happens. */}
        <div className="mx-auto h-full max-w-md bg-canvas shadow-xl">
          <Routes>
            <Route element={<PublicOnly />}>
              <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
            </Route>

            {/* Not built yet. Sending them to Orders beats a blank screen. */}
            <Route path="/signup" element={<ComingSoon what="Signing up" />} />
            <Route
              path="/forgot-password"
              element={<ComingSoon what="Password reset" />}
            />
            <Route path="*" element={<Navigate to="/orders" replace />} />
          </Routes>
        </div>
        <UpdateToast />
      </BrowserRouter>
    </SessionProvider>
  );
}

/**
 * The signed-in shell.
 *
 * Waits for the session check before deciding. Without that, a vendor with a perfectly
 * good token is bounced to the login screen for the split second it takes to confirm it
 * — which on a slow connection is not a split second.
 */
function RequireAuth() {
  const { user, loading } = useSession();
  const location = useLocation();

  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

/** Someone already signed in has no use for the welcome screen. */
function PublicOnly() {
  const { user, loading } = useSession();

  if (loading) return <Splash />;
  if (user) return <Navigate to="/orders" replace />;

  return <Outlet />;
}

function Splash() {
  return (
    <div className="grid h-full place-items-center bg-canvas">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-2xl font-extrabold text-white">
        R
      </span>
    </div>
  );
}

function ComingSoon({ what }: { what: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-canvas px-8 text-center">
      <p className="text-[15px] font-bold text-ink">{what} lands next</p>
      <p className="text-[13px] leading-relaxed text-ink-soft">
        For now, ask us to set your account up and sign in with the details we
        send you.
      </p>
      <a
        href="/login"
        className="mt-2 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-[14px] font-bold text-white"
      >
        Back to login
      </a>
    </div>
  );
}
