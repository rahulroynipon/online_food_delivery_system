import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import CustomerLayout from '../../components/CustomerLayout';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../design-system';
import { ShoppingBag, MapPin, Store, Bike, CheckCircle2, Clock, Ban, ArrowLeft, RefreshCw, Landmark } from 'lucide-react';
import api from '../../lib/axios';

// Interface definitions
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
  items?: any[];
  createdAt: string;
}

export default function OrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('id');

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  const fetchOrderDetails = async (showPulse = false) => {
    if (!orderId) return;
    if (showPulse) setPolling(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      if (res.data?.success) {
        setOrder(res.data.order);
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
          <h2 className="text-xl font-black text-foreground">Order Not Found</h2>
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
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in select-none">
        
        {/* Back navigation & Polling Pulse */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link to="/restaurants" className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-xs text-muted-foreground">Browse Restaurants</span>
          </div>
          <button 
            onClick={() => fetchOrderDetails(true)} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[10px] font-bold text-foreground cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${polling ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        {/* Top summary row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-card border border-border/40 rounded-3xl gap-4 shadow-xs">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Order Reference</p>
            <h1 className="text-lg font-black text-foreground mt-0.5">Order #{order.id}</h1>
            <p className="text-[10px] text-slate-500 mt-1">Placed on {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-black">Merchant</p>
              <h2 className="text-xs font-extrabold text-foreground mt-0.5">{order.restaurant?.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Bike className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-black">Delivery Rider</p>
              <h2 className="text-xs font-extrabold text-foreground mt-0.5">
                {order.rider ? `${order.rider.name} (${order.rider.phone || 'N/A'})` : 'Assigning rider...'}
              </h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Stepper Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-border/40 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/10">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Live Order Stepper
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 relative">
                
                {isCancelled ? (
                  <div className="p-6 rounded-2xl border border-dashed border-red-500/20 bg-red-500/5 flex flex-col items-center gap-4 text-center">
                    <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                      <Ban className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-foreground">Order Cancelled</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        This order was rejected or cancelled. 
                        {order.paymentMethod === 'ONLINE' && ' A full transaction refund has been initiated to your account.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 pl-4 relative before:absolute before:left-6.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                    
                    {statuses.map((step, idx) => {
                      const isCompleted = idx <= activeIndex;
                      const isCurrent = idx === activeIndex;
                      
                      return (
                        <div key={step.key} className="flex gap-4 relative">
                          {/* Dot / Icon */}
                          <div className={`z-10 h-5.5 w-5.5 rounded-full flex items-center justify-center border shadow-xs transition-colors shrink-0 ${
                            isCompleted 
                              ? 'bg-primary border-primary text-white' 
                              : 'bg-card border-border text-muted-foreground/30'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <span className="text-[8px] font-bold">{idx + 1}</span>
                            )}
                          </div>
                          
                          {/* Text description */}
                          <div className="min-w-0 pb-1">
                            <p className={`text-xs font-black transition-colors ${
                              isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground/60'
                            }`}>
                              {step.label}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium leading-relaxed">
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
          </div>

          {/* Details Column */}
          <div className="space-y-6">
            
            {/* Address Details */}
            <Card className="border border-border/40 shadow-xs">
              <CardContent className="p-5 space-y-3.5">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider border-b border-border/10 pb-2">Delivery Information</p>
                <div className="flex gap-2.5 items-start text-xs font-medium">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-foreground leading-relaxed">{order.deliveryAddressText}</p>
                </div>
                {order.notes && (
                  <div className="p-3 bg-muted/20 rounded-xl border border-border/30 text-[10px] text-muted-foreground font-semibold">
                    <p className="font-bold text-foreground">Delivery Instructions:</p>
                    <p className="mt-0.5 leading-normal">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card className="border border-border/40 shadow-xs">
              <CardContent className="p-5 space-y-3.5">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider border-b border-border/10 pb-2">Payment Details</p>
                <div className="space-y-2.5 text-xs select-none font-semibold text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="text-foreground">{order.paymentMethod === 'ONLINE' ? 'Online Checkout' : 'Cash on Delivery (COD)'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payment Status</span>
                    <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      order.paymentStatus === 'PAID' 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : order.paymentStatus === 'REFUNDED'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Bill Items */}
            <Card className="border border-border/40 shadow-xs">
              <CardContent className="p-5 space-y-3.5">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider border-b border-border/10 pb-2">Billing Details</p>
                <div className="space-y-3">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs text-foreground/90 font-medium">
                        <span className="truncate pr-4 flex-1">
                          <span className="text-primary font-bold mr-1.5">{item.quantity}×</span>
                          {item.foodName}
                          {item.variantName && <span className="text-[10px] text-muted-foreground ml-1.5">({item.variantName})</span>}
                        </span>
                        <span className="font-bold">৳{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                      
                      {/* Addons inside invoice */}
                      {item.addons?.map((addon: any, addIdx: number) => (
                        <div key={addIdx} className="pl-6 flex justify-between text-[10px] text-muted-foreground font-medium">
                          <span>+ {addon.quantity}× {addon.addonName}</span>
                          <span>৳{(parseFloat(addon.price) * addon.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <hr className="border-border/10" />

                <div className="space-y-2.5 text-xs text-muted-foreground select-none font-semibold">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-foreground">৳{parseFloat(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="text-foreground">৳{parseFloat(order.deliveryFee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT / Tax</span>
                    <span className="text-foreground">৳{parseFloat(order.tax).toFixed(2)}</span>
                  </div>
                </div>

                <hr className="border-border/10" />

                <div className="flex justify-between items-center text-xs font-black text-foreground select-none">
                  <span>Grand Total</span>
                  <span className="text-primary text-sm font-extrabold">৳{parseFloat(order.total).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </CustomerLayout>
  );
}
