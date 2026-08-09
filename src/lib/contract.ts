/**
 * The backend contract, as this app uses it.
 *
 * Mirrored by hand from `recommend-be` rather than generated: it is a small, stable
 * surface, and hand-mirroring means a backend rename shows up as a type error here
 * instead of `undefined` on a screen.
 *
 * Framework-agnostic, like everything in `lib/` — this file moves to React Native
 * untouched.
 */

// ─── Envelope ─────────────────────────────────────────────────────────────────

/** Every response is wrapped by the backend's global interceptor. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type Role = 'BUYER' | 'SELLER' | 'RIDER' | 'ADMIN' | 'SUPER_ADMIN';

/** Vendor account state. `APPROVED` is the only one that can trade. */
export type SellerStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'DEACTIVATED';

export type VendorType = 'REGISTERED' | 'NON_REGISTERED';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  role: Role;
  status: SellerStatus;
  vendorType: VendorType | null;
  businessName: string | null;
  isEmailVerified: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

/**
 * Mirrors `OrderStatus` on the backend, in lifecycle order.
 *
 * On a vendor's own order only `PAID → READY` is theirs to move. `DISPATCHED` and
 * `COMPLETED` are checkout-level: with one rider carrying a whole basket, no single
 * vendor knows collection has finished or that the goods were handed over.
 *
 * `PROCESSING` predates the lifecycle and is written by nothing.
 */
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'READY'
  | 'DISPATCHED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type FulfillmentType = 'PICKUP' | 'DELIVERY';

export interface VendorOrder {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  /** This vendor's goods subtotal. Delivery belongs to the checkout, not here. */
  totalAmount: string;
  platformFee: string;
  /** What this vendor is owed — 80% of their own subtotal. */
  vendorAmount: string;
  fulfillmentType: FulfillmentType;
  status: OrderStatus;
  deliveryAddress: string | null;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  items: {
    id: string;
    productId: string;
    /** Snapshot taken at purchase — the product may have been renamed since. */
    productName: string;
    unitPrice: string;
    quantity: number;
    lineTotal: string;
  }[];
  /** The payment this order was part of; may cover other vendors too. */
  checkout: {
    id: string;
    reference: string;
    totalAmount: string;
    deliveryFee: string;
  } | null;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * One thing a vendor sells.
 *
 * Deliberately narrow, and narrower than the reference design implies. The backend's
 * `Product` entity has exactly these columns — there is **no stock level, no category
 * and no second image**, so the "Stock Level", "Category" and "Enable Track Inventory"
 * controls in the design have nothing to write to. Building them would mean fields that
 * silently do nothing.
 *
 * Adding any of them is backend work: a migration, DTO changes, and a decision about
 * what stock means when two buyers check out at once.
 */
export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description: string | null;
  /** Postgres decimal — arrives as a string. */
  price: string;
  imageUrl: string | null;
  /** What buyers see. False hides it from search without deleting it. */
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Profile, coverage and money ──────────────────────────────────────────────

export interface State {
  id: string;
  name: string;
}

export interface Area {
  id: string;
  name: string;
  stateId: string;
}

/**
 * Everything `GET /sellers/profile` returns.
 *
 * Wider than any one screen needs — it carries the business details, the KYC document
 * URLs and the payout account together — because it is one endpoint and splitting it
 * client-side is cheaper than three round trips on a phone.
 */
export interface VendorProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string | null;
  status: SellerStatus;
  vendorType: VendorType | null;
  slug: string | null;

  businessName: string | null;
  businessAddress: string | null;
  businessDescription: string | null;
  businessCategory: string | null;
  /** Resolved rows, not ids — sending them back requires `areaIds`. */
  serviceAreas: { id: string; name: string; stateId: string }[];
  businessLogoUrl: string | null;
  businessBannerUrl: string | null;
  whatsappNumber: string | null;
  /** The shop shutter. False hides every product from buyers at once. */
  isOpen: boolean;

  // KYC — which of these are set tells the vendor what is still outstanding.
  cacDocumentUrl: string | null;
  tinDocumentUrl: string | null;
  ninDocumentUrl: string | null;
  passportPhotoUrl: string | null;
  bankStatementUrl: string | null;
  utilityBillUrl: string | null;

  bankName: string | null;
  bankCode: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;

  /** 0–100, computed server-side. */
  profileCompleteness: number;
  storefrontUrl: string | null;
  isEmailVerified: boolean;
}

export interface Earnings {
  /** What buyers paid for this vendor's items, before the platform's cut. */
  grossTotal: number;
  /** What the vendor is owed — 80% of gross. */
  netTotal: number;
  platformFeeTotal: number;
  monthlyBreakdown: { month: string; gross: number; net: number }[];
}
