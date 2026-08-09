/**
 * The backend's rules, checked before the round trip.
 *
 * Mirrors `registerVendorSchema`. Duplicated deliberately rather than trusted to the
 * server: a wizard that only discovers a bad password on the last step, after five
 * screens of typing, is a wizard people abandon. The server still validates — this only
 * decides when to say so.
 */

/** Must contain lower, upper, digit and one of `@$!%*?&`. */
export const PASSWORD_RULE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'At least 8 characters';
  if (password.length > 50) return 'No more than 50 characters';
  if (!PASSWORD_RULE.test(password)) {
    return 'Add a capital letter, a number and a symbol (@ $ ! % * ? &)';
  }
  return null;
}

export function emailProblem(email: string): string | null {
  // Deliberately loose. The server is the authority; this only catches obvious typos
  // before someone waits for a round trip to be told.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? null
    : 'That does not look like an email address';
}

/**
 * Nigerian numbers, normalised to E.164 — which is the only form the backend accepts.
 *
 * Vendors type `0801…`, `234801…`, `+234 801 234 5678`, or with spaces and dashes. All
 * of them mean the same number, and none of them pass `/^\+?[1-9]\d{1,14}$/` unchanged.
 */
export function toE164(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '');
  if (!digits) return null;

  let normalised = digits;
  if (normalised.startsWith('+')) normalised = normalised.slice(1);

  // 0801… → 234801…
  if (normalised.startsWith('0')) normalised = `234${normalised.slice(1)}`;
  // 801… typed without either prefix
  else if (normalised.length === 10) normalised = `234${normalised}`;

  /**
   * Eight digits minimum, not the backend's two.
   *
   * `registerVendorSchema` accepts `/^\+?[1-9]\d{1,14}$/`, which passes `+234` — a bare
   * country code. Prefixing a stray `0` produces exactly that, so this is stricter than
   * the server on purpose: better to say "enter a valid phone number" than to create an
   * account nobody can be rung on.
   */
  return /^[1-9]\d{7,14}$/.test(normalised) ? `+${normalised}` : null;
}

export function phoneProblem(input: string): string | null {
  return toE164(input)
    ? null
    : 'Enter a valid phone number, like 0801 234 5678';
}

export function requiredProblem(
  value: string,
  label: string,
  min = 2,
): string | null {
  const trimmed = value.trim();
  if (trimmed.length < min) return `${label} is required`;
  return null;
}
