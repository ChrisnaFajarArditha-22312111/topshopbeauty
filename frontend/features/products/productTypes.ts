export interface SkinType {
  id: string;
  name: string;
  description?: string;
}

export interface SkinConcern {
  id: string;
  name: string;
  description?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  description?: string;
}

export interface ProductImage {
  id: string;
  image_url: string;
  sort_order: number;
}

export interface Product {
  id: string;
  item_id?: number | null;
  nama_produk: string;
  brand_name?: string | null;
  category_name?: string | null;
  harga: number;
  harga_asli?: number | null;
  diskon_persen?: string | null;
  stok: number;
  terjual: number;
  rating: number;
  foto_utama?: string | null;
  is_skincare: boolean;
  usage_time?: string | null;
  texture?: string | null;
}

export interface ProductDetail extends Product {
  shop_id?: number | null;
  sub_category_name?: string | null;
  url_produk?: string | null;
  search_document?: string | null;
  images: ProductImage[];
  skin_types: SkinType[];
  skin_concerns: SkinConcern[];
  ingredients: Ingredient[];
}

export interface PaginatedProducts {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: Product[];
}

export interface ProductFilterParams {
  q?: string;
  category?: string;
  brand?: string;
  skin_type?: string;
  skin_concern?: string;
  min_price?: number;
  max_price?: number;
  is_skincare?: boolean;
  sort_by?: "terlaris" | "termurah" | "termahal" | "rating" | "terbaru";
  page?: number;
  page_size?: number;
}

export interface ReviewItem {
  id: string;
  product_id: string;
  user_id: string;
  user_name?: string;
  rating: number;
  comment?: string;
  is_verified_purchase?: boolean;
  created_at: string;
}

export interface ProductReviewsSummary {
  total_reviews: number;
  average_rating: number;
  reviews: ReviewItem[];
}
