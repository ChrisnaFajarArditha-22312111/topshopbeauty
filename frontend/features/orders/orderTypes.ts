export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  is_reviewed?: boolean;
}

export interface PaymentInfo {
  id: string;
  payment_method: string;
  amount: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  mayar_payment_url: string | null;
  paid_at: string | null;
}

export interface ShipmentInfo {
  id: string;
  courier_code?: string;
  service_code?: string;
  courier_name?: string;
  service_name?: string;
  tracking_number: string | null;
  shipping_status: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  total_amount: number;
  shipping_recipient_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_courier: string;
  shipping_service: string;
  customer_notes: string | null;
  voucher_code: string | null;
  items: OrderItem[];
  payment: PaymentInfo | null;
  shipment: ShipmentInfo | null;
  created_at: string;
}

export interface TrackingHistoryItem {
  note: string;
  updated_at: string;
  status?: string;
}

export interface TrackingInfo {
  tracking_number: string;
  status: string;
  courier_name?: string;
  history: TrackingHistoryItem[];
}

export interface CreateReviewInput {
  order_item_id: string;
  rating: number;
  comment?: string;
  photo_url?: string;
}

export interface ReviewItem {
  id: string;
  product_id: string;
  user_name?: string;
  rating: number;
  comment?: string;
  photo_url?: string;
  created_at: string;
}
