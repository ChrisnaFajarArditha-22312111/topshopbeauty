"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, ShoppingBag, Heart, User, ShoppingCart } from "lucide-react";
import { useCartCount } from "@/features/cart/useCart";
import { useAuth } from "@/features/auth/useAuth";

export function MobileNav() {
  const pathname = usePathname();
  const cartCount = useCartCount();
  const { isAuthenticated } = useAuth();

  const navItems = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/products", label: "Katalog", icon: ShoppingBag },
    { href: "/cart", label: "Keranjang", icon: ShoppingCart, badge: cartCount },
    { href: isAuthenticated ? "/profile" : "/login", label: "Akun", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border/80 md:hidden py-2 px-4 shadow-lg pb-safe">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-navy-800"
              }`}
            >
              <div className="p-1.5 rounded-full relative">
                <IconComponent className="w-6 h-6" />
                {item.badge ? (
                  <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center translate-x-1/4 -translate-y-1/4 shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
