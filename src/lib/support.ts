/**
 * How a vendor reaches the Recommend team.
 *
 * `VITE_SUPPORT_PHONE` overrides the default. Baked in at build time. The backend
 * (`SUPPORT_PHONE`), the website and the customer app carry the same default; keep them
 * the same.
 */
const DEFAULT_SUPPORT_PHONE = '+234 814 306 7676';

export const SUPPORT_PHONE =
  (import.meta.env.VITE_SUPPORT_PHONE as string | undefined)?.trim() ||
  DEFAULT_SUPPORT_PHONE;

export const SUPPORT_PHONE_HREF = `tel:${SUPPORT_PHONE.replace(/[^\d+]/g, '')}`;
