import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Tabs, toast } from '../../design-system';
import { ShoppingBag, User, Phone, MapPin, CheckCircle, CookingPot, Check, X, RefreshCw, Loader2, Bike, Eye } from 'lucide-react';
import api from '../../lib/axios';

export default function RestaurantOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/merchant');
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load merchant orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleNewOrder = () => {
      fetchOrders();
    };

    window.addEventListener('NEW_MERCHANT_ORDER', handleNewOrder);
    // Background polling fallback
    const interval = setInterval(fetchOrders, 10000);

    return () => {
      window.removeEventListener('NEW_MERCHANT_ORDER', handleNewOrder);
      clearInterval(interval);
    };
  }, []);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    setActionLoading(orderId);
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status });
      if (res.data?.success) {
        toast.success(`Order #${orderId} updated to ${status}`);
        fetchOrders();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter orders by status categories
  const incomingOrders = orders.filter(o => o.status === 'PENDING');
  const activeOrders = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PREPARING');
  const outForDelivery = orders.filter(o => ['READY', 'RIDER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'DELIVERED' || o.status === 'CANCELLED');

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Order Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Track incoming orders, update preparation status, and monitor payouts.</p>
        </div>
        <button 
          onClick={fetchOrders} 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[10px] font-bold text-foreground cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      <Tabs defaultValue="incoming" className="w-full">
        
        {/* Tabs Bar */}
        <div className="flex border-b border-border/20 mb-6 gap-2">
          <Tabs.Trigger value="incoming" className="pb-3 text-xs font-bold relative px-2 cursor-pointer">
            Incoming ({incomingOrders.length})
            {incomingOrders.length > 0 && (
              <span className="ml-1.5 h-2 w-2 rounded-full bg-rose-500 inline-block animate-pulse" />
            )}
          </Tabs.Trigger>
          <Tabs.Trigger value="active" className="pb-3 text-xs font-bold relative px-2 cursor-pointer">
            Active ({activeOrders.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="delivery" className="pb-3 text-xs font-bold relative px-2 cursor-pointer">
            Out for Delivery ({outForDelivery.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="completed" className="pb-3 text-xs font-bold relative px-2 cursor-pointer">
            Completed/Cancelled
          </Tabs.Trigger>
        </div>

        {/* 1. INCOMING Tab */}
        <Tabs.Content value="incoming" className="space-y-4 outline-none">
          {incomingOrders.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mx-auto opacity-30 mb-3" />
              <p className="text-xs">No incoming orders at the moment.</p>
            </div>
          ) : (
            incomingOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                actionLoading={actionLoading}
                actions={
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      onClick={() => handleUpdateStatus(order.id, 'CANCELLED')} 
                      disabled={actionLoading !== null}
                      variant="outline" 
                      leftIcon={<X className="h-4 w-4" />}
                      className="text-red-500 hover:bg-red-500/5 hover:border-red-500/50 flex-1 sm:flex-none py-2 text-xs"
                    >
                      Reject
                    </Button>
                    <Button 
                      onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')} 
                      disabled={actionLoading !== null}
                      variant="primary" 
                      leftIcon={<Check className="h-4 w-4" />}
                      className="flex-1 sm:flex-none py-2 text-xs font-bold"
                    >
                      Accept Order
                    </Button>
                  </div>
                }
              />
            ))
          )}
        </Tabs.Content>

        {/* 2. ACTIVE Tab */}
        <Tabs.Content value="active" className="space-y-4 outline-none">
          {activeOrders.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mx-auto opacity-30 mb-3" />
              <p className="text-xs">No active orders being prepared.</p>
            </div>
          ) : (
            activeOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                actionLoading={actionLoading}
                actions={
                  <div className="flex gap-2 w-full sm:w-auto">
                    {order.status === 'CONFIRMED' ? (
                      <Button 
                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')} 
                        disabled={actionLoading !== null}
                        variant="primary" 
                        leftIcon={<CookingPot className="h-4 w-4" />}
                        className="w-full sm:w-auto py-2 text-xs font-bold"
                      >
                        Start Cooking
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleUpdateStatus(order.id, 'READY')} 
                        disabled={actionLoading !== null}
                        variant="primary" 
                        leftIcon={<CheckCircle className="h-4 w-4" />}
                        className="w-full sm:w-auto py-2 text-xs font-bold"
                      >
                        Mark Prepared
                      </Button>
                    )}
                  </div>
                }
              />
            ))
          )}
        </Tabs.Content>

        {/* 3. DELIVERY Tab */}
        <Tabs.Content value="delivery" className="space-y-4 outline-none">
          {outForDelivery.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mx-auto opacity-30 mb-3" />
              <p className="text-xs">No orders out for delivery.</p>
            </div>
          ) : (
            outForDelivery.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                actionLoading={actionLoading}
                infoBadge={
                  <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    order.status === 'READY' 
                      ? 'bg-amber-500/10 text-amber-500' 
                      : order.status === 'RIDER_ASSIGNED'
                      ? 'bg-indigo-500/10 text-indigo-500'
                      : 'bg-teal-500/10 text-teal-500'
                  }`}>
                    {order.status === 'READY' ? 'Searching Rider' : order.status === 'RIDER_ASSIGNED' ? 'Rider Assigned' : 'On the Way'}
                  </span>
                }
              />
            ))
          )}
        </Tabs.Content>

        {/* 4. COMPLETED/CANCELLED Tab */}
        <Tabs.Content value="completed" className="space-y-4 outline-none">
          {completedOrders.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mx-auto opacity-30 mb-3" />
              <p className="text-xs">No order history found.</p>
            </div>
          ) : (
            completedOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                actionLoading={actionLoading}
                infoBadge={
                  <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    order.status === 'DELIVERED' 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {order.status}
                  </span>
                }
              />
            ))
          )}
        </Tabs.Content>

      </Tabs>
    </div>
  );
}

// Sub-component: OrderCard
function OrderCard({ order, actions, infoBadge, actionLoading }: { order: any; actions?: React.ReactNode; infoBadge?: React.ReactNode; actionLoading: number | null }) {
  const navigate = useNavigate();

  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
      {actionLoading === order.id && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <CardContent className="p-5 space-y-4">
        
        {/* Header summary info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/10 pb-3 gap-2">
          <div 
            onClick={() => navigate(`/restaurant/history/${order.id}`)}
            className="cursor-pointer group"
          >
            <h3 className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
              Order #{order.id}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Placed by {order.user?.name} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {infoBadge}
            <span className="text-xs font-extrabold text-primary bg-primary/5 px-2.5 py-0.5 rounded-full">
              ৳{parseFloat(order.total).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Customer Address & Delivery notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Deliver to</p>
            <div className="flex items-start gap-1 text-foreground/80 font-medium">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <p className="leading-relaxed">{order.deliveryAddressText?.split(', Lat/Lng:')[0]}</p>
            </div>
            {order.notes && (
              <p className="text-[10px] text-slate-500 italic mt-1 font-medium pl-4.5">"{order.notes}"</p>
            )}
          </div>
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Order Contents</p>
            <div className="space-y-1 pl-1">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs font-medium">
                  <span className="truncate max-w-[200px]">
                    <span className="text-primary font-bold mr-1.5">{item.quantity}×</span>
                    {item.foodName || item.itemName || item.name}
                    {item.variantName && <span className="text-[10px] text-muted-foreground ml-1.5">({item.variantName})</span>}
                  </span>
                  <span className="font-extrabold">৳{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer split splits earnings / action buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 border-t border-border/10 gap-3">
          <div className="text-[10px] text-muted-foreground font-semibold flex gap-3">
            <div>
              <span>Platform Comm: </span>
              <span className="text-foreground font-bold">৳{parseFloat(order.platformCommission || 0).toFixed(2)}</span>
            </div>
            <div>
              <span>Your Net Earnings: </span>
              <span className="text-emerald-500 font-bold">৳{parseFloat(order.restaurantEarnings || 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              size="xs"
              variant="outline"
              onClick={() => navigate(`/restaurant/history/${order.id}`)}
              leftIcon={<Eye size={12} className="text-primary" />}
              className="text-xs font-bold py-1.5 px-3"
            >
              View Details
            </Button>
            {actions}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
