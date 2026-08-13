import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

/**
 * The tab bar from the references.
 *
 * The active tab is an orange tile with a white glyph, not a tinted icon. On a phone held
 * at arm's length across a counter that difference is the whole point: the filled shape
 * is legible in peripheral vision, a colour change is not.
 */
const TABS: { to: string; label: string; icon: ReactNode }[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <path
        d="M4 4h7v7H4V4zm9 0h7v4h-7V4zM4 13h7v7H4v-7zm9-3h7v10h-7V10z"
        fill="currentColor"
      />
    ),
  },
  {
    to: '/products',
    label: 'Products',
    icon: (
      <path
        d="M4 7l8-4 8 4v10l-8 4-8-4V7zm8 0l6-3M4 7l8 4 8-4M12 11v10"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinejoin="round"
      />
    ),
  },
  {
    to: '/orders',
    label: 'Orders',
    icon: (
      <path
        d="M5 4h14v16H5V4zm3 4h8v1.7H8V8zm0 4h8v1.7H8V12zm0 4h5v1.7H8V16z"
        fill="currentColor"
      />
    ),
  },
  {
    to: '/wallet',
    label: 'Wallet',
    icon: (
      <>
        <path
          d="M3 8a2 2 0 012-2h11a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
          strokeLinejoin="round"
        />
        <path
          d="M18 10.5h3v3h-3a1.5 1.5 0 010-3z"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
          strokeLinejoin="round"
        />
      </>
    ),
  },
];

// KYC is not a tab. It is a setup task done once and then never again, and a permanent
// place in the four most valuable targets in the app is too much rent for that. It lives
// in the drawer, and the approval banner points at it while it still matters.

export function BottomNav() {
  return (
    <nav
      className="flex items-stretch justify-around border-t border-hairline bg-surface"
      // Reaches under the home indicator without putting a tap target beneath it.
      style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className="flex flex-1 flex-col items-center gap-1 px-1 pt-2 pb-1.5"
        >
          {({ isActive }) => (
            <>
              <span
                className={[
                  'grid h-9 w-9 place-items-center rounded-2xl transition',
                  isActive ? 'bg-accent text-white' : 'text-ink-faint',
                ].join(' ')}
              >
                <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden>
                  {tab.icon}
                </svg>
              </span>
              <span
                className={[
                  'text-[9px] font-extrabold tracking-wider uppercase',
                  isActive ? 'text-ink' : 'text-ink-faint',
                ].join(' ')}
              >
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
