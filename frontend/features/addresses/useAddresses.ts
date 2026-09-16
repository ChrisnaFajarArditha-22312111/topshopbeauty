"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addressApi } from "./addressApi";
import { AddressCreateInput, AddressUpdateInput } from "./addressTypes";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/useAuth";

export function useAddresses() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const {
    data: addresses = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["addresses"],
    queryFn: addressApi.getAddresses,
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: (data: AddressCreateInput) => addressApi.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Alamat baru berhasil ditambahkan!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Gagal menambahkan alamat");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressUpdateInput }) =>
      addressApi.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Alamat berhasil diperbarui!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Gagal memperbarui alamat");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => addressApi.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Alamat berhasil dihapus");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Gagal menghapus alamat");
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => addressApi.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Alamat utama berhasil diubah!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Gagal mengubah alamat default");
    },
  });

  return {
    addresses,
    isLoading,
    error,
    refetch,
    createAddress: createMutation.mutateAsync,
    updateAddress: updateMutation.mutateAsync,
    deleteAddress: deleteMutation.mutateAsync,
    setDefaultAddress: setDefaultMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
