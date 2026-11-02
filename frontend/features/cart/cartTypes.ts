export interface CartItemResponse {
  id: string;
  product_id: string;
  nama_produk: string;
  foto_utama: string | null;
  harga: number;
  price?: number;
  harga_asli?: number | null;
  stok: number;
  quantity: number;
  subtotal: number;
}

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  total_items: number;
  total_price: number;
}

export interface AddToCartRequest {
  product_id: string;
  quantity?: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface WishlistItemResponse {
  id: string;
  product_id: string;
  nama_produk: string;
  price: number;
  harga_asli: number | null;
  foto_utama: string | null;
  stok: number;
  rating: number;
}

export interface MoveWishlistToCartRequest {
  product_id: string;
  quantity?: number;
}
