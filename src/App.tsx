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
import { SignUp } from './screens/SignUp';
import { VerifyEmail } from './screens/VerifyEmail';
import { ForgotPassword, ResetPassword } from './screens/ForgotPassword';
import { Orders } from './screens/Orders';
import { OrderDetail } from './screens/OrderDetail';
import { Kyc } from './screens/Kyc';
import { Products } from './screens/Products';
import { ProductForm } from './screens/ProductForm';
import { ApprovalBanner } from './components/ApprovalBanner';

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
              <Route path="/signup" element={<SignUp />} />
              <Route path="/verify" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/new" element={<ProductForm />} />
              <Route path="/products/:id" element={<ProductForm />} />
              <Route path="/kyc" element={<Kyc />} />
            </Route>

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
 * Waits for the session check before deciding — without that, a vendor with a perfectly
 * good token is bounced to login for however long the check takes, which on a slow
 * connection is not a moment.
 */
function RequireAuth() {
  const { user, loading } = useSession();
  const location = useLocation();

  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return (
    <div className="flex h-full flex-col">
      <ApprovalBanner />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

/** Someone already signed in has no use for the welcome or signup screens. */
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
