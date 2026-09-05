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
  Loader2, 
  RefreshCw, 
  Bike, 
  User, 
  Calendar,
  Package,
  ChevronRight,
  TrendingUp,
  Percent
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

export default function RestaurantOrderDetailPage() {
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
      console.error('Failed to load restaurant order details:', err);
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
          onClick={() => navigate('/restaurant/history')}
          leftIcon={<ArrowLeft size={14} />}
          className="font-bold text-xs"
        >
          Back to Order History
        </Button>
        <Card className="p-12 text-center border-dashed">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-foreground">Order Not Found</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-6">
            The requested order could not be located or you may not have permission to view it.
          </p>
          <Button variant="primary" onClick={() => navigate('/restaurant/history')}>
            Return to Order History
          </Button>
        </Card>
      </div>
    );
  }

  const isDelivered = order.status === 'DELIVERED';
  const isCancelled = order.status === 'CANCELLED';
  const customerPhone = getCustomerPhone(order);
  const formattedAddress = formatDeliveryAddress(order);
  const foodSubtotal = parseFloat(order.subtotal || (parseFloat(order.total) - parseFloat(order.deliveryFee || 0)));
  const restaurantPayout = parseFloat(order.restaurantEarnings || 0);
  const platformFee = parseFloat(order.platformCommission || 0);

  return (
    <div className="space-y-6 pb-12 animate-fade-in select-none">
      
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link to="/restaurant" className="hover:text-foreground transition-colors">Merchant Portal</Link>
            <ChevronRight size={12} />
            <Link to="/restaurant/history" className="hover:text-foreground transition-colors">Order History</Link>
            <ChevronRight size={12} />
            <span className="text-foreground font-bold">Order #{order.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Order #{order.id} Details
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
            onClick={() => navigate('/restaurant/history')}
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

      {/* Hero Financial Payout Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Amount Store Gets */}
        <Card className="border border-emerald-500/30 bg-emerald-500/5 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
                What You Get (Net Payout)
              </span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                +৳{restaurantPayout.toFixed(2)}
              </h3>
              <p className="text-[10px] text-emerald-700/80 font-semibold mt-0.5">Credited to Store Balance</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <DollarSign size={22} />
            </div>
          </CardContent>
        </Card>

        {/* Gross Food Value */}
        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Gross Food Sales
              </span>
              <h3 className="text-2xl font-black text-foreground font-mono mt-0.5">
                ৳{foodSubtotal.toFixed(2)}
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                {order.items?.length || 0} food items ordered
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Platform Commission Deducted */}
        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Platform Commission
              </span>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-500 font-mono mt-0.5">
                -৳{platformFee.toFixed(2)}
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                Platform service charge
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Percent size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Payment Mode */}
        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Payment Method
              </span>
              <h3 className="text-sm font-black text-foreground mt-1">
                {order.paymentMethod === 'COD' ? 'Cash On Delivery' : 'Prepaid Online'}
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                Total Billed: ৳{parseFloat(order.total || 0).toFixed(2)}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Receipt size={20} />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Content Grid: Contacts/Rider & Items Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Customer & Rider Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer Dropoff Card */}
          <Card className="border border-border/60 bg-card overflow-hidden shadow-2xs">
            <CardHeader className="p-5 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black text-foreground flex items-center gap-2">
                <User size={16} className="text-emerald-600" />
                Dropoff Customer Information
              </CardTitle>
              <Badge variant="soft" color="success" className="text-[9px] font-bold uppercase">
                Destination
              </Badge>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <h4 className="text-base font-black text-foreground">{order.user?.name || 'Customer'}</h4>
                <p className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                  <MapPin size={13} className="shrink-0 text-muted-foreground/70 mt-0.5" />
                  <span>{formattedAddress}</span>
                </p>
              </div>

              {order.notes && (
                <div className="p-3 rounded-xl bg-muted/40 text-xs text-muted-foreground italic border border-border/40">
                  <span className="font-bold text-foreground not-italic">Customer Note: </span>
                  "{order.notes}"
                </div>
              )}

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
            </CardContent>
          </Card>

          {/* Delivery Rider Card */}
          <Card className="border border-border/60 bg-card overflow-hidden shadow-2xs">
            <CardHeader className="p-5 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black text-foreground flex items-center gap-2">
                <Bike size={16} className="text-primary" />
                Assigned Delivery Partner
              </CardTitle>
              <Badge variant="soft" color="primary" className="text-[9px] font-bold uppercase">
                Courier
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              {order.rider ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-foreground">{order.rider.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Assigned Rider ID: #{order.rider.id}
                    </p>
                  </div>
                  {order.rider.phone && (
                    <div className="pt-1">
                      <a
                        href={`tel:${order.rider.phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-colors"
                      >
                        <Phone size={13} />
                        <span>Call Rider ({order.rider.phone})</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">
                  No delivery rider was assigned to this order or it was completed via direct counter pickup.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ordered Food Items Manifest */}
          <Card className="border border-border/60 bg-card overflow-hidden shadow-2xs">
            <CardHeader className="p-5 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black text-foreground flex items-center gap-2">
                <ShoppingBag size={16} className="text-primary" />
                Ordered Food Items ({order.items?.length || 0})
              </CardTitle>
              <span className="text-xs text-muted-foreground font-semibold">Kitchen Manifest</span>
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
                            {item.foodName || item.itemName || item.name || `Food Item #${idx + 1}`}
                          </p>
                          {item.variantName && (
                            <span className="text-[11px] text-muted-foreground font-semibold">
                              Variant: {item.variantName}
                            </span>
                          )}
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

        {/* Right Column: Financial Payout Ledger & Timestamps */}
        <div className="space-y-6">
          
          {/* Financial Breakdown (What You Get) */}
          <Card className="border border-border/60 bg-card overflow-hidden shadow-2xs">
            <CardHeader className="p-5 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-black text-foreground flex items-center gap-2">
                <Receipt size={16} className="text-primary" />
                Store Payout Statement
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5 text-xs">
              
              <div className="flex justify-between text-muted-foreground">
                <span>Food Items Subtotal</span>
                <span className="font-mono font-bold text-foreground">
                  ৳{foodSubtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-amber-600 dark:text-amber-500 font-semibold">
                <span>Platform Commission Fee</span>
                <span className="font-mono">
                  -৳{platformFee.toFixed(2)}
                </span>
              </div>

              <div className="pt-3 border-t border-border/60 flex justify-between font-black text-base">
                <span className="text-foreground">Net Store Payout:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  +৳{restaurantPayout.toFixed(2)}
                </span>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold leading-relaxed">
                ✓ Payout for this completed order has been added to your merchant wallet balance.
              </div>

            </CardContent>
          </Card>

          {/* Timestamps Card */}
          <Card className="border border-border/60 bg-card overflow-hidden shadow-2xs">
            <CardHeader className="p-5 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-black text-foreground flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                Order Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">Order Placed:</span>
                <span className="font-medium text-foreground text-right">
                  {new Date(order.createdAt).toLocaleDateString()} at{' '}
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">Order Finished:</span>
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

          {/* Return Action */}
          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate('/restaurant/history')}
            leftIcon={<ArrowLeft size={14} />}
            className="font-bold text-xs h-10"
          >
            Return to Order History
          </Button>

        </div>

      </div>

    </div>
  );
}
