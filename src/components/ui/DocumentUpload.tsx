import { useRef, useState } from 'react';
import {
  UploadError,
  uploadFile,
  type UploadedFile,
} from '../../lib/services/storage.service';

/**
 * One document: pick or photograph it, and it uploads immediately.
 *
 * Uploading on selection rather than on submit is deliberate. A vendor photographing
 * four documents on mobile data would otherwise sit through four uploads at the end, on
 * one screen, with one failure losing the lot. This way each is done and visibly done,
 * and a retry costs one file.
 *
 * `capture` is not set on the input: it would force the camera and make it impossible to
 * choose a PDF or an existing photo, which is exactly what someone with a scanned CAC
 * certificate needs.
 */
export function DocumentUpload({
  label,
  hint,
  folder = 'kyc',
  value,
  onUploaded,
}: {
  label: string;
  hint: string;
  folder?: 'kyc' | 'products' | 'profile';
  value?: string;
  onUploaded: (url: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;

    setError(null);
    setBusy(true);
    try {
      const result = await uploadFile(file, folder);
      setUploaded(result);
      onUploaded(result.secureUrl);
    } catch (cause) {
      setError(
        cause instanceof UploadError
          ? cause.message
          : 'That upload failed. Check your connection and try again.',
      );
    } finally {
      setBusy(false);
      // Cleared so choosing the *same* file again still fires a change event — which is
      // exactly what someone does after a failure.
      if (input.current) input.current.value = '';
    }
  };

  const done = !!value;

  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-extrabold text-ink">{label}</p>
          <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">
            {done ? (uploaded?.format ?? 'Uploaded').toUpperCase() : hint}
          </p>
        </div>
        {done && <Tick />}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={(event) => void pick(event.target.files?.[0])}
        className="sr-only"
      />

      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className={[
          'mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 text-[14px] font-bold transition active:scale-[0.99] disabled:opacity-50',
          done ? 'bg-mint text-brand' : 'bg-accent text-white',
        ].join(' ')}
      >
        {busy ? 'Uploading…' : done ? 'Replace' : 'Upload or take a photo'}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-[13px] leading-snug text-accent">
          {error}
        </p>
      )}
    </div>
  );
}

function Tick() {
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mint text-brand">
      <svg
        width="14"
        height="14"
        viewBox="0 0 20 20"
        fill="none"
        aria-label="Uploaded"
      >
        <path
          d="M4 10.5 8 14.5 16 6"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
