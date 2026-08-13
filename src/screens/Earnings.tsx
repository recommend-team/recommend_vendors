import { Link } from 'react-router-dom';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { useEarnings } from '../hooks/useProfile';
import { formatNaira } from '../lib/format';

/**
 * What the business has sold.
 *
 * Bars rather than a chart library: a dozen months of two numbers does not justify
 * shipping a charting dependency to a phone on mobile data, and a bar whose width is a
 * percentage is legible at a glance in a way a line chart on a small screen is not.
 *
 * **Still not the wallet**, though the reason has changed. Payouts are no longer arranged
 * by hand — there is a real balance now — but this counts every *paid* order while the
 * wallet counts only those a customer confirmed receiving. Two honest numbers that
 * disagree, so the difference is stated rather than left to be discovered.
 */
export function Earnings() {
  const { data, isLoading, isError } = useEarnings();

  const months = data?.monthlyBreakdown ?? [];
  const peak = Math.max(1, ...months.map((month) => month.gross));

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <ScreenHeader title="Sales" />

      <div className="space-y-3 px-4 pb-6">
        {isLoading && (
          <p className="py-10 text-center text-[13px] text-ink-soft">
            Loading…
          </p>
        )}

        {isError && (
          <p className="py-10 text-center text-[13px] text-ink-soft">
            Couldn&apos;t load your earnings.
          </p>
        )}

        {data && (
          <>
            <div className="rounded-2xl bg-forest p-5 text-white">
              <p className="text-[11px] font-extrabold tracking-widest text-white/60 uppercase">
                Yours to keep
              </p>
              <p className="mt-1 text-4xl font-extrabold">
                {formatNaira(data.netTotal)}
              </p>
              <div className="mt-4 flex gap-6 text-[12px] text-white/70">
                <span>Sold {formatNaira(data.grossTotal)}</span>
                <span>Fee {formatNaira(data.platformFeeTotal)}</span>
              </div>
            </div>

            <Link
              to="/wallet"
              className="block rounded-2xl bg-mint px-4 py-3 text-[12px] leading-snug text-brand"
            >
              This counts everything customers have paid for. Money becomes
              yours to withdraw once they confirm they received the order —{' '}
              <span className="font-extrabold underline">
                see your wallet balance
              </span>
              .
            </Link>

            <section className="rounded-2xl bg-surface p-4 shadow-sm">
              <h2 className="text-[11px] font-extrabold tracking-widest text-ink-faint uppercase">
                Month by month
              </h2>

              {months.length === 0 && (
                <p className="py-6 text-center text-[13px] text-ink-soft">
                  Nothing yet. Completed orders show up here.
                </p>
              )}

              <ul className="mt-3 space-y-3">
                {months.map((month) => (
                  <li key={month.month}>
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="font-bold text-ink">{month.month}</span>
                      <span className="font-extrabold text-ink">
                        {formatNaira(month.net)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-hairline">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{
                          width: `${Math.max(2, (month.gross / peak) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
