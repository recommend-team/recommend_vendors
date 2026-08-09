import { useRef, useState } from 'react';
import { UploadError, uploadFile } from '../../lib/services/storage.service';

/**
 * The product photo.
 *
 * Same upload path as KYC documents — including the downscaling, which matters more
 * here: a vendor adding twenty products on mobile data is twenty 5 MB photos otherwise.
 *
 * Shows the image itself rather than a filename, because a vendor uploading the wrong
 * photo of the wrong dish will notice a picture and will not notice `IMG_4471.jpg`.
 */
export function ImageUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;

    setError(null);
    setBusy(true);
    try {
      const result = await uploadFile(file, 'products');
      onChange(result.secureUrl);
    } catch (cause) {
      setError(
        cause instanceof UploadError
          ? cause.message
          : 'That upload failed. Check your connection and try again.',
      );
    } finally {
      setBusy(false);
      // Cleared so picking the *same* file again still fires a change — which is what
      // someone does straight after a failure.
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => void pick(event.target.files?.[0])}
        className="sr-only"
      />

      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-hairline bg-surface disabled:opacity-60"
      >
        {value ? (
          <img
            src={value}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-2 text-ink-faint">
            <svg
              width="30"
              height="30"
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
              <circle cx="8.5" cy="10" r="1.6" fill="currentColor" />
              <path
                d="m4 17 4.5-5 3 3.2L15 12l5 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[13px] font-bold">
              {busy ? 'Uploading…' : 'Add a photo'}
            </span>
          </span>
        )}

        {value && busy && (
          <span className="absolute inset-0 grid place-items-center bg-black/40 text-[13px] font-bold text-white">
            Uploading…
          </span>
        )}
      </button>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[12px] leading-snug text-ink-faint">
          {/* Not a rule the app enforces — advice that measurably sells more. */}
          Bright, natural light and a plain background work best.
        </p>
        {value && !busy && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 text-[12px] font-bold text-accent"
          >
            Remove
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-[13px] leading-snug text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
