import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { DocumentUpload } from '../components/ui/DocumentUpload';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { useSession } from '../hooks/useSession';
import { ApiError } from '../lib/api';
import {
  KYC_DOCUMENTS,
  submitKyc,
  type KycSubmission,
} from '../lib/services/kyc.service';

export function Kyc() {
  const navigate = useNavigate();
  const { user } = useSession();

  const [documents, setDocuments] = useState<KycSubmission>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const required = KYC_DOCUMENTS[user?.vendorType ?? 'NON_REGISTERED'];
  const uploaded = Object.keys(documents).length;

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await submitKyc(documents);
      setDone(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Could not submit those documents. Try again in a moment.',
      );
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-full flex-col justify-center bg-canvas px-6 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint text-brand">
          <svg
            width="30"
            height="30"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
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
        <h1 className="mt-5 text-2xl font-extrabold text-ink">
          Documents received
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          We&apos;ll review them and let you know by email. You can keep adding
          products in the meantime.
        </p>
        <Button className="mt-8" onClick={() => navigate('/orders')}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      {/* No longer a tab, so it needs its own way out. An installed PWA has no browser
          chrome to fall back on — without this a vendor is stranded here. */}
      <ScreenHeader title="Your documents" subtitle="Verification" />

      <div className="px-4 pb-2">
        <p className="text-[14px] leading-relaxed text-ink-soft">
          {user?.vendorType === 'REGISTERED'
            ? 'Upload your registration documents so we can verify your business.'
            : 'Upload what you have. One is enough to start — you can add the rest later.'}
        </p>
      </div>

      <div className="space-y-3 px-4 py-4">
        {required.map((document) => (
          <DocumentUpload
            key={document.key}
            label={document.label}
            hint={document.hint}
            value={documents[document.key]}
            onUploaded={(url) =>
              setDocuments((current) => ({ ...current, [document.key]: url }))
            }
          />
        ))}

        {error && (
          <p
            role="alert"
            className="rounded-2xl bg-accent/10 px-4 py-3 text-[13px] leading-snug text-accent"
          >
            {error}
          </p>
        )}
      </div>

      <div
        className="mt-auto border-t border-hairline bg-surface p-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <Button
          onClick={() => void submit()}
          loading={busy}
          disabled={uploaded === 0}
        >
          {uploaded === 0
            ? 'Upload at least one document'
            : `Submit ${uploaded} document${uploaded === 1 ? '' : 's'}`}
        </Button>
      </div>
    </div>
  );
}
