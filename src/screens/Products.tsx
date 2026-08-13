import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Fab } from '../components/ui/Fab';
import { formatNaira } from '../lib/format';
import { PRODUCT_LIMIT } from '../lib/services/products.service';
import { useProducts, useToggleAvailability } from '../hooks/useProducts';
import { useSession } from '../hooks/useSession';
import type { Product } from '../lib/contract';

type Filter = 'all' | 'inStock' | 'outOfStock';

/**
 * The catalogue.
 *
 * Search and filters are here because a vendor with twenty products scrolling on a phone
 * needs them, and twenty is the ceiling the backend enforces — so both stay client-side.
 * One request, filtered in memory, no round trip per keystroke.
 *
 * **"Out of stock", never "Hidden".** The flag underneath is `isAvailable`, which is
 * really "do buyers see this", but that describes the mechanism rather than the reason.
 * Running out is why a vendor reaches for this switch nearly every time, so it is worded
 * as stock.
 *
 * The row and the filter read `Active` / `Out of stock`. The edit form's switch reads
 * `In stock`, because a switch labelled "Active" whose off position means "out of stock"
 * is a riddle — a badge and a toggle want different grammar for the same fact.
 */
export function Products() {
  const { user } = useSession();
  const { products, total, isLoading, isError, refetch } = useProducts();
  const toggle = useToggleAvailability();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [blocked, setBlocked] = useState<string | null>(null);

  const approved = user?.status === 'APPROVED';
  const atLimit = total >= PRODUCT_LIMIT;
  const canAdd = approved && !atLimit;

  const visible = products.filter((product) => {
    if (filter === 'inStock' && !product.isAvailable) return false;
    if (filter === 'outOfStock' && product.isAvailable) return false;
    if (!search) return true;

    const needle = search.toLowerCase();
    return (
      product.name.toLowerCase().includes(needle) ||
      (product.description ?? '').toLowerCase().includes(needle)
    );
  });

  return (
    <div className="flex min-h-full flex-col bg-canvas pb-28">
      <header className="px-4 pt-5 pb-4">
        <h1 className="text-[26px] leading-tight font-extrabold text-ink">
          Product Inventory
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          Manage your listings and what buyers can see.{' '}
          <span className="font-bold text-accent">
            {total} of {PRODUCT_LIMIT}
          </span>{' '}
          used.
        </p>
      </header>

      <div className="px-4">
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-faint">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="1.9"
              />
              <path
                d="m16.5 16.5 4 4"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="min-h-12 w-full rounded-full border border-hairline bg-surface pr-5 pl-11 text-ink outline-none placeholder:text-ink-faint"
          />
        </div>

        <div className="mt-3 flex gap-2">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            All Items
          </Chip>
          <Chip
            active={filter === 'inStock'}
            onClick={() => setFilter('inStock')}
          >
            Active
          </Chip>
          <Chip
            active={filter === 'outOfStock'}
            onClick={() => setFilter('outOfStock')}
          >
            Out of Stock
          </Chip>
        </div>
      </div>

      <div className="flex-1 space-y-3 px-4 py-4">
        {isLoading && (
          <p className="py-10 text-center text-[13px] text-ink-soft">
            Loading your products…
          </p>
        )}

        {isError && (
          <div className="py-10 text-center">
            <p className="text-[13px] text-ink-soft">
              Couldn&apos;t load your products.
            </p>
            <button
              onClick={() => void refetch()}
              className="mt-3 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-[14px] font-bold text-white"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && visible.length === 0 && (
          <p className="py-10 text-center text-[13px] leading-relaxed text-ink-soft">
            {products.length === 0
              ? 'Nothing listed yet. Add your first product and buyers can start finding you.'
              : 'Nothing matches that.'}
          </p>
        )}

        {visible.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            busy={toggle.isPending && toggle.variables?.id === product.id}
            onToggle={() =>
              toggle.mutate({
                id: product.id,
                isAvailable: !product.isAvailable,
              })
            }
          />
        ))}

        {toggle.isError && (
          <p
            role="alert"
            className="rounded-2xl bg-accent/10 px-4 py-3 text-[13px] text-accent"
          >
            Couldn&apos;t update that. Nothing has changed — try again.
          </p>
        )}

        {/**
         * Why the button is always drawn.
         *
         * It used to be hidden unless the vendor was approved and under the limit, on the
         * grounds that `POST /products` would refuse them anyway. That reasoning was
         * wrong: a vendor who cannot find the button does not conclude "I must not be
         * approved yet", they conclude the app is broken. It is shown, and tapping it
         * when it cannot work says why instead of navigating into a form that will fail.
         */}
        {blocked && (
          <p
            role="status"
            className="rounded-2xl bg-amber px-4 py-3 text-[13px] leading-snug text-ink"
          >
            {blocked}
          </p>
        )}
      </div>

      <Fab
        label="Add a product"
        to={canAdd ? '/products/new' : undefined}
        onClick={
          canAdd
            ? undefined
            : () =>
                setBlocked(
                  atLimit
                    ? `You've listed the maximum of ${PRODUCT_LIMIT} products. Remove one to add another.`
                    : 'You can add products once an admin approves your account. Uploading your documents is the fastest way there.',
                )
        }
      />
    </div>
  );
}

function ProductRow({
  product,
  busy,
  onToggle,
}: {
  product: Product;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-sm">
      <Link to={`/products/${product.id}`} className="flex min-w-0 flex-1 gap-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            loading="lazy"
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-amber text-ink-faint">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="m4 17 4.5-5 3 3.2L15 12l5 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold text-ink">
            {product.name}
          </p>
          <p className="mt-0.5 text-[15px] font-extrabold text-accent">
            {formatNaira(product.price)}
          </p>
          <p
            className={[
              'mt-1 flex items-center gap-1.5 text-[11px] font-extrabold tracking-wider uppercase',
              product.isAvailable ? 'text-brand' : 'text-ink-faint',
            ].join(' ')}
          >
            <span
              className={[
                'h-1.5 w-1.5 rounded-full',
                product.isAvailable ? 'bg-brand' : 'bg-ink-faint',
              ].join(' ')}
            />
            {product.isAvailable ? 'Active' : 'Out of stock'}
          </p>
        </div>
      </Link>

      {/**
       * Selling out is the most frequent thing a vendor does all day, so it is one tap
       * from the list rather than four taps through the edit form.
       */}
      <button
        onClick={onToggle}
        disabled={busy}
        role="switch"
        aria-checked={product.isAvailable}
        aria-label={
          product.isAvailable ? 'Mark out of stock' : 'Mark back in stock'
        }
        className={[
          'relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50',
          product.isAvailable ? 'bg-brand' : 'bg-hairline',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-1 h-5 w-5 rounded-full bg-white transition-all',
            product.isAvailable ? 'left-6' : 'left-1',
          ].join(' ')}
        />
      </button>
    </article>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={[
        'min-h-10 rounded-full px-4 text-[13px] font-bold transition',
        active ? 'bg-mint text-brand' : 'bg-surface text-ink-soft',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
