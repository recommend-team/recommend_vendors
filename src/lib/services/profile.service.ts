import { request } from '../api';
import type { Earnings, State, Area, VendorProfile } from '../contract';

export function fetchVendorProfile(): Promise<VendorProfile> {
  return request<VendorProfile>('/sellers/profile');
}

export interface ProfileChanges {
  businessName?: string;
  businessAddress?: string;
  businessDescription?: string;
  businessCategory?: string;
  /**
   * **Area ids, not names.**
   *
   * Areas became admin-created rows in B1; the old free-text `businessAreas` field is
   * gone. `recommend-fe` still sends the string form and therefore cannot save areas at
   * all (`BACKLOG.md` §2.1) — this is the bug not to port.
   */
  areaIds?: string[];
  businessLogoUrl?: string;
  businessBannerUrl?: string;
  whatsappNumber?: string;
  isOpen?: boolean;
}

/** At least one field, or the backend refuses it. */
export function updateVendorProfile(
  changes: ProfileChanges,
): Promise<VendorProfile> {
  return request<VendorProfile>('/sellers/profile', {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

export interface PayoutDetails {
  bankName: string;
  bankCode: string;
  /** Exactly ten digits — a NUBAN. */
  bankAccountNumber: string;
  bankAccountName: string;
}

/**
 * Where a vendor's money goes.
 *
 * All four fields are required together: a half-saved bank account is one that cannot
 * be paid into, and the backend's schema says the same.
 */
export function updatePayoutDetails(
  details: PayoutDetails,
): Promise<VendorProfile> {
  return request<VendorProfile>('/sellers/profile/payout', {
    method: 'PATCH',
    body: JSON.stringify(details),
  });
}

export function fetchEarnings(): Promise<Earnings> {
  return request<Earnings>('/sellers/earnings');
}

// ─── Coverage ─────────────────────────────────────────────────────────────────

/** Public — a vendor needs these before they have an account, let alone approval. */
export function listStates(): Promise<State[]> {
  return request<State[]>('/locations/states', { anonymous: true });
}

export function listAreas(stateId: string): Promise<Area[]> {
  return request<Area[]>(
    `/locations/states/${encodeURIComponent(stateId)}/areas`,
    { anonymous: true },
  );
}
