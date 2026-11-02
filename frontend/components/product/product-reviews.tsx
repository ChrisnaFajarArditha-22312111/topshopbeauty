"use client";

import * as React from "react";
import { CheckCircle2, Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/shared/star-rating";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import type { ReviewItem, ProductReviewsSummary } from "@/features/products/productTypes";

interface ProductReviewsProps {
  summary?: ProductReviewsSummary;
  isLoading?: boolean;
  className?: string;
}

const INITIAL_DISPLAY_COUNT = 6;

function RatingDistributionBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-stone-600 font-medium w-4 text-right">{star}</span>
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
      <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewItem }) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-border/80 shadow-xs flex flex-col justify-between gap-3 hover:border-primary/30 transition-colors">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* AVATAR + NAME */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-blush-100 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {(review.user_name || "A")[0].toUpperCase()}
            </div>
            <span className="font-bold text-xs text-navy-900">{review.user_name || "Pembeli"}</span>
          </div>

          {/* VERIFIED BADGE */}
          {review.is_verified_purchase && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Terverifikasi
            </span>
          )}
        </div>

        {/* STAR RATING */}
        <StarRating rating={review.rating} size="sm" />

        {/* COMMENT */}
        {review.comment && (
          <p className="text-xs text-stone-600 leading-relaxed mt-1">
            &ldquo;{review.comment}&rdquo;
          </p>
        )}
      </div>

      {/* DATE */}
      <span className="text-[10px] text-muted-foreground">
        {formatDate(review.created_at)}
      </span>
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-5 border border-border/80 shadow-xs flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-3 w-24 rounded-full" />
      </div>
      <Skeleton className="h-3 w-20 rounded-full" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-2.5 w-16 rounded-full" />
    </div>
  );
}

export function ProductReviews({ summary, isLoading, className }: ProductReviewsProps) {
  const [showAll, setShowAll] = React.useState(false);

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-6 w-56 rounded-xl" />
            <Skeleton className="h-4 w-72 rounded-xl mt-2" />
          </div>
          <Skeleton className="h-16 w-36 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ReviewSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const reviews = summary?.reviews || [];
  const avgRating = summary?.average_rating || 0;
  const totalReviews = summary?.total_reviews || reviews.length;

  // Hitung distribusi bintang dari ulasan yang tersedia
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  const displayedReviews = showAll ? reviews : reviews.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className={className}>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-navy-800 tracking-tight">
            Ulasan &amp; Penilaian Pembeli
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Pengalaman nyata dari pembeli terverifikasi Topshop Kosmetik
          </p>
        </div>

        {/* RATING SUMMARY */}
        {totalReviews > 0 && (
          <div className="flex items-stretch gap-4 bg-white px-5 py-3.5 rounded-2xl border border-border/80 shadow-2xs shrink-0">
            {/* AGGREGATE */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-navy-950 leading-none">
                {avgRating.toFixed(1)}
              </span>
              <StarRating rating={avgRating} size="xs" className="mt-1" />
              <span className="text-[10px] text-muted-foreground mt-1">{totalReviews} ulasan</span>
            </div>

            {/* DISTRIBUTION */}
            {reviews.length > 0 && (
              <div className="border-l border-border/60 pl-4 flex flex-col justify-center gap-0.5 min-w-[130px]">
                {distribution.map(({ star, count }) => (
                  <RatingDistributionBar key={star} star={star} count={count} total={reviews.length} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* REVIEW CARDS */}
      {reviews.length === 0 ? (
        <EmptyState
          variant="generic"
          title="Belum Ada Ulasan"
          description="Jadilah yang pertama memberikan ulasan untuk produk ini setelah berbelanja!"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedReviews.map((rev) => (
              <ReviewCard key={rev.id} review={rev} />
            ))}
          </div>

          {/* SHOW MORE BUTTON */}
          {reviews.length > INITIAL_DISPLAY_COUNT && !showAll && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAll(true)}
                className="rounded-full border-border/80 text-xs font-semibold gap-1.5 px-6 hover:border-primary/40"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                Tampilkan Semua {reviews.length} Ulasan
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
