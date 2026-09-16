import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from './cartApi';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/useAuth';

export function useCart() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
    enabled: isAuthenticated,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      const msg = err?.response?.data?.detail || 'Gagal menambahkan ke keranjang';
      toast.error(msg);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: { quantity: number } }) =>
      cartApi.updateCartItem(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      toast.error('Gagal memperbarui kuantitas');
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.removeCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item dihapus dari keranjang');
    },
    onError: () => {
      toast.error('Gagal menghapus item');
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Keranjang berhasil dikosongkan');
    },
    onError: () => {
      toast.error('Gagal mengosongkan keranjang');
    },
  });
}

export function useCartCount() {
  const { data } = useCart();
  return data?.total_items || 0;
}
