"use client";

import * as React from "react";
import { ProductCard } from "@/components/product/product-card";
import { useProducts } from "@/features/products/useProducts";
import { Skeleton } from "@/components/ui/skeleton";

export function TrendingProductsSection() {
  const { data, isLoading } = useProducts({
    sort_by: "terlaris",
    page_size: 4,
  });

  const products = data?.items || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-border/70 p-3 space-y-3">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="gsap-products-grid grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <div key={product.id} className="gsap-product-card">
          <ProductCard
            id={product.id}
            nama_produk={product.nama_produk}
            brand_name={product.brand_name}
            harga={product.harga}
            harga_asli={product.harga_asli}
            diskon_persen={product.diskon_persen}
            rating={product.rating}
            terjual={product.terjual}
            foto_utama={product.foto_utama}
            isAiRecommended={product.is_skincare}
          />
        </div>
      ))}
    </div>
  );
}
