export interface CourierOptionResponse {
  courier_code: string;
  courier_name: string;
  service_code: string;
  service_name: string;
  price: number;
  etd: string;
}

export interface CheckoutPreviewRequest {
  address_id: string;
  courier_code: string;
  service_code: string;
  voucher_code?: string | null;
}

export interface CheckoutPreviewResponse {
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  item_count: number;
  voucher_applied: string | null;
}

export interface CreateOrderRequest {
  address_id: string;
  courier_code: string;
  service_code: string;
  voucher_code?: string | null;
  customer_notes?: string | null;
}

export interface VoucherResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_amount: number;
  min_purchase: number;
  max_discount: number | null;
  usage_limit: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface ValidateVoucherRequest {
  code: string;
  subtotal: number;
}

export interface ValidateVoucherResponse {
  is_valid: boolean;
  code: string;
  discount_amount: number;
  voucher: VoucherResponse | null;
  message: string;
}

export interface OrderItemResponse {
  id: string;
  product_id: string;
  nama_produk: string;
  foto_utama: string | null;
  harga_satuan: number;
  quantity: number;
  subtotal: number;
}

export interface PaymentInfoResponse {
  id: string;
  payment_method: string;
  amount: number;
  status: string;
  mayar_payment_url: string | null;
  paid_at: string | null;
}

export interface ShipmentInfoResponse {
  id: string;
  tracking_number: string | null;
  courier_name: string;
  service_name: string;
  status: string;
}

export interface OrderResponse {
  id: string;
  order_number: string;
  status: string;
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
  items: OrderItemResponse[];
  payment: PaymentInfoResponse | null;
  shipment: ShipmentInfoResponse | null;
  created_at: string;
}
