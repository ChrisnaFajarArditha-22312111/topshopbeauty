"use client";

import * as React from "react";
import { SlidersHorizontal, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils";

export interface FilterValues {
  category: string;
  brand: string;
  skinType: string;
  skinConcern: string;
  minPrice: string;
  maxPrice: string;
}

interface ProductFilterProps {
  values: FilterValues;
  onChange: (key: keyof FilterValues, value: string) => void;
  onApplyPrice: () => void;
  onReset: () => void;
  categoryOptions?: string[];
  skinTypeOptions?: string[];
  skinConcernOptions?: string[];
  brandOptions?: string[];
}

const DEFAULT_CATEGORIES = [
  "Semua Kategori",
  "Skincare",
  "Cleanser",
  "Toner",
  "Serum",
  "Moisturizer",
  "Sunscreen",
  "Makeup",
  "Lip Care",
  "Masker",
];

const DEFAULT_SKIN_TYPES = [
  "Semua Tipe",
  "Oily",
  "Dry",
  "Sensitive",
  "Combination",
  "Normal",
];

const DEFAULT_SKIN_CONCERNS = [
  "Semua Masalah",
  "Acne",
  "Dullness",
  "Dark Spots",
  "Hydration",
  "Enlarged Pores",
  "Anti-Aging",
  "Brightening",
];

const DEFAULT_BRANDS = [
  "Semua Brand",
  "Somethinc",
  "Skintific",
  "Wardah",
  "Garnier",
  "Avoskin",
  "COSRX",
  "The Originote",
  "Azarine",
  "Implora",
  "Emina",
];

function FilterChipGroup({
  label,
  options,
  selected,
  allLabel,
  onSelect,
  icon,
}: {
  label: string;
  options: string[];
  selected: string;
  allLabel: string;
  onSelect: (val: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold uppercase tracking-wider text-navy-800 flex items-center gap-1">
        {icon}
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const val = opt === allLabel ? "" : opt;
          const isSelected = (!selected && opt === allLabel) || selected === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(val)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                isSelected
                  ? "bg-primary text-white border-primary font-semibold shadow-2xs"
                  : "bg-white text-stone-600 border-border/80 hover:border-primary/40 hover:text-primary"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProductFilter({
  values,
  onChange,
  onApplyPrice,
  onReset,
  categoryOptions = DEFAULT_CATEGORIES,
  skinTypeOptions = DEFAULT_SKIN_TYPES,
  skinConcernOptions = DEFAULT_SKIN_CONCERNS,
  brandOptions = DEFAULT_BRANDS,
}: ProductFilterProps) {
  const hasActiveFilters =
    values.category || values.brand || values.skinType || values.skinConcern || values.minPrice || values.maxPrice;

  return (
    <div className="flex flex-col gap-5 text-left">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-sm text-navy-800 uppercase tracking-wider flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4 text-primary" /> Filter
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* 1. KATEGORI */}
      <FilterChipGroup
        label="Kategori"
        options={categoryOptions}
        selected={values.category}
        allLabel="Semua Kategori"
        onSelect={(val) => onChange("category", val)}
      />

      {/* 2. JENIS KULIT */}
      <div className="pt-4 border-t border-border/60">
        <FilterChipGroup
          label="Jenis Kulit"
          options={skinTypeOptions}
          selected={values.skinType}
          allLabel="Semua Tipe"
          onSelect={(val) => onChange("skinType", val)}
        />
      </div>

      {/* 3. MASALAH KULIT */}
      <div className="pt-4 border-t border-border/60">
        <FilterChipGroup
          label="Masalah Kulit"
          options={skinConcernOptions}
          selected={values.skinConcern}
          allLabel="Semua Masalah"
          onSelect={(val) => onChange("skinConcern", val)}
          icon={<Sparkles className="w-3.5 h-3.5 text-primary" />}
        />
      </div>

      {/* 4. BRAND */}
      <div className="pt-4 border-t border-border/60 flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-navy-800">Brand</label>
        <select
          value={values.brand}
          onChange={(e) => onChange("brand", e.target.value)}
          className="w-full text-xs font-medium rounded-xl border border-border/80 bg-white p-2.5 outline-none focus:border-primary cursor-pointer"
        >
          {brandOptions.map((brand) => (
            <option key={brand} value={brand === "Semua Brand" ? "" : brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      {/* 5. RENTANG HARGA */}
      <div className="pt-4 border-t border-border/60 flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-navy-800">
          Rentang Harga (Rp)
        </label>
        {/* QUICK PRICE PRESETS */}
        <div className="flex flex-wrap gap-1.5 mb-1">
          {[
            { label: "< 50rb", min: "", max: "50000" },
            { label: "50–100rb", min: "50000", max: "100000" },
            { label: "100–200rb", min: "100000", max: "200000" },
            { label: "> 200rb", min: "200000", max: "" },
          ].map(({ label, min, max }) => {
            const isSelected = values.minPrice === min && values.maxPrice === max;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  onChange("minPrice", min);
                  onChange("maxPrice", max);
                  setTimeout(onApplyPrice, 0);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                  isSelected
                    ? "bg-primary text-white border-primary font-semibold"
                    : "bg-white text-stone-600 border-border/80 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={values.minPrice}
            onChange={(e) => onChange("minPrice", e.target.value)}
            className="text-xs rounded-xl h-9"
          />
          <Input
            type="number"
            placeholder="Max"
            value={values.maxPrice}
            onChange={(e) => onChange("maxPrice", e.target.value)}
            className="text-xs rounded-xl h-9"
          />
        </div>
        {(values.minPrice || values.maxPrice) && (
          <p className="text-[10px] text-muted-foreground">
            {values.minPrice ? formatRupiah(Number(values.minPrice)) : "0"} –{" "}
            {values.maxPrice ? formatRupiah(Number(values.maxPrice)) : "Tanpa batas"}
          </p>
        )}
        <Button
          onClick={onApplyPrice}
          variant="outline"
          size="sm"
          className="rounded-full text-xs font-semibold mt-1 border-primary/40 text-primary hover:bg-blush-100"
        >
          Terapkan Harga
        </Button>
      </div>

      {/* RESET ALL */}
      <div className="pt-4 border-t border-border/60">
        <Button
          onClick={onReset}
          variant="ghost"
          size="sm"
          className="w-full text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-rose-50 gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Semua Filter
        </Button>
      </div>
    </div>
  );
}
