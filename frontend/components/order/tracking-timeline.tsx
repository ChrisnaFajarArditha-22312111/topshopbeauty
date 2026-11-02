import { TrackingInfo } from '@/features/orders/orderTypes';
import { Package, Truck, CheckCircle } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const TRACKING_STATUS_LABELS: Record<string, string> = {
  confirmed: 'Pengiriman dikonfirmasi', allocated: 'Kurir ditugaskan',
  picking_up: 'Kurir menuju penjemputan', picked: 'Paket dijemput kurir',
  in_transit: 'Dalam perjalanan', dropping_off: 'Sedang diantar',
  delivered: 'Paket diterima', on_hold: 'Pengiriman tertunda',
  return_in_transit: 'Dalam proses pengembalian', returned: 'Dikembalikan',
  cancelled: 'Pengiriman dibatalkan', rejected: 'Paket ditolak', courier_not_found: 'Kurir belum ditemukan',
};

interface TrackingTimelineProps {
  trackingData?: TrackingInfo;
  isLoading?: boolean;
  isError?: boolean;
}

export function TrackingTimeline({ trackingData, isLoading, isError }: TrackingTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-4 h-4 bg-gray-200 rounded-full mt-1"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <p role="alert" className="text-sm text-destructive">Gagal memuat pelacakan. Silakan coba lagi dengan tombol di bawah.</p>;
  }
  if (!trackingData || trackingData.data_state !== 'available' || !trackingData.history?.length) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 font-medium">{trackingData?.data_state === 'awaiting_waybill' ? 'Pesanan sedang disiapkan' : trackingData?.data_state === 'unavailable' ? 'Pelacakan belum dapat diakses' : 'Belum ada riwayat pelacakan'}</p>
        <p className="text-xs text-gray-500 mt-1">{trackingData?.message || 'Riwayat akan muncul setelah data diterima dari kurir.'}</p>
        {trackingData?.data_state === 'available' && trackingData.status && <p className="text-sm font-medium mt-2">Status kurir: {TRACKING_STATUS_LABELS[trackingData.status] || trackingData.status}</p>}
        {trackingData?.tracking_number && <p className="text-xs text-gray-500 mt-2">Resi: {trackingData.tracking_number} · {trackingData.courier_name}</p>}
      </div>
    );
  }

  const { history, courier_name, tracking_number } = trackingData;

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">Kurir Pengiriman</p>
          <p className="font-semibold text-gray-900">{courier_name || 'Kurir'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">Nomor Resi</p>
          <p className="font-semibold text-gray-900">{tracking_number}</p>
        </div>
      </div>

      {trackingData.status && <p className="text-sm font-semibold">Status kurir: {TRACKING_STATUS_LABELS[trackingData.status] || trackingData.status}</p>}
      <p className="text-xs text-gray-500">Sumber: data kurir melalui Biteship. Diperiksa {isValid(new Date(trackingData.checked_at)) ? format(new Date(trackingData.checked_at), 'dd MMM yyyy, HH:mm', { locale: id }) : 'waktu belum tersedia'}.</p>
      <div className="relative pl-6 border-l-2 border-gray-100 space-y-6">
        {history.map((item, index) => {
          const isLatest = index === 0;
          
          let Icon = Package;
          if (item.status === 'delivered') Icon = CheckCircle;
          else if (item.status === 'in_transit') Icon = Truck;

          return (
            <div key={index} className="relative">
              <span className={cn(
                "absolute -left-[35px] flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white",
                isLatest ? "border-rose-500 text-rose-500 shadow-sm" : "border-gray-200 text-gray-400"
              )}>
                <Icon className="h-4 w-4" />
                {isLatest && (
                  <span className="absolute -inset-1 animate-ping rounded-full border-2 border-rose-500 opacity-20"></span>
                )}
              </span>
              <div className="flex flex-col">
                <p className={cn("text-sm font-medium", isLatest ? "text-gray-900" : "text-gray-600")}>
                  {item.note}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {isValid(new Date(item.updated_at)) ? format(new Date(item.updated_at), 'dd MMM yyyy, HH:mm', { locale: id }) : 'Waktu belum tersedia'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
