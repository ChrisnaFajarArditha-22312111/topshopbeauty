'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useCreateReview } from '@/features/orders/useOrders';
import { cn } from '@/lib/utils';
import { OrderItem } from '@/features/orders/orderTypes';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItem: OrderItem | null;
}

export function ReviewModal({ isOpen, onClose, orderItem }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  
  const createReview = useCreateReview();

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setComment('');
    setPhotoUrl('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderItem || rating === 0) return;

    createReview.mutate({
      order_item_id: orderItem.id,
      rating,
      comment: comment.trim() || undefined,
      photo_url: photoUrl.trim() || undefined
    }, {
      onSuccess: () => {
        handleClose();
      }
    });
  };

  if (!orderItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Beri Ulasan Produk</DialogTitle>
          <DialogDescription>
            Bagaimana pengalaman Anda menggunakan {orderItem.product_name}?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="flex flex-col items-center gap-2">
            <Label className="text-sm font-medium">Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-sm"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      (hoverRating || rating) >= star
                        ? "fill-amber-400 text-amber-400"
                        : "fill-transparent text-gray-300"
                    )}
                  />
                </button>
              ))}
            </div>
            {rating === 0 && <p className="text-xs text-rose-500">Pilih minimal 1 bintang</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Komentar (Opsional)</Label>
            <Textarea
              id="comment"
              placeholder="Ceritakan kepuasan Anda terhadap produk ini..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">URL Foto (Opsional)</Label>
            <Input
              id="photo"
              placeholder="https://example.com/photo.jpg"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              type="url"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={createReview.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={rating === 0 || createReview.isPending} className="bg-rose-600 hover:bg-rose-700">
              {createReview.isPending ? 'Mengirim...' : 'Kirim Ulasan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
