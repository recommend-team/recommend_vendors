import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { ImageUpload } from '../components/ui/ImageUpload';
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from '../hooks/useProducts';
import { ApiError } from '../lib/api';
import { requiredProblem } from '../lib/validate';
import { formatNaira } from '../lib/format';

/**
 * Adding or editing one extra — Beef, Takeaway pack, Water. Its own short form, apart
 * from the product form, so a vendor always knows which of the two they are adding.
 *
 * An extra has a name, a price, an optional photo, whether it's in stock, and the
 * products it goes with. A new one starts on every product; the vendor unticks what
 * doesn't fit. The same links show as "Extras on this product" on each product's form.
 */
export function ExtraForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editing = !!id;

  const { products, isLoading } = useProducts();
  const existing = products.find((product) => product.id === id);
  const mains = products.filter((product) => !product.isAddOn);

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  /** Null until the vendor touches the list: a new extra goes on every product. */
  const [goesWith, setGoesWith] = useState<string[] | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // The list may arrive after this screen mounts, so the fields fill in when it does.
  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setPrice(String(Number(existing.price)));
    setImageUrl(existing.imageUrl);
    setAvailable(existing.isAvailable);
    setGoesWith(existing.dishIds ?? []);
  }, [existing]);

  // A product opened here by an old link belongs on the product form.
  if (existing && !existing.isAddOn) {
    return <Navigate to={`/products/${existing.id}`} replace />;
  }

  const selected = goesWith ?? (editing ? [] : mains.map((p) => p.id));
  const all = mains.length > 0 && mains.every((p) => selected.includes(p.id));
  const toggle = (productId: string) =>
    setGoesWith(
      selected.includes(productId)
        ? selected.filter((x) => x !== productId)
        : [...selected, productId],
    );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFailure(null);

    const amount = Number(price);
    const problems = {
      name: requiredProblem(name, 'Extra name'),
      price:
        !Number.isFinite(amount) || amount <= 0
          ? 'Enter a price'
          : Math.round(amount * 100) !== amount * 100
            ? 'Use at most two decimal places'
            : null,
    };
    if (Object.values(problems).some(Boolean)) {
      setErrors(problems);
      return;
    }

    const payload = {
      name: name.trim(),
      price: amount,
      imageUrl: imageUrl ?? undefined,
      isAvailable: available,
      isAddOn: true,
      dishIds: selected,
    };

    try {
      if (editing && id) {
        await update.mutateAsync({ id, changes: payload });
      } else {
        await create.mutateAsync(payload);
      }
      navigate('/extras', { replace: true });
    } catch (cause) {
      setFailure(
        cause instanceof ApiError
          ? cause.message
          : 'Could not save that. Check your connection and try again.',
      );
    }
  };

  const busy = create.isPending || update.isPending || remove.isPending;

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <header className="flex items-center gap-3 px-4 pt-4 pb-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-accent active:bg-black/5"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-[19px] font-extrabold text-accent">
          {editing ? 'Edit Extra' : 'Add Extra'}
        </h1>
        <span className="h-10 w-10 shrink-0" aria-hidden />
      </header>

      <form onSubmit={submit} className="flex flex-1 flex-col gap-5 px-4 pb-6">
        <p className="rounded-2xl bg-mint-soft px-4 py-3 text-[13px] leading-relaxed text-ink">
          An extra is something buyers <b>add to a product</b> they order —
          Beef, a Takeaway pack, Water. It&apos;s never sold on its own.
        </p>

        <Field
          label="Extra name"
          placeholder="e.g. Beef, Takeaway pack"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          maxLength={100}
        />

        <Field
          label="Price"
          inputMode="decimal"
          placeholder="200"
          value={price}
          onChange={(event) =>
            setPrice(event.target.value.replace(/[^\d.]/g, ''))
          }
          error={errors.price}
          hint={<span className="text-[13px] text-ink-faint">₦</span>}
        />

        <section className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-extrabold text-ink">Goes with</h2>
              <p className="text-[12px] leading-snug text-ink-soft">
                Buyers can add it to these products — up to 5 in each pack.
              </p>
            </div>
            {mains.length > 1 && (
              <button
                type="button"
                onClick={() => setGoesWith(all ? [] : mains.map((p) => p.id))}
                className="shrink-0 text-[12px] font-bold text-accent"
              >
                {all ? 'Clear' : 'Select all'}
              </button>
            )}
          </div>
          {!isLoading && mains.length === 0 ? (
            <p className="rounded-2xl bg-surface px-4 py-3 text-[13px] leading-snug text-ink-soft">
              You have no products yet. Add one, and this extra can go with it.
            </p>
          ) : (
            <ul className="divide-y divide-hairline overflow-hidden rounded-2xl bg-surface">
              {mains.map((product) => (
                <li key={product.id}>
                  <label className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(product.id)}
                      onChange={() => toggle(product.id)}
                      className="h-5 w-5 accent-[var(--color-brand)]"
                    />
                    <span className="min-w-0 flex-1 text-[14px] text-ink">
                      {product.name}
                    </span>
                    <span className="shrink-0 text-[13px] text-ink-soft">
                      {formatNaira(product.price)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[14px] font-extrabold text-ink">Photo</h2>
            <span className="text-[12px] text-ink-faint">Optional</span>
          </div>
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </section>

        <div className="flex items-center gap-3 rounded-2xl bg-surface p-4">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-ink">In stock</p>
            <p className="text-[12px] leading-snug text-ink-soft">
              Turn this off when you run out. Buyers just won&apos;t see it.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAvailable((current) => !current)}
            role="switch"
            aria-checked={available}
            aria-label="In stock"
            className={[
              'relative h-7 w-12 shrink-0 rounded-full transition',
              available ? 'bg-brand' : 'bg-hairline',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-1 h-5 w-5 rounded-full bg-white transition-all',
                available ? 'left-6' : 'left-1',
              ].join(' ')}
            />
          </button>
        </div>

        {failure && (
          <p
            role="alert"
            className="rounded-2xl bg-accent/10 px-4 py-3 text-[13px] leading-snug text-accent"
          >
            {failure}
          </p>
        )}

        <div className="mt-auto pt-4">
          {confirmingDelete && id ? (
            <div className="rounded-2xl bg-surface p-4">
              <p className="text-[14px] font-bold text-ink">Delete {name}?</p>
              <p className="mt-1 text-[13px] leading-snug text-ink-soft">
                It comes off every product it goes with. Past orders keep their
                own record.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="min-h-11 flex-1 rounded-full bg-mint px-4 text-[14px] font-bold text-brand"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await remove.mutateAsync(id);
                    navigate('/extras', { replace: true });
                  }}
                  className="min-h-11 flex-1 rounded-full bg-accent px-4 text-[14px] font-bold text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button type="submit" loading={busy}>
                {editing ? 'Save changes' : 'Save extra'}
              </Button>
              {editing && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  aria-label="Delete this extra"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber text-ink-soft active:scale-95"
                >
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M5 7h14M10 7V5h4v2m-7 0 1 13h8l1-13"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
