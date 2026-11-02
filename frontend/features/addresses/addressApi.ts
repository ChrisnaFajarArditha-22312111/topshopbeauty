import api from "@/lib/axios";
import { Address, AddressCreateInput, AddressUpdateInput } from "./addressTypes";

export const addressApi = {
  // Ambil semua alamat user
  getAddresses: async (): Promise<Address[]> => {
    const res = await api.get<Address[]>("/addresses");
    return res.data;
  },

  // Tambah alamat baru
  createAddress: async (data: AddressCreateInput): Promise<Address> => {
    const res = await api.post<Address>("/addresses", data);
    return res.data;
  },

  // Update alamat
  updateAddress: async (
    id: string,
    data: AddressUpdateInput
  ): Promise<Address> => {
    const res = await api.patch<Address>(`/addresses/${id}`, data);
    return res.data;
  },

  // Hapus alamat
  deleteAddress: async (id: string): Promise<void> => {
    await api.delete(`/addresses/${id}`);
  },

  // Jadikan alamat default
  setDefaultAddress: async (id: string): Promise<Address> => {
    const res = await api.patch<Address>(`/addresses/${id}/default`);
    return res.data;
  },
};
