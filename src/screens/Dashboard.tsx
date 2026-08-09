import { Link } from 'react-router-dom';
import { formatNaira } from '../lib/format';
import {
  useEarnings,
  useUpdateProfile,
  useVendorProfile,
} from '../hooks/useProfile';
import { useOrders } from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';
import type { ReactNode } from 'react';

/**
 * The hub: what the business earned, and everything that is not an order.
 *
 * Deliberately not the landing screen — Orders is. A vendor opening this app mid-service
 * wants the work, not a summary. This is where they come between rushes.
 *
 * The one control that belongs at the top is the shutter: `isOpen` hides every product
 * from buyers at once, and a vendor closing early needs it in one tap rather than buried
 * in a settings form.
 */
export function Dashboard() {
  const { data: profile, isLoading } = useVendorProfile();
  const { data: earnings } = useEarnings();
  const { awaitingCount } = useOrders('active');
  const { total: productCount } = useProducts();
  const update = useUpdateProfile();

  const open = profile?.isOpen ?? false;

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <header className="px-4 pt-6 pb-3">
        <p className="text-[11px] font-extrabold tracking-widest text-accent uppercase">
          Welcome back
        </p>
        <h1 className="mt-0.5 truncate text-3xl font-extrabold text-ink">
          {profile?.businessName ?? 'Your business'}
        </h1>
        {profile?.slug && (
          <p className="mt-1 truncate text-[12px] text-ink-faint">
            recommend.ng/store/{profile.slug}
          </p>
        )}
      </header>

      <div className="space-y-3 px-4 pb-4">
        {/* The shutter. One tap, at the top, because closing early is a decision made
            in a hurry and buried settings are how a vendor takes orders they cannot fill. */}
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm">
          <span
            className={[
              'h-3 w-3 shrink-0 rounded-full',
              open ? 'bg-brand' : 'bg-ink-faint',
            ].join(' ')}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold text-ink">
              {open ? 'Open for orders' : 'Closed'}
            </p>
            <p className="text-[12px] leading-snug text-ink-soft">
              {open
                ? 'Buyers can see and order your products.'
                : 'Your products are hidden until you open again.'}
            </p>
          </div>
          <button
            onClick={() => update.mutate({ isOpen: !open })}
            disabled={isLoading || update.isPending}
            role="switch"
            aria-checked={open}
            aria-label={open ? 'Close the shop' : 'Open the shop'}
            className={[
              'relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50',
              open ? 'bg-brand' : 'bg-hairline',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-1 h-5 w-5 rounded-full bg-white transition-all',
                open ? 'left-6' : 'left-1',
              ].join(' ')}
            />
          </button>
        </div>

        <div className="rounded-2xl bg-forest p-4 text-white">
          <p className="text-[11px] font-extrabold tracking-widest text-white/60 uppercase">
            Your earnings
          </p>
          <p className="mt-1 text-3xl font-extrabold">
            {earnings ? formatNaira(earnings.netTotal) : '—'}
          </p>
          <p className="mt-1 text-[12px] text-white/70">
            After the platform fee. Paid out manually for now.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Waiting on you" value={String(awaitingCount)} />
          <Stat label="Products listed" value={String(productCount)} />
        </div>

        <nav className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          <Row
            to="/store"
            title="Store details"
            hint="Name, description, logo"
          />
          <Row
            to="/areas"
            title="Where you deliver"
            hint={coverage(profile?.serviceAreas)}
          />
          <Row
            to="/payout"
            title="Payout account"
            hint={
              profile?.bankName
                ? `${profile.bankName} · ${mask(profile.bankAccountNumber)}`
                : 'Not set up yet'
            }
          />
          <Row to="/earnings" title="Earnings" hint="Month by month" />
          <Row to="/kyc" title="Documents" hint="Verification" last />
        </nav>

        {profile && profile.profileCompleteness < 100 && (
          <p className="px-1 text-[12px] leading-snug text-ink-soft">
            Your profile is {profile.profileCompleteness}% complete. Filling it
            in helps buyers find and trust you.
          </p>
        )}
      </div>
    </div>
  );
}

/** "Ikeja, Egbeda and 2 more" — a phone has no room for twenty area names. */
function coverage(areas?: { name: string }[]): string {
  if (!areas || areas.length === 0) return 'Not set — buyers cannot find you';
  const names = areas.map((area) => area.name);
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`;
}

/** Never the whole account number — a screenshot of this screen should be harmless. */
function mask(accountNumber: string | null | undefined): string {
  if (!accountNumber) return '';
  return `••••${accountNumber.slice(-4)}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm">
      <p className="text-2xl font-extrabold text-ink">{value}</p>
      <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">{label}</p>
    </div>
  );
}

function Row({
  to,
  title,
  hint,
  last = false,
}: {
  to: string;
  title: string;
  hint: ReactNode;
  last?: boolean;
}) {
  return (
    <Link
      to={to}
      className={[
        'flex min-h-14 items-center gap-3 px-4',
        last ? '' : 'border-b border-hairline',
      ].join(' ')}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-ink">{title}</p>
        <p className="truncate text-[12px] text-ink-soft">{hint}</p>
      </div>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="shrink-0 text-ink-faint"
      >
        <path
          d="M9 5l7 7-7 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
