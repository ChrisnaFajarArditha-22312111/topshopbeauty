"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Ticket,
  Database,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";

const adminNavLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Manajemen Produk", icon: Package },
  { href: "/admin/orders", label: "Manajemen Pesanan", icon: ShoppingBag },
  { href: "/admin/customers", label: "Pelanggan", icon: Users },
  { href: "/admin/promotions", label: "Voucher Promosi", icon: Ticket },
  { href: "/admin/master-data", label: "Master Data", icon: Database },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Akses ditolak jika bukan admin
  if (!isLoading && (!isAuthenticated || !user?.is_admin)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4 text-primary">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Akses Terbatas (Admin Only)</h1>
        <p className="text-slate-500 max-w-md mb-6">
          Halaman ini khusus untuk administrator Toko Topshop Kosmetik. Silakan masuk menggunakan akun admin Anda.
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
          <Button asChild className="rounded-full bg-primary hover:bg-rose-600 text-white">
            <Link href="/login?redirect=/admin">Masuk Akun Admin</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50/60">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#17243D] text-white shrink-0 sticky top-0 h-screen z-30 shadow-xl border-r border-slate-800">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center shrink-0">
            <Image src="/logo.png" alt="Logo Topshop" width={36} height={36} className="object-contain" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white leading-none block">Topshop Admin</span>
            <span className="text-[11px] text-pink-300 font-medium mt-0.5 block">Backoffice Portal</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {adminNavLinks.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-white font-semibold shadow-md shadow-rose-900/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Kembali ke Toko Publik</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Admin</span>
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative w-64 bg-[#17243D] text-white flex flex-col h-full z-10 shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-full bg-white p-0.5" />
                <span className="font-bold text-sm">Topshop Admin</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(false)}
                className="text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
              {adminNavLinks.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive ? "bg-primary text-white font-semibold" : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800 space-y-2">
              <Link href="/" className="flex items-center gap-2 text-xs text-slate-300 py-1.5">
                <ArrowLeft className="w-4 h-4" /> Ke Toko Publik
              </Link>
              <button onClick={logout} className="flex items-center gap-2 text-xs text-rose-400 py-1.5">
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-primary border border-rose-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                ADMIN PORTAL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block truncate max-w-[150px]">
                {user?.email}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold uppercase">Superadmin</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center ring-2 ring-rose-200">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16">{children}</main>
      </div>
    </div>
  );
}
