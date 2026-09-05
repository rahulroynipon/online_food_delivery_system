import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, toast } from '../../design-system';
import { 
  Bike, 
  MapPin, 
  Store, 
  Phone, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Navigation, 
  Loader2, 
  AlertTriangle, 
  Check, 
  X, 
  RefreshCw,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import api from '../../lib/axios';

export default function RiderDeliveriesPage() {
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchRiderOrders = async () => {
    try {
      const res = await api.get('/orders/rider');
      if (res.data?.success) {
        setAssignedOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load active orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderOrders();
    const interval = setInterval(fetchRiderOrders, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRiderResponse = async (orderId: number, action: 'ACCEPT' | 'REJECT') => {
    setActionLoading(orderId);
    try {
      const res = await api.put(`/orders/${orderId}/rider-response`, { action });
      if (res.data?.success) {
        toast.success(action === 'ACCEPT' ? 'Order accepted! Navigate to restaurant.' : 'Order assignment rejected.');
        fetchRiderOrders();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit response.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    setActionLoading(orderId);
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status });
      if (res.data?.success) {
        toast.success(`Status updated to: ${status}`);
        fetchRiderOrders();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-semibold">Loading active tasks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Active Deliveries</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your active pickup runs, customer navigation, and cash handovers.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchRiderOrders}
          leftIcon={<RefreshCw size={13} />}
          className="font-bold text-xs"
        >
          Refresh Tasks
        </Button>
      </div>

      {assignedOrders.length === 0 ? (
        <Card className="border-dashed border-2 border-border/70 bg-card/40">
          <CardContent className="py-20 text-center space-y-3">
            <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Bike size={32} className="animate-bounce" />
            </div>
            <h3 className="text-base font-extrabold text-foreground">No Deliveries in Progress</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              You are currently online. When food is prepared by a merchant in your zone, you will be automatically matched.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {assignedOrders.map((order) => {
            const isAssigned = order.status === 'RIDER_ASSIGNED';
            const isWay = order.status === 'ON_THE_WAY';
            const isPicked = order.status === 'PICKED_UP';

            return (
              <Card key={order.id} className="border border-border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden">
                {actionLoading === order.id && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center z-20">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}

                {/* Card Title / Summary Header */}
                <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm">
                      #{order.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-foreground">Order #{order.id}</h3>
                        <Badge variant="soft" color="primary" className="text-[10px] font-bold">
                          Fee: ৳{parseFloat(order.riderEarnings || 0).toFixed(2)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Restaurant: <span className="font-bold text-foreground">{order.restaurant?.name}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="soft" color={order.paymentMethod === 'COD' ? 'warning' : 'success'} className="font-extrabold text-xs px-3 py-1 uppercase">
                      {order.paymentMethod === 'COD' ? `Collect Cash: ৳${parseFloat(order.total || 0).toFixed(2)}` : 'Prepaid Online'}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6 space-y-6">
                  
                  {/* Status Pipeline Progress Indicator */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold select-none">
                    <div className={`p-2.5 rounded-xl border transition-all ${
                      isAssigned ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'bg-muted/30 text-muted-foreground border-border/50'
                    }`}>
                      1. Job Assigned
                    </div>
                    <div className={`p-2.5 rounded-xl border transition-all ${
                      isWay ? 'bg-primary text-primary-foreground border-primary shadow-xs' : isPicked ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-muted/30 text-muted-foreground border-border/50'
                    }`}>
                      2. Restaurant Pickup
                    </div>
                    <div className={`p-2.5 rounded-xl border transition-all ${
                      isPicked ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'bg-muted/30 text-muted-foreground border-border/50'
                    }`}>
                      3. Customer Dropoff
                    </div>
                  </div>

                  {/* Accept / Reject Decision */}
                  {isAssigned && (
                    <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-extrabold text-foreground">New Incoming Delivery Assignment</h4>
                        <p className="text-xs text-muted-foreground">
                          Do you want to accept this delivery? You will earn ৳{parseFloat(order.riderEarnings || 0).toFixed(2)} on completion.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRiderResponse(order.id, 'REJECT')}
                          className="flex-1 sm:flex-none text-rose-500 hover:bg-rose-500/10 font-bold"
                        >
                          Reject Job
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleRiderResponse(order.id, 'ACCEPT')}
                          className="flex-1 sm:flex-none font-bold"
                          leftIcon={<Check size={14} />}
                        >
                          Accept & Start Delivery
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Operational Directions & Action Blocks */}
                  {!isAssigned && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Pickup Info */}
                      <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
                        isWay ? 'border-primary/40 bg-primary/5 ring-2 ring-primary/10' : 'border-border/60 bg-muted/20 opacity-70'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                            <Store size={15} /> Store Pickup Location
                          </span>
                          {isPicked && <Badge variant="soft" color="success">Collected</Badge>}
                        </div>

                        <div>
                          <h4 className="text-sm font-extrabold text-foreground">{order.restaurant?.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {order.restaurant?.address || 'Restaurant address coordinate'}
                          </p>
                        </div>

                        {order.restaurant?.phone && (
                          <div className="flex items-center gap-2 pt-1">
                            <a
                              href={`tel:${order.restaurant.phone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors"
                            >
                              <Phone size={12} className="text-primary" />
                              <span>Call Store: {order.restaurant.phone}</span>
                            </a>
                          </div>
                        )}

                        {isWay && (
                          <Button
                            size="sm"
                            variant="primary"
                            fullWidth
                            onClick={() => handleUpdateStatus(order.id, 'PICKED_UP')}
                            className="font-extrabold text-xs mt-2 py-2"
                          >
                            Mark Picked Up (Food in Bag)
                          </Button>
                        )}
                      </div>

                      {/* Dropoff Info */}
                      <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
                        isPicked ? 'border-primary/40 bg-primary/5 ring-2 ring-primary/10' : 'border-border/60 bg-muted/20 opacity-70'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                            <MapPin size={15} /> Customer Destination
                          </span>
                          <span className="text-xs font-extrabold text-foreground">
                            {order.paymentMethod === 'COD' ? 'Cash Collection' : 'Prepaid'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-extrabold text-foreground">{order.user?.name || 'Customer'}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {order.deliveryAddressText?.split(', Lat/Lng:')[0] || order.deliveryAddressText || 'Customer destination'}
                          </p>
                        </div>

                        {order.user?.phone && (
                          <div className="flex items-center gap-2 pt-1">
                            <a
                              href={`tel:${order.user.phone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors"
                            >
                              <Phone size={12} className="text-primary" />
                              <span>Call Customer: {order.user.phone}</span>
                            </a>
                          </div>
                        )}

                        {isPicked && (
                          <div className="space-y-2 pt-2">
                            {order.paymentMethod === 'COD' && (
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-400">
                                ⚠️ Collect ৳{parseFloat(order.total).toFixed(2)} in physical cash before handing over the food parcel.
                              </div>
                            )}

                            <Button
                              size="sm"
                              variant="primary"
                              fullWidth
                              onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                              className="font-extrabold text-xs py-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Mark Delivered & Collect Fee ৳{parseFloat(order.riderEarnings || 0).toFixed(2)}
                            </Button>
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* Order Items manifest */}
                  {order.items && order.items.length > 0 && (
                    <div className="pt-2 border-t border-border/40">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        Food Items in Bag ({order.items.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((it: any) => (
                          <span key={it.id} className="text-xs bg-muted/40 border border-border/50 px-2.5 py-1 rounded-lg font-semibold text-foreground">
                            {it.quantity}x {it.foodName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
