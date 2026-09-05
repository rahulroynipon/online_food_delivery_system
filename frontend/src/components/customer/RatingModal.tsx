import React, { useState } from 'react';
import { Modal, Button, Textarea, toast } from '../../design-system';
import { Star, Store, Bike, Utensils, Sparkles, Check, ThumbsUp, Heart } from 'lucide-react';
import api from '../../lib/axios';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: number;
    restaurant?: { id: number; name: string };
    rider?: { id: number; name: string; phone?: string };
    items?: Array<{ id: number; foodId?: number; foodName: string; quantity: number }>;
  } | null;
  onSuccess?: (review: any) => void;
}

const FOOD_TAGS = [
  '🍕 Delicious Taste',
  '🔥 Hot & Fresh',
  '📦 Great Packaging',
  '⚡ Generous Portion',
  '🌿 Fresh Ingredients',
  '💎 Premium Quality',
  '💰 Great Value',
];

const RIDER_TAGS = [
  '⚡ Super Fast Delivery',
  '😊 Friendly & Polite',
  '🛵 Handled With Care',
  '📍 Smooth Navigation',
  '📞 Good Communication',
  '🛡️ Safe & Clean',
];

const RATING_LABELS: Record<number, string> = {
  1: 'Poor / Disappointed 😞',
  2: 'Fair / Could be better 😐',
  3: 'Good / Satisfied 🙂',
  4: 'Very Good / Tasty! 😊',
  5: 'Exceptional / Loved it! 🌟',
};

export default function RatingModal({ isOpen, onClose, order, onSuccess }: RatingModalProps) {
  const [foodRating, setFoodRating] = useState<number>(5);
  const [foodHover, setFoodHover] = useState<number>(0);
  const [foodReview, setFoodReview] = useState<string>('');
  const [selectedFoodTags, setSelectedFoodTags] = useState<string[]>([]);

  const [riderRating, setRiderRating] = useState<number>(5);
  const [riderHover, setRiderHover] = useState<number>(0);
  const [riderReview, setRiderReview] = useState<string>('');
  const [selectedRiderTags, setSelectedRiderTags] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!order) return null;

  const toggleFoodTag = (tag: string) => {
    setSelectedFoodTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleRiderTag = (tag: string) => {
    setSelectedRiderTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!foodRating) {
      toast.error('Please select a star rating for the food.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        orderId: order.id,
        foodRating,
        foodReview,
        foodTags: selectedFoodTags,
        riderRating: order.rider ? riderRating : null,
        riderReview: order.rider ? riderReview : null,
        riderTags: order.rider ? selectedRiderTags : [],
      };

      const res = await api.post('/reviews', payload);
      if (res.data?.success) {
        toast.success('Thank you! Your review and ratings have been submitted.');
        if (onSuccess) {
          onSuccess(res.data.review);
        }
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      toast.error(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentFoodStar = foodHover || foodRating;
  const currentRiderStar = riderHover || riderRating;

  return (
    <Modal open={isOpen} onClose={onClose} size="lg">
      <Modal.Panel className="max-w-xl">
        <Modal.Header
          title={`Rate Order #${order.id}`}
          description="How was your food and delivery experience?"
          icon={<Sparkles className="h-5 w-5 text-amber-500" />}
          showClose={!submitting}
        />

        <Modal.Content className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {/* Section 1: Food & Restaurant Rating */}
          <div className="p-4 rounded-2xl border border-border/60 bg-gradient-to-br from-amber-500/5 via-primary/5 to-transparent space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Utensils className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-foreground">
                    {order.restaurant?.name || 'Restaurant & Food'}
                  </h4>
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    Rate taste, freshness, and packaging
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400">
                {RATING_LABELS[currentFoodStar] || 'Select Rating'}
              </span>
            </div>

            {/* Stars Row */}
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= currentFoodStar;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFoodRating(star)}
                    onMouseEnter={() => setFoodHover(star)}
                    onMouseLeave={() => setFoodHover(0)}
                    className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        filled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                          : 'fill-muted/20 text-muted-foreground/30'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Quick compliments tags */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                What did you like?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FOOD_TAGS.map((tag) => {
                  const isSelected = selectedFoodTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleFoodTag(tag)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                          : 'bg-card border-border/70 text-muted-foreground hover:border-amber-500/30'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Review text */}
            <div className="space-y-1">
              <textarea
                value={foodReview}
                onChange={(e) => setFoodReview(e.target.value)}
                placeholder="Write a review for the kitchen (optional)... e.g. The burger was juicy and fries were super crispy!"
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-border/60 bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-medium resize-none"
              />
            </div>
          </div>

          {/* Section 2: Rider Rating (If order had a rider) */}
          {order.rider && (
            <div className="p-4 rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-500/5 via-primary/5 to-transparent space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <Bike className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-foreground">
                      {order.rider.name || 'Delivery Rider'}
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      Rate delivery speed, courtesy, and handling
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  {RATING_LABELS[currentRiderStar] || 'Select Rating'}
                </span>
              </div>

              {/* Stars Row */}
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= currentRiderStar;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRiderRating(star)}
                      onMouseEnter={() => setRiderHover(star)}
                      onMouseLeave={() => setRiderHover(0)}
                      className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          filled
                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                            : 'fill-muted/20 text-muted-foreground/30'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Quick rider tags */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  How was the delivery?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {RIDER_TAGS.map((tag) => {
                    const isSelected = selectedRiderTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleRiderTag(tag)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                            : 'bg-card border-border/70 text-muted-foreground hover:border-emerald-500/30'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review text */}
              <div className="space-y-1">
                <textarea
                  value={riderReview}
                  onChange={(e) => setRiderReview(e.target.value)}
                  placeholder="Leave a note for the rider (optional)... e.g. Polite rider and arrived well before ETA!"
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-border/60 bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-medium resize-none"
                />
              </div>
            </div>
          )}
        </Modal.Content>

        <Modal.Footer>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={submitting}
            className="font-bold text-xs"
          >
            Skip for now
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={submitting}
            className="font-bold text-xs shadow-xs"
            leftIcon={<Heart className="h-3.5 w-3.5 fill-current" />}
          >
            Submit Ratings
          </Button>
        </Modal.Footer>
      </Modal.Panel>
    </Modal>
  );
}
