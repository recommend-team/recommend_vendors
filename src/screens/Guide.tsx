import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { useSession } from '../hooks/useSession';
import { percentText, vendorShare } from '../lib/fees';
import { useCategoryOptions, useVendorProfile } from '../hooks/useProfile';
import { formatNaira } from '../lib/format';

/** The worked example in the fees section — a round number makes the cut obvious. */
const EXAMPLE_PRICE = 10000;

/**
 * How Recommend works, for vendors.
 *
 * Public on purpose: someone deciding whether to sign up wants to know what it costs
 * before handing over their details, and nothing here is private. Signed-in vendors reach
 * the same page from the menu, the dashboard and the price field.
 *
 * The fee comes first and stays open. It is the one thing a vendor will be upset to
 * discover late, and the sections they skim past are the ones they already understand.
 */
export function Guide() {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <ScreenHeader
        title="How Recommend works"
        subtitle="Selling, orders and fees"
      />

      <div className="flex-1 space-y-3 px-4 pb-8">
        <p className="px-1 text-[14px] leading-relaxed text-ink-soft">
          Recommend puts your products in front of buyers already looking for
          food in your area. You list what you sell, buyers pay up front, and
          you get paid once they receive it.
        </p>

        <Section title="Fees: what Recommend keeps" open>
          {/* Signed in: their own rate. Deciding whether to sign up: each category's. */}
          {user && !loading ? <YourFee /> : <FeesByCategory />}
          <p>
            Delivery is never part of the fee. Set your prices with the fee in
            mind: the price form shows what you will receive as you type.
          </p>
          <p>
            In your wallet, each sale appears as two lines, the sale and the
            Recommend fee, so you can always check the arithmetic.
          </p>
        </Section>

        <Section title="Getting approved">
          <p>
            New accounts are reviewed before they can list products. To get
            approved quickly:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Upload your verification documents under Documents.</li>
            <li>Fill in your store name, description and logo.</li>
            <li>
              Choose where you deliver. Buyers only see vendors who cover their
              area, so a store with no areas set is invisible.
            </li>
          </ul>
        </Section>

        <Section title="Adding products">
          <p>
            Tap <strong>Add a product</strong> and give it a photo, a name and a
            price. A description is optional but helps buyers decide.
          </p>
          <p>
            Photos taken in daylight against a plain background sell best. When
            you run out of something, turn off <strong>In stock</strong>: the
            listing stays, buyers just can&apos;t order it until you turn it
            back on.
          </p>
        </Section>

        <Section title="Extras">
          <p>
            An extra is something buyers add to a product they order — Beef, a
            Takeaway pack, Water. Go to <strong>Products</strong>, open the{' '}
            <strong>Extras</strong> tab and tap <strong>+ Add extra</strong>,
            then tick the products it goes with.
          </p>
          <p>
            Extras are never sold on their own and don&apos;t appear in search.
            They are charged the same fee as any other item.
          </p>
        </Section>

        <Section title="Handling orders">
          <p>
            You are alerted the moment a buyer pays. Allow notifications and add
            the app to your home screen so you never miss one.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Prepare the order.</li>
            <li>
              Tap <strong>Mark ready for pickup</strong>. For delivery, the
              order shows who is coming to collect it, with a button to call
              them. For pickup, the buyer collects it from you.
            </li>
            <li>
              The order completes once the buyer confirms they received it.
            </li>
          </ul>
        </Section>

        <Section title="Getting paid">
          <p>
            Your share of a sale reaches your wallet when the order completes.
            Sales shows everything you have sold; the wallet shows only what is
            ready to withdraw, so the two differ while orders are on the way.
          </p>
          <p>
            Add a bank account under Payout accounts, then withdraw from the
            wallet. A small bank transfer fee applies, and you see the exact
            amount that will reach your bank before you confirm.
          </p>
        </Section>

        {!loading && (
          <div className="pt-3">
            {user ? (
              <Button onClick={() => navigate('/dashboard')}>
                Go to dashboard
              </Button>
            ) : (
              <Button onClick={() => navigate('/signup')}>Start selling</Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * A signed-in vendor's own rate, worked through on an example — the rate the server
 * charges them: one agreed with them, their category's, or the standard one.
 */
function YourFee() {
  const { data: profile } = useVendorProfile();
  const commission = profile?.commission;
  if (!commission) {
    return (
      <p>
        Recommend keeps a share of the price of every item sold, add-ons included.
        You keep the rest. There is no sign-up fee and no monthly charge.
      </p>
    );
  }
  const percent = commission.percent;
  const share = vendorShare(EXAMPLE_PRICE, percent);
  const why =
    commission.basis === 'CUSTOM'
      ? 'This is a rate agreed with you.'
      : commission.basis === 'CATEGORY'
        ? `This is the rate for ${commission.categoryName}.`
        : 'This is the standard rate. It may change once your store is in a category.';
  return (
    <>
      <p>
        For every sale, Recommend keeps <strong>{percentText(percent)}</strong> of
        the price of the items sold, add-ons included. You keep the rest. {why} There
        is no sign-up fee and no monthly charge.
      </p>
      <div className="rounded-2xl bg-canvas p-4 text-[13px]">
        <Row label="A buyer pays for an item" value={formatNaira(EXAMPLE_PRICE)} />
        <Row
          label={`Recommend fee (${percentText(percent)})`}
          value={`−${formatNaira(EXAMPLE_PRICE - share)}`}
        />
        <Row label="You receive" value={formatNaira(share)} strong />
      </div>
      <p>
        If your rate ever goes up, you are told before your next order — in the app
        and by email. Orders already placed never change.
      </p>
    </>
  );
}

/** Before signing up: what Recommend keeps depends on what you sell. */
function FeesByCategory() {
  const { data: categories } = useCategoryOptions();
  return (
    <>
      <p>
        Recommend keeps a share of the price of every item sold, add-ons included,
        and you keep the rest. The share depends on what you sell. There is no
        sign-up fee and no monthly charge.
      </p>
      {categories && categories.length > 0 && (
        <div className="rounded-2xl bg-canvas p-4 text-[13px]">
          {categories.map((category) => (
            <Row
              key={category.id}
              label={category.name}
              value={percentText(category.feePercent)}
            />
          ))}
        </div>
      )}
    </>
  );
}

/**
 * One topic. A native `<details>` rather than state: it opens with a keyboard, a screen
 * reader announces it, and in-page search finds text inside it while it is closed.
 */
function Section({
  title,
  open,
  children,
}: {
  title: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} className="group rounded-2xl bg-surface shadow-sm">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 text-[15px] font-extrabold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="shrink-0 text-ink-soft transition-transform group-open:rotate-180"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="space-y-3 px-4 pb-4 text-[14px] leading-relaxed text-ink-soft">
        {children}
      </div>
    </details>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={[
        'flex justify-between gap-3 py-1',
        strong
          ? 'mt-1 border-t border-hairline pt-2 font-extrabold text-ink'
          : '',
      ].join(' ')}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
