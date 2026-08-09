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
 * is no category, no stock level and no "track inventory" — a `Product` is a name, a
 * price, one image, a description and whether it is available. Drawing those controls
 * would mean inputs that silently write nothing.
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
      <header className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-ink"
        >
          <svg
            width="18"
            height="18"
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
        <h1 className="text-2xl font-extrabold text-ink">
          {editing ? 'Edit product' : 'Add product'}
        </h1>
      </header>

      <form onSubmit={submit} className="flex flex-1 flex-col gap-5 px-4 pb-4">
        <ImageUpload value={imageUrl} onChange={setImageUrl} />

        <Field
          label="Product name"
          placeholder="Jollof Rice & Chicken"
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
          onChange={(event) =>
            setPrice(event.target.value.replace(/[^\d.]/g, ''))
          }
          error={errors.price}
          hint={<span className="text-[13px] text-ink-faint">₦</span>}
        />

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-[13px] font-bold text-ink-soft"
          >
            Description{' '}
            <span className="font-normal text-ink-faint">(optional)</span>
          </label>
          <textarea
            id="description"
            rows={4}
            maxLength={500}
            placeholder="Smoky party jollof, cooked fresh each morning."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-2xl border border-hairline bg-surface px-4 py-3 text-ink outline-none placeholder:text-ink-faint"
          />
        </div>

        {failure && (
          <p
            role="alert"
            className="rounded-2xl bg-accent/10 px-4 py-3 text-[13px] leading-snug text-accent"
          >
            {failure}
          </p>
        )}

        <div className="mt-auto space-y-3 pt-4">
          <Button type="submit" loading={busy}>
            {editing ? 'Save changes' : 'Add product'}
          </Button>

          {editing && id && (
            <>
              {confirmingDelete ? (
                <div className="rounded-2xl bg-surface p-4">
                  <p className="text-[14px] font-bold text-ink">
                    Delete {name}?
                  </p>
                  <p className="mt-1 text-[13px] leading-snug text-ink-soft">
                    Buyers won&apos;t see it again. Past orders keep their own
                    record, so nothing already sold is affected.
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
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="min-h-11 w-full text-[14px] font-bold text-ink-soft"
                >
                  Delete this product
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
}
