import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Field, PasswordField } from '../components/ui/Field';
import { ApiError } from '../lib/api';
import { forgotPassword, resetPassword } from '../lib/services/auth.service';
import { passwordProblem } from '../lib/validate';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Could not send that just now. Try again in a moment.',
      );
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-full flex-col justify-center bg-canvas px-6 py-14 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-mint text-brand">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M3 7l9 6 9-6M3 7v10h18V7M3 7l9-4 9 4"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-ink">
          Check your email
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          If there&apos;s an account for {email.trim()}, we&apos;ve sent a link
          to reset your password.
        </p>
        <Link
          to="/login"
          className="mx-auto mt-8 inline-flex min-h-12 items-center rounded-full bg-accent px-6 text-[15px] font-bold text-white"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-canvas px-6 pt-14 pb-8">
      <h1 className="text-3xl font-extrabold text-ink">Forgot password</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
        Enter the email you signed up with and we&apos;ll send you a link.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <Field
          label="Email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="you@yourbusiness.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        {error && (
          <p
            role="alert"
            className="rounded-2xl bg-accent/10 px-4 py-3 text-[13px] text-accent"
          >
            {error}
          </p>
        )}

        <Button type="submit" loading={busy}>
          Send reset link
        </Button>
      </form>

      <p className="mt-auto pt-8 text-center text-[13px] text-ink-soft">
        Remembered it?{' '}
        <Link to="/login" className="font-bold text-accent">
          Log in
        </Link>
      </p>
    </div>
  );
}

/**
 * Setting a new password, from the link in that email.
 *
 * The token arrives in the query string. Read from there rather than asked for — nobody
 * is going to copy a signed token out of a URL by hand.
 */
export function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get('token') ?? '';

  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const problem = passwordProblem(password);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await resetPassword({ token, password });
      setDone(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Could not reset your password. The link may have expired.',
      );
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-full flex-col justify-center bg-canvas px-6 text-center">
        <p className="text-[14px] text-ink-soft">
          This reset link is incomplete. Ask for a new one.
        </p>
        <Link
          to="/forgot-password"
          className="mx-auto mt-6 inline-flex min-h-12 items-center rounded-full bg-accent px-6 text-[15px] font-bold text-white"
        >
          Send a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-full flex-col justify-center bg-canvas px-6 text-center">
        <h1 className="text-2xl font-extrabold text-ink">Password changed</h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          Sign in with your new password.
        </p>
        <Link
          to="/login"
          className="mx-auto mt-8 inline-flex min-h-12 items-center rounded-full bg-accent px-6 text-[15px] font-bold text-white"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-canvas px-6 pt-14 pb-8">
      <h1 className="text-3xl font-extrabold text-ink">New password</h1>
      <p className="mt-2 text-[14px] text-ink-soft">
        Choose something you&apos;ll remember.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <PasswordField
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={error}
        />
        <p className="text-[12px] leading-snug text-ink-faint">
          At least 8 characters, with a capital letter, a number and a symbol.
        </p>

        <Button type="submit" loading={busy}>
          Change password
        </Button>
      </form>
    </div>
  );
}
