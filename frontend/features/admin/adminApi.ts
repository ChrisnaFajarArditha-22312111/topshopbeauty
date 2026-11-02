import api from "@/lib/axios";
import {
  DashboardStatsResponse,
  AdminProductCreate,
  AdminProductUpdate,
  AdminOrderStatusUpdate,
  AdminOrderTrackingInput,
  CustomerListItem,
  CustomerDetailResponse,
  CustomerStatusUpdate,
  AdminVoucherCreate,
  AdminVoucherResponse,
  CategoryResponse,
  BrandResponse,
  SkinTypeResponse,
  SkinConcernResponse,
  IngredientResponse,
} from "./adminTypes";
import { OrderResponse } from "@/features/checkout/checkoutTypes";
import { ProductDetail } from "@/features/products/productTypes";

export const adminApi = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStatsResponse> => {
    const response = await api.get<DashboardStatsResponse>("/admin/dashboard/stats");
    return response.data;
  },

  // Products
  createProduct: async (data: AdminProductCreate): Promise<ProductDetail> => {
    const response = await api.post<ProductDetail>("/admin/products", data);
    return response.data;
  },

  updateProduct: async (id: string, data: AdminProductUpdate): Promise<ProductDetail> => {
    const response = await api.patch<ProductDetail>(`/admin/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/admin/products/${id}`);
    return response.data;
  },

  // Orders
  getOrders: async (params?: { status?: string; limit?: number; offset?: number }): Promise<OrderResponse[]> => {
    const response = await api.get<OrderResponse[]>("/admin/orders", { params });
    return response.data;
  },

  getOrderDetail: async (id: string): Promise<OrderResponse> => {
    const response = await api.get<OrderResponse>(`/admin/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: string, data: AdminOrderStatusUpdate): Promise<OrderResponse> => {
    const response = await api.patch<OrderResponse>(`/admin/orders/${id}/status`, data);
    return response.data;
  },

  inputOrderTracking: async (id: string, data: AdminOrderTrackingInput): Promise<OrderResponse> => {
    const response = await api.post<OrderResponse>(`/admin/orders/${id}/tracking`, data);
    return response.data;
  },

  // Customers
  getCustomers: async (params?: { limit?: number; offset?: number }): Promise<CustomerListItem[]> => {
    const response = await api.get<CustomerListItem[]>("/admin/customers", { params });
    return response.data;
  },

  getCustomerDetail: async (id: string): Promise<CustomerDetailResponse> => {
    const response = await api.get<CustomerDetailResponse>(`/admin/customers/${id}`);
    return response.data;
  },

  updateCustomerStatus: async (id: string, data: CustomerStatusUpdate): Promise<{ message: string }> => {
    const response = await api.patch<{ message: string }>(`/admin/customers/${id}/status`, data);
    return response.data;
  },

  // Promotions & Vouchers
  getVouchers: async (): Promise<AdminVoucherResponse[]> => {
    const response = await api.get<AdminVoucherResponse[]>("/admin/promotions/vouchers");
    return response.data;
  },

  createVoucher: async (data: AdminVoucherCreate): Promise<AdminVoucherResponse> => {
    const response = await api.post<AdminVoucherResponse>("/admin/promotions/vouchers", data);
    return response.data;
  },

  toggleVoucher: async (id: string, isActive: boolean): Promise<AdminVoucherResponse> => {
    const response = await api.patch<AdminVoucherResponse>(
      `/admin/promotions/vouchers/${id}/toggle`,
      null,
      { params: { is_active: isActive } }
    );
    return response.data;
  },

  // Master Data
  getCategories: async (): Promise<CategoryResponse[]> => {
    const response = await api.get<CategoryResponse[]>("/categories");
    return response.data;
  },

  createCategory: async (data: { name: string; description?: string }): Promise<CategoryResponse> => {
    const response = await api.post<CategoryResponse>("/admin/categories", data);
    return response.data;
  },

  createSubCategory: async (data: { category_id: string; name: string }): Promise<{ id: string; category_id: string; name: string }> => {
    const response = await api.post<{ id: string; category_id: string; name: string }>("/admin/sub-categories", data);
    return response.data;
  },

  getBrands: async (): Promise<BrandResponse[]> => {
    const response = await api.get<BrandResponse[]>("/brands");
    return response.data;
  },

  createBrand: async (data: { name: string; description?: string; logo_url?: string }): Promise<BrandResponse> => {
    const response = await api.post<BrandResponse>("/admin/brands", data);
    return response.data;
  },

  getSkinTypes: async (): Promise<SkinTypeResponse[]> => {
    const response = await api.get<SkinTypeResponse[]>("/skin-types");
    return response.data;
  },

  createSkinType: async (data: { name: string; description?: string }): Promise<SkinTypeResponse> => {
    const response = await api.post<SkinTypeResponse>("/admin/skin-types", data);
    return response.data;
  },

  getSkinConcerns: async (): Promise<SkinConcernResponse[]> => {
    const response = await api.get<SkinConcernResponse[]>("/skin-concerns");
    return response.data;
  },

  createSkinConcern: async (data: { name: string; description?: string }): Promise<SkinConcernResponse> => {
    const response = await api.post<SkinConcernResponse>("/admin/skin-concerns", data);
    return response.data;
  },

  createIngredient: async (data: { name: string; description?: string }): Promise<IngredientResponse> => {
    const response = await api.post<IngredientResponse>("/admin/ingredients", data);
    return response.data;
  },
};
