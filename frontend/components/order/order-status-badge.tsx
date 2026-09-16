import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/features/orders/orderTypes';
import { Clock, CheckCircle, Package, Truck, XCircle, CreditCard, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  let label = '';
  let colorClass = '';
  let Icon = Clock;

  switch (status) {
    case 'pending':
      label = 'Menunggu Pembayaran';
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = Clock;
      break;
    case 'paid':
      label = 'Sudah Dibayar';
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      Icon = CreditCard;
      break;
    case 'processing':
      label = 'Sedang Diproses';
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      Icon = Package;
      break;
    case 'shipped':
      label = 'Sedang Dikirim';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
      Icon = Truck;
      break;
    case 'delivered':
    case 'completed':
      label = 'Selesai';
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      Icon = CheckCircle;
      break;
    case 'cancelled':
      label = 'Dibatalkan';
      colorClass = 'bg-stone-100 text-stone-600 border-stone-200';
      Icon = XCircle;
      break;
    case 'refunded':
      label = 'Dikembalikan';
      colorClass = 'bg-stone-100 text-stone-600 border-stone-200';
      Icon = RotateCcw;
      break;
    default:
      label = status;
      colorClass = 'bg-gray-50 text-gray-700 border-gray-200';
      Icon = Clock;
  }

  return (
    <Badge variant="outline" className={cn("flex w-fit items-center gap-1.5 px-2.5 py-1 text-xs font-medium", colorClass, className)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}
