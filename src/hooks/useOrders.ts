import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listOrders, markOrderReady } from '../lib/services/orders.service';
import type { OrderStatus, Paginated, VendorOrder } from '../lib/contract';

/**
 * Which orders are still the vendor's problem.
 *
 * `PENDING_PAYMENT` is deliberately absent: nobody has paid, so there is nothing to
 * make, and showing them would fill the list with abandoned checkouts.
 */
export const ACTIVE_STATUSES: OrderStatus[] = ['PAID', 'READY', 'DISPATCHED'];

export type OrdersTab = 'active' | 'past';

/**
 * The orders list.
 *
 * The backend filters by a single status and this screen needs several, so the split
 * happens here — one request, partitioned client-side. At a vendor's volume that is
 * cheaper and simpler than three round trips, and it keeps the two tabs consistent with
 * each other.
 */
export function useOrders(tab: OrdersTab) {
  const query = useQuery<Paginated<VendorOrder>>({
    queryKey: ['vendor', 'orders'],
    queryFn: () => listOrders({ limit: 50 }),
    // Orders arrive while the phone is in a pocket. Short, so a returning vendor is
    // never looking at something stale, and `refetchOnWindowFocus` does the rest.
    staleTime: 15_000,
  });

  const all = query.data?.items ?? [];
  const orders = all.filter((order) =>
    tab === 'active'
      ? ACTIVE_STATUSES.includes(order.status)
      : !ACTIVE_STATUSES.includes(order.status),
  );

  return {
    orders,
    activeCount: all.filter((order) => ACTIVE_STATUSES.includes(order.status))
      .length,
    /** Orders waiting on this vendor specifically — the number that should nag. */
    awaitingCount: all.filter((order) => order.status === 'PAID').length,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/**
 * Marking one order ready can move the whole checkout — once every vendor on a basket
 * is ready, the buyer's order is too — so the list is refetched rather than patched by
 * hand. What the server decided is the only version worth showing.
 */
export function useMarkReady() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markOrderReady,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] });
    },
  });
}
