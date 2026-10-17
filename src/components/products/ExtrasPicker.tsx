import { Link } from 'react-router-dom';
import type { Product } from '../../lib/contract';
import { formatNaira } from '../../lib/format';

/**
 * Which of the vendor's extras go with this dish — Beef, Takeaway pack, Water. The
 * extras themselves live in one list (the Extras screen), so a price changed there
 * changes everywhere.
 */
export function ExtrasPicker({
  extras,
  selected,
  onChange,
}: {
  /** The vendor's extras. */
  extras: Product[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const all = extras.length > 0 && extras.every((e) => selected.includes(e.id));
  const toggle = (id: string) =>
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-extrabold text-ink">
            Extras on this dish
          </h2>
          <p className="text-[12px] leading-snug text-ink-soft">
            Buyers can add these when they order it — up to 5 of each.
          </p>
        </div>
        {extras.length > 1 && (
          <button
            type="button"
            onClick={() => onChange(all ? [] : extras.map((e) => e.id))}
            className="shrink-0 text-[12px] font-bold text-accent"
          >
            {all ? 'Clear' : 'Select all'}
          </button>
        )}
      </div>

      {extras.length === 0 ? (
        <p className="rounded-2xl bg-surface px-4 py-3 text-[13px] leading-snug text-ink-soft">
          You have no extras yet.{' '}
          <Link to="/extras/new" className="font-bold text-accent">
            Add your extras
          </Link>{' '}
          — Beef, Takeaway pack, Water — then tick them here.
        </p>
      ) : (
        <ul className="divide-y divide-hairline overflow-hidden rounded-2xl bg-surface">
          {extras.map((extra) => (
            <li key={extra.id}>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2">
                <input
                  type="checkbox"
                  checked={selected.includes(extra.id)}
                  onChange={() => toggle(extra.id)}
                  className="h-5 w-5 accent-[var(--color-brand)]"
                />
                <span
                  className={`min-w-0 flex-1 text-[14px] ${extra.isAvailable ? 'text-ink' : 'text-ink-faint'}`}
                >
                  {extra.name}
                  {!extra.isAvailable && ' · out of stock'}
                </span>
                <span className="shrink-0 text-[13px] text-ink-soft">
                  {formatNaira(extra.price)}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
