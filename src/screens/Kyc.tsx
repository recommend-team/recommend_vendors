import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { DocumentUpload } from '../components/ui/DocumentUpload';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { useSession } from '../hooks/useSession';
import { useVendorProfile } from '../hooks/useProfile';
import { SUPPORT_PHONE, SUPPORT_PHONE_HREF } from '../lib/support';
import { ApiError } from '../lib/api';
import {
  KYC_DOCUMENTS,
  submitKyc,
  type KycSubmission,
} from '../lib/services/kyc.service';

export function Kyc() {
  const navigate = useNavigate();
  const { user } = useSession();
  const queryClient = useQueryClient();
  // What is already on the account: shown as submitted, not asked for again.
  const profile = useVendorProfile();

  const [documents, setDocuments] = useState<KycSubmission>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const vendorType =
    profile.data?.vendorType ?? user?.vendorType ?? 'NON_REGISTERED';
  const required = KYC_DOCUMENTS[vendorType];
  const isSubmitted = (key: string) =>
    !!profile.data?.[key as keyof typeof profile.data];
  const outstanding = required.filter((document) => !isSubmitted(document.key));
  const uploaded = Object.keys(documents).length;

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await submitKyc(documents);
      // So coming back here shows these as submitted.
      await queryClient.invalidateQueries({ queryKey: ['vendor', 'profile'] });
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
          {profile.data && outstanding.length === 0
            ? 'All your documents are in. We’ll review them and let you know by email.'
            : vendorType === 'REGISTERED'
              ? 'Upload your registration documents so we can verify your business.'
              : 'Upload what you have. One is enough to start — you can add the rest later.'}
        </p>
      </div>

      <div className="space-y-3 px-4 py-4">
        {profile.isLoading ? (
          <p className="py-6 text-center text-[13px] text-ink-soft">
            Loading your documents…
          </p>
        ) : (
          required.map((document) => (
            <DocumentUpload
              key={document.key}
              label={document.label}
              hint={document.hint}
              value={documents[document.key]}
              submitted={isSubmitted(document.key)}
              onUploaded={(ref) =>
                setDocuments((current) => ({
                  ...current,
                  [document.key]: ref,
                }))
              }
            />
          ))
        )}

        {required.some((document) => isSubmitted(document.key)) && (
          <p className="text-[12px] leading-snug text-ink-soft">
            Need to change a document you&apos;ve submitted? Call us on{' '}
            <a href={SUPPORT_PHONE_HREF} className="font-bold text-accent">
              {SUPPORT_PHONE}
            </a>
            .
          </p>
        )}

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
          {uploaded > 0
            ? `Submit ${uploaded} document${uploaded === 1 ? '' : 's'}`
            : profile.data && outstanding.length === 0
              ? 'All documents submitted'
              : 'Upload at least one document'}
        </Button>
      </div>
    </div>
  );
}
