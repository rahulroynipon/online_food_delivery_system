import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useCustomerStore } from '../../store/useCustomerStore';
import CustomerLayout from '../../components/CustomerLayout';
import { Button, Card, CardHeader, CardTitle, CardContent, toast } from '../../design-system';
import { MapPin, ShoppingBag, CreditCard, Banknote, ShieldAlert, ArrowLeft, ArrowRight, Loader2, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';
import api from '../../lib/axios';

// Helper: Haversine distance in KM
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cart, clearCart, selectedAddress } = useCustomerStore();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Check for error return from payment gateway
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'payment_failed') {
      toast.error('Payment failed or was declined by gateway. Please try again.');
    } else if (errorParam === 'payment_cancelled') {
      toast.error('Payment was cancelled. You can retry with COD or another online method.');
    }
  }, [searchParams]);

  // Pricing constants fetched from platform settings
  const [settings, setSettings] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const restaurantId = cart.length > 0 ? cart[0].restaurantId : null;
  const restaurantSlug = cart.length > 0 ? cart[0].restaurantSlug : null;

  // 1. Fetch addresses, platform settings, and active restaurant
  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const [addrRes, settingsRes, restListRes] = await Promise.all([
          api.get('/user-addresses'),
          api.get('/settings/platform'),
          api.get('/public/restaurants')
        ]);

        if (addrRes.data?.success) {
          const list = addrRes.data.addresses || [];
          setAddresses(list);
          // Pre-select store-selected or default address
          const active = list.find((a: any) => selectedAddress && a.id === selectedAddress.id);
          const defAddr = list.find((a: any) => a.isDefault) || list[0];
          setSelectedAddrId(active?.id || defAddr?.id || null);
        }

        if (settingsRes.data?.success) {
          setSettings(settingsRes.data.settings);
        }

        if (restListRes.data?.success && restaurantId) {
          const matched = restListRes.data.restaurants.find(
            (r: any) => r.id === restaurantId
          );
          if (matched) {
            setRestaurant(matched);
          }
        }
      } catch (err) {
        console.error('Failed to load checkout settings:', err);
      } finally {
        setPageLoading(false);
      }
    };
    fetchCheckoutData();
  }, [selectedAddress, restaurantId]);

  if (cart.length === 0) {
    return (
      <CustomerLayout>
        <div className="max-w-md mx-auto py-24 px-4 text-center space-y-5 animate-fade-in select-none">
          <div className="h-16 w-16 bg-muted/40 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-foreground">Your basket is empty</h2>
          <p className="text-xs text-muted-foreground">Add items from your favorite restaurants to complete checkout.</p>
          <Button onClick={() => navigate('/restaurants')} variant="primary" size="lg" className="w-full">
            Browse Restaurants
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  if (pageLoading || !restaurant) {
    return (
      <CustomerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CustomerLayout>
    );
  }

  // Compute delivery fee dynamically (max of base fee or calculated distance fee)
  const activeAddress = addresses.find(a => a.id === selectedAddrId);
  let distance = 0;
  const baseFee = Number(settings?.riderBaseFee || 30.00);
  let deliveryFee = baseFee;

  if (activeAddress && restaurant) {
    distance = getDistanceKm(
      Number(activeAddress.latitude),
      Number(activeAddress.longitude),
      Number(restaurant.latitude || 0),
      Number(restaurant.longitude || 0)
    );
    const costPerKm = Number(settings?.riderFeePerKm || 15.00);
    const calculatedDistanceFee = costPerKm * distance;
    deliveryFee = Math.max(baseFee, calculatedDistanceFee);
  }

  const taxRate = Number(settings?.taxRate || 5.00);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + deliveryFee + tax;

  const handlePlaceOrder = async () => {
    if (!selectedAddrId) {
      toast.error('Please configure and select a delivery address.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/orders', {
        restaurantId: restaurant.id,
        addressId: selectedAddrId,
        items: cart.map(item => ({
          foodId: item.foodId,
          foodName: item.foodName,
          price: item.price,
          quantity: item.quantity,
          variant: item.variant,
          addons: item.addons
        })),
        paymentMethod
      });

      if (response.data?.success) {
        clearCart();

        if (paymentMethod === 'ONLINE' && response.data.paymentUrl) {
          toast.success('Order created! Redirecting to SSLCommerz Secure Gateway...');
          window.location.href = response.data.paymentUrl;
        } else {
          toast.success('Order placed successfully!');
          navigate(`/order-tracking?id=${response.data.order.id}`);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in select-none">
        
        {/* Navigation back */}
        <div className="flex items-center gap-2">
          <Link to="/cart" className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-xs text-muted-foreground">Back to Basket</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns: Inputs */}
          <div className="lg:col-span-2 space-y-6">
            
          

            {/* Payment Method Card */}
            <Card className="border border-border/40 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/10">
                <CardTitle className="text-sm font-black flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Select Payment Method
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> SSL 256-Bit Encrypted
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-5 rounded-2xl border cursor-pointer flex flex-col justify-between gap-3 transition-all select-none ${
                    paymentMethod === 'COD'
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary'
                      : 'border-border/60 hover:bg-muted/40 bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Banknote className="h-5 w-5" />
                    </div>
                    <input
                      type="radio"
                      name="payment-method"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="accent-primary cursor-pointer"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground">Cash on Delivery (COD)</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Pay in cash directly to delivery rider upon receiving order.</p>
                  </div>
                </div>

                {/* Online Prepaid Payment (SSLCommerz) */}
                <div
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`p-5 rounded-2xl border cursor-pointer flex flex-col justify-between gap-3 transition-all select-none ${
                    paymentMethod === 'ONLINE'
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary'
                      : 'border-border/60 hover:bg-muted/40 bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-extrabold bg-rose-500/15 text-rose-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        SSLCommerz
                      </span>
                      <input
                        type="radio"
                        name="payment-method"
                        checked={paymentMethod === 'ONLINE'}
                        onChange={() => setPaymentMethod('ONLINE')}
                        className="accent-primary cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground">Online Payment (Cards & MFS)</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Pay instantly via bKash, Nagad, Rocket, Visa, or MasterCard.
                    </p>
                    
                    {/* Micro Channel Badges */}
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-border/20 text-[9px] font-bold text-muted-foreground">
                      <span className="px-1.5 py-0.5 bg-pink-500/10 text-pink-600 rounded">bKash</span>
                      <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded">Nagad</span>
                      <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded">Rocket</span>
                      <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded">Cards</span>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>

          {/* Right Column: Order Summary & Placement */}
          <div className="space-y-6">
            <Card className="border border-border/40 shadow-lg sticky top-24">
              <CardHeader className="pb-3 border-b border-border/10">
                <CardTitle className="text-sm font-black flex items-center justify-between">
                  <span>Checkout Summary</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase">
                    {cart.length} item{cart.length > 1 ? 's' : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                {/* Items Summary list */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs text-foreground/90 font-medium">
                      <span className="truncate pr-4 flex-1">
                        <span className="text-primary font-bold mr-1.5">{item.quantity}×</span>
                        {item.foodName}
                      </span>
                      <span className="font-bold">৳{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <hr className="border-border/10" />

                {/* Subtotals & Fees */}
                <div className="space-y-2.5 text-xs text-muted-foreground select-none font-semibold">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-foreground">৳{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span>Delivery Fee</span>
                      {distance > 0 && <span className="text-[9px] text-slate-500 font-medium block">Dist: {distance.toFixed(2)} km</span>}
                    </div>
                    <span className="text-foreground">৳{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vat / Tax ({taxRate}%)</span>
                    <span className="text-foreground">৳{tax.toFixed(2)}</span>
                  </div>
                </div>

                <hr className="border-border/10" />

                {/* Grand Total */}
                <div className="flex justify-between items-center text-sm font-black text-foreground select-none">
                  <span>Grand Total</span>
                  <span className="text-primary text-base font-extrabold">৳{total.toFixed(2)}</span>
                </div>

                {/* Place Order CTA Button */}
                <Button
                  onClick={handlePlaceOrder}
                  loading={loading}
                  disabled={addresses.length === 0}
                  variant="primary"
                  fullWidth
                  size="lg"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  className="shadow-md shadow-primary/15 mt-3 py-3 font-extrabold"
                >
                  Place Order ({paymentMethod})
                </Button>

              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </CustomerLayout>
  );
}
