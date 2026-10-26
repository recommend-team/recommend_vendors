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
  /** Where the buyer picked the address on the map. Null when typed; absent on older servers. */
  deliveryPlaceId?: string | null;
  /** Decimal strings, as Postgres sends them. */
  deliveryLat?: string | null;
  deliveryLng?: string | null;
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
    /** Bought as an extra — pack it with the meal. Absent on older servers. */
    isAddOn?: boolean;
  }[];
  /**
   * The order as the buyer built it: each dish with its portions, packs, choices and
   * extras. Absent on older servers — `items` then is all there is.
   */
  lines?: OrderLine[];
  /**
   * The payment this order was part of; may cover other vendors too. Narrowed by the
   * server to what a vendor may see — never the basket's totals, which would show other
   * sellers' shares.
   */
  checkout: {
    id: string;
    reference: string;
    /** Who is coming to collect a delivery, once admin has assigned them. */
    rider: { name: string; phone: string | null } | null;
  } | null;
}

/** One dish as bought — "2 × Rice and beans (2 portions, Protein: Beef, with Beef ×2)". */
export interface OrderLine {
  productName: string;
  /** The one-line form: name with portions, choices and extras. */
  name: string;
  /** Packs for a dish built as a pack; the count for anything else. */
  quantity: number;
  /** Per pack. */
  portions: number;
  packs: number;
  unit: string | null;
  lineTotal: number;
  unitPrice: number;
  isAddOn: boolean;
  choices: { group: string; option: string; priceDelta: number }[];
  /** Per pack. */
  extras: {
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
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
  /**
   * An extra — drinks, extra protein — sold only with a main item from this vendor.
   * Kept out of search and offered to buyers at checkout. Absent from a server older
   * than add-ons, which reads as false.
   */
  isAddOn?: boolean;
  /** What the price is for — "per portion". Null shows no unit. Absent on older servers. */
  unit?: ProductUnit | null;
  /** On a dish: the vendor's extras ticked onto it. */
  extraIds?: string[];
  /** On an extra: the products it is ticked on. */
  dishIds?: string[];
  /** On a dish: its choices — "Choose your protein". */
  choices?: ChoiceGroup[];
  createdAt: string;
  updatedAt: string;
}

/** The units a price can be for — `PRODUCT_UNITS` on the backend. */
export const PRODUCT_UNITS = [
  'portion',
  'plate',
  'piece',
  'pack',
  'wrap',
  'bottle',
  'bowl',
  'cup',
] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

/**
 * A question on a dish. The buyer picks between `minPick` and `maxPick` options; a
 * required choice must be answered before the dish can be added. One answer covers the
 * whole pack.
 */
export interface ChoiceGroup {
  id: string;
  name: string;
  required: boolean;
  minPick: number;
  maxPick: number;
  options: ChoiceOption[];
}

export interface ChoiceOption {
  id: string;
  name: string;
  /** Added per portion. 0 for "included". */
  priceDelta: number;
  isAvailable: boolean;
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

export type WeekDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/**
 * One day of opening hours, "HH:mm" in Lagos time. A closing time earlier than the
 * opening time closes the next day; the same time means open all day.
 */
export interface DaySchedule {
  isOpen: boolean;
  open: string;
  close: string;
}

/** All seven days — the backend refuses a week with any missing. */
export type OperatingHours = Record<WeekDay, DaySchedule>;

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
  /**
   * The pause switch. Off: no orders, whatever the opening hours say. On: orders within
   * the opening hours, or at any time if none are set.
   */
  isOpen: boolean;
  /** The weekly schedule in Lagos time, or null for none (open whenever switched on). */
  operatingHours: OperatingHours | null;
  /**
   * Whether buyers can order right now — the switch and the hours together, decided by
   * the server. Optional only because an older server does not send it.
   */
  openNow?: boolean;
  /** When the shop next opens (ISO) — null if open, paused, or no day open. */
  opensAt?: string | null;
  /** When the current opening ends (ISO) — null if closed or it never ends. */
  closesAt?: string | null;

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

/**
 * What has been sold. **Not the wallet balance.**
 *
 * Counts every paid order; the wallet counts only orders a customer has confirmed
 * receiving. They differ by everything in transit, and answer different questions —
 * "how is business" against "what can I take out today".
 */
export interface Earnings {
  /** What buyers paid for this vendor's items, before the platform's cut. */
  grossTotal: number;
  /** What the vendor is owed — 80% of gross. */
  netTotal: number;
  platformFeeTotal: number;
  monthlyBreakdown: { month: string; gross: number; net: number }[];
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'NEW_ORDER'
  | 'ORDER_PAID'
  | 'ORDER_CANCELLED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'WALLET_CREDITED'
  | 'WITHDRAWAL_SETTLED'
  | 'WITHDRAWAL_FAILED'
  /** Recommend changed the store, products or documents for the vendor. */
  | 'STORE_UPDATED_BY_ADMIN';

/**
 * One thing that happened.
 *
 * The durable record — push and email are best-effort layers on top of this, so anything
 * a vendor missed elsewhere is still here.
 */
export interface VendorNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Ids for deep-linking: `orderId`, `reference`, `withdrawalId`, and so on. */
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationFeed {
  items: VendorNotification[];
  total: number;
  unread: number;
  page: number;
  limit: number;
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface Wallet {
  currency: string;
  /** Summed from the ledger on every read, never stored. */
  balance: number;
  entryCount: number;
}

export type WalletEntryType =
  | 'EARNING'
  | 'COMMISSION'
  | 'WITHDRAWAL'
  | 'WITHDRAWAL_REVERSED'
  | 'ADJUSTMENT';

/** One movement. A sale is two of these: what was sold, and the commission on it. */
export interface WalletEntry {
  id: string;
  type: WalletEntryType;
  /** Signed — credits positive, debits negative. */
  amount: number;
  note: string | null;
  orderId: string | null;
  withdrawalId: string | null;
  createdAt: string;
}

export interface Bank {
  name: string;
  code: string;
  slug: string;
}

export type PayoutAccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'REMOVED';

export interface PayoutAccount {
  id: string;
  bankName: string;
  bankCode: string;
  /** Masked by the backend — the last four only. */
  accountNumber: string;
  /** As Paystack resolved it, not as anyone typed it. */
  accountName: string;
  status: PayoutAccountStatus;
  isDefault: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

export type WithdrawalStatus =
  'REQUESTED' | 'PROCESSING' | 'SETTLED' | 'FAILED' | 'REVERSED';

export interface Withdrawal {
  id: string;
  reference: string;
  amountRequested: number;
  feeAmount: number;
  /** What actually reaches the bank, after the transfer fee. */
  amountSent: number;
  status: WithdrawalStatus;
  failureReason: string | null;
  createdAt: string;
  settledAt: string | null;
}

/** What a withdrawal of a given amount would send, shown before confirming. */
export interface WithdrawalQuote {
  amountRequested: number;
  feeAmount: number;
  amountSent: number;
}
