import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useWallet, useWalletEntries, useWithdrawals } from '../hooks/useWallet';
import { formatNaira } from '../lib/format';
import type { WalletEntry, Withdrawal } from '../lib/contract';

/**
 * What can actually be taken out, and where every naira of it came from.
 *
 * The balance and the statement are one screen on purpose. A number on its own invites
 * "why is it that?", and the answer is the list directly beneath it — a sale and its
 * commission appear as two lines, so the arithmetic is visible rather than asserted.
 *
 * Distinct from Earnings, which counts everything sold. This counts only what customers
 * have confirmed receiving, and the gap between them is orders still in transit.
 */
export function Wallet() {
  const wallet = useWallet();
  const entries = useWalletEntries();
  const withdrawals = useWithdrawals();

  const balance = wallet.data?.balance ?? 0;
  const inFlight = (withdrawals.data ?? []).filter(
    (w) => w.status === 'PROCESSING' || w.status === 'REQUESTED',
  );

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      {/* A tab, so it carries its own title rather than a back button — the AppBar above
          is already the way out, and stacking a second header would cost a phone-height
          of chrome. Matches Orders. */}
      <header className="px-4 pt-5 pb-3">
        <p className="text-[11px] font-extrabold tracking-widest text-ink-soft uppercase">
          Your money
        </p>
        <h1 className="mt-0.5 text-[28px] leading-tight font-extrabold text-ink">
          Wallet
        </h1>
      </header>

      <div className="space-y-3 px-4 pb-6">
        <div className="rounded-2xl bg-forest p-5 text-white">
          <p className="text-[11px] font-extrabold tracking-widest text-white/60 uppercase">
            Available to withdraw
          </p>
          <p className="mt-1 text-4xl font-extrabold">
            {wallet.isLoading ? '—' : formatNaira(balance)}
          </p>
          <p className="mt-3 text-[12px] leading-snug text-white/70">
            Money lands here when a customer confirms they received their order.
          </p>
        </div>

        {wallet.isError && (
          <p className="py-6 text-center text-[13px] text-ink-soft">
            Couldn&apos;t load your wallet.
          </p>
        )}

        <Link to="/withdraw" className="block">
          <Button disabled={balance <= 0}>
            {balance > 0 ? 'Withdraw' : 'Nothing to withdraw yet'}
          </Button>
        </Link>

        {inFlight.length > 0 && (
          <section className="rounded-2xl bg-amber/30 p-4">
            <h2 className="text-[11px] font-extrabold tracking-widest text-ink-faint uppercase">
              On its way
            </h2>
            <ul className="mt-2 space-y-1">
              {inFlight.map((w) => (
                <li
                  key={w.id}
                  className="flex items-baseline justify-between text-[13px]"
                >
                  <span className="text-ink-soft">{w.reference}</span>
                  <span className="font-bold text-ink">
                    {formatNaira(w.amountSent)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] leading-snug text-ink-soft">
              Transfers can take a little while to clear. We&apos;ll tell you
              the moment it reaches your bank.
            </p>
          </section>
        )}

        <section className="rounded-2xl bg-surface p-4 shadow-sm">
          <h2 className="text-[11px] font-extrabold tracking-widest text-ink-faint uppercase">
            Everything that moved
          </h2>

          {entries.isLoading && (
            <p className="py-6 text-center text-[13px] text-ink-soft">
              Loading…
            </p>
          )}

          {entries.data?.length === 0 && (
            <p className="py-6 text-center text-[13px] text-ink-soft">
              Nothing yet. Your first delivered order shows up here.
            </p>
          )}

          <ul className="mt-2 divide-y divide-hairline">
            {(entries.data ?? []).map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </ul>
        </section>

        <PastWithdrawals withdrawals={withdrawals.data ?? []} />
      </div>
    </div>
  );
}

/** Labels a vendor would use, not the enum. */
const ENTRY_LABEL: Record<WalletEntry['type'], string> = {
  EARNING: 'Order delivered',
  COMMISSION: 'Recommend fee',
  WITHDRAWAL: 'Withdrawn',
  WITHDRAWAL_REVERSED: 'Withdrawal returned',
  ADJUSTMENT: 'Adjustment',
};

function EntryRow({ entry }: { entry: WalletEntry }) {
  const credit = entry.amount >= 0;

  return (
    <li className="flex items-baseline justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-[14px] font-bold text-ink">
          {ENTRY_LABEL[entry.type]}
        </p>
        <p className="text-[12px] text-ink-soft">
          {new Date(entry.createdAt).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
          })}
          {entry.note ? ` · ${entry.note}` : ''}
        </p>
      </div>
      {/* The sign is carried by the number itself — a debit rendered without one reads as
          money arriving. */}
      <span
        className={[
          'shrink-0 text-[14px] font-extrabold',
          credit ? 'text-brand' : 'text-ink-soft',
        ].join(' ')}
      >
        {credit ? '+' : '−'}
        {formatNaira(Math.abs(entry.amount))}
      </span>
    </li>
  );
}

function PastWithdrawals({ withdrawals }: { withdrawals: Withdrawal[] }) {
  const settled = withdrawals.filter(
    (w) => w.status !== 'PROCESSING' && w.status !== 'REQUESTED',
  );
  if (settled.length === 0) return null;

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-sm">
      <h2 className="text-[11px] font-extrabold tracking-widest text-ink-faint uppercase">
        Past withdrawals
      </h2>
      <ul className="mt-2 divide-y divide-hairline">
        {settled.map((w) => (
          <li key={w.id} className="flex items-baseline justify-between py-3">
            <div>
              <p className="text-[14px] font-bold text-ink">
                {formatNaira(w.amountSent)}
              </p>
              <p className="text-[12px] text-ink-soft">{w.reference}</p>
            </div>
            <span
              className={[
                'text-[12px] font-bold',
                w.status === 'SETTLED' ? 'text-brand' : 'text-accent',
              ].join(' ')}
            >
              {w.status === 'SETTLED' ? 'Paid out' : 'Returned'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
