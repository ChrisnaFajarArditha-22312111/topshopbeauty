"use client";

import { useQuery } from "@tanstack/react-query";
import { productApi } from "./productApi";
import { ProductFilterParams, PaginatedProducts } from "./productTypes";

export function useProducts(params: ProductFilterParams) {
  return useQuery<PaginatedProducts>({
    queryKey: ["products", params],
    queryFn: () => productApi.getProducts(params),
    staleTime: 1000 * 60 * 2, // 2 menit
  });
}
