import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
  type ProductInput,
} from '../lib/services/products.service';
import type { Paginated, Product } from '../lib/contract';

const KEY = ['vendor', 'products'];

export function useProducts() {
  const query = useQuery<Paginated<Product>>({
    queryKey: KEY,
    queryFn: () => listProducts(),
    // A catalogue changes when the vendor changes it, not on its own — so unlike orders
    // there is nothing to poll for.
    staleTime: 60_000,
  });

  return {
    products: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

function useProductMutation<TInput>(
  action: (input: TInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useCreateProduct() {
  return useProductMutation<ProductInput>(createProduct);
}

export function useUpdateProduct() {
  return useProductMutation<{ id: string; changes: Partial<ProductInput> }>(
    ({ id, changes }) => updateProduct(id, changes),
  );
}

export function useDeleteProduct() {
  return useProductMutation<string>(deleteProduct);
}

/**
 * The availability switch.
 *
 * Its own hook so the list can flip one product without going through the whole form,
 * and so the button knows which row is saving. Selling out is the most frequent thing a
 * vendor does all day — it should be one tap from the list, not four taps through an
 * edit screen.
 */
export function useToggleAvailability() {
  return useProductMutation<{ id: string; isAvailable: boolean }>(
    ({ id, isAvailable }) => updateProduct(id, { isAvailable }),
  );
}
