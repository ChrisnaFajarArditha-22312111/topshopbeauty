import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "./adminApi";
import {
  AdminProductCreate,
  AdminProductUpdate,
  AdminOrderStatusUpdate,
  AdminOrderTrackingInput,
  CustomerStatusUpdate,
  AdminVoucherCreate,
} from "./adminTypes";
import { toast } from "sonner";

// Dashboard
export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: adminApi.getDashboardStats,
    refetchInterval: 30000,
  });
}

// Products
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminProductCreate) => adminApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard-stats"] });
      toast.success("Produk berhasil ditambahkan ke katalog!");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Gagal menambahkan produk");
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminProductUpdate }) =>
      adminApi.updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard-stats"] });
      toast.success("Produk berhasil diperbarui!");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Gagal memperbarui produk");
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard-stats"] });
      toast.success("Produk berhasil dihapus!");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Gagal menghapus produk");
    },
  });
}

// Orders
export function useAdminOrders(statusFilter?: string) {
  return useQuery({
    queryKey: ["admin", "orders", statusFilter],
    queryFn: () => adminApi.getOrders(statusFilter && statusFilter !== "all" ? { status: statusFilter } : undefined),
  });
}

export function useAdminOrderDetail(id: string) {
  return useQuery({
    queryKey: ["admin", "order", id],
    queryFn: () => adminApi.getOrderDetail(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminOrderStatusUpdate }) =>
      adminApi.updateOrderStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "order", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard-stats"] });
      toast.success("Status pesanan berhasil diubah!");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Gagal mengubah status pesanan");
    },
  });
}

export function useInputOrderTracking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminOrderTrackingInput }) =>
      adminApi.inputOrderTracking(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "order", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard-stats"] });
      toast.success("Nomor resi berhasil diinput & pesanan berstatus dikirim!");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Gagal menginput resi pengiriman");
    },
  });
}

// Customers
export function useAdminCustomers() {
  return useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => adminApi.getCustomers(),
  });
}

export function useAdminCustomerDetail(id: string) {
  return useQuery({
    queryKey: ["admin", "customer", id],
    queryFn: () => adminApi.getCustomerDetail(id),
    enabled: !!id,
  });
}

export function useUpdateCustomerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerStatusUpdate }) =>
      adminApi.updateCustomerStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "customer", variables.id] });
      toast.success("Status akun pelanggan berhasil diperbarui!");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Gagal memperbarui status akun");
    },
  });
}

// Promotions & Vouchers
export function useAdminVouchers() {
  return useQuery({
    queryKey: ["admin", "vouchers"],
    queryFn: adminApi.getVouchers,
  });
}

export function useCreateVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminVoucherCreate) => adminApi.createVoucher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vouchers"] });
      toast.success("Voucher promosi berhasil dibuat!");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Gagal membuat voucher");
    },
  });
}

export function useToggleVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.toggleVoucher(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vouchers"] });
      toast.success("Status aktif voucher berhasil diubah!");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Gagal mengubah status voucher");
    },
  });
}

// Master Data
export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: adminApi.getCategories,
  });
}

export function useAdminBrands() {
  return useQuery({
    queryKey: ["admin", "brands"],
    queryFn: adminApi.getBrands,
  });
}

export function useAdminSkinTypes() {
  return useQuery({
    queryKey: ["admin", "skin-types"],
    queryFn: adminApi.getSkinTypes,
  });
}

export function useAdminSkinConcerns() {
  return useQuery({
    queryKey: ["admin", "skin-concerns"],
    queryFn: adminApi.getSkinConcerns,
  });
}
