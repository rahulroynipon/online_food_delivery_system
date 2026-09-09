import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import CustomerLayout from '../../components/CustomerLayout';
import { Card, CardHeader, CardTitle, CardContent, Button, Textarea, toast } from '../../design-system';
import {
  MapPin,
  Store,
  Bike,
  CheckCircle2,
  Clock,
  Ban,
  ArrowLeft,
  RefreshCw,
  Star,
} from 'lucide-react';
import api from '../../lib/axios';

interface OrderItem {
  id?: number;
  foodName: string;
  variantName?: string;
  price: string;
  quantity: number;
  addons?: Array<{
    addonName: string;
    price: string;
    quantity: number;
  }>;
}

interface OrderDetails {
  id: number;
  status: string;
  subtotal: string;
  deliveryFee: string;
  tax: string;
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddressText: string;
  notes?: string;
  restaurant?: { id: number; name: string };
  rider?: { id: number; name: string; phone?: string };
  items?: OrderItem[];
  createdAt: string;
}

const FOOD_TAGS = [
  'Delicious taste',
  'Hot & fresh',
  'Great packaging',
  'Generous portion',
  'Fresh ingredients',
  'Great value',
];

const RIDER_TAGS = [
  'Fast delivery',
  'Polite & friendly',
  'Handled with care',
  'Smooth navigation',
  'Good communication',
];

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Exceptional',
};

export default function OrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('id');

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [review, setReview] = useState<any>(null);

  // Inline Rating States
  const [foodRating, setFoodRating] = useState<number>(5);
  const [foodHover, setFoodHover] = useState<number>(0);
  const [foodReview, setFoodReview] = useState<string>('');
  const [selectedFoodTags, setSelectedFoodTags] = useState<string[]>([]);

  const [riderRating, setRiderRating] = useState<number>(5);
  const [riderHover, setRiderHover] = useState<number>(0);
  const [riderReview, setRiderReview] = useState<string>('');
  const [selectedRiderTags, setSelectedRiderTags] = useState<string[]>([]);

  const [submittingRating, setSubmittingRating] = useState(false);

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

  const handleInlineSubmitReview = async () => {
    if (!order) return;
    if (!foodRating) {
      toast.error('Please select a star rating for the food.');
      return;
    }

    setSubmittingRating(true);
    try {
      const payload = {
        orderId: order.id,
        foodRating,
        foodReview: foodReview.trim() || null,
        foodTags: selectedFoodTags,
        riderRating: order.rider ? riderRating : null,
        riderReview: order.rider ? riderReview.trim() || null : null,
        riderTags: order.rider ? selectedRiderTags : [],
      };

      const res = await api.post('/reviews', payload);
      if (res.data?.success) {
        toast.success('Thank you! Your ratings & review have been submitted.');
        setReview(res.data.review);
      }
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      toast.error(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const fetchReview = async () => {
    if (!orderId) return;
    try {
      const res = await api.get(`/reviews/order/${orderId}`);
      if (res.data?.success && res.data.review) {
        setReview(res.data.review);
      }
    } catch (err) {
      console.error('Failed to load order review status:', err);
    }
  };

  const fetchOrderDetails = async (showPulse = false) => {
    if (!orderId) return;
    if (showPulse) setPolling(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      if (res.data?.success) {
        setOrder(res.data.order);
        if (res.data.order.status === 'DELIVERED') {
          fetchReview();
        }
      }
    } catch (err) {
      console.error('Failed to load tracking details:', err);
    } finally {
      setLoading(false);
      setPolling(false);
    }
  };

  // Poll status every 5 seconds for live updates
  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    fetchOrderDetails();
    const interval = setInterval(() => {
      fetchOrderDetails(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <CustomerLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CustomerLayout>
    );
  }

  if (!order) {
    return (
      <CustomerLayout>
        <div className="max-w-md mx-auto py-24 px-4 text-center space-y-5 animate-fade-in select-none">
          <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <Ban className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Order Not Found</h2>
          <p className="text-xs text-muted-foreground">The order details you requested could not be retrieved.</p>
          <Button onClick={() => navigate('/')} variant="primary" size="lg" className="w-full">
            Back to Home
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  // Stepper helper
  const statuses = [
    { key: 'PENDING', label: 'Order Placed', desc: 'Waiting for restaurant approval' },
    { key: 'CONFIRMED', label: 'Confirmed', desc: 'Restaurant accepted your order' },
    { key: 'PREPARING', label: 'Preparing', desc: 'Chef is cooking your fresh food' },
    { key: 'READY', label: 'Ready for Pickup', desc: 'Food is prepared, waiting for rider' },
    { key: 'RIDER_ASSIGNED', label: 'Rider Assigned', desc: 'Rider is picking up your order' },
    { key: 'PICKED_UP', label: 'Picked Up', desc: 'Rider collected your food packet' },
    { key: 'ON_THE_WAY', label: 'On the Way', desc: 'Rider is speeding towards you' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Enjoy your delicious meal!' }
  ];

  const getStatusIndex = (status: string) => {
    return statuses.findIndex(s => s.key === status);
  };

  const activeIndex = getStatusIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <CustomerLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in select-none">
        
        {/* Back navigation & Polling Pulse */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link
              to="/restaurants"
              className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-xs font-medium text-muted-foreground">Browse Restaurants</span>
          </div>
          <button 
            onClick={() => fetchOrderDetails(true)} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-colors shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${polling ? 'animate-spin text-primary' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Top Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-card border border-border/60 rounded-2xl shadow-xs">
          <div className="flex flex-col justify-center">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Order Details</span>
            <h1 className="text-lg font-bold text-foreground mt-0.5">Order #{order.id}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Store className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Restaurant</p>
              <h2 className="text-xs font-bold text-foreground mt-0.5 truncate">{order.restaurant?.name || 'Restaurant'}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
            <div className="p-2.5 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <Bike className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Delivery Rider</p>
              <h2 className="text-xs font-bold text-foreground mt-0.5 truncate">
                {order.rider ? `${order.rider.name} (${order.rider.phone || 'Courier'})` : 'Assigning rider...'}
              </h2>
            </div>
          </div>
        </div>

        {/* Main Grid: Left Stepper & Rating, Right Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stepper Card */}
            <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden">
              <CardHeader className="p-4 px-5 border-b border-border/40 bg-muted/20">
                <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Live Order Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 relative">
                
                {isCancelled ? (
                  <div className="p-6 rounded-xl border border-dashed border-red-500/20 bg-red-500/5 flex flex-col items-center gap-3 text-center">
                    <div className="h-10 w-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                      <Ban className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground">Order Cancelled</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        This order was cancelled. 
                        {order.paymentMethod === 'ONLINE' && ' A refund has been initiated.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 pl-4 relative before:absolute before:left-6.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                    {statuses.map((step, idx) => {
                      const isCompleted = idx <= activeIndex;
                      const isCurrent = idx === activeIndex;
                      
                      return (
                        <div key={step.key} className="flex gap-4 relative">
                          <div className={`z-10 h-5 w-5 rounded-full flex items-center justify-center border shadow-xs transition-colors shrink-0 ${
                            isCompleted 
                              ? 'bg-primary border-primary text-white' 
                              : 'bg-card border-border text-muted-foreground/30'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <span className="text-[8px] font-bold">{idx + 1}</span>
                            )}
                          </div>
                          
                          <div className="min-w-0 pb-0.5">
                            <p className={`text-xs font-bold transition-colors ${
                              isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground/60'
                            }`}>
                              {step.label}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium leading-relaxed">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </CardContent>
            </Card>

            {/* INLINE RATING & FEEDBACK SECTION (DESIGN SYSTEM UI) */}
            {order.status === 'DELIVERED' && (
              <div className="animate-fade-in">
                {!review ? (
                  <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden">
                    <CardHeader className="p-5 pb-4 border-b border-border/40">
                      <CardTitle className="text-sm font-bold text-foreground">
                        Rate Your Experience
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your feedback helps {order.restaurant?.name || 'the restaurant'}{order.rider ? ` and ${order.rider.name}` : ''} improve their service.
                      </p>
                    </CardHeader>

                    <CardContent className="p-5 space-y-5">
                      
                      {/* Section 1: Food & Restaurant Rating */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-primary" />
                            <span className="text-xs font-bold text-foreground">
                              Food & Packaging ({order.restaurant?.name || 'Restaurant'})
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {RATING_LABELS[foodHover || foodRating]}
                          </span>
                        </div>

                        {/* Interactive Stars */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const filled = star <= (foodHover || foodRating);
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFoodRating(star)}
                                onMouseEnter={() => setFoodHover(star)}
                                onMouseLeave={() => setFoodHover(0)}
                                className="p-1 cursor-pointer transition-transform hover:scale-115 focus:outline-none"
                              >
                                <Star
                                  className={`h-6 w-6 transition-colors ${
                                    filled
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-slate-100 text-slate-300'
                                  }`}
                                />
                              </button>
                            );
                          })}
                          <span className="text-xs font-bold text-foreground ml-2">
                            {(foodHover || foodRating)}.0
                          </span>
                        </div>

                        {/* Food Compliment Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {FOOD_TAGS.map((tag) => {
                            const isSelected = selectedFoodTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleFoodTag(tag)}
                                className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-medium ${
                                  isSelected
                                    ? 'bg-foreground text-background border-foreground font-semibold shadow-xs'
                                    : 'bg-muted/40 text-muted-foreground border-border/70 hover:bg-muted hover:text-foreground'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>

                        {/* Food Review Comment */}
                        <div className="pt-1">
                          <Textarea
                            value={foodReview}
                            onChange={(e) => setFoodReview(e.target.value)}
                            placeholder="What did you think of the food taste, temperature, or packaging? (Optional)"
                            rows={2}
                            className="text-xs rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Section 2: Delivery Courier / Rider Rating */}
                      {order.rider && (
                        <>
                          <hr className="border-border/40" />

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Bike className="h-4 w-4 text-emerald-600" />
                                <span className="text-xs font-bold text-foreground">
                                  Delivery Service ({order.rider.name})
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-muted-foreground">
                                {RATING_LABELS[riderHover || riderRating]}
                              </span>
                            </div>

                            {/* Interactive Stars */}
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const filled = star <= (riderHover || riderRating);
                                return (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRiderRating(star)}
                                    onMouseEnter={() => setRiderHover(star)}
                                    onMouseLeave={() => setRiderHover(0)}
                                    className="p-1 cursor-pointer transition-transform hover:scale-115 focus:outline-none"
                                  >
                                    <Star
                                      className={`h-6 w-6 transition-colors ${
                                        filled
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'fill-slate-100 text-slate-300'
                                      }`}
                                    />
                                  </button>
                                );
                              })}
                              <span className="text-xs font-bold text-foreground ml-2">
                                {(riderHover || riderRating)}.0
                              </span>
                            </div>

                            {/* Rider Compliment Badges */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {RIDER_TAGS.map((tag) => {
                                const isSelected = selectedRiderTags.includes(tag);
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleRiderTag(tag)}
                                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-medium ${
                                      isSelected
                                        ? 'bg-foreground text-background border-foreground font-semibold shadow-xs'
                                        : 'bg-muted/40 text-muted-foreground border-border/70 hover:bg-muted hover:text-foreground'
                                    }`}
                                  >
                                    {tag}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Rider Review Comment */}
                            <div className="pt-1">
                              <Textarea
                                value={riderReview}
                                onChange={(e) => setRiderReview(e.target.value)}
                                placeholder="Leave a delivery note or compliment for the rider (Optional)..."
                                rows={2}
                                className="text-xs rounded-xl"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Design System Primary Button */}
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleInlineSubmitReview}
                        loading={submittingRating}
                        className="w-full font-bold text-xs py-2.5 rounded-xl shadow-xs"
                      >
                        Submit Review
                      </Button>

                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-border/60 bg-card shadow-xs rounded-2xl overflow-hidden">
                    <CardHeader className="p-4 px-5 border-b border-border/40 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <CardTitle className="text-xs font-bold text-foreground">
                          Review Submitted
                        </CardTitle>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {new Date(review.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </CardHeader>
                    
                    <CardContent className="p-5 space-y-4">
                      {/* Food Rating Summary */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Store className="h-3.5 w-3.5 text-muted-foreground" />
                            {order.restaurant?.name || 'Food Quality'}
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3.5 w-3.5 ${
                                  s <= review.foodRating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-slate-100 text-slate-200'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold ml-1 text-foreground">
                              {review.foodRating}.0
                            </span>
                          </div>
                        </div>

                        {review.foodTags && review.foodTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {review.foodTags.map((tag: string, i: number) => (
                              <span
                                key={i}
                                className="text-[11px] font-medium bg-muted text-muted-foreground px-2.5 py-0.5 rounded-md border border-border/50"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {review.foodReview && (
                          <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">
                            "{review.foodReview}"
                          </p>
                        )}
                      </div>

                      {/* Rider Rating Summary */}
                      {review.riderRating && (
                        <>
                          <hr className="border-border/40" />
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <Bike className="h-3.5 w-3.5 text-muted-foreground" />
                                {order.rider?.name || 'Delivery Rider'}
                              </span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`h-3.5 w-3.5 ${
                                      s <= review.riderRating
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'fill-slate-100 text-slate-200'
                                    }`}
                                  />
                                ))}
                                <span className="text-xs font-bold ml-1 text-foreground">
                                  {review.riderRating}.0
                                </span>
                              </div>
                            </div>

                            {review.riderTags && review.riderTags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {review.riderTags.map((tag: string, i: number) => (
                                  <span
                                    key={i}
                                    className="text-[11px] font-medium bg-muted text-muted-foreground px-2.5 py-0.5 rounded-md border border-border/50"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {review.riderReview && (
                              <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">
                                "{review.riderReview}"
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

          </div>

          {/* Right Details Column */}
          <div className="space-y-6">
            
            {/* Address Details */}
            <Card className="border border-border/60 shadow-xs rounded-2xl">
              <CardContent className="p-5 space-y-3">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider border-b border-border/20 pb-2">
                  Delivery Information
                </p>
                <div className="flex gap-2.5 items-start text-xs font-medium">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-foreground leading-relaxed">{order.deliveryAddressText}</p>
                </div>
                {order.notes && (
                  <div className="p-3 bg-muted/30 rounded-xl border border-border/30 text-xs text-muted-foreground font-medium">
                    <p className="font-semibold text-foreground">Delivery Instructions:</p>
                    <p className="mt-0.5 leading-normal">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card className="border border-border/60 shadow-xs rounded-2xl">
              <CardContent className="p-5 space-y-3">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider border-b border-border/20 pb-2">
                  Payment Details
                </p>
                <div className="space-y-2.5 text-xs select-none font-medium text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="text-foreground font-semibold">{order.paymentMethod === 'ONLINE' ? 'Online Checkout' : 'Cash on Delivery (COD)'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payment Status</span>
                    <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                      order.paymentStatus === 'PAID' 
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                        : order.paymentStatus === 'REFUNDED'
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Bill Items */}
            <Card className="border border-border/60 shadow-xs rounded-2xl">
              <CardContent className="p-5 space-y-3">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider border-b border-border/20 pb-2">
                  Billing Details
                </p>
                <div className="space-y-2.5">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs text-foreground/90 font-medium">
                        <span className="truncate pr-4 flex-1">
                          <span className="text-primary font-bold mr-1.5">{item.quantity}×</span>
                          {item.foodName}
                          {item.variantName && <span className="text-[10px] text-muted-foreground ml-1.5">({item.variantName})</span>}
                        </span>
                        <span className="font-semibold">৳{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                      
                      {/* Addons inside invoice */}
                      {item.addons?.map((addon: any, addIdx: number) => (
                        <div key={addIdx} className="pl-6 flex justify-between text-[11px] text-muted-foreground font-medium">
                          <span>+ {addon.quantity}× {addon.addonName}</span>
                          <span>৳{(parseFloat(addon.price) * addon.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <hr className="border-border/30" />

                <div className="space-y-2 text-xs text-muted-foreground select-none font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-foreground font-semibold">৳{parseFloat(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="text-foreground font-semibold">৳{parseFloat(order.deliveryFee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT / Tax</span>
                    <span className="text-foreground font-semibold">৳{parseFloat(order.tax).toFixed(2)}</span>
                  </div>
                </div>

                <hr className="border-border/30" />

                <div className="flex justify-between items-center text-xs font-bold text-foreground select-none">
                  <span>Grand Total</span>
                  <span className="text-primary text-base font-extrabold">৳{parseFloat(order.total).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </CustomerLayout>
  );
}
