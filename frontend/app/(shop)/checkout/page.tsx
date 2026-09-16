"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Check, 
  MapPin, 
  Truck, 
  Ticket, 
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/useAuth";
import { useCart } from "@/features/cart/useCart";
import { checkoutApi } from "@/features/checkout/checkoutApi";
import { 
  CourierOptionResponse, 
  CheckoutPreviewResponse, 
  VoucherResponse,
  ValidateVoucherResponse
} from "@/features/checkout/checkoutTypes";
import { formatRupiah } from "@/lib/utils";
import api from "@/lib/axios";

// Dummy address type since address feature might not be fully available
interface Address {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  full_address: string;
  city: string;
  is_primary: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { data: cart, isLoading: isLoadingCart } = useCart();
  
  const [step, setStep] = useState(1);
  
  // State for addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  // State for shipping
  const [shippingRates, setShippingRates] = useState<CourierOptionResponse[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<{courier_code: string, service_code: string} | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);

  // State for vouchers & notes
  const [voucherCode, setVoucherCode] = useState("");
  const [validatedVoucher, setValidatedVoucher] = useState<ValidateVoucherResponse | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const [customerNotes, setCustomerNotes] = useState("");

  // State for preview & create
  const [checkoutPreview, setCheckoutPreview] = useState<CheckoutPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Fetch Addresses
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchAddresses = async () => {
      try {
        const { data } = await api.get('/addresses');
        const userAddresses: Address[] = Array.isArray(data) ? data : (data?.data ?? []);
        setAddresses(userAddresses);
        
        const primary = userAddresses.find((a: Address) => a.is_primary);
        if (primary) setSelectedAddressId(primary.id);
        else if (userAddresses.length > 0) setSelectedAddressId(userAddresses[0].id);
      } catch (error) {
        toast.error("Gagal memuat alamat. Anda bisa menambah alamat di halaman Profil.");
      } finally {
        setIsLoadingAddresses(false);
      }
    };
    
    fetchAddresses();
  }, [isAuthenticated]);

  // Step 2: Fetch Shipping Rates when address is selected
  const loadShippingRates = async () => {
    if (!selectedAddressId) {
      toast.error("Pilih alamat pengiriman terlebih dahulu");
      return;
    }
    
    setIsLoadingShipping(true);
    try {
      const rates = await checkoutApi.getShippingRates(selectedAddressId);
      setShippingRates(rates);
      setStep(2);
    } catch (error) {
      toast.error("Gagal memuat opsi pengiriman. Silakan coba lagi.");
    } finally {
      setIsLoadingShipping(false);
    }
  };

  // Step 3: Handle Voucher Validation
  const handleValidateVoucher = async () => {
    if (!voucherCode) return;
    if (!cart?.total_price) return;
    
    setIsValidatingVoucher(true);
    try {
      const response = await checkoutApi.validateVoucher({
        code: voucherCode,
        subtotal: cart.total_price
      });
      
      if (response.is_valid) {
        setValidatedVoucher(response);
        toast.success(`Voucher berhasil digunakan! Diskon: ${formatRupiah(response.discount_amount)}`);
      } else {
        toast.error(response.message || "Voucher tidak valid");
        setValidatedVoucher(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memvalidasi voucher");
      setValidatedVoucher(null);
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  // Step 4: Load Preview
  const loadPreview = async () => {
    if (!selectedAddressId || !selectedShipping) return;
    
    setIsLoadingPreview(true);
    try {
      const preview = await checkoutApi.previewCheckout({
        address_id: selectedAddressId,
        courier_code: selectedShipping.courier_code,
        service_code: selectedShipping.service_code,
        voucher_code: validatedVoucher?.code || undefined
      });
      setCheckoutPreview(preview);
      setStep(4);
    } catch (error) {
      toast.error("Gagal memuat rincian pesanan.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handle Create Order
  const handleCreateOrder = async () => {
    if (!selectedAddressId || !selectedShipping) return;
    
    setIsSubmitting(true);
    try {
      const order = await checkoutApi.createOrder({
        address_id: selectedAddressId,
        courier_code: selectedShipping.courier_code,
        service_code: selectedShipping.service_code,
        voucher_code: validatedVoucher?.code || undefined,
        customer_notes: customerNotes || undefined
      });
      
      // Jika tersedia URL pembayaran Mayar, langsung alihkan ke gateway pembayaran Mayar
      if (order.payment?.mayar_payment_url) {
        toast.success("Pesanan dibuat! Mengalihkan ke portal pembayaran Mayar...");
        window.location.href = order.payment.mayar_payment_url;
        return;
      }

      toast.success("Pesanan berhasil dibuat!");
      router.push(`/checkout/success?order_id=${order.id}`);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Terjadi kesalahan saat membuat pesanan.";
      toast.error(errorMsg);
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || isLoadingCart) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <Check className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-navy-900 mb-2">Keranjang Kosong</h2>
        <p className="text-muted-foreground mb-6">Tidak ada produk untuk dicheckout.</p>
        <Button asChild onClick={() => router.push('/products')}>
          <span>Kembali Belanja</span>
        </Button>
      </div>
    );
  }

  // Calculate temp totals for sidebar
  const tempSubtotal = cart.total_price;
  const tempShipping = selectedShipping ? shippingRates.find(r => r.service_code === selectedShipping.service_code)?.price || 0 : 0;
  const tempDiscount = validatedVoucher ? validatedVoucher.discount_amount : 0;
  const tempGrandTotal = tempSubtotal + tempShipping - tempDiscount;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[80vh]">
      <h1 className="text-3xl font-bold text-navy-900 mb-8">Checkout</h1>

      {/* Step Indicators */}
      <div className="flex items-center mb-8 overflow-x-auto pb-4 hide-scrollbar">
        {[
          { num: 1, label: "Alamat", icon: MapPin },
          { num: 2, label: "Pengiriman", icon: Truck },
          { num: 3, label: "Voucher", icon: Ticket },
          { num: 4, label: "Konfirmasi", icon: ShieldCheck },
        ].map((s, i) => (
          <React.Fragment key={s.num}>
            <div className={`flex items-center gap-2 shrink-0 ${step >= s.num ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                step >= s.num ? "border-primary bg-primary/10" : "border-muted-foreground/30 bg-muted/30"
              }`}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`font-semibold text-sm hidden sm:inline-block ${step >= s.num ? "text-navy-900" : ""}`}>
                {s.label}
              </span>
            </div>
            {i < 3 && (
              <div className={`w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 shrink-0 ${step > s.num ? "bg-primary" : "bg-border"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: ADDRESS */}
          {step === 1 && (
            <div className="bg-white p-6 rounded-3xl border border-border/60 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
                <MapPin className="text-primary w-5 h-5" /> Pilih Alamat Pengiriman
              </h2>
              
              {isLoadingAddresses ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-2xl">
                  <p className="text-muted-foreground mb-4">Anda belum memiliki alamat tersimpan.</p>
                  <Button asChild variant="outline">
                    <Link href="/addresses?redirect=/checkout">Tambah Alamat Baru</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div 
                      key={address.id}
                      onClick={() => setSelectedAddressId(address.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedAddressId === address.id 
                          ? "border-primary bg-blush-50 shadow-sm" 
                          : "border-border/60 hover:border-primary/50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy-900">{address.label}</span>
                          {address.is_primary && (
                            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Utama</span>
                          )}
                        </div>
                        {selectedAddressId === address.id && (
                          <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <p className="font-semibold text-sm mb-1">{address.recipient_name} | {address.phone}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{address.full_address}, {address.city}</p>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-8 flex justify-end">
                <Button 
                  onClick={loadShippingRates} 
                  disabled={!selectedAddressId || isLoadingShipping}
                  className="rounded-full px-8"
                >
                  {isLoadingShipping ? "Memuat..." : "Lanjut Pilih Kurir"} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: SHIPPING */}
          {step === 2 && (
            <div className="bg-white p-6 rounded-3xl border border-border/60 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
                <Truck className="text-primary w-5 h-5" /> Pilih Opsi Pengiriman
              </h2>
              
              <div className="space-y-4">
                {shippingRates.map((rate, idx) => (
                  <div 
                    key={`${rate.courier_code}-${rate.service_code}-${idx}`}
                    onClick={() => setSelectedShipping({ courier_code: rate.courier_code, service_code: rate.service_code })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      selectedShipping?.service_code === rate.service_code 
                        ? "border-primary bg-blush-50 shadow-sm" 
                        : "border-border/60 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden p-1 shrink-0 border border-border/40">
                        {(() => {
                          const code = rate.courier_code.toLowerCase();
                          const logos: Record<string, string> = {
                            jne: "/couriers/jne.webp",
                            jnt: "/couriers/jnt.webp",
                            sicepat: "/couriers/sicepat.webp",
                          };
                          return logos[code]
                            ? <Image src={logos[code]} alt={rate.courier_name} width={88} height={56} className="object-contain w-full h-full" />
                            : <span className="font-bold text-xs uppercase text-center leading-tight">{rate.courier_name}</span>;
                        })()}
                      </div>
                      <div>
                        <p className="font-bold text-navy-900">{rate.service_name}</p>
                        <p className="text-sm text-muted-foreground">Estimasi: {rate.etd}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <span className="font-bold text-primary">{formatRupiah(rate.price)}</span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedShipping?.service_code === rate.service_code ? "bg-primary border-primary text-white" : "border-muted-foreground/30"
                      }`}>
                        {selectedShipping?.service_code === rate.service_code && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex justify-between items-center">
                <Button variant="ghost" onClick={() => setStep(1)} className="rounded-full">Kembali</Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={!selectedShipping}
                  className="rounded-full px-8"
                >
                  Lanjut <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: VOUCHER & NOTES */}
          {step === 3 && (
            <div className="bg-white p-6 rounded-3xl border border-border/60 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
                <Ticket className="text-primary w-5 h-5" /> Voucher & Catatan
              </h2>
              
              <div className="mb-8">
                <label className="block text-sm font-semibold text-navy-900 mb-2">Kode Voucher (Opsional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Masukkan kode voucher"
                    className="flex-1 rounded-xl border border-border px-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleValidateVoucher}
                    disabled={!voucherCode || isValidatingVoucher}
                    className="rounded-xl border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    {isValidatingVoucher ? "Mengecek..." : "Pakai"}
                  </Button>
                </div>
                {validatedVoucher && (
                  <p className="mt-2 text-sm text-emerald-600 font-medium flex items-center gap-1">
                    <Check className="w-4 h-4" /> Voucher valid! Diskon {formatRupiah(validatedVoucher.discount_amount)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-900 mb-2">Catatan untuk Penjual (Opsional)</label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Contoh: Tolong packing dengan aman ya..."
                  rows={3}
                  className="w-full rounded-xl border border-border px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              
              <div className="mt-8 flex justify-between items-center">
                <Button variant="ghost" onClick={() => setStep(2)} className="rounded-full">Kembali</Button>
                <Button 
                  onClick={loadPreview} 
                  disabled={isLoadingPreview}
                  className="rounded-full px-8"
                >
                  {isLoadingPreview ? "Memuat Ringkasan..." : "Konfirmasi Pesanan"} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRMATION */}
          {step === 4 && (
            <div className="bg-white p-6 rounded-3xl border border-border/60 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
                <Check className="text-primary w-5 h-5" /> Konfirmasi Pesanan
              </h2>
              
              {checkoutPreview ? (
                <div className="space-y-6">
                  {/* Address Summary */}
                  <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                    <h3 className="text-sm font-bold text-navy-900 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> Alamat Pengiriman</h3>
                    <p className="text-sm">{addresses.find(a => a.id === selectedAddressId)?.full_address}</p>
                  </div>

                  {/* Shipping Summary */}
                  <div className="p-4 bg-muted/30 rounded-2xl border border-border flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-navy-900 mb-1 flex items-center gap-2"><Truck className="w-4 h-4" /> Pengiriman</h3>
                      <p className="text-sm text-muted-foreground uppercase">{selectedShipping?.courier_code} - {selectedShipping?.service_code}</p>
                    </div>
                    <span className="font-bold text-navy-900">{formatRupiah(checkoutPreview.shipping_cost)}</span>
                  </div>

                  {/* Items List */}
                  <div>
                    <h3 className="text-sm font-bold text-navy-900 mb-3">Produk yang dibeli</h3>
                    <div className="space-y-3">
                      {cart.items.map(item => (
                        <div key={item.id} className="flex gap-3 py-2 border-b border-border/50 last:border-0">
                          <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden relative shrink-0">
                            {item.foto_utama && <Image src={item.foto_utama} alt={item.nama_produk} fill className="object-cover" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-1">{item.nama_produk}</p>
                            <p className="text-xs text-muted-foreground">{item.quantity} x {formatRupiah(item.harga)}</p>
                          </div>
                          <p className="text-sm font-bold">{formatRupiah(item.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Skeleton className="h-64 w-full rounded-2xl" />
              )}
              
              <div className="mt-8 flex justify-between items-center pt-6 border-t border-border">
                <Button variant="ghost" onClick={() => setStep(3)} className="rounded-full">Kembali</Button>
                <Button 
                  onClick={handleCreateOrder} 
                  disabled={isSubmitting}
                  className="rounded-full px-8 bg-primary hover:bg-primary/90 text-white font-bold"
                  size="lg"
                >
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  {isSubmitting ? "Memproses..." : "Bayar Sekarang"}
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* SIDEBAR SUMMARY */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-border/60 shadow-sm sticky top-28">
            <h3 className="text-lg font-bold text-navy-900 mb-4">Ringkasan Pesanan</h3>
            
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Total Item</span>
                <span>{cart.total_items} Barang</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal Produk</span>
                <span className="font-semibold">{formatRupiah(tempSubtotal)}</span>
              </div>
              
              {tempShipping > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Biaya Pengiriman</span>
                  <span className="font-semibold">{formatRupiah(tempShipping)}</span>
                </div>
              )}
              
              {tempDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon Voucher</span>
                  <span className="font-semibold">-{formatRupiah(tempDiscount)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-lg text-navy-900 border-t border-border pt-4 mt-2">
                <span>Total Tagihan</span>
                <span className="text-primary">{formatRupiah(tempGrandTotal)}</span>
              </div>
            </div>

            <div className="bg-blush-50 rounded-xl p-4 text-xs text-primary/80 flex gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <p>Pembayaran 100% aman dan terenkripsi menggunakan payment gateway resmi.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
