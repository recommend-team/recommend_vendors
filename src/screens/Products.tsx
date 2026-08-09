import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatNaira } from '../lib/format';
import { PRODUCT_LIMIT } from '../lib/services/products.service';
import { useProducts, useToggleAvailability } from '../hooks/useProducts';
import { useSession } from '../hooks/useSession';
import type { Product } from '../lib/contract';

type Filter = 'all' | 'available' | 'hidden';

/**
 * The catalogue.
 *
 * Search and filters are here because a vendor with twenty products scrolling on a phone
 * needs them, and twenty is the ceiling the backend enforces — so both stay client-side.
 * One request, filtered in memory, no round trip per keystroke.
 */
export function Products() {
  const { user } = useSession();
  const { products, total, isLoading, isError, refetch } = useProducts();
  const toggle = useToggleAvailability();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const approved = user?.status === 'APPROVED';
  const atLimit = total >= PRODUCT_LIMIT;

  const visible = products.filter((product) => {
    if (filter === 'available' && !product.isAvailable) return false;
    if (filter === 'hidden' && product.isAvailable) return false;
    if (!search) return true;

    const needle = search.toLowerCase();
    return (
      product.name.toLowerCase().includes(needle) ||
      (product.description ?? '').toLowerCase().includes(needle)
    );
  });

  return (
    <div className="relative flex min-h-full flex-col bg-canvas">
      <header className="px-4 pt-6 pb-3">
        <p className="text-[11px] font-extrabold tracking-widest text-accent uppercase">
          Your catalogue
        </p>
        <h1 className="mt-0.5 text-3xl font-extrabold text-ink">Products</h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          {total} of {PRODUCT_LIMIT} used
        </p>
      </header>

      <div className="px-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search your products"
          className="min-h-12 w-full rounded-full border border-hairline bg-surface px-5 text-ink outline-none placeholder:text-ink-faint"
        />

        <div className="mt-3 flex gap-2">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </Chip>
          <Chip
            active={filter === 'available'}
            onClick={() => setFilter('available')}
          >
            On sale
          </Chip>
          <Chip
            active={filter === 'hidden'}
            onClick={() => setFilter('hidden')}
          >
            Hidden
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
      </div>

      {/**
       * Only offered when it can actually work.
       *
       * `POST /products` is refused for an unapproved vendor and once twenty products
       * exist, so a button that leads to a guaranteed error is worse than no button —
       * and worse still if it takes a vendor through a whole form first.
       */}
      {approved && !atLimit && (
        <Link
          to="/products/new"
          aria-label="Add a product"
          className="fixed right-5 bottom-24 grid h-14 w-14 place-items-center rounded-full bg-accent text-white shadow-lg transition active:scale-95"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </Link>
      )}

      {approved && atLimit && (
        <p className="px-4 pb-4 text-center text-[12px] leading-snug text-ink-faint">
          You&apos;ve listed the maximum of {PRODUCT_LIMIT} products. Remove one
          to add another.
        </p>
      )}
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
      <Link
        to={`/products/${product.id}`}
        className="flex min-w-0 flex-1 gap-3"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            loading="lazy"
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-amber text-ink-faint">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
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
          <p className="truncate text-[15px] font-bold text-ink">
            {product.name}
          </p>
          <p className="mt-0.5 text-[15px] font-extrabold text-ink">
            {formatNaira(product.price)}
          </p>
          <p
            className={[
              'mt-0.5 text-[12px] font-bold',
              product.isAvailable ? 'text-brand' : 'text-ink-faint',
            ].join(' ')}
          >
            {product.isAvailable ? 'On sale' : 'Hidden from buyers'}
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
          product.isAvailable ? 'Hide from buyers' : 'Put back on sale'
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
      className={[
        'min-h-10 rounded-full px-4 text-[14px] font-bold transition',
        active ? 'bg-accent text-white' : 'bg-surface text-ink-soft',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
