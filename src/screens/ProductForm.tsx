import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

/**
 * Adding or editing one product.
 *
 * **Fewer fields than the reference design**, because the model has fewer columns. There
 * is no category, no stock level and no second image — a `Product` is a name, a price,
 * one image, a description and whether buyers can see it. Drawing the rest would mean
 * controls that silently write nothing, which is worse than their absence.
 *
 * The design's "Enable Track Inventory" switch is the one of those that has a real
 * counterpart: `isAvailable`. It keeps the position and the shape, and says what it does.
 *
 * Editing reads from the list already in the cache: there is no single-product endpoint
 * for vendors, and adding one would be a vendor-app-only route — exactly what the plan
 * says to avoid if the React Native port is to stay a re-skin.
 */
export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editing = !!id;

  const { products } = useProducts();
  const existing = products.find((product) => product.id === id);

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // The list may arrive after this screen mounts, so the fields fill in when it does.
  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setPrice(String(Number(existing.price)));
    setDescription(existing.description ?? '');
    setImageUrl(existing.imageUrl);
    setAvailable(existing.isAvailable);
  }, [existing]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFailure(null);

    const amount = Number(price);
    const problems = {
      name: requiredProblem(name, 'Product name'),
      // `createProductSchema` wants a positive number with at most two decimals.
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
      description: description.trim() || undefined,
      imageUrl: imageUrl ?? undefined,
      isAvailable: available,
    };

    try {
      if (editing && id) {
        await update.mutateAsync({ id, changes: payload });
      } else {
        await create.mutateAsync(payload);
      }
      navigate('/products', { replace: true });
    } catch (cause) {
      // The server refuses creation for an unapproved vendor and past twenty products.
      // Its message says which, and both need different action from the vendor.
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
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
          {editing ? 'Edit Product' : 'Add Product'}
        </h1>
        {/* Balances the back button so the title sits centred, as in the reference. */}
        <span className="h-10 w-10 shrink-0" aria-hidden />
      </header>

      <form onSubmit={submit} className="flex flex-1 flex-col gap-5 px-4 pb-6">
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[14px] font-extrabold text-ink">
              Product media
            </h2>
            <span className="text-[12px] font-bold text-brand">Recommended</span>
          </div>
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </section>

        <p className="flex gap-2.5 rounded-2xl bg-mint-soft px-4 py-3 text-[12px] leading-relaxed text-ink">
          <span className="shrink-0 text-brand" aria-hidden>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </span>
          <span>
            <span className="font-extrabold">Pro-tip </span>
            Daylight and a plain background sell better than a styled photo. Shoot
            the food itself, close up, with nothing behind it.
          </span>
        </p>

        <Field
          label="Product name"
          placeholder="e.g. Smoky party jollof with chicken"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          maxLength={100}
        />

        <Field
          label="Price"
          // `inputMode="decimal"` gives the number pad without `type="number"`'s
          // spinners and scroll-to-change behaviour, which on a price field is a way to
          // charge the wrong amount.
          inputMode="decimal"
          placeholder="3500"
          value={price}
          onChange={(event) => setPrice(event.target.value.replace(/[^\d.]/g, ''))}
          error={errors.price}
          hint={<span className="text-[13px] text-ink-faint">₦</span>}
        />

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-[13px] font-bold text-ink-soft"
          >
            Product description{' '}
            <span className="font-normal text-ink-faint">(optional)</span>
          </label>
          <textarea
            id="description"
            rows={4}
            maxLength={500}
            placeholder="Tell buyers about the taste, the portion size, and how it is cooked."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-2xl border border-hairline bg-surface px-4 py-3 text-ink outline-none placeholder:text-ink-faint"
          />
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-surface p-4">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-ink">In stock</p>
            <p className="text-[12px] leading-snug text-ink-soft">
              Turn this off when you run out. The listing stays, buyers just
              can&apos;t order it.
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
                Buyers won&apos;t see it again. Past orders keep their own record,
                so nothing already sold is affected.
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
                    navigate('/products', { replace: true });
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
                {editing ? 'Save changes' : 'Save product'}
              </Button>

              {editing && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  aria-label="Delete this product"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber text-ink-soft active:scale-95"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
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
