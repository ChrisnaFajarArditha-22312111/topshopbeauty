import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Truck,
  MessageCircle,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy-950 text-white mt-auto border-t border-navy-800">
      {/* VALUE PROPOSITION BADGES (CONSISTENT MONOCHROMATIC BRAND STYLE) */}
      <div className="border-b border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. REKOMENDASI AI */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-pink-300/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h4 className="font-bold text-sm text-white tracking-tight">
                Rekomendasi Cerdas AI
              </h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Analisis kebutuhan kulit personal & akurat
              </p>
            </div>
          </div>

          {/* 2. 100% PRODUK ORIGINAL */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-pink-300/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h4 className="font-bold text-sm text-white tracking-tight">
                100% Produk Original
              </h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Terkurasi resmi dari distributor terpercaya
              </p>
            </div>
          </div>

          {/* 3. PENGIRIMAN CEPAT & TERLACAK */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-pink-300/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h4 className="font-bold text-sm text-white tracking-tight">
                Pengiriman Cepat & Terlacak
              </h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Integrasi live tracking kurir via Biteship
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN FOOTER COLUMNS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* BRAND & ABOUT */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white border border-pink-200/40 p-0.5 shadow-sm shrink-0 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Logo Topshop Kosmetik"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="font-bold text-lg text-white">
              Topshop Kosmetik
            </span>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            Pusat belanja kosmetik dan skincare terpercaya di Bandar Lampung
            yang dilengkapi dengan teknologi kecerdasan buatan (AI Beauty
            Advisor) untuk konsultasi perawatan kulit Anda.
          </p>
          <div className="flex items-center gap-3 text-stone-400">
            <Link
              href="https://wa.me"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* TOKO & LOKASI */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
            Lokasi Toko
          </h4>
          <ul className="flex flex-col gap-2.5 text-xs text-stone-400">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                Jl. Raden Intan, Tanjung Karang Pusat, Kota Bandar Lampung,
                Lampung
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span>Setiap Hari: 08.00 - 21.00 WIB</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <span>+62 812-3456-7890</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <span>mail@topshopbeauty.cloud</span>
            </li>
          </ul>
        </div>

        {/* BELANJA & KATALOG */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
            Belanja
          </h4>
          <ul className="flex flex-col gap-2 text-xs text-stone-400">
            <li>
              <Link
                href="/products?category=Skincare"
                className="hover:text-white transition-colors"
              >
                Skincare & Perawatan Wajah
              </Link>
            </li>
            <li>
              <Link
                href="/products?category=Makeup"
                className="hover:text-white transition-colors"
              >
                Makeup & Kosmetik
              </Link>
            </li>
            <li>
              <Link
                href="/products?is_promo=true"
                className="hover:text-white transition-colors"
              >
                Promo & Diskon Terkini
              </Link>
            </li>
            <li>
              <Link
                href="/beauty-advisor"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Konsultasi AI
                Beauty Advisor
              </Link>
            </li>
          </ul>
        </div>

        {/* BANTUAN & PRIVASI */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
            Bantuan & Keamanan
          </h4>
          <ul className="flex flex-col gap-2 text-xs text-stone-400">
            <li>
              <Link
                href="/orders"
                className="hover:text-white transition-colors"
              >
                Lacak Status Pesanan
              </Link>
            </li>
            <li>
              <span className="text-stone-400">
                Pembayaran Online Aman (Mayar)
              </span>
            </li>
            <li>
              <span className="text-stone-400">
                Ekspedisi Logistik Terintegrasi (Biteship)
              </span>
            </li>
            <li>
              <Link
                href="/admin"
                className="text-stone-500 hover:text-stone-400 transition-colors"
              >
                Area Khusus Administrator Toko
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* COPYRIGHT BOTTOM BAR */}
      <div className="border-t border-white/10 py-6 text-center text-xs text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © {new Date().getFullYear()} Topshop Kosmetik Bandar Lampung. Hak
            Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
