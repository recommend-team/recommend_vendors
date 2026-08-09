import { request } from '../api';
import type { OrderStatus, Paginated, VendorOrder } from '../contract';

/**
 * A vendor's own orders.
 *
 * The backend already scopes these to whoever the token belongs to, so there is no
 * vendor id to pass and no way to ask for someone else's.
 */
export function listOrders(
  query: {
    status?: OrderStatus;
    page?: number;
    limit?: number;
  } = {},
): Promise<Paginated<VendorOrder>> {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));

  const qs = params.toString();
  return request<Paginated<VendorOrder>>(
    `/sellers/orders${qs ? `?${qs}` : ''}`,
  );
}

/**
 * "I have the goods, a rider can collect."
 *
 * The vendor's only transition, and the reason this app exists. Always labelled
 * **Ready for pickup**, never *Accept*: a button marked Accept gets tapped the moment an
 * order appears — that is what accepting means everywhere else — and dispatch then sends
 * a rider for food that is not cooked.
 *
 * Once every vendor on a basket is ready the whole order becomes ready, which on a
 * pickup order is what tells the buyer to come.
 */
export function markOrderReady(orderId: string): Promise<null> {
  return request<null>(`/sellers/orders/${encodeURIComponent(orderId)}/ready`, {
    method: 'PATCH',
  });
}
