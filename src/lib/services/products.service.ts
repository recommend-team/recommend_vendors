import { request } from '../api';
import type { Paginated, Product, ProductUnit } from '../contract';

/**
 * A vendor's catalogue.
 *
 * Deliberately thin, because the model is thin: a product is a name, a price, one
 * image, a description and whether it is available. There is no stock level, no
 * category, and no second image — the reference design shows all three, and none of
 * them exist. See `contract.ts`.
 */

/** `PRODUCT_LIMIT` in `products.service.ts` on the backend. */
export const PRODUCT_LIMIT = 20;

export function listProducts(
  query: { page?: number; limit?: number } = {},
): Promise<Paginated<Product>> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  params.set('limit', String(query.limit ?? 50));

  return request<Paginated<Product>>(`/products?${params.toString()}`);
}

export interface ProductInput {
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  isAddOn?: boolean;
  /** Dishes only. */
  unit?: ProductUnit | null;
  /** Dishes only: the extras ticked on it. Replaces the current list. */
  extraIds?: string[];
  /** Extras only: the products it goes with. Replaces the current list. */
  dishIds?: string[];
  /**
   * Dishes only: the whole list of choices, replacing the current one. Keep `id` on
   * groups and options that already exist, so buyers' carts holding them keep working.
   */
  choices?: ChoiceGroupInput[];
}

export interface ChoiceGroupInput {
  id?: string;
  name: string;
  required: boolean;
  minPick: number;
  maxPick: number;
  options: {
    id?: string;
    name: string;
    priceDelta: number;
    isAvailable: boolean;
  }[];
}

/**
 * Refused for a vendor who is not yet approved.
 *
 * `POST /products` is the only endpoint in the whole backend carrying `@ApprovedOnly()`.
 * The UI disables the button and explains why, but the server is what actually enforces
 * it — a disabled button is a courtesy, not a control.
 */
export function createProduct(input: ProductInput): Promise<Product> {
  return request<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** At least one field, or the backend refuses it. */
export function updateProduct(
  id: string,
  changes: Partial<ProductInput>,
): Promise<Product> {
  return request<Product>(`/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

export function deleteProduct(id: string): Promise<unknown> {
  return request<unknown>(`/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
