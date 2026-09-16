"use client";

import * as React from "react";
import { ProductCard } from "@/components/product/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import type { Product } from "@/features/products/productTypes";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  skeletonCount?: number;
  onResetFilters?: () => void;
  className?: string;
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border/60 overflow-hidden flex flex-col">
      <Skeleton className="w-full aspect-square rounded-none" />
      <div className="p-3.5 flex flex-col gap-2">
        <Skeleton className="h-2.5 w-16 rounded-full" />
        <Skeleton className="h-4 w-full rounded-xl" />
        <Skeleton className="h-4 w-3/4 rounded-xl" />
        <div className="flex items-center gap-1.5 mt-1">
          <Skeleton className="h-3 w-8 rounded-full" />
          <Skeleton className="h-3 w-20 rounded-full" />
        </div>
        <div className="flex items-end justify-between pt-2 border-t border-border/40">
          <Skeleton className="h-5 w-24 rounded-xl" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  isLoading = false,
  skeletonCount = 8,
  onResetFilters,
  className,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 ${className ?? ""}`}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        variant="search"
        actionLabel="Reset Filter"
        onAction={onResetFilters}
        className={className}
      />
    );
  }

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 ${className ?? ""}`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}
