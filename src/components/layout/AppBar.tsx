import { Link } from 'react-router-dom';
import { useVendorProfile } from '../../hooks/useProfile';
import { useSession } from '../../hooks/useSession';
import { useUnreadCount } from '../../hooks/useNotifications';

/**
 * The bar across the top of every signed-in screen.
 *
 * The references put it above the page's own title rather than instead of it: the bar
 * says which product this is, the title says where you are. It stays fixed while the
 * page scrolls, so the way out — the menu — is never scrolled off.
 */
export function AppBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user } = useSession();
  const { data: profile } = useVendorProfile();

  const logo = profile?.businessLogoUrl;
  const initial =
    (profile?.businessName ?? user?.businessName ?? user?.firstName ?? 'R')
      .trim()
      .charAt(0)
      .toUpperCase() || 'R';

  return (
    <header className="flex items-center gap-3 border-b border-hairline bg-canvas px-4 py-3">
      <button
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="-ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink active:bg-black/5"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <p className="min-w-0 flex-1 truncate text-[17px] font-extrabold text-accent">
        Recommend
      </p>

      <NotificationBell />

      {/* The avatar is the way into the business's own details, which is where a vendor
          goes looking when they tap their own face. */}
      <Link
        to="/store"
        aria-label="Your business"
        className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-forest text-[14px] font-extrabold text-white"
      >
        {logo ? (
          <img src={logo} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </Link>
    </header>
  );
}

/**
 * The way into the record of what happened.
 *
 * Worth its place in the bar rather than the drawer: it is the only surface in the app
 * that survives a missed push, and until vendors start granting notification permission
 * it is the *only* one that works at all.
 *
 * The count is capped at 9+. A vendor with forty unread needs to open it, not read the
 * number — and three digits in a badge stop being legible anyway.
 */
function NotificationBell() {
  const { data: unread = 0 } = useUnreadCount();

  return (
    <Link
      to="/notifications"
      aria-label={
        unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'
      }
      className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink active:bg-black/5"
    >
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3a6 6 0 016 6v3.6l1.4 2.6a.8.8 0 01-.7 1.2H5.3a.8.8 0 01-.7-1.2L6 12.6V9a6 6 0 016-6z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M9.8 19a2.3 2.3 0 004.4 0"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>

      {unread > 0 && (
        <span className="absolute top-0.5 right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-extrabold text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}
