import { useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { SessionProvider, useSession } from './hooks/useSession';
import { AppBar } from './components/layout/AppBar';
import { Drawer } from './components/layout/Drawer';
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
import { Dashboard } from './screens/Dashboard';
import { StoreDetails } from './screens/StoreDetails';
import { ServiceAreas } from './screens/ServiceAreas';
import { PayoutAccounts } from './screens/PayoutAccounts';
import { Wallet } from './screens/Wallet';
import { Withdraw } from './screens/Withdraw';
import { Notifications } from './screens/Notifications';
import { Earnings } from './screens/Earnings';
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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/store" element={<StoreDetails />} />
              <Route path="/areas" element={<ServiceAreas />} />
              <Route path="/payout-accounts" element={<PayoutAccounts />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/withdraw" element={<Withdraw />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/earnings" element={<Earnings />} />
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
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return (
    <div className="flex h-full flex-col">
      {/* Only the tab screens get the bar. Everything deeper carries its own header with
          a back button, and stacking the two would cost a phone-height of chrome and
          leave two competing ways out on one screen. */}
      {TAB_ROUTES.includes(location.pathname) && (
        <AppBar onOpenMenu={() => setMenuOpen(true)} />
      )}
      <ApprovalBanner />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}

/** The bottom-nav destinations — the only screens with no back button of their own. */
const TAB_ROUTES = ['/dashboard', '/products', '/orders', '/wallet'];

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
