/**
 * Build-time configuration.
 *
 * Fails loudly rather than defaulting. A vendor app silently pointing at the wrong API
 * is worse than one that refuses to start: the first looks like it works right up until
 * an order goes missing.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

export const config = {
  /** REST base, including the version prefix — e.g. http://localhost:4000/api/v1 */
  apiBaseUrl: required('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
};
