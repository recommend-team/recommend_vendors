import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { ApiError } from '../lib/api';
import { resendVerification, verifyEmail } from '../lib/services/auth.service';

const CODE_LENGTH = 6;
export function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const passed = (location.state as { email?: string } | null)?.email;

  const [email, setEmail] = useState(passed ?? '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  // Codes get mistyped and emails get lost, but a resend button tapped six times sends
  // six emails — so it goes quiet for a minute after each one.
  const [cooldown, setCooldown] = useState(0);
  /** The pending signup has expired: there is nothing left to resend against. */
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await verifyEmail({ email: email.trim(), code: code.trim() });
      navigate('/login', {
        replace: true,
        state: { justVerified: true, email: email.trim() },
      });
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : 'Could not verify that code. Check it and try again.';
      // "Please register again" means the pending signup is gone — the code cannot be
      // resent because there is nothing to resend for.
      if (/register again/i.test(message)) setExpired(true);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await resendVerification(email.trim());
      setResent(true);
      setCooldown(60);
    } catch (cause) {
      const message = cause instanceof ApiError ? cause.message : '';
      if (/register again|not found/i.test(message)) {
        setExpired(true);
        setError(message || 'That signup has expired.');
        return;
      }
      setError('Could not send another code just now.');
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-canvas px-6 pt-14 pb-8">
      <h1 className="text-3xl font-extrabold text-ink">Check your email</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
        We sent a six-digit code to{' '}
        <span className="font-bold text-ink">{email || 'your inbox'}</span>.
        {/* Said plainly, because five minutes is short and the consequence of missing
            it is starting over. */}
        <span className="text-ink"> It expires in five minutes.</span>
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        {!passed && (
          <Field
            label="Email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        )}

        <Field
          label="Verification code"
          // `inputMode="numeric"` gives a phone the number pad without the spinner and
          // scroll-to-change misery of `type="number"`.
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          placeholder="000000"
          value={code}
          onChange={(event) =>
            setCode(event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))
          }
          className="[&_input]:text-center [&_input]:text-2xl [&_input]:font-extrabold [&_input]:tracking-[0.4em]"
          required
        />

        {error && (
          <div
            role="alert"
            className="rounded-2xl bg-accent/10 px-4 py-3 text-[13px] leading-snug text-accent"
          >
            {error}
            {expired && (
              <Link
                to="/signup"
                className="mt-1 block font-extrabold underline"
              >
                Start again
              </Link>
            )}
          </div>
        )}

        {resent && !error && (
          <p className="rounded-2xl bg-mint px-4 py-3 text-[13px] text-brand">
            Sent. It can take a minute to arrive.
          </p>
        )}

        <Button
          type="submit"
          loading={busy}
          disabled={code.length !== CODE_LENGTH}
        >
          Verify email
        </Button>
      </form>

      <button
        onClick={() => void resend()}
        disabled={cooldown > 0 || !email.trim() || expired}
        className="mt-6 text-center text-[13px] font-bold text-accent disabled:text-ink-faint"
      >
        {cooldown > 0
          ? `Send another code in ${cooldown}s`
          : 'Send another code'}
      </button>

      <p className="mt-auto pt-8 text-center text-[13px] text-ink-soft">
        Already verified?{' '}
        <Link to="/login" className="font-bold text-accent">
          Log in
        </Link>
      </p>
    </div>
  );
}
