import { TrackingInfo } from '@/features/orders/orderTypes';
import { Package, Truck, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TrackingTimelineProps {
  trackingData?: TrackingInfo;
  isLoading?: boolean;
}

export function TrackingTimeline({ trackingData, isLoading }: TrackingTimelineProps) {
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

  if (!trackingData || !trackingData.history || trackingData.history.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 font-medium">Belum ada data pelacakan</p>
        <p className="text-xs text-gray-500 mt-1">Status pengiriman akan diperbarui segera setelah kurir memproses paket Anda.</p>
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
                  {format(new Date(item.updated_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
