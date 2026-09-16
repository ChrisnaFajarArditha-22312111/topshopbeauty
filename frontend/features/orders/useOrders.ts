import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getOrders,
  getOrderDetail,
  syncPaymentStatus,
  cancelOrder,
  getTracking,
  createReview,
  getMyReviews
} from './orderApi';
import { CreateReviewInput } from './orderTypes';

export function useOrders(statusFilter?: string) {
  return useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      const orders = await getOrders();
      if (statusFilter) {
        return orders.filter(order => order.status === statusFilter);
      }
      return orders;
    }
  });
}

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderDetail(orderId),
    enabled: !!orderId
  });
}

export function useSyncPaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => syncPaymentStatus(orderId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (data.status === 'paid') {
        toast.success('Pembayaran Terverifikasi!', {
          description: 'Sistem Mayar mengonfirmasi bahwa pembayaran Anda telah Lunas.',
        });
      } else {
        toast.info(`Status: ${data.status.toUpperCase()}`, {
          description: 'Belum terdeteksi pembayaran lunas di Mayar. Silakan selesaikan pembayaran.',
        });
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Gagal memeriksa status pembayaran ke gateway.');
    }
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Pesanan dibatalkan. Produk telah dikembalikan ke keranjang belanja Anda.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || error?.response?.data?.message || 'Gagal membatalkan pesanan.');
    }
  });
}

export function useTracking(trackingNumber?: string | null) {
  return useQuery({
    queryKey: ['tracking', trackingNumber],
    queryFn: () => getTracking(trackingNumber!),
    enabled: !!trackingNumber
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewInput) => createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
      toast.success('Ulasan berhasil dikirim. Terima kasih!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal mengirim ulasan.');
    }
  });
}

export function useMyReviews() {
  return useQuery({
    queryKey: ['my-reviews'],
    queryFn: getMyReviews
  });
}
