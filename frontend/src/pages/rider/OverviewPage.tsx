import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, toast } from '../../design-system';
import { 
  Bike, 
  MapPin, 
  Store, 
  Phone, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Wallet, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  TrendingUp, 
  Package, 
  ShieldCheck,
  Check,
  X,
  Map as MapIcon,
  Compass
} from 'lucide-react';
import api from '../../lib/axios';
import DeliveryRouteMap from '../../components/rider/DeliveryRouteMap';

const formatDeliveryAddress = (order: any): string => {
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

export default function RiderOverviewPage() {
  const navigate = useNavigate();
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [wallet, setWallet] = useState<{ balance: number; transactions: any[] }>({ balance: 0, transactions: [] });
  const [riderProfile, setRiderProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [activeRes, histRes, walletRes, profileRes] = await Promise.all([
        api.get('/orders/rider'),
        api.get('/orders/rider?history=true'),
        api.get('/wallets/balance'),
        api.get('/onboarding/my-rider')
      ]);

      if (activeRes.data?.success) setActiveOrders(activeRes.data.orders || []);
      if (histRes.data?.success) setHistoryOrders(histRes.data.orders || []);
      if (walletRes.data?.success) {
        setWallet({
          balance: parseFloat(walletRes.data.walletBalance || 0),
          transactions: walletRes.data.transactions || []
        });
      }
      if (profileRes.data?.success) setRiderProfile(profileRes.data.rider);
    } catch (err) {
      console.error('Failed to load rider overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);

    const handleNewOrder = () => {
      fetchData();
    };
    window.addEventListener('NEW_RIDER_ORDER', handleNewOrder);

    return () => {
      clearInterval(interval);
      window.removeEventListener('NEW_RIDER_ORDER', handleNewOrder);
    };
  }, []);

  const handleRiderResponse = async (orderId: number, action: 'ACCEPT' | 'REJECT') => {
    setActionLoading(orderId);
    try {
      const res = await api.put(`/orders/${orderId}/rider-response`, { action });
      if (res.data?.success) {
        toast.success(action === 'ACCEPT' ? 'Order accepted! Navigate to restaurant pickup.' : 'Order assignment rejected.');
        fetchData();
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
        toast.success(`Delivery status updated to: ${status}`);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setActionLoading(null);
    }
  };

  const completedCount = historyOrders.filter((o: any) => o.status === 'DELIVERED').length;
  const totalEarned = historyOrders
    .filter((o: any) => o.status === 'DELIVERED')
    .reduce((acc, curr) => acc + (parseFloat(curr.riderEarnings) || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-semibold">Loading rider dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/15 relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <Badge variant="solid" color="primary" className="text-[10px] font-black uppercase px-2 py-0.5">
              Rider Online
            </Badge>
            <span className="text-xs text-muted-foreground font-semibold">Vehicle: {riderProfile?.vehicleType || 'MOTORBIKE'}</span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Welcome, {riderProfile?.user?.name || 'Rider'}! 🏍️
          </h1>
          <p className="text-xs text-muted-foreground">
            You are ready to receive delivery jobs. Keep this tab active to hear incoming order audio alerts.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Button
            size="sm"
            onClick={() => navigate('/rider/deliveries')}
            variant="primary"
            className="font-bold shadow-xs"
            rightIcon={<ArrowRight size={14} />}
          >
            Active Deliveries ({activeOrders.length})
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Deliveries */}
        <Card className="border border-border/60 bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Tasks</span>
              <h3 className="text-2xl font-black text-foreground">{activeOrders.length}</h3>
              <p className="text-[10px] text-muted-foreground font-medium">Orders in delivery pipeline</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Package size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Completed Deliveries */}
        <Card className="border border-border/60 bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Delivered</span>
              <h3 className="text-2xl font-black text-foreground">{completedCount}</h3>
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 size={11} /> Completed trips
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Total Earnings */}
        <Card className="border border-border/60 bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Earnings</span>
              <h3 className="text-2xl font-black text-foreground">৳{totalEarned.toFixed(2)}</h3>
              <p className="text-[10px] text-muted-foreground font-medium">Accumulated trip fees</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <TrendingUp size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Wallet Balance */}
        <Card className="border border-border/60 bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Ledger Balance</span>
              <h3 className={`text-2xl font-black ${wallet.balance < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                ৳{wallet.balance.toFixed(2)}
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium">
                {wallet.balance < 0 ? 'Cash in hand to settle' : 'Available for payout'}
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Wallet size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Deliveries / Incoming Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-foreground tracking-tight">Active Delivery Requests</h2>
            <p className="text-xs text-muted-foreground">Orders assigned to you requiring immediate action</p>
          </div>
          {activeOrders.length > 0 && (
            <span className="text-xs font-bold text-primary px-2.5 py-1 bg-primary/10 rounded-full border border-primary/20">
              {activeOrders.length} In Progress
            </span>
          )}
        </div>

        {activeOrders.length === 0 ? (
          <Card className="border-dashed border-2 border-border/70 bg-card/40">
            <CardContent className="py-16 text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
                <Bike size={28} className="animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-foreground">Waiting for New Delivery Orders</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When a nearby restaurant marks an order ready, you will receive an instant audio chime and assignment card here.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeOrders.map((order) => {
              const isAssigned = order.status === 'RIDER_ASSIGNED';
              const isWay = order.status === 'ON_THE_WAY';
              const isPicked = order.status === 'PICKED_UP';

              const pickupLocation = {
                lat: parseFloat(order.restaurant?.latitude) || 23.8103,
                lng: parseFloat(order.restaurant?.longitude) || 90.4125,
                name: order.restaurant?.name || 'Restaurant',
                address: order.restaurant?.address || 'Store Location',
                phone: order.restaurant?.phone
              };

              const dropoffLocation = {
                lat: parseFloat(order.deliveryLatitude) || (pickupLocation.lat + 0.015),
                lng: parseFloat(order.deliveryLongitude) || (pickupLocation.lng + 0.012),
                name: order.user?.name || 'Customer',
                address: formatDeliveryAddress(order),
                phone: order.user?.phone
              };

              return (
                <Card key={order.id} className="border border-border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden">
                  {actionLoading === order.id && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center z-20">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}

                  {/* Header Row */}
                  <div className="px-6 py-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-3 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                        #{order.id}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-foreground">{order.restaurant?.name || 'Restaurant'}</h4>
                        <p className="text-[10px] text-muted-foreground">Order ID: #{order.id} • {order.items?.length || 0} items</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="soft" color="primary" className="font-extrabold text-xs px-3 py-1">
                        Fee: ৳{parseFloat(order.riderEarnings || 0).toFixed(2)}
                      </Badge>
                      <Badge variant="soft" color={order.paymentMethod === 'COD' ? 'warning' : 'success'} className="font-bold text-[10px] uppercase px-2.5 py-1">
                        {order.paymentMethod === 'COD' ? `COD: ৳${parseFloat(order.total || 0).toFixed(2)}` : 'Prepaid'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/rider/deliveries?orderId=${order.id}`)}
                        className="text-xs font-black py-1 px-2.5 ml-1 hidden sm:inline-flex"
                      >
                        View Order
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-6">
                    {/* Incoming Decision Banner */}
                    {isAssigned && (
                      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-foreground">New Assignment Request</h4>
                          <p className="text-[11px] text-muted-foreground">
                            Restaurant has prepared the food. Accept this job to start pickup.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRiderResponse(order.id, 'REJECT')}
                            className="flex-1 sm:flex-none text-rose-500 hover:bg-rose-500/10 font-bold"
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleRiderResponse(order.id, 'ACCEPT')}
                            className="flex-1 sm:flex-none font-bold"
                            leftIcon={<Check size={14} />}
                          >
                            Accept Job
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Interactive Live Route Map with Distance, ETA & Navigation */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <MapIcon size={14} className="text-primary" />
                          <h4 className="text-xs font-black uppercase text-foreground tracking-wider">
                            Live Route & ETA
                          </h4>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          {isWay ? 'Step 1: Heading to Store' : isPicked ? 'Step 2: Delivering to Customer' : 'Route Overview'}
                        </span>
                      </div>

                      <DeliveryRouteMap
                        orderId={order.id}
                        pickup={pickupLocation}
                        dropoff={dropoffLocation}
                        initialRiderLocation={
                          riderProfile?.currentLatitude && riderProfile?.currentLongitude
                            ? { lat: parseFloat(riderProfile.currentLatitude), lng: parseFloat(riderProfile.currentLongitude) }
                            : null
                        }
                        currentStatus={order.status}
                        height="320px"
                      />
                    </div>

                    {/* Step routing cards */}
                    {!isAssigned && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Step 1: Store Pickup */}
                        <div className={`p-4 rounded-2xl border transition-all ${
                          isWay ? 'border-primary/40 bg-primary/5 ring-2 ring-primary/10' : 'border-border/60 bg-muted/20 opacity-70'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                              <Store size={13} /> 1. Store Pickup
                            </span>
                            {isPicked && (
                              <Badge variant="soft" color="success" className="text-[9px] font-bold">
                                Picked Up
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-foreground">{order.restaurant?.name}</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                            {order.restaurant?.address || 'Restaurant address'}
                          </p>
                          {order.restaurant?.phone && (
                            <p className="text-[10px] text-primary font-semibold mt-1 flex items-center gap-1">
                              <Phone size={10} /> {order.restaurant.phone}
                            </p>
                          )}

                          {isWay && (
                            <Button
                              size="sm"
                              variant="primary"
                              fullWidth
                              onClick={() => handleUpdateStatus(order.id, 'PICKED_UP')}
                              className="mt-3 font-bold text-xs"
                            >
                              Mark Picked Up
                            </Button>
                          )}
                        </div>

                        {/* Step 2: Customer Dropoff */}
                        <div className={`p-4 rounded-2xl border transition-all ${
                          isPicked ? 'border-emerald-500/40 bg-emerald-500/5 ring-2 ring-emerald-500/15' : 'border-border/60 bg-muted/20 opacity-80'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1.5">
                              <MapPin size={13} /> 2. Customer Dropoff
                            </span>
                            <span className="text-[10px] font-extrabold text-foreground">
                              {order.paymentMethod === 'COD' ? 'Collect Cash' : 'Online Paid'}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-foreground">{order.user?.name || 'Customer'}</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                            {formatDeliveryAddress(order)}
                          </p>

                          <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                            <a
                              href={`tel:${order.user?.phone || '+8801571323156'}`}
                              className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-black hover:underline"
                            >
                              <Phone size={12} className="fill-current" />
                              <span>Customer: {order.user?.phone || '+880 1571-323156'}</span>
                            </a>
                            <a
                              href={`https://wa.me/${(order.user?.phone || '+8801571323156').replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-muted-foreground hover:text-foreground"
                            >
                              💬 WhatsApp
                            </a>
                          </div>

                          {isPicked && (
                            <Button
                              size="sm"
                              variant="primary"
                              fullWidth
                              onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                              className="mt-3 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            >
                              Mark Delivered ({order.paymentMethod === 'COD' ? `Collect ৳${parseFloat(order.total).toFixed(2)}` : 'Handover'})
                            </Button>
                          )}
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

    </div>
  );
}
