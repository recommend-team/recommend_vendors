import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ChoiceCard } from '../components/ui/ChoiceCard';
import { Field, PasswordField } from '../components/ui/Field';
import { Stepper } from '../components/ui/Stepper';
import { ApiError } from '../lib/api';
import { registerVendor } from '../lib/services/auth.service';
import {
  emailProblem,
  passwordProblem,
  phoneProblem,
  requiredProblem,
  toE164,
} from '../lib/validate';
import type { VendorType } from '../lib/contract';

const TOTAL_STEPS = 5;

const CATEGORIES = [
  'Restaurant',
  'Gadgets',
  'Phone Accessories',
  'Home Appliances',
  'Groceries',
  'Fashion',
  'Beauty',
  'Other',
];

/**
 * The marketing site's tier cards link here as `/signup?type=REGISTERED`, so a vendor
 * who already picked a tier there does not pick it again. Anything unrecognised is
 * ignored rather than trusted — it arrives from a URL.
 */
function typeFromQuery(raw: string | null): VendorType | '' {
  return raw === 'REGISTERED' || raw === 'NON_REGISTERED' ? raw : '';
}

export function SignUp() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const [form, setForm] = useState({
    vendorType: typeFromQuery(params.get('type')),
    firstName: '',
    lastName: '',
    phoneNumber: '',
    businessName: '',
    businessCategory: '',
    businessAddress: '',
    businessDescription: '',
    email: '',
    password: '',
  });

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: null }));
  };

  /** Only the fields on this step — nothing further ahead has been filled in yet. */
  const problemsFor = (which: number): Record<string, string | null> => {
    switch (which) {
      case 1:
        return {
          vendorType: form.vendorType ? null : 'Choose one to continue',
        };
      case 2:
        return {
          firstName: requiredProblem(form.firstName, 'First name'),
          lastName: requiredProblem(form.lastName, 'Last name'),
          phoneNumber: phoneProblem(form.phoneNumber),
        };
      case 3:
        return {
          businessName: requiredProblem(form.businessName, 'Business name'),
          businessCategory: form.businessCategory ? null : 'Pick what you sell',
        };
      case 4:
        return {
          businessAddress: requiredProblem(
            form.businessAddress,
            'Business address',
            5,
          ),
        };
      case 5:
        return {
          email: emailProblem(form.email),
          password: passwordProblem(form.password),
        };
      default:
        return {};
    }
  };

  const advance = async (event: FormEvent) => {
    event.preventDefault();

    const problems = problemsFor(step);
    if (Object.values(problems).some(Boolean)) {
      setErrors(problems);
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    setBusy(true);
    setFailure(null);

    try {
      await registerVendor({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        // E.164 or the backend refuses it — vendors type 0801…, not +234801….
        phoneNumber: toE164(form.phoneNumber)!,
        vendorType: form.vendorType as VendorType,
        businessName: form.businessName.trim(),
        businessAddress: form.businessAddress.trim(),
        businessCategory: form.businessCategory,
        businessDescription: form.businessDescription.trim() || undefined,
      });

      // No session yet: the backend refuses login until the email is verified, so
      // storing one here would make the app look signed in and fail on its first call.
      navigate('/verify', {
        replace: true,
        state: { email: form.email.trim() },
      });
    } catch (cause) {
      setFailure(
        cause instanceof ApiError
          ? cause.message
          : 'Could not create your account. Check your connection and try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const back = () => (step === 1 ? navigate('/') : setStep(step - 1));

  return (
    <div className="flex min-h-full flex-col bg-canvas px-6 pt-6 pb-8">
      <button
        onClick={back}
        aria-label="Back"
        className="mb-5 grid h-10 w-10 place-items-center self-start rounded-full bg-surface text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 5l-7 7 7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Stepper step={step} total={TOTAL_STEPS} />

      <form onSubmit={advance} className="mt-6 flex flex-1 flex-col">
        {step === 1 && (
          <Step
            title="Join as a vendor"
            subtitle="Select your business type to get started."
          >
            <div className="space-y-3">
              <ChoiceCard
                name="vendorType"
                value="REGISTERED"
                checked={form.vendorType === 'REGISTERED'}
                onChange={set('vendorType')}
                title="Registered business"
                badge="Verified"
                icon={<BuildingIcon />}
              >
                Formal businesses with CAC registration and a TIN. Ideal for
                established brands and retail outlets.
              </ChoiceCard>

              <ChoiceCard
                name="vendorType"
                value="NON_REGISTERED"
                checked={form.vendorType === 'NON_REGISTERED'}
                onChange={set('vendorType')}
                title="Not registered yet"
                badge="Strong KYC"
                icon={<StallIcon />}
              >
                Home kitchens, market sellers and independent traders without
                formal registration documents.
              </ChoiceCard>

              {errors.vendorType && (
                <p className="text-[13px] text-accent">{errors.vendorType}</p>
              )}
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step title="About you" subtitle="So we know who we're working with.">
            <Field
              label="First name"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => set('firstName')(e.target.value)}
              error={errors.firstName}
            />
            <Field
              label="Last name"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => set('lastName')(e.target.value)}
              error={errors.lastName}
            />
            <Field
              label="Phone number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0801 234 5678"
              value={form.phoneNumber}
              onChange={(e) => set('phoneNumber')(e.target.value)}
              error={errors.phoneNumber}
            />
          </Step>
        )}

        {step === 3 && (
          <Step title="Your business" subtitle="How buyers will find you.">
            <Field
              label="Business name"
              placeholder="Mama Tunde Buka"
              value={form.businessName}
              onChange={(e) => set('businessName')(e.target.value)}
              error={errors.businessName}
            />

            <div>
              <p className="mb-1.5 text-[13px] font-bold text-ink-soft">
                What do you sell?
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => set('businessCategory')(category)}
                    className={[
                      'min-h-11 rounded-full px-4 text-[14px] font-bold transition',
                      form.businessCategory === category
                        ? 'bg-accent text-white'
                        : 'bg-surface text-ink-soft',
                    ].join(' ')}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {errors.businessCategory && (
                <p className="mt-1.5 text-[13px] text-accent">
                  {errors.businessCategory}
                </p>
              )}
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step
            title="Where you are"
            subtitle="Where you cook, store or sell from."
          >
            <Field
              label="Business address"
              placeholder="12 Allen Avenue, Ikeja"
              value={form.businessAddress}
              onChange={(e) => set('businessAddress')(e.target.value)}
              error={errors.businessAddress}
            />

            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-[13px] font-bold text-ink-soft"
              >
                Tell buyers about your business{' '}
                <span className="font-normal text-ink-faint">(optional)</span>
              </label>
              <textarea
                id="description"
                rows={4}
                maxLength={500}
                placeholder="Home-style Nigerian cooking, made fresh every morning."
                value={form.businessDescription}
                onChange={(e) => set('businessDescription')(e.target.value)}
                className="w-full rounded-2xl border border-hairline bg-surface px-4 py-3 text-ink outline-none placeholder:text-ink-faint"
              />
            </div>
          </Step>
        )}

        {step === 5 && (
          <Step
            title="Your login"
            subtitle="You'll use these to sign in from now on."
          >
            <Field
              label="Email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@yourbusiness.com"
              value={form.email}
              onChange={(e) => set('email')(e.target.value)}
              error={errors.email}
            />
            <PasswordField
              label="Password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set('password')(e.target.value)}
              error={errors.password}
            />
            <p className="text-[12px] leading-snug text-ink-faint">
              At least 8 characters, with a capital letter, a number and a
              symbol.
            </p>
          </Step>
        )}

        {failure && (
          <p
            role="alert"
            className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-[13px] leading-snug text-accent"
          >
            {failure}
          </p>
        )}

        <div className="mt-auto pt-8">
          <Button type="submit" loading={busy}>
            {step === TOTAL_STEPS ? 'Create account' : 'Continue'}
          </Button>

          {step === 1 && (
            <p className="mt-5 text-center text-[13px] text-ink-soft">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-accent">
                Log in
              </Link>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
        <p className="mt-1 text-[14px] text-ink-soft">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function BuildingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16M15 10h4a1 1 0 011 1v10M7 8h4M7 12h4M7 16h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StallIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9h16l-1 11H5L4 9zm-1-4h18l-1 4H4L3 5zm6 8v5m6-5v5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
