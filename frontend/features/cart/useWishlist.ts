import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from './cartApi';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/useAuth';

export function useWishlist() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: cartApi.getWishlist,
    enabled: isAuthenticated,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.addToWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Berhasil ditambahkan ke favorit');
    },
    onError: () => {
      toast.error('Gagal menambahkan ke favorit');
    },
  });
}

export function useMoveToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.moveWishlistToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Berhasil dipindahkan ke keranjang');
    },
    onError: () => {
      toast.error('Gagal memindahkan ke keranjang');
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Dihapus dari favorit');
    },
    onError: () => {
      toast.error('Gagal menghapus dari favorit');
    },
  });
}

export function useWishlistCount() {
  const { data } = useWishlist();
  return data?.length || 0;
}
