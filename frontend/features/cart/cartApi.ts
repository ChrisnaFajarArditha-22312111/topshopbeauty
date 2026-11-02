import api from '@/lib/axios';
import {
  CartResponse,
  CartItemResponse,
  AddToCartRequest,
  UpdateCartItemRequest,
  WishlistItemResponse,
  MoveWishlistToCartRequest
} from './cartTypes';

const normalizeCart = (data: unknown): CartResponse => {
  const raw = (data as { data?: CartResponse })?.data ?? (data as CartResponse);
  const cart: CartResponse =
    raw && typeof raw === 'object'
      ? raw
      : { id: '', items: [], total_items: 0, total_price: 0 };

  if (Array.isArray(cart.items)) {
    cart.items = cart.items.map((item: CartItemResponse) => ({
      ...item,
      harga: item.harga ?? item.price ?? 0,
      price: item.price ?? item.harga ?? 0,
    }));
  } else {
    cart.items = [];
  }
  return cart;
};

export const cartApi = {
  getCart: async (): Promise<CartResponse> => {
    const { data } = await api.get('/cart');
    return normalizeCart(data);
  },
  addToCart: async (req: AddToCartRequest): Promise<CartResponse> => {
    const { data } = await api.post('/cart/items', req);
    return normalizeCart(data);
  },
  updateCartItem: async (itemId: string, req: UpdateCartItemRequest): Promise<CartResponse> => {
    const { data } = await api.patch(`/cart/items/${itemId}`, req);
    return normalizeCart(data);
  },
  removeCartItem: async (itemId: string): Promise<CartResponse> => {
    const { data } = await api.delete(`/cart/items/${itemId}`);
    return normalizeCart(data);
  },
  clearCart: async (): Promise<CartResponse> => {
    const { data } = await api.delete('/cart');
    return normalizeCart(data);
  },
  getWishlist: async (): Promise<WishlistItemResponse[]> => {
    const { data } = await api.get('/wishlist');
    const list = data?.data ?? data;
    return Array.isArray(list) ? list : [];
  },
  addToWishlist: async (productId: string): Promise<WishlistItemResponse> => {
    const { data } = await api.post('/wishlist', { product_id: productId });
    return data?.data ?? data;
  },
  moveWishlistToCart: async (req: MoveWishlistToCartRequest): Promise<CartResponse> => {
    const { data } = await api.post('/wishlist/move-to-cart', req);
    return normalizeCart(data);
  },
  removeFromWishlist: async (productId: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/wishlist/${productId}`);
    return data?.data ?? data;
  }
};
