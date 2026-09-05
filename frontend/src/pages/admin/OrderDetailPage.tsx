import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, toast, Select } from '../../design-system';
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
  Percent,
  Star,
  ShieldCheck,
  CreditCard,
  Utensils,
  AlertCircle
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

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      if (res.data?.success && res.data.order) {
        setOrder(res.data.order);
        setNewStatus(res.data.order.status);
      } else {
        toast.error('Could not find order details.');
      }
    } catch (err: any) {
      console.error('Failed to load admin order details:', err);
      toast.error(err.response?.data?.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleUpdateStatus = async () => {
    if (!order || !newStatus || newStatus === order.status) return;
    setUpdatingStatus(true);
    try {
      const res = await api.put(`/orders/${order.id}/status`, { status: newStatus });
      if (res.data?.success) {
        toast.success(`Order #${order.id} status updated to ${newStatus}`);
        setOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err: any) {
      console.error('Failed to update status:', err);
      toast.error(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge variant="success" size="md" className="font-extrabold text-xs">DELIVERED</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger" size="md" className="font-extrabold text-xs">CANCELLED</Badge>;
      case 'ON_THE_WAY':
        return <Badge variant="warning" size="md" className="font-extrabold text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">ON THE WAY</Badge>;
      case 'PICKED_UP':
        return <Badge variant="warning" size="md" className="font-extrabold text-xs bg-indigo-500/10 text-indigo-600 border-indigo-500/20">PICKED UP</Badge>;
      case 'READY':
        return <Badge variant="warning" size="md" className="font-extrabold text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">READY</Badge>;
      case 'PREPARING':
        return <Badge variant="warning" size="md" className="font-extrabold text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">PREPARING</Badge>;
      case 'CONFIRMED':
        return <Badge variant="info" size="md" className="font-extrabold text-xs">CONFIRMED</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="outline" size="md" className="font-extrabold text-xs text-muted-foreground">PENDING</Badge>;
    }
  };

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
          onClick={() => navigate('/admin/orders')}
          leftIcon={<ArrowLeft size={14} />}
          className="font-bold text-xs"
        >
          Back to Orders
        </Button>
        <Card className="p-8 text-center bg-card border-border/40">
          <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground">Order Not Found</h3>
          <p className="text-xs text-muted-foreground mt-1">This order does not exist or could not be loaded.</p>
        </Card>
      </div>
    );
  }

  const items = order.items || [];
  const subtotal = parseFloat(order.subtotal || 0);
  const deliveryFee = parseFloat(order.deliveryFee || 0);
  const tax = parseFloat(order.tax || 0);
  const total = parseFloat(order.total || 0);
  const restaurantEarnings = parseFloat(order.restaurantEarnings || 0);
  const riderEarnings = parseFloat(order.riderEarnings || 0);
  const commission = parseFloat(order.platformCommission || 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12 select-none">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-border/10">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/orders')}
            leftIcon={<ArrowLeft size={14} />}
            className="font-bold text-xs"
          >
            Back to Orders
          </Button>
          <div className="h-4 w-px bg-border/40 hidden sm:block" />
          <span className="text-xs font-black text-muted-foreground hidden sm:inline">
            Platform Orders / #{order.id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrderDetails}
            className="font-bold text-xs"
            leftIcon={<RefreshCw size={13} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Order Header Card */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black text-foreground tracking-tight">Order #{order.id}</h1>
                {getStatusBadge(order.status)}
                <span className="text-xs px-2.5 py-1 rounded-md bg-muted/40 font-bold text-muted-foreground">
                  {order.paymentMethod === 'ONLINE' ? '💳 Online Paid' : '💵 Cash on Delivery'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
                <Calendar size={13} className="text-primary" /> Placed on{' '}
                {new Date(order.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Admin Status Override Box */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-2xl bg-muted/20 border border-border/40 w-full lg:w-auto">
              <span className="text-xs font-black text-foreground shrink-0 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-primary" /> Status Control:
              </span>
              <Select
                value={newStatus}
                onValueChange={(val: string) => setNewStatus(val)}
                className="text-xs font-bold w-full sm:w-44"
                options={[
                  { value: 'PENDING', label: 'PENDING' },
                  { value: 'CONFIRMED', label: 'CONFIRMED' },
                  { value: 'PREPARING', label: 'PREPARING' },
                  { value: 'READY', label: 'READY' },
                  { value: 'RIDER_ASSIGNED', label: 'RIDER_ASSIGNED' },
                  { value: 'PICKED_UP', label: 'PICKED_UP' },
                  { value: 'ON_THE_WAY', label: 'ON_THE_WAY' },
                  { value: 'DELIVERED', label: 'DELIVERED' },
                  { value: 'CANCELLED', label: 'CANCELLED' },
                ]}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpdateStatus}
                disabled={updatingStatus || newStatus === order.status}
                className="font-bold text-xs shrink-0"
              >
                {updatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Update Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3 Parties Info Grid (Customer / Restaurant / Rider) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Information */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-3 border-b border-border/10">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-foreground">
              <User size={16} className="text-primary" /> Customer Info
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Name</p>
              <p className="text-sm font-black text-foreground mt-0.5">{order.user?.name || 'Customer'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Contact Phone</p>
              <p className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                <Phone size={12} className="text-primary" /> {getCustomerPhone(order)}
              </p>
            </div>
            <div className="pt-2 border-t border-border/10">
              <p className="text-xs text-muted-foreground font-semibold">Delivery Address</p>
              <p className="text-xs font-bold text-foreground leading-relaxed mt-1 flex items-start gap-1.5">
                <MapPin size={13} className="text-primary shrink-0 mt-0.5" />
                <span>{formatDeliveryAddress(order)}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Information */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-3 border-b border-border/10">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-foreground">
              <Store size={16} className="text-amber-500" /> Restaurant Info
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Kitchen Name</p>
              <p className="text-sm font-black text-foreground mt-0.5">{order.restaurant?.name || 'Restaurant'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Kitchen Contact</p>
              <p className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                <Phone size={12} className="text-amber-500" /> {order.restaurant?.phone || '+8801750000000'}
              </p>
            </div>
            <div className="pt-2 border-t border-border/10">
              <p className="text-xs text-muted-foreground font-semibold">Merchant Net Earnings</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                ৳{restaurantEarnings.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rider Information */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-3 border-b border-border/10">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-foreground">
              <Bike size={16} className="text-purple-500" /> Courier / Rider Info
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {order.rider ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Assigned Rider</p>
                  <p className="text-sm font-black text-foreground mt-0.5">{order.rider.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Rider Phone</p>
                  <p className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                    <Phone size={12} className="text-purple-500" /> {order.rider.phone || '+8801571323156'}
                  </p>
                </div>
                <div className="pt-2 border-t border-border/10">
                  <p className="text-xs text-muted-foreground font-semibold">Rider Delivery Payout</p>
                  <p className="text-sm font-black text-purple-600 dark:text-purple-400 mt-0.5">
                    ৳{riderEarnings.toFixed(2)}
                  </p>
                </div>
              </>
            ) : (
              <div className="py-6 text-center space-y-2 text-muted-foreground">
                <Bike className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="text-xs font-semibold">No rider assigned yet</p>
                <p className="text-[10px]">Waiting for courier match or dispatch.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items Table & Financial Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <ShoppingBag size={18} className="text-primary" /> Ordered Dishes & Recipes ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/20 text-muted-foreground uppercase font-black text-[10px] tracking-wider border-b border-border/10">
                    <tr>
                      <th className="px-6 py-3.5">Item</th>
                      <th className="px-4 py-3.5 text-center">Qty</th>
                      <th className="px-4 py-3.5 text-right">Unit Price</th>
                      <th className="px-6 py-3.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10 font-medium text-foreground">
                    {items.map((item: any) => {
                      const itemPrice = parseFloat(item.price || 0);
                      const lineTotal = itemPrice * item.quantity;
                      return (
                        <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-extrabold text-xs text-foreground">{item.foodName}</p>
                            {item.variantName && (
                              <p className="text-[10px] text-primary font-bold mt-0.5">
                                Variant: {item.variantName}
                              </p>
                            )}
                            {item.addons && item.addons.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.addons.map((ad: any, i: number) => (
                                  <span
                                    key={i}
                                    className="text-[9px] font-bold bg-muted/40 text-muted-foreground px-1.5 py-0.5 rounded border border-border/30"
                                  >
                                    +{ad.addonName} (৳{parseFloat(ad.price).toFixed(2)})
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center font-bold">{item.quantity}</td>
                          <td className="px-4 py-4 text-right font-semibold">৳{itemPrice.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-black">৳{lineTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Customer Reviews & Feedback Section */}
          {order.review ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  Verified Customer Reviews & Ratings
                </h3>
                <span className="text-xs font-bold text-muted-foreground">
                  Order #{order.id} Review
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Restaurant & Food Review Card */}
                <Card className="border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card">
                  <CardHeader className="pb-3 border-b border-amber-500/15">
                    <CardTitle className="text-xs font-black flex items-center justify-between text-amber-700 dark:text-amber-300">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                          <Utensils className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-foreground">{order.restaurant?.name || 'Restaurant Food'}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold">Kitchen & Taste Rating</p>
                        </div>
                      </div>
                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                        {order.review.foodRating}.0 / 5.0 ★
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {order.review.foodReview ? (
                      <p className="text-xs text-foreground/90 italic font-medium bg-card/80 p-3 rounded-xl border border-border/40 leading-relaxed">
                        "{order.review.foodReview}"
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No written comment provided.</p>
                    )}
                    {order.review.foodTags && order.review.foodTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {order.review.foodTags.map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-200 px-2.5 py-0.5 rounded-md border border-amber-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 2. Courier & Delivery Review Card */}
                {order.review.riderRating ? (
                  <Card className="border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-card to-card">
                    <CardHeader className="pb-3 border-b border-purple-500/15">
                      <CardTitle className="text-xs font-black flex items-center justify-between text-purple-700 dark:text-purple-300">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                            <Bike className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground">{order.rider?.name || 'Delivery Courier'}</p>
                            <p className="text-[10px] text-muted-foreground font-semibold">Courier & Handling Rating</p>
                          </div>
                        </div>
                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-800 dark:text-purple-200 border border-purple-500/30">
                          {order.review.riderRating}.0 / 5.0 ★
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {order.review.riderReview ? (
                        <p className="text-xs text-foreground/90 italic font-medium bg-card/80 p-3 rounded-xl border border-border/40 leading-relaxed">
                          "{order.review.riderReview}"
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No written comment provided.</p>
                      )}
                      {order.review.riderTags && order.review.riderTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {order.review.riderTags.map((tag: string, i: number) => (
                            <span
                              key={i}
                              className="text-[10px] font-bold bg-purple-500/15 text-purple-800 dark:text-purple-200 px-2.5 py-0.5 rounded-md border border-purple-500/20"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-border/40 bg-card p-5 flex flex-col items-center justify-center text-center space-y-1 text-muted-foreground">
                    <Bike className="h-6 w-6 text-muted-foreground/40 mb-1" />
                    <p className="text-xs font-bold text-foreground">No Courier Review</p>
                    <p className="text-[10px]">Customer did not rate the delivery courier separately.</p>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card className="border border-border/40 bg-muted/10 p-5 text-center space-y-1.5">
              <Star className="h-6 w-6 text-muted-foreground/30 mx-auto" />
              <p className="text-xs font-bold text-foreground">No Customer Review Yet</p>
              <p className="text-[11px] text-muted-foreground">
                The customer has not submitted a rating or review for this order yet.
              </p>
            </Card>
          )}
        </div>

        {/* Financial & Split Breakdown */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-foreground">
                <Receipt size={16} className="text-primary" /> Financial Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="flex justify-between text-muted-foreground font-semibold">
                <span>Subtotal</span>
                <span className="font-bold text-foreground">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground font-semibold">
                <span>Delivery Fee</span>
                <span className="font-bold text-foreground">৳{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground font-semibold">
                <span>Tax & VAT</span>
                <span className="font-bold text-foreground">৳{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-foreground pt-3 border-t border-border/20">
                <span>Total Amount</span>
                <span className="text-primary">৳{total.toFixed(2)}</span>
              </div>

              {/* Commission & Settlement Split Box */}
              <div className="mt-4 pt-3.5 border-t border-dashed border-border/30 space-y-2.5 bg-muted/20 p-3.5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-wider font-black text-muted-foreground">
                    Revenue Split Distribution
                  </p>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    Live Split
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Percent size={12} className="text-amber-500" /> Platform Cut:
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">৳{commission.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Receipt size={12} className="text-blue-500" /> Tax & VAT (Platform):
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">৳{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black pt-1.5 border-t border-border/20 text-foreground">
                    <span className="flex items-center gap-1.5 text-primary">
                      <TrendingUp size={12} /> Total Platform Net:
                    </span>
                    <span className="text-primary font-black">৳{(commission + tax).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-dashed border-border/20">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Store size={12} className="text-emerald-500" /> Merchant Net Payable:
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">৳{restaurantEarnings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Bike size={12} className="text-purple-500" /> Rider Delivery Payout:
                    </span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">৳{riderEarnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
