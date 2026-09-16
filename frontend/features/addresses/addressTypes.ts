export interface Address {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  district: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressCreateInput {
  label?: string;
  recipient_name: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  district: string;
  postal_code: string;
  is_default?: boolean;
}

export interface AddressUpdateInput {
  label?: string;
  recipient_name?: string;
  phone?: string;
  address?: string;
  province?: string;
  city?: string;
  district?: string;
  postal_code?: string;
  is_default?: boolean;
}
