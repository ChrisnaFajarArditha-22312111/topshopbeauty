export interface TopSellingProduct {
  id?: string;
  product_id?: string;
  nama_produk: string;
  terjual: number;
  harga: number;
  total_omset?: number;
  foto_utama?: string | null;
}

export interface LowStockProduct {
  id?: string;
  product_id?: string;
  nama_produk: string;
  stok: number;
  foto_utama?: string | null;
}

export interface RecentOrderSummary {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_email?: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface SalesChartDataPoint {
  date: string;
  total_sales: number;
  order_count?: number;
  total_orders?: number;
}

export interface DashboardStatsResponse {
  total_penjualan: number;
  total_order: number;
  total_customer: number;
  total_produk: number;
  pesanan_pending: number;
  pesanan_selesai: number;
  top_selling_products: TopSellingProduct[];
  low_stock_products: LowStockProduct[];
  recent_orders: RecentOrderSummary[];
  sales_chart: SalesChartDataPoint[];
}

export interface AdminProductCreate {
  nama_produk: string;
  brand_id?: string | null;
  category_id?: string | null;
  sub_category_id?: string | null;
  harga: number;
  harga_asli?: number | null;
  diskon_persen?: string | null;
  stok?: number;
  foto_utama?: string | null;
  url_produk?: string | null;
  is_skincare?: boolean;
  usage_time?: string | null;
  texture?: string | null;
  search_document?: string | null;
  skin_type_ids?: string[];
  skin_concern_ids?: string[];
  ingredient_ids?: string[];
  image_urls?: string[];
}

export type AdminProductUpdate = Partial<AdminProductCreate>;

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface AdminOrderStatusUpdate {
  status: OrderStatus | string;
  notes?: string | null;
}

export interface AdminOrderTrackingInput {
  courier: string;
  tracking_number: string;
}

export interface CustomerListItem {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  email_verified: boolean;
  is_active: boolean;
  is_admin: boolean;
  total_orders: number;
  total_spend: number;
  created_at: string;
}

export interface CustomerDetailResponse {
  id: string;
  email: string;
  email_verified: boolean;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  profile?: Record<string, unknown> | null;
  addresses_count: number;
  orders: RecentOrderSummary[];
  total_spend: number;
}

export interface CustomerStatusUpdate {
  is_active: boolean;
  is_admin?: boolean | null;
}

export interface AdminVoucherCreate {
  code: string;
  name: string;
  description?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_amount: number;
  min_purchase?: number;
  max_discount?: number | null;
  start_date: string;
  end_date: string;
  usage_limit?: number;
  is_active?: boolean;
}

export interface AdminVoucherResponse {
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

export interface CategoryResponse {
  id: string;
  name: string;
  description?: string | null;
  sub_categories?: { id: string; name: string }[];
}

export interface BrandResponse {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
}

export interface SkinTypeResponse {
  id: string;
  name: string;
  description?: string | null;
}

export interface SkinConcernResponse {
  id: string;
  name: string;
  description?: string | null;
}

export interface IngredientResponse {
  id: string;
  name: string;
  description?: string | null;
}
