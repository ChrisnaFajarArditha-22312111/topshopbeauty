import api from '@/lib/axios';
import { Order, PaymentInfo, TrackingInfo, CreateReviewInput, ReviewItem } from './orderTypes';

export async function getOrders(): Promise<Order[]> {
  const response = await api.get('/orders');
  return response.data;
}

export async function getOrderDetail(orderId: string): Promise<Order> {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
}

export async function syncPaymentStatus(orderId: string): Promise<PaymentInfo> {
  const response = await api.post(`/payments/order/${orderId}/sync`);
  return response.data;
}

export async function cancelOrder(orderId: string): Promise<Order> {
  const response = await api.post(`/orders/${orderId}/cancel`);
  return response.data;
}

export async function getTracking(trackingNumber: string): Promise<TrackingInfo> {
  const response = await api.get(`/shipping/track/${trackingNumber}`);
  return response.data;
}

export async function createReview(data: CreateReviewInput): Promise<ReviewItem> {
  const response = await api.post('/reviews', data);
  return response.data;
}

export async function getMyReviews(): Promise<ReviewItem[]> {
  const response = await api.get('/reviews/me');
  return response.data;
}
