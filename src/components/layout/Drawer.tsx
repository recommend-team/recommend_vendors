import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import { useVendorProfile } from '../../hooks/useProfile';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

/**
 * What the hamburger opens.
 *
 * Everything that is not a tab: the business's own settings, and the way out. These were
 * reachable only as rows on the Dashboard before, which meant a vendor deep in Orders had
 * to go home first to change their payout account.
 *
 * Closes on navigation — a menu that stays open over the screen it just moved you to is
 * the most common way a drawer goes wrong.
 */
// The wallet is not here: it earned a tab, and a destination reachable two ways is a
// destination a vendor learns twice.
const LINKS: { to: string; label: string; hint: string }[] = [
  { to: '/store', label: 'Store details', hint: 'Name, description, logo' },
  { to: '/areas', label: 'Where you deliver', hint: 'Your service areas' },
  {
    to: '/payout-accounts',
    label: 'Payout accounts',
    hint: 'Banks you withdraw to',
  },
  { to: '/earnings', label: 'Sales', hint: 'Month by month' },
  { to: '/kyc', label: 'Documents', hint: 'Verification' },
];

export function Drawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useSession();
  const { data: profile } = useVendorProfile();
  const { kind, installed, install, reset } = useInstallPrompt();
  const location = useLocation();
  const navigate = useNavigate();

  // Any navigation closes it, including the browser's back button.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Escape closes it too, which costs nothing and matters on the desktop browser this
  // gets tested in.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={[
          'fixed inset-0 z-40 bg-black/40 transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      />

      <aside
        aria-hidden={!open}
        className={[
          'fixed top-0 bottom-0 left-0 z-50 flex w-72 max-w-[80%] flex-col bg-surface transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="bg-forest px-5 pt-8 pb-5 text-white">
          <p className="text-[11px] font-extrabold tracking-widest text-white/60 uppercase">
            Signed in as
          </p>
          <p className="mt-1 truncate text-[18px] font-extrabold">
            {profile?.businessName ?? user?.businessName ?? 'Your business'}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-white/70">
            {user?.email}
          </p>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto py-2">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex min-h-14 flex-col justify-center border-b border-hairline px-5 active:bg-black/5"
            >
              <span className="text-[15px] font-bold text-ink">
                {link.label}
              </span>
              <span className="text-[12px] text-ink-soft">{link.hint}</span>
            </Link>
          ))}
        </nav>

        <div
          className="space-y-2 border-t border-hairline p-4"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          {/**
           * The permanent way back to installing — on demand, from any screen.
           *
           * A vendor who swiped the banner away in the middle of a rush should not lose
           * notifications for good, and on iOS there is no browser install button to fall
           * back on. So this clears the dismissal *and*, where Chrome gave us a prompt to
           * replay, installs right here from the tap rather than routing to a banner and
           * hoping. Only iOS and a spent prompt need the trip to Orders, because there
           * the answer is instructions rather than a dialog.
           *
           * Hidden when `kind` is null: already installed, or a browser that cannot
           * install at all. A button that provably does nothing is worse than no button —
           * that was the original complaint.
           */}
          {!installed && kind !== null && (
            <button
              onClick={() => {
                reset();
                if (kind === 'native') {
                  install();
                  onClose();
                } else {
                  navigate('/orders');
                }
              }}
              className="min-h-12 w-full rounded-full bg-mint text-[15px] font-bold text-brand"
            >
              Add to home screen
            </button>
          )}

          <button
            onClick={() => void logout()}
            className="min-h-12 w-full rounded-full bg-amber text-[15px] font-bold text-ink"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
