import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AirbnbSearchCapsule } from "@/components/product/airbnb-search-capsule";
import { CategoryCarousel } from "@/components/product/category-carousel";
import { TrendingProductsSection } from "@/components/landing/trending-products-section";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, ChevronRight } from "lucide-react";
import { GsapLandingWrapper } from "@/components/landing/gsap-landing-wrapper";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-blush-100 selection:text-primary relative">
      {/* 1. GLOBAL NAVBAR */}
      <Navbar />

      <GsapLandingWrapper>
        {/* 2. HERO BANNER WITH OVERLAPPING AIRBNB SEARCH CAPSULE */}
        <section className="relative w-full overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
            <div className="gsap-hero-card relative rounded-3xl overflow-hidden min-h-[290px] sm:min-h-[330px] lg:min-h-[360px] flex items-center shadow-md border border-pink-100/80 group">
              {/* BACKGROUND HERO IMAGE WITH SUBTLE GSAP PARALLAX */}
              <div className="gsap-hero-bg absolute inset-0 -top-4 -bottom-4 w-full h-[115%]">
                <Image
                  src="/bg-heroo.png"
                  alt="Topshop Kosmetik Banner"
                  fill
                  priority
                  className="object-cover object-[75%_center] sm:object-right md:object-center transition-transform duration-1000 ease-out group-hover:scale-105"
                />
              </div>

              {/* SOFT GRADIENT OVERLAY FOR MAXIMUM LEGIBILITY ON LEFT COPY */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 sm:via-white/50 md:via-white/20 to-transparent pointer-events-none" />

              {/* HERO CONTENT (LEFT) */}
              <div className="relative z-10 max-w-lg p-5 sm:p-7 lg:p-8 flex flex-col gap-2.5 sm:gap-3">
                {/* <div className="gsap-hero-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-primary/20 text-primary text-xs font-bold w-fit shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 gsap-float-badge" />
                  <span>Beauty & Skincare AI Hub</span>
                </div> */}

                <h1 className="gsap-hero-title text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-snug text-navy-800">
                  Temukan Produk Terbaik <br className="hidden sm:inline" />
                  <span className="text-primary bg-gradient-to-r from-primary to-rose-600 bg-clip-text text-transparent">
                    untuk Versi Terbaik Dirimu
                  </span>
                </h1>

                <p className="gsap-hero-desc text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm">
                  Dapatkan rekomendasi produk kosmetik yang sesuai dengan
                  kebutuhan dan kecenderungan kulitmu, dengan teknologi AI yang
                  cerdas dan terpercaya.
                </p>

                <div className="gsap-hero-actions pt-1 flex items-center gap-3">
                  <Button
                    asChild
                    className="rounded-full bg-primary hover:bg-rose-600 text-white font-semibold px-6 shadow-md gap-2 h-10 text-sm transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <Link href="/products">
                      Mulai Berbelanja <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-primary/30 text-navy-800 hover:bg-blush-100 hover:text-primary font-medium px-4 h-10 text-sm transition-all duration-300"
                  >
                    <Link href="/beauty-advisor">Konsultasi AI</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* AIRBNB SEARCH CAPSULE (BELOW BANNER ON MOBILE, FLOATING OVERLAPPING ON DESKTOP) */}
          <div className="gsap-search-capsule relative z-30 max-w-4xl mx-auto px-4 mt-4 md:-mt-8 mb-4 md:mb-6">
            <AirbnbSearchCapsule />
          </div>
        </section>

        {/* 3. CATEGORY CAROUSEL (AIRBNB STYLE) */}
        <div className="gsap-category-section">
          <Suspense
            fallback={<div className="h-16 w-full bg-white/40 animate-pulse" />}
          >
            <CategoryCarousel />
          </Suspense>
        </div>

        <main className="flex-1 flex flex-col gap-16 md:gap-24 py-8 md:py-12">
          {/* 4. TRENDING PRODUCTS GRID (AIRBNB STYLE) */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="gsap-trending-header flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Paling Diminati
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-800 tracking-tight">
                  Pilihan Favorit Pengguna
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Produk kosmetik dan skincare terlaris dengan rating tertinggi
                  di Bandar Lampung
                </p>
              </div>

              <Button
                asChild
                variant="ghost"
                className="rounded-full text-primary hover:text-primary hover:bg-blush-100 gap-1 font-semibold self-start sm:self-auto transition-transform hover:translate-x-1"
              >
                <Link href="/products">
                  Lihat Semua <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            <TrendingProductsSection />
          </section>

          {/* 5. HOW IT WORKS: DARI MASALAH KULIT KE RUTINITAS (3 LANGKAH EMAS) */}
          <section className="bg-pink-soft/60 border-y border-pink-200/60 py-16 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="gsap-steps-header text-center max-w-2xl mx-auto mb-12">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary uppercase tracking-wider px-3 py-1 rounded-full bg-blush-100 mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> Alur Konsultasi Praktis
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-800 tracking-tight mt-1">
                  Dari Masalah Kulit ke Rutinitas Sempurna
                </h2>
                <p className="text-sm text-stone-600 mt-2 max-w-lg mx-auto">
                  Tidak perlu bingung memilih skincare di antara ribuan pilihan.
                  AI Beauty Advisor membimbingmu dalam 3 langkah mudah.
                </p>
              </div>

              <div className="gsap-steps-grid grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* LANGKAH 1 */}
                <div className="gsap-step-card h-full">
                  <div className="bg-white rounded-3xl p-7 border border-pink-100 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:-translate-y-2 flex flex-col gap-4 relative h-full group">
                    <div className="w-12 h-12 rounded-2xl bg-blush-100 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 flex items-center justify-center font-bold text-lg">
                      01
                    </div>
                    <h3 className="font-bold text-lg text-navy-800 group-hover:text-primary transition-colors">
                      Ceritakan Kondisi Kulitmu
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      Tuliskan keluhanmu dengan bahasa santai. Mulai dari
                      jerawat, noda hitam, tipe kulit, hingga batasan budget
                      belanja yang kamu inginkan.
                    </p>
                  </div>
                </div>

                {/* LANGKAH 2 */}
                <div className="gsap-step-card h-full">
                  <div className="bg-white rounded-3xl p-7 border border-pink-100 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:-translate-y-2 flex flex-col gap-4 relative h-full group">
                    <div className="w-12 h-12 rounded-2xl bg-blush-100 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 flex items-center justify-center font-bold text-lg">
                      02
                    </div>
                    <h3 className="font-bold text-lg text-navy-800 group-hover:text-primary transition-colors">
                      Dapatkan Analisis Cerdas
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      Sistem RAG dan Qwen AI memfilter database produk nyata
                      Topshop untuk memilihkan kandungan bahan yang paling aman
                      dan efektif untukmu.
                    </p>
                  </div>
                </div>

                {/* LANGKAH 3 */}
                <div className="gsap-step-card h-full">
                  <div className="bg-white rounded-3xl p-7 border border-pink-100 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:-translate-y-2 flex flex-col gap-4 relative h-full group">
                    <div className="w-12 h-12 rounded-2xl bg-blush-100 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 flex items-center justify-center font-bold text-lg">
                      03
                    </div>
                    <h3 className="font-bold text-lg text-navy-800 group-hover:text-primary transition-colors">
                      Checkout & Mulai Rawat
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      Langsung tambahkan produk rekomendasi ke keranjang,
                      nikmati perhitungan ongkir Biteship akurat, dan bayar aman
                      instan lewat Mayar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="gsap-steps-cta mt-12 text-center">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-primary hover:bg-plum-600 text-white font-bold px-8 shadow-md transition-transform hover:scale-105 active:scale-95"
                >
                  <Link
                    href="/beauty-advisor"
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Coba Konsultasi Sekarang
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* 6. AI BEAUTY ADVISOR HIGHLIGHT BANNER (ALA AIRBNB EXPERIENCES) */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="gsap-advisor-banner relative overflow-hidden bg-gradient-to-br from-blush-100/90 via-pink-soft to-blush-200/50 border border-primary/25 rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-sm">
              <div className="max-w-xl flex flex-col gap-3 text-center lg:text-left z-10">
                <div className="inline-flex items-center justify-center lg:justify-start gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Konsultan Pribadi di Saku
                  Anda
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-800 tracking-tight">
                  Punya Pertanyaan Spesifik Tentang Skincare?
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tanyakan apa saja: kandungan AHA/BHA, cara layering serum
                  vitamin C dengan retinol, atau rekomendasi pelembap di bawah
                  50 ribu rupiah. AI kami siap menjawab kapan saja!
                </p>
              </div>

              <div className="z-10 shrink-0">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-primary hover:bg-plum-600 text-white font-bold px-8 py-6 shadow-md text-base transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg"
                >
                  <Link
                    href="/beauty-advisor"
                    className="flex items-center gap-2"
                  >
                    Buka AI Beauty Advisor <ChevronRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>

              {/* Ambient blur glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            </div>
          </section>
        </main>
      </GsapLandingWrapper>

      {/* 7. GLOBAL FOOTER */}
      <Footer />
    </div>
  );
}
