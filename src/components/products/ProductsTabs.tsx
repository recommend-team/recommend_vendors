import { NavLink } from 'react-router-dom';
import { PRODUCT_LIMIT } from '../../lib/services/products.service';
import type { Product } from '../../lib/contract';

/**
 * The top of the Products tab: what is used of the limit, and the two lists a vendor
 * keeps — their products (what buyers order) and their extras (what buyers add to a
 * product: Beef, Takeaway pack). Each list has its own page and its own add button, so
 * it is always clear which one is being added to.
 */
export function ProductsTabs({ products }: { products: Product[] }) {
  const extras = products.filter((p) => p.isAddOn).length;
  const main = products.length - extras;

  return (
    <header className="px-4 pt-5 pb-3">
      <h1 className="text-[26px] leading-tight font-extrabold text-ink">
        Products
      </h1>
      <p className="mt-1 text-[13px] text-ink-soft">
        <span className="font-bold text-accent">
          {products.length} of {PRODUCT_LIMIT}
        </span>{' '}
        used, products and extras together.
      </p>

      <nav
        aria-label="Products or extras"
        className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-surface p-1 shadow-sm"
      >
        <Tab to="/products" label="Products" count={main} />
        <Tab to="/extras" label="Extras" count={extras} />
      </nav>
    </header>
  );
}

function Tab({
  to,
  label,
  count,
}: {
  to: string;
  label: string;
  count: number;
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          'flex min-h-11 items-center justify-center gap-1.5 rounded-full text-[14px] font-extrabold transition',
          isActive ? 'bg-accent text-white' : 'text-ink-soft',
        ].join(' ')
      }
    >
      {label}
      <span className="text-[12px] font-bold opacity-80">{count}</span>
    </NavLink>
  );
}
