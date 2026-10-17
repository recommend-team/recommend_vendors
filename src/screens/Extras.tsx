import { Link } from 'react-router-dom';
import { formatNaira } from '../lib/format';
import { useProducts, useToggleAvailability } from '../hooks/useProducts';
import { useSession } from '../hooks/useSession';
import { useSuspended, SUSPENDED_EXPLAINER } from '../hooks/useSuspended';
import { PRODUCT_LIMIT } from '../lib/services/products.service';
import { ProductsTabs } from '../components/products/ProductsTabs';
import { AddButton } from '../components/products/AddButton';

/**
 * The vendor's extras — Beef, Takeaway pack, Water, Nylon — the second tab of Products.
 *
 * Set up once, each saying which products it goes with. A price changed here changes on
 * every product; running out here hides it everywhere. Extras are products underneath
 * (`isAddOn`), so they count towards the 20 like any other.
 */
export function Extras() {
  const { user } = useSession();
  const suspended = useSuspended();
  const { products, total, isLoading, isError, refetch } = useProducts();
  const toggle = useToggleAvailability();

  const extras = products.filter((p) => p.isAddOn);
  const main = products.filter((p) => !p.isAddOn);
  const usedOn = (extraId: string) =>
    main.filter((product) => product.extraIds?.includes(extraId)).length;

  const blockedBecause = suspended
    ? SUSPENDED_EXPLAINER
    : total >= PRODUCT_LIMIT
      ? `You've listed the maximum of ${PRODUCT_LIMIT} products and extras. Remove one to add another.`
      : user?.status !== 'APPROVED'
        ? 'You can add extras once an admin approves your account.'
        : null;

  return (
    <div className="flex min-h-full flex-col bg-canvas pb-10">
      <ProductsTabs products={products} />

      <div className="space-y-3 px-4">
        <AddButton
          label="Add extra"
          to="/extras/new"
          blockedBecause={blockedBecause}
        />
        <p className="px-1 text-[13px] leading-snug text-ink-soft">
          Things buyers add to a product they order — Beef, Takeaway pack,
          Water. Never sold on their own.
        </p>

        {isLoading && (
          <p className="py-8 text-center text-[13px] text-ink-soft">
            Loading your extras…
          </p>
        )}
        {isError && (
          <button
            type="button"
            onClick={() => void refetch()}
            className="w-full py-8 text-center text-[13px] text-ink-soft"
          >
            Couldn&apos;t load your extras. Tap to try again.
          </button>
        )}
        {!isLoading && !isError && extras.length === 0 && (
          <p className="rounded-2xl bg-surface px-4 py-8 text-center text-[13px] leading-relaxed text-ink-soft">
            No extras yet. Add your first one — like a Takeaway pack.
          </p>
        )}

        {extras.length > 0 && (
          <ul className="divide-y divide-hairline overflow-hidden rounded-2xl bg-surface shadow-sm">
            {extras.map((extra) => {
              const count = usedOn(extra.id);
              return (
                <li
                  key={extra.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Link to={`/extras/${extra.id}`} className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[15px] font-bold ${extra.isAvailable ? 'text-ink' : 'text-ink-faint'}`}
                    >
                      {extra.name}
                    </p>
                    <p className="text-[12px] text-ink-soft">
                      {formatNaira(extra.price)} ·{' '}
                      {count === 0 ? (
                        <span className="font-bold text-accent">
                          not on any product yet
                        </span>
                      ) : (
                        `on ${count} product${count === 1 ? '' : 's'}`
                      )}
                    </p>
                  </Link>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={extra.isAvailable}
                    aria-label={`${extra.name} in stock`}
                    disabled={suspended || toggle.isPending}
                    onClick={() =>
                      toggle.mutate({
                        id: extra.id,
                        isAvailable: !extra.isAvailable,
                      })
                    }
                    className={[
                      'relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50',
                      extra.isAvailable ? 'bg-brand' : 'bg-hairline',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute top-1 h-5 w-5 rounded-full bg-white transition-all',
                        extra.isAvailable ? 'left-6' : 'left-1',
                      ].join(' ')}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
