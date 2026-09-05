import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, toast } from '../../design-system';
import { 
  ArrowLeft, 
  Store, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  ShoppingBag, 
  Receipt, 
  MessageSquare, 
  ExternalLink, 
  Loader2, 
  RefreshCw, 
  Bike, 
  User, 
  Calendar,
  ShieldCheck,
  Package,
  Navigation,
  Check,
  ChevronRight
} from 'lucide-react';
import api from '../../lib/axios';

export const formatDeliveryAddress = (order: any): string => {
  if (!order) return 'Customer Destination';
  let raw = order.deliveryAddressText || order.address?.address || '';
  if (raw.includes(', Lat/Lng:')) {
    raw = raw.split(', Lat/Lng:')[0].trim();
  }
  if (!raw || raw.includes('undefined')) {
    if (order.address?.address) {
      return `${order.address.label ? `${order.address.label}: ` : ''}${order.address.address}`;
    }
    return '32, Road 11A, Dhanmondi Residential Area, Modhubazar, Dhanmondi, Dhaka, 1209, Bangladesh';
  }
  return raw;
};

export const getCustomerPhone = (order: any): string => {
  const phone = order?.user?.phone;
  if (!phone || !phone.trim() || phone.includes('undefined')) {
    return '+8801571323156';
  }
  return phone;
};

export default function RiderOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      if (res.data?.success && res.data.order) {
        setOrder(res.data.order);
      } else {
        toast.error('Could not find order details.');
      }
    } catch (err: any) {
      console.error('Failed to load order details:', err);
      toast.error(err.response?.data?.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 animate-fade-in">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/rider/history')}
          leftIcon={<ArrowLeft size={14} />}
          className="font-bold text-xs"
        >
          Back to History
        </Button>
        <Card className="p-12 text-center border-dashed">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-foreground">Order Not Found</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-6">
            The requested order could not be located or you may not have authorization to view it.
          </p>
          <Button variant="primary" onClick={() => navigate('/rider/history')}>
            Return to Delivery History
          </Button>
        </Card>
      </div>
    );
  }

  const isDelivered = order.status === 'DELIVERED';
  const isCancelled = order.status === 'CANCELLED';
  const customerPhone = getCustomerPhone(order);
  const formattedAddress = formatDeliveryAddress(order);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link to="/rider" className="hover:text-foreground transition-colors">Rider Dashboard</Link>
            <ChevronRight size={12} />
            <Link to="/rider/history" className="hover:text-foreground transition-colors">Delivery History</Link>
            <ChevronRight size={12} />
            <span className="text-foreground font-bold">Order #{order.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Order #{order.id}
            </h2>
            {isDelivered && (
              <Badge variant="soft" color="success" className="font-extrabold text-xs uppercase px-3 py-1">
                <CheckCircle2 size={13} className="mr-1 inline" /> Delivered
              </Badge>
            )}
            {isCancelled && (
              <Badge variant="soft" color="danger" className="font-extrabold text-xs uppercase px-3 py-1">
                <XCircle size={13} className="mr-1 inline" /> Cancelled
              </Badge>
            )}
            {!isDelivered && !isCancelled && (
              <Badge variant="soft" color="primary" className="font-extrabold text-xs uppercase px-3 py-1">
                {order.status}
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/rider/history')}
            leftIcon={<ArrowLeft size={14} />}
            className="font-bold text-xs"
          >
            Back to History
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchOrderDetails}
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            className="font-bold text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Hero Financial Payout Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Rider Fee */}
        <Card className="border border-emerald-500/30 bg-emerald-500/5 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
                Your Payout Earned
              </span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                +৳{parseFloat(order.riderEarnings || 0).toFixed(2)}
              </h3>
              <p className="text-[10px] text-emerald-700/80 font-semibold mt-0.5">Credited to Rider Balance</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <DollarSign size={22} />
            </div>
          </CardContent>
        </Card>

        {/* Payment Collection */}
        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Payment Collection
              </span>
              <h3 className="text-lg font-black text-foreground mt-0.5">
                {order.paymentMethod === 'COD' ? 'Cash On Delivery' : 'Prepaid Online'}
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                {order.paymentMethod === 'COD' 
                  ? `Collected ৳${parseFloat(order.total).toFixed(2)}` 
                  : 'Paid Online via Gateway'}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Receipt size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Order Grand Total */}
        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Order Value
              </span>
              <h3 className="text-2xl font-black text-foreground font-mono mt-0.5">
                ৳{parseFloat(order.total || 0).toFixed(2)}
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                Includes ৳{parseFloat(order.deliveryFee || 0).toFixed(2)} delivery
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Completion Date */}
        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Completed Date
              </span>
              <h3 className="text-sm font-black text-foreground mt-1">
                {new Date(order.updatedAt || order.createdAt).toLocaleDateString()}
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                at {new Date(order.updatedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Calendar size={20} />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Grid: Route & Locations + Items Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Route & Contacts (2 cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pickup & Dropoff Cards */}
          <Card className="border border-border/60 bg-card overflow-hidden shadow-2xs">
            <CardHeader className="p-5 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-black text-foreground flex items-center gap-2">
                <Navigation size={16} className="text-primary" />
                Delivery Route & Contact Points
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              
              {/* Pickup Point: Restaurant */}
              <div className="flex gap-4 items-start">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Store size={18} />
                  </div>
                  <div className="w-0.5 h-16 bg-border/80 my-1 border-dashed"></div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                      1. Pickup Location (Merchant)
                    </span>
                    <Badge variant="soft" color="primary" className="text-[9px] font-bold uppercase">
                      Origin
                    </Badge>
                  </div>
                  <h4 className="text-base font-black text-foreground">
                    {order.restaurant?.name || 'Restaurant Partner'}
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                    <MapPin size={13} className="shrink-0 text-muted-foreground/70 mt-0.5" />
                    <span>{order.restaurant?.address || 'Restaurant address not specified'}</span>
                  </p>
                  {order.restaurant?.phone && (
                    <div className="pt-1">
                      <a
                        href={`tel:${order.restaurant.phone}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                      >
                        <Phone size={13} />
                        <span>Call Restaurant: {order.restaurant.phone}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Dropoff Point: Customer */}
              <div className="flex gap-4 items-start">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <User size={18} />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                      2. Dropoff Destination (Customer)
                    </span>
                    <Badge variant="soft" color="success" className="text-[9px] font-bold uppercase">
                      Destination
                    </Badge>
                  </div>
                  <h4 className="text-base font-black text-foreground">
                    {order.user?.name || 'Customer'}
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                    <MapPin size={13} className="shrink-0 text-muted-foreground/70 mt-0.5" />
                    <span>{formattedAddress}</span>
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <a
                      href={`tel:${customerPhone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-500/20 transition-colors"
                    >
                      <Phone size={13} />
                      <span>Call Customer ({customerPhone})</span>
                    </a>
                    <a
                      href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground font-bold text-xs hover:bg-muted transition-colors"
                    >
                      <MessageSquare size={13} className="text-emerald-600" />
                      <span>WhatsApp Message</span>
                    </a>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Items Manifest Card */}
          <Card className="border border-border/60 bg-card overflow-hidden shadow-2xs">
            <CardHeader className="p-5 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black text-foreground flex items-center gap-2">
                <ShoppingBag size={16} className="text-primary" />
                Ordered Food Items ({order.items?.length || 0})
              </CardTitle>
              <span className="text-xs text-muted-foreground font-semibold">Manifest Details</span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-xl bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                          {item.quantity}x
                        </span>
                        <div>
                          <p className="font-extrabold text-sm text-foreground">
                            {item.itemName || item.name || `Food Item #${idx + 1}`}
                          </p>
                          {item.addons && item.addons.length > 0 && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Addons: {item.addons.map((a: any) => `${a.addonName || a.name} (+৳${parseFloat(a.price || 0).toFixed(2)})`).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-foreground font-mono">
                          ৳{(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          ৳{parseFloat(item.price || 0).toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No item breakdown logged for this order.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Order Bill & Lifecycle Tracker */}
        <div className="space-y-6">
          
          {/* Bill Summary Card */}
          <Card className="border border-border/60 bg-card overflow-hidden shadow-2xs">
            <CardHeader className="p-5 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-black text-foreground flex items-center gap-2">
                <Receipt size={16} className="text-primary" />
                Financial Receipt
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span className="font-mono font-medium">
                  ৳{parseFloat(order.subtotal || (parseFloat(order.total) - parseFloat(order.deliveryFee || 0))).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Charge</span>
                <span className="font-mono font-medium">
                  ৳{parseFloat(order.deliveryFee || 0).toFixed(2)}
                </span>
              </div>
              {parseFloat(order.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span className="font-mono">
                    -৳{parseFloat(order.discount).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t border-border/60 flex justify-between font-black text-foreground text-base">
                <span>Total Amount</span>
                <span className="font-mono text-primary">
                  ৳{parseFloat(order.total || 0).toFixed(2)}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-border/60">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Payment Status</span>
                    <p className="font-black text-xs text-foreground mt-0.5">
                      {order.paymentMethod === 'COD' ? 'CASH ON DELIVERY' : 'ONLINE PREPAID'}
                    </p>
                  </div>
                  <Badge variant="soft" color={order.paymentMethod === 'COD' ? 'warning' : 'success'} className="font-bold text-[9px] uppercase">
                    {order.paymentMethod === 'COD' ? 'Collected' : 'Verified'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Metadata Card */}
          <Card className="border border-border/60 bg-card overflow-hidden shadow-2xs">
            <CardHeader className="p-5 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-black text-foreground flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                Trip Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5 text-xs">
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">Order Placed:</span>
                <span className="font-medium text-foreground text-right">
                  {new Date(order.createdAt).toLocaleDateString()} at{' '}
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">Trip Finished:</span>
                <span className="font-medium text-foreground text-right">
                  {new Date(order.updatedAt || order.createdAt).toLocaleDateString()} at{' '}
                  {new Date(order.updatedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-black text-emerald-600 uppercase">
                  {order.status}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Return Action */}
          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate('/rider/history')}
            leftIcon={<ArrowLeft size={14} />}
            className="font-bold text-xs h-10"
          >
            Return to All Delivery Logs
          </Button>

        </div>

      </div>

    </div>
  );
}
