import api from '@/lib/axios';
import {
  CourierOptionResponse,
  CheckoutPreviewRequest,
  CheckoutPreviewResponse,
  CreateOrderRequest,
  OrderResponse,
  VoucherResponse,
  ValidateVoucherRequest,
  ValidateVoucherResponse
} from './checkoutTypes';

export const checkoutApi = {
  getShippingRates: async (addressId: string, courier?: string): Promise<CourierOptionResponse[]> => {
    const params = new URLSearchParams();
    params.append('address_id', addressId);
    if (courier) {
      params.append('courier', courier);
    }
    const { data } = await api.get(`/shipping/rates?${params.toString()}`);
    const list = data?.data ?? data;
    return Array.isArray(list) ? list : [];
  },

  previewCheckout: async (req: CheckoutPreviewRequest): Promise<CheckoutPreviewResponse> => {
    const { data } = await api.post('/checkout/preview', req);
    return data?.data ?? data;
  },

  createOrder: async (req: CreateOrderRequest): Promise<OrderResponse> => {
    const idempotencyKey = crypto.randomUUID();
    const { data } = await api.post('/checkout', req, {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    });
    return data?.data ?? data;
  },

  getVouchers: async (): Promise<VoucherResponse[]> => {
    const { data } = await api.get('/promotions/vouchers');
    const list = data?.data ?? data;
    return Array.isArray(list) ? list : [];
  },

  validateVoucher: async (req: ValidateVoucherRequest): Promise<ValidateVoucherResponse> => {
    const { data } = await api.post('/promotions/validate', req);
    return data?.data ?? data;
  }
};
