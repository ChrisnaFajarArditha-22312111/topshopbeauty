"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  ShoppingBag,
  Heart,
  User,
  Menu,
  LogIn,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/useAuth";
import { useCartCount } from "@/features/cart/useCart";
import { useWishlistCount } from "@/features/cart/useWishlist";
export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();
  const [isScrolled, setIsScrolled] = React.useState<boolean>(false);
  const [isMounted, setIsMounted] = React.useState<boolean>(false);

  // Deteksi scroll dan pastikan komponen sudah mounted pada client untuk mencegah hydration mismatch
  React.useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const hasUser = isMounted && isAuthenticated && !!user;
  const displayCartCount = isMounted ? cartCount : 0;
  const displayWishlistCount = isMounted ? wishlistCount : 0;

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/products", label: "Katalog Produk" },
    { href: "/beauty-advisor", label: "Konsultasi AI", isAi: true },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled || pathname !== "/"
          ? "bg-white/95 backdrop-blur-md shadow-xs border-b border-border/60"
          : "bg-white/70 backdrop-blur-sm border-b border-border/40"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 rounded-full overflow-hidden bg-white border border-pink-200/80 shadow-xs flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
            <Image
              src="/logo.png"
              alt="Logo Topshop Kosmetik"
              width={44}
              height={44}
              priority
              className="object-contain p-0.5"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-['Playfair_Display'] font-bold text-xl tracking-tight text-primary leading-none">
              Topshop
            </span>
          </div>
        </Link>

        {/* NAVIGATION LINKS (DESKTOP) */}
        <nav className="hidden md:flex items-center gap-1 bg-white/80 border border-border/80 px-2 py-1.5 rounded-full shadow-xs">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : link.isAi
                      ? "text-primary hover:bg-blush-100"
                      : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {link.isAi && (
                  <Sparkles
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-primary-foreground"
                        : "text-primary animate-pulse"
                    }`}
                  />
                )}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-2">
          {/* Wishlist Button */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-full relative text-foreground/80 hover:text-foreground hover:bg-muted/80"
          >
            <Link href="/wishlist" aria-label="Lihat Wishlist">
              <Heart className="w-5 h-5" />
              {displayWishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {displayWishlistCount}
                </span>
              )}
            </Link>
          </Button>

          {/* Cart Button */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-full relative text-foreground/80 hover:text-foreground hover:bg-muted/80"
          >
            <Link href="/cart" aria-label="Lihat Keranjang">
              <ShoppingBag className="w-5 h-5" />
              {displayCartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {displayCartCount}
                </span>
              )}
            </Link>
          </Button>

          {/* User Account Menu */}
          {hasUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full gap-2 pl-2 pr-3.5 border-border/80 hover:bg-muted/60 h-10"
                >
                  <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold max-w-[90px] truncate">
                    {user.email.split("@")[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-2xl p-2 shadow-lg"
              >
                <DropdownMenuLabel className="font-semibold text-xs text-muted-foreground uppercase px-2 py-1.5 truncate">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                  <Link href="/profile">Profil Pengguna</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                  <Link href="/orders">Riwayat Pesanan</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                  <Link href="/addresses">Buku Alamat</Link>
                </DropdownMenuItem>
                {user.is_admin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      asChild
                      className="rounded-xl cursor-pointer text-primary font-bold"
                    >
                      <Link href="/admin">Portal Admin Toko</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="rounded-xl cursor-pointer text-destructive focus:text-destructive focus:bg-rose-50"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              className="rounded-full bg-primary hover:bg-rose-600 text-white text-xs font-bold h-10 px-4 shadow-xs gap-1.5"
            >
              <Link href="/login">
                <LogIn className="w-3.5 h-3.5" /> Masuk
              </Link>
            </Button>
          )}

          {/* Mobile Hamburger Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full"
                aria-label="Buka Menu"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-6 rounded-l-3xl">
              <SheetHeader className="text-left mb-6">
                <SheetTitle className="font-bold text-lg flex items-center gap-2.5">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden bg-white border border-pink-200/80 shadow-xs shrink-0 flex items-center justify-center">
                    <Image
                      src="/logo.png"
                      alt="Logo Topshop Kosmetik"
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                  </div>
                  <span>Topshop Kosmetik</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "text-foreground/80 hover:bg-muted"
                      }`}
                    >
                      {link.isAi && (
                        <Sparkles
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? "text-primary-foreground"
                              : "text-primary"
                          }`}
                        />
                      )}
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
                <hr className="my-2 border-border" />
                {hasUser ? (
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium bg-primary text-primary-foreground justify-center"
                  >
                    <User className="w-4 h-4" /> Profil Saya
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium bg-primary text-primary-foreground justify-center"
                  >
                    <LogIn className="w-4 h-4" /> Masuk Akun
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
