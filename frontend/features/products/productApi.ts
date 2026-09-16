import api from "@/lib/axios";
import {
  ProductDetail,
  PaginatedProducts,
  ProductFilterParams,
  ProductReviewsSummary,
} from "./productTypes";

export const productApi = {
  // Ambil katalog produk dengan filter, sort, & pagination
  getProducts: async (params?: ProductFilterParams): Promise<PaginatedProducts> => {
    const res = await api.get<PaginatedProducts>("/products", {
      params,
    });
    return res.data;
  },

  // Ambil detail lengkap produk
  getProductDetail: async (productId: string): Promise<ProductDetail> => {
    const res = await api.get<ProductDetail>(`/products/${productId}`);
    return res.data;
  },

  // Ambil ulasan produk
  getProductReviews: async (productId: string): Promise<ProductReviewsSummary> => {
    try {
      const res = await api.get<ProductReviewsSummary>(`/reviews/product/${productId}`);
      return res.data;
    } catch {
      return {
        total_reviews: 0,
        average_rating: 4.8,
        reviews: [],
      };
    }
  },
};
