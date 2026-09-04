import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomerStore } from '../../store/useCustomerStore';
import CustomerLayout from '../../components/CustomerLayout';
import { Button, Card, CardHeader, CardTitle, CardContent, toast } from '../../design-system';
import { MapPin, ShoppingBag, CreditCard, Banknote, ShieldAlert, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
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
  const { cart, clearCart, selectedAddress } = useCustomerStore();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

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
        toast.success('Order placed successfully!');
        clearCart();
        navigate(`/order-tracking?id=${response.data.order.id}`);
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
            
            {/* Address Selector Card */}
            <Card className="border border-border/40 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/10">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary animate-pulse" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {addresses.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-destructive/20 bg-destructive/5 text-center space-y-2">
                    <ShieldAlert className="h-5 w-5 text-destructive mx-auto" />
                    <p className="text-xs font-semibold text-foreground">No saved addresses found</p>
                    <p className="text-[10px] text-muted-foreground">Click the location selector in the header to pin your coordinate-bounded address.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddrId(addr.id)}
                        className={`p-4 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                          selectedAddrId === addr.id
                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                            : 'border-border/60 hover:bg-muted/40 bg-card'
                        }`}
                      >
                        <input
                          type="radio"
                          name="checkout-address"
                          checked={selectedAddrId === addr.id}
                          onChange={() => setSelectedAddrId(addr.id)}
                          className="mt-0.5 accent-primary cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground">{addr.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed truncate">
                            {addr.addressLine1}
                          </p>
                          <p className="text-[9px] text-slate-500 mt-1 select-none font-medium">
                            Coord: ({Number(addr.latitude).toFixed(4)}, {Number(addr.longitude).toFixed(4)})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method Card */}
            <Card className="border border-border/40 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/10">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Select Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-5 rounded-2xl border cursor-pointer flex flex-col items-center gap-3 transition-all select-none ${
                    paymentMethod === 'COD'
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                      : 'border-border/60 hover:bg-muted/40 bg-card'
                  }`}
                >
                  <Banknote className={`h-8 w-8 ${paymentMethod === 'COD' ? 'text-primary' : 'text-muted-foreground/60'}`} />
                  <div className="text-center">
                    <p className="text-xs font-black text-foreground">Cash on Delivery</p>
                    <p className="text-[9px] text-muted-foreground mt-1">Pay with physical cash to the rider.</p>
                  </div>
                </div>

                {/* Online Payment (Simulation) */}
                <div
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`p-5 rounded-2xl border cursor-pointer flex flex-col items-center gap-3 transition-all select-none ${
                    paymentMethod === 'ONLINE'
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                      : 'border-border/60 hover:bg-muted/40 bg-card'
                  }`}
                >
                  <CreditCard className={`h-8 w-8 ${paymentMethod === 'ONLINE' ? 'text-primary' : 'text-muted-foreground/60'}`} />
                  <div className="text-center">
                    <p className="text-xs font-black text-foreground">Online Payment</p>
                    <p className="text-[9px] text-muted-foreground mt-1">Simulate instant checkout payment.</p>
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
