"use client";

import { useQuery } from "@tanstack/react-query";
import { productApi } from "./productApi";
import { ProductDetail, ProductReviewsSummary } from "./productTypes";

export function useProductDetail(productId: string) {
  const productQuery = useQuery<ProductDetail>({
    queryKey: ["product", productId],
    queryFn: () => productApi.getProductDetail(productId),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });

  const reviewsQuery = useQuery<ProductReviewsSummary>({
    queryKey: ["productReviews", productId],
    queryFn: () => productApi.getProductReviews(productId),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    product: productQuery.data,
    isLoading: productQuery.isLoading,
    isError: productQuery.isError,
    error: productQuery.error,
    reviews: reviewsQuery.data,
    isLoadingReviews: reviewsQuery.isLoading,
  };
}
