import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { ImageUpload } from '../components/ui/ImageUpload';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { useUpdateProfile, useVendorProfile } from '../hooks/useProfile';
import { ApiError } from '../lib/api';
import { requiredProblem, toE164 } from '../lib/validate';

/**
 * How the business looks to a buyer.
 *
 * Only changed fields are sent. The backend accepts a partial patch and refuses an empty
 * one, so sending the whole form back would overwrite fields this screen never showed —
 * and would fail outright if nothing was edited.
 */
export function StoreDetails() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useVendorProfile();
  const update = useUpdateProfile();

  const [form, setForm] = useState({
    businessName: '',
    businessCategory: '',
    businessAddress: '',
    businessDescription: '',
    whatsappNumber: '',
  });
  const [logo, setLogo] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      businessName: profile.businessName ?? '',
      businessCategory: profile.businessCategory ?? '',
      businessAddress: profile.businessAddress ?? '',
      businessDescription: profile.businessDescription ?? '',
      whatsappNumber: profile.whatsappNumber ?? '',
    });
    setLogo(profile.businessLogoUrl);
  }, [profile]);

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: null }));
    setSaved(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFailure(null);

    const problems = {
      businessName: requiredProblem(form.businessName, 'Business name'),
      businessAddress: requiredProblem(form.businessAddress, 'Address', 5),
      whatsappNumber:
        form.whatsappNumber && !toE164(form.whatsappNumber)
          ? 'Enter a valid number, like 0801 234 5678'
          : null,
    };
    if (Object.values(problems).some(Boolean)) {
      setErrors(problems);
      return;
    }

    // Only what actually changed — see the note above.
    const changes: Record<string, string> = {};
    if (form.businessName !== (profile?.businessName ?? ''))
      changes.businessName = form.businessName.trim();
    if (form.businessCategory !== (profile?.businessCategory ?? ''))
      changes.businessCategory = form.businessCategory.trim();
    if (form.businessAddress !== (profile?.businessAddress ?? ''))
      changes.businessAddress = form.businessAddress.trim();
    if (form.businessDescription !== (profile?.businessDescription ?? ''))
      changes.businessDescription = form.businessDescription.trim();
    if (form.whatsappNumber !== (profile?.whatsappNumber ?? '')) {
      const e164 = toE164(form.whatsappNumber);
      if (e164) changes.whatsappNumber = e164;
    }
    if (logo && logo !== profile?.businessLogoUrl)
      changes.businessLogoUrl = logo;

    if (Object.keys(changes).length === 0) {
      navigate(-1);
      return;
    }

    try {
      await update.mutateAsync(changes);
      setSaved(true);
    } catch (cause) {
      setFailure(
        cause instanceof ApiError
          ? cause.message
          : 'Could not save that. Check your connection and try again.',
      );
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <ScreenHeader title="Store details" />

      <form onSubmit={submit} className="flex flex-1 flex-col gap-5 px-4 pb-6">
        <div>
          <p className="mb-1.5 text-[13px] font-bold text-ink-soft">Logo</p>
          <ImageUpload value={logo} onChange={setLogo} />
        </div>

        <Field
          label="Business name"
          value={form.businessName}
          onChange={(event) => set('businessName')(event.target.value)}
          error={errors.businessName}
          maxLength={100}
        />

        <Field
          label="What you sell"
          placeholder="Restaurant"
          value={form.businessCategory}
          onChange={(event) => set('businessCategory')(event.target.value)}
          maxLength={100}
        />

        <Field
          label="Address"
          value={form.businessAddress}
          onChange={(event) => set('businessAddress')(event.target.value)}
          error={errors.businessAddress}
          maxLength={255}
        />

        <Field
          label="WhatsApp number"
          type="tel"
          inputMode="tel"
          placeholder="0801 234 5678"
          value={form.whatsappNumber}
          onChange={(event) => set('whatsappNumber')(event.target.value)}
          error={errors.whatsappNumber}
        />

        <div>
          <label
            htmlFor="about"
            className="mb-1.5 block text-[13px] font-bold text-ink-soft"
          >
            About your business
          </label>
          <textarea
            id="about"
            rows={4}
            maxLength={500}
            placeholder="Home-style Nigerian cooking, made fresh every morning."
            value={form.businessDescription}
            onChange={(event) => set('businessDescription')(event.target.value)}
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

        {saved && (
          <p className="rounded-2xl bg-mint px-4 py-3 text-[13px] font-bold text-brand">
            Saved.
          </p>
        )}

        <div className="mt-auto pt-4">
          <Button type="submit" loading={isLoading || update.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
