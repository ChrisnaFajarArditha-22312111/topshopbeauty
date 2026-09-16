"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ChevronDown,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Navbar } from "@/components/layout/navbar";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductFilter, FilterValues } from "@/components/product/product-filter";
import { useProducts } from "@/features/products/useProducts";
import { formatRupiah } from "@/lib/utils";



const sortLabels: Record<string, string> = {
  terlaris: "Paling Terlaris",
  termurah: "Harga Terendah",
  termahal: "Harga Tertinggi",
  rating: "Rating Tertinggi",
  terbaru: "Produk Terbaru",
};

function ProductsCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const qParam = searchParams.get("search") || searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const brandParam = searchParams.get("brand") || "";
  const skinTypeParam = searchParams.get("skin_type") || "";
  const skinConcernParam = searchParams.get("skin_concern") || "";
  const minPriceParam = searchParams.get("min_price") || "";
  const maxPriceParam = searchParams.get("max_price") || "";
  const sortByParam = searchParams.get("sort_by") || "terlaris";
  const pageParam = parseInt(searchParams.get("page") || "1");

  // Local filter states (synced with URL on mount)
  const [searchQuery, setSearchQuery] = React.useState(qParam);
  const [sortBy, setSortBy] = React.useState(sortByParam);
  const [page, setPage] = React.useState(pageParam);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = React.useState(false);

  // Filter values object
  const [filterValues, setFilterValues] = React.useState<FilterValues>({
    category: categoryParam,
    brand: brandParam,
    skinType: skinTypeParam,
    skinConcern: skinConcernParam,
    minPrice: minPriceParam,
    maxPrice: maxPriceParam,
  });

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update URL search parameters
  const applyFilters = (overrides: Partial<Record<string, string | number | undefined>> = {}) => {
    const params = new URLSearchParams();

    const q = overrides.q !== undefined ? String(overrides.q) : searchQuery;
    const cat = overrides.category !== undefined ? String(overrides.category) : filterValues.category;
    const brd = overrides.brand !== undefined ? String(overrides.brand) : filterValues.brand;
    const st = overrides.skin_type !== undefined ? String(overrides.skin_type) : filterValues.skinType;
    const sc = overrides.skin_concern !== undefined ? String(overrides.skin_concern) : filterValues.skinConcern;
    const minP = overrides.min_price !== undefined ? String(overrides.min_price) : filterValues.minPrice;
    const maxP = overrides.max_price !== undefined ? String(overrides.max_price) : filterValues.maxPrice;
    const sort = overrides.sort_by !== undefined ? String(overrides.sort_by) : sortBy;
    const pg = overrides.page !== undefined ? Number(overrides.page) : 1; // always reset page on filter change

    if (q.trim()) params.set("search", q.trim());
    if (cat) params.set("category", cat);
    if (brd) params.set("brand", brd);
    if (st) params.set("skin_type", st);
    if (sc) params.set("skin_concern", sc);
    if (minP) params.set("min_price", minP);
    if (maxP) params.set("max_price", maxP);
    if (sort && sort !== "terlaris") params.set("sort_by", sort);
    if (pg > 1) params.set("page", String(pg));

    router.push(`/products?${params.toString()}`);
  };

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    const updated = { ...filterValues, [key]: value };
    setFilterValues(updated);

    // Apply immediately for chips/dropdown (not for price text inputs)
    if (key !== "minPrice" && key !== "maxPrice") {
      const overrideMap: Record<keyof FilterValues, string> = {
        category: "category",
        brand: "brand",
        skinType: "skin_type",
        skinConcern: "skin_concern",
        minPrice: "min_price",
        maxPrice: "max_price",
      };
      applyFilters({ [overrideMap[key]]: value });
    }
  };

  const handleApplyPrice = () => {
    applyFilters({
      min_price: filterValues.minPrice,
      max_price: filterValues.maxPrice,
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: searchQuery, page: 1 });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterValues({ category: "", brand: "", skinType: "", skinConcern: "", minPrice: "", maxPrice: "" });
    setSortBy("terlaris");
    setPage(1);
    router.push("/products");
    setIsMobileFilterOpen(false);
  };

  const [isPageChanging, setIsPageChanging] = React.useState(false);

  // Sync page state when URL changes (e.g. browser back/forward or pagination)
  React.useEffect(() => {
    setPage(pageParam);
  }, [pageParam]);

  // Fetch products from backend
  const { data, isLoading, isFetching } = useProducts({
    q: qParam || undefined,
    category: categoryParam || undefined,
    brand: brandParam || undefined,
    skin_type: skinTypeParam || undefined,
    skin_concern: skinConcernParam || undefined,
    min_price: minPriceParam ? Number(minPriceParam) : undefined,
    max_price: maxPriceParam ? Number(maxPriceParam) : undefined,
    sort_by: (sortByParam as "terlaris" | "termurah" | "termahal" | "rating" | "terbaru") || "terlaris",
    page: pageParam,
    page_size: 20,
  });

  const isGridLoading = isLoading || isFetching || isPageChanging;

  const handlePageChange = (newPage: number) => {
    if (newPage === page || newPage < 1 || newPage > totalPages) return;
    setIsPageChanging(true);
    setPage(newPage);
    applyFilters({ page: newPage });
    window.scrollTo({ top: 180, behavior: "smooth" });
    setTimeout(() => {
      setIsPageChanging(false);
    }, 450);
  };

  const products = data?.items || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  // Active filter chips
  const activeFilters = [
    qParam && { key: "search", label: `Cari: "${qParam}"`, onRemove: () => applyFilters({ q: "" }) },
    categoryParam && {
      key: "category",
      label: categoryParam,
      onRemove: () => {
        setFilterValues((f) => ({ ...f, category: "" }));
        applyFilters({ category: "" });
      },
    },
    brandParam && {
      key: "brand",
      label: brandParam,
      onRemove: () => {
        setFilterValues((f) => ({ ...f, brand: "" }));
        applyFilters({ brand: "" });
      },
    },
    skinTypeParam && {
      key: "skin_type",
      label: `Kulit: ${skinTypeParam}`,
      onRemove: () => {
        setFilterValues((f) => ({ ...f, skinType: "" }));
        applyFilters({ skin_type: "" });
      },
    },
    skinConcernParam && {
      key: "skin_concern",
      label: `Masalah: ${skinConcernParam}`,
      onRemove: () => {
        setFilterValues((f) => ({ ...f, skinConcern: "" }));
        applyFilters({ skin_concern: "" });
      },
    },
    (minPriceParam || maxPriceParam) && {
      key: "price",
      label: `Harga: ${minPriceParam ? formatRupiah(Number(minPriceParam)) : "0"} - ${
        maxPriceParam ? formatRupiah(Number(maxPriceParam)) : "Maks"
      }`,
      onRemove: () => {
        setFilterValues((f) => ({ ...f, minPrice: "", maxPrice: "" }));
        applyFilters({ min_price: "", max_price: "" });
      },
    },
  ].filter(Boolean) as Array<{ key: string; label: string; onRemove: () => void }>;

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-blush-100 selection:text-primary">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
          <span className="text-stone-300 mx-1">/</span>
          <span className="text-navy-800 font-semibold">Katalog Produk</span>
        </nav>

        {/* PAGE TITLE */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-navy-800 tracking-tight">Semua Produk</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Temukan kosmetik & skincare terbaik yang cocok untuk kulit Anda
          </p>
        </div>

        {/* SEARCH + SORT HEADER BAR */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border/60">
          {/* SEARCH BAR */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari skincare, serum, sunscreen, brand..."
              className="pl-10 pr-14 rounded-full h-11 text-sm bg-white border-border/80 shadow-xs focus-visible:ring-primary"
            />
            <kbd className="hidden sm:inline-block absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border select-none">
              /
            </kbd>
          </form>

          {/* CONTROLS: SORT + MOBILE FILTER */}
          <div className="flex items-center justify-between md:justify-end gap-3">
            {/* MOBILE FILTER SHEET TRIGGER */}
            <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="md:hidden rounded-full border-border/80 gap-1.5 text-xs font-semibold h-10 px-4"
                >
                  <Filter className="w-4 h-4 text-primary" /> Filter
                  {activeFilters.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                      {activeFilters.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[360px] p-6 overflow-y-auto">
                <SheetHeader className="mb-4 text-left">
                  <SheetTitle className="text-lg font-extrabold text-navy-800">Filter Produk</SheetTitle>
                </SheetHeader>
                <ProductFilter
                  values={filterValues}
                  onChange={handleFilterChange}
                  onApplyPrice={handleApplyPrice}
                  onReset={handleResetFilters}
                />
              </SheetContent>
            </Sheet>

            {/* SORTING DROPDOWN */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-muted-foreground font-medium">Urutkan:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full border-border/80 gap-1.5 text-xs font-semibold h-10 px-4"
                  >
                    <span>{sortLabels[sortBy] || "Paling Terlaris"}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5 shadow-md">
                  {Object.entries(sortLabels).map(([key, label]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => {
                        setSortBy(key);
                        applyFilters({ sort_by: key });
                      }}
                      className={`text-xs rounded-xl cursor-pointer ${
                        sortBy === key ? "font-bold text-primary bg-blush-100/60" : ""
                      }`}
                    >
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* ACTIVE FILTER CHIPS */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span className="text-xs text-muted-foreground font-medium">Filter Aktif:</span>
            {activeFilters.map((af) => (
              <Badge
                key={af.key}
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs gap-1.5 bg-blush-100 text-primary border border-primary/20 font-medium"
              >
                {af.label}
                <button
                  type="button"
                  onClick={af.onRemove}
                  className="hover:text-destructive rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            <button
              onClick={handleResetFilters}
              type="button"
              className="text-xs font-bold text-primary hover:underline ml-1"
            >
              Hapus Semua
            </button>
          </div>
        )}

        {/* MAIN BODY: SIDEBAR + GRID */}
        <div className="flex items-start gap-8">
          {/* DESKTOP SIDEBAR FILTER */}
          <aside className="hidden md:block w-64 shrink-0 bg-white rounded-3xl p-6 border border-border/80 shadow-xs sticky top-24">
            <ProductFilter
              values={filterValues}
              onChange={handleFilterChange}
              onApplyPrice={handleApplyPrice}
              onReset={handleResetFilters}
            />
          </aside>

          {/* PRODUCT CATALOG GRID */}
          <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
            {/* RESULT COUNT */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Menampilkan <strong className="text-navy-900">{products.length}</strong> dari{" "}
                <strong className="text-navy-900">{totalItems}</strong> produk
              </span>
              <span className="text-stone-400">
                Halaman {page} dari {totalPages}
              </span>
            </div>

            {/* PRODUCT GRID with loading/empty states */}
            <ProductGrid
              products={products}
              isLoading={isGridLoading}
              skeletonCount={8}
              onResetFilters={handleResetFilters}
            />

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-border/60 mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1 || isGridLoading}
                  onClick={() => handlePageChange(page - 1)}
                  className="rounded-full w-9 h-9 disabled:opacity-40"
                  aria-label="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pg = idx + 1;
                  if (pg === 1 || pg === totalPages || (pg >= page - 1 && pg <= page + 1)) {
                    return (
                      <Button
                        key={pg}
                        variant={page === pg ? "default" : "outline"}
                        disabled={isGridLoading}
                        onClick={() => handlePageChange(pg)}
                        className={`w-9 h-9 rounded-full text-xs font-semibold transition-all ${
                          page === pg
                            ? "bg-primary text-white shadow-xs scale-105"
                            : "hover:border-primary/40 hover:text-primary"
                        } disabled:opacity-60`}
                      >
                        {pg}
                      </Button>
                    );
                  }
                  if (pg === page - 2 || pg === page + 2) {
                    return (
                      <span key={pg} className="px-1 text-xs text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages || isGridLoading}
                  onClick={() => handlePageChange(page + 1)}
                  className="rounded-full w-9 h-9 disabled:opacity-40"
                  aria-label="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ProductsCatalogContent />
    </React.Suspense>
  );
}
