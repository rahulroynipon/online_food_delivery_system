import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  ArrowRight, 
  ArrowLeft,
  Map as MapIcon, 
  Compass,
  Eye,
  ChevronRight,
  ListFilter,
  ExternalLink,
  ShieldCheck,
  Package,
  Zap,
  Radio,
  Sparkles,
  Route as RouteIcon
} from 'lucide-react';
import api from '../../lib/axios';
import DeliveryRouteMap from '../../components/rider/DeliveryRouteMap';

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

export default function RiderDeliveriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [riderProfile, setRiderProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PICKUP' | 'DELIVERY'>('ALL');

  // Selected Order for Detail View
  const initialOrderId = searchParams.get('orderId') ? parseInt(searchParams.get('orderId')!, 10) : null;
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(initialOrderId);

  const fetchRiderOrders = async () => {
    try {
      const res = await api.get('/orders/rider');
      if (res.data?.success) {
        const orders = res.data.orders || [];
        setAssignedOrders(orders);
        if (res.data.rider) {
          setRiderProfile(res.data.rider);
        }

        // If selectedOrderId is set but order is not found/completed, reset it
        if (selectedOrderId && !orders.some((o: any) => o.id === selectedOrderId)) {
          setSelectedOrderId(null);
        }
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

    const handleNewOrder = () => {
      fetchRiderOrders();
    };
    window.addEventListener('NEW_RIDER_ORDER', handleNewOrder);

    return () => {
      clearInterval(interval);
      window.removeEventListener('NEW_RIDER_ORDER', handleNewOrder);
    };
  }, []);

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setSearchParams({ orderId: String(orderId) });
  };

  const handleBackToList = () => {
    setSelectedOrderId(null);
    setSearchParams({});
  };

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

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'PICKUP') {
      return assignedOrders.filter(o => o.status === 'RIDER_ASSIGNED' || o.status === 'ON_THE_WAY');
    }
    if (statusFilter === 'DELIVERY') {
      return assignedOrders.filter(o => o.status === 'PICKED_UP');
    }
    return assignedOrders;
  }, [assignedOrders, statusFilter]);

  const totalEarningsInQueue = useMemo(() => {
    return assignedOrders.reduce((acc, curr) => acc + (parseFloat(curr.riderEarnings) || 0), 0);
  }, [assignedOrders]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="relative">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-spin">
            <Loader2 size={24} />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-primary/20 blur-sm animate-pulse"></div>
        </div>
        <span className="text-xs text-muted-foreground font-black tracking-wider uppercase">Loading Dispatch Control...</span>
      </div>
    );
  }

  // Active focused order (if selected)
  const selectedOrder = assignedOrders.find((o) => o.id === selectedOrderId);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      
      {/* ========================================================================= */}
      {/* SCENARIO 1: PRO COMMAND CENTER DUAL-COLUMN ORDER VIEW */}
      {/* ========================================================================= */}
      {selectedOrder ? (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Command Breadcrumb Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBackToList}
                leftIcon={<ArrowLeft size={14} />}
                className="font-bold text-xs bg-muted/30 hover:bg-muted"
              >
                Back to List ({assignedOrders.length})
              </Button>

              <div className="h-5 w-px bg-border/80 hidden sm:block"></div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-black text-xs shadow-2xs">
                  #{selectedOrder.id}
                </div>
                <h2 className="text-base font-black text-foreground">{selectedOrder.restaurant?.name}</h2>
                
                <Badge variant="soft" color="primary" className="text-xs font-black px-2.5 py-0.5">
                  Fee: ৳{parseFloat(selectedOrder.riderEarnings || 0).toFixed(2)}
                </Badge>
                
                <Badge variant="soft" color={selectedOrder.paymentMethod === 'COD' ? 'warning' : 'success'} className="text-[10px] font-extrabold uppercase px-2 py-0.5">
                  {selectedOrder.paymentMethod === 'COD' ? `COD: ৳${parseFloat(selectedOrder.total || 0).toFixed(2)}` : 'Prepaid Online'}
                </Badge>

                <a
                  href={`tel:${selectedOrder.user?.phone || '+8801571323156'}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold hover:bg-emerald-500/20 transition-colors shadow-2xs"
                  title="Direct call customer"
                >
                  <Phone size={12} className="text-emerald-600 dark:text-emerald-400 fill-current" />
                  <span>{selectedOrder.user?.name || 'Customer'}: {selectedOrder.user?.phone || '+8801571323156'}</span>
                </a>
              </div>
            </div>

            {/* Quick Order Switcher */}
            {assignedOrders.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 bg-muted/20 p-1.5 rounded-2xl border border-border/50">
                <span className="text-[10px] font-black uppercase text-muted-foreground px-2">Switch Task:</span>
                {assignedOrders.map((ord) => (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => handleSelectOrder(ord.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                      ord.id === selectedOrder.id
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    #{ord.id}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Focused Order Dual-Column Command Center */}
          {(() => {
            const isAssigned = selectedOrder.status === 'RIDER_ASSIGNED';
            const isWay = selectedOrder.status === 'ON_THE_WAY';
            const isPicked = selectedOrder.status === 'PICKED_UP';

            const pickupLocation = {
              lat: parseFloat(selectedOrder.restaurant?.latitude) || 23.8103,
              lng: parseFloat(selectedOrder.restaurant?.longitude) || 90.4125,
              name: selectedOrder.restaurant?.name || 'Restaurant',
              address: selectedOrder.restaurant?.address || 'Store Location',
              phone: selectedOrder.restaurant?.phone
            };

            const dropoffLocation = {
              lat: parseFloat(selectedOrder.deliveryLatitude) || (pickupLocation.lat + 0.015),
              lng: parseFloat(selectedOrder.deliveryLongitude) || (pickupLocation.lng + 0.012),
              name: selectedOrder.user?.name || 'Customer',
              address: formatDeliveryAddress(selectedOrder),
              phone: selectedOrder.user?.phone
            };

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ------------------------------------------------------------- */}
                {/* LEFT 7 COLS: INTERACTIVE ROAD MAP & LIVE NAVIGATION */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Status Pipeline Progress Stepper */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-black select-none p-2 bg-card rounded-2xl border border-border shadow-xs">
                    <div className={`p-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                      isAssigned ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'bg-muted/20 text-muted-foreground border-transparent'
                    }`}>
                      <span>1. Assigned</span>
                    </div>
                    <div className={`p-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                      isWay ? 'bg-primary text-primary-foreground border-primary shadow-xs' : isPicked ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-muted/20 text-muted-foreground border-transparent'
                    }`}>
                      <span>2. Store Pickup</span>
                    </div>
                    <div className={`p-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                      isPicked ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'bg-muted/20 text-muted-foreground border-transparent'
                    }`}>
                      <span>3. Dropoff</span>
                    </div>
                  </div>

                  {/* Accept / Reject Decision Banner if New Assignment */}
                  {isAssigned && (
                    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-primary animate-ping"></span>
                          <h4 className="text-xs font-black text-foreground uppercase tracking-wider">New Incoming Delivery Task</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Accept job to start live navigation. Fee: <strong className="text-foreground">৳{parseFloat(selectedOrder.riderEarnings || 0).toFixed(2)}</strong>.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRiderResponse(selectedOrder.id, 'REJECT')}
                          className="flex-1 sm:flex-none text-rose-500 hover:bg-rose-500/10 font-black text-xs"
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleRiderResponse(selectedOrder.id, 'ACCEPT')}
                          className="flex-1 sm:flex-none font-black text-xs shadow-md"
                          leftIcon={<Check size={14} />}
                        >
                          Accept & Start
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Full Interactive Live Route Map */}
                  <div className="relative">
                    <DeliveryRouteMap
                      orderId={selectedOrder.id}
                      pickup={pickupLocation}
                      dropoff={dropoffLocation}
                      initialRiderLocation={
                        riderProfile?.currentLatitude && riderProfile?.currentLongitude
                          ? { lat: parseFloat(riderProfile.currentLatitude), lng: parseFloat(riderProfile.currentLongitude) }
                          : null
                      }
                      currentStatus={selectedOrder.status}
                      height="540px"
                    />
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT 5 COLS: COMMAND PANEL (ACTIONS, PICKUP, DROPOFF, BAG) */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Immediate Action Execution Card */}
                  {!isAssigned && (
                    <Card className="border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card shadow-md">
                      <CardContent className="p-5 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                            <Zap size={13} /> Current Stage Action
                          </span>
                          <Badge variant="soft" color={isWay ? 'warning' : 'success'} className="text-[10px] font-black uppercase">
                            {isWay ? 'Pickup Pending' : 'Dropoff Pending'}
                          </Badge>
                        </div>

                        {isWay && (
                          <div className="space-y-3">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Ride to <strong className="text-foreground">{selectedOrder.restaurant?.name}</strong>, collect parcel, then confirm pickup below.
                            </p>
                            <Button
                              size="lg"
                              variant="primary"
                              fullWidth
                              disabled={actionLoading === selectedOrder.id}
                              onClick={() => handleUpdateStatus(selectedOrder.id, 'PICKED_UP')}
                              className="font-black text-xs py-3.5 shadow-lg bg-gradient-to-r from-primary to-[#f43f5e] hover:opacity-95"
                              leftIcon={actionLoading === selectedOrder.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            >
                              Mark Picked Up (Food in Bag)
                            </Button>
                          </div>
                        )}

                        {isPicked && (
                          <div className="space-y-3">
                            {selectedOrder.paymentMethod === 'COD' ? (
                              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs font-black text-amber-700 dark:text-amber-400 leading-snug">
                                ⚠️ Cash on Delivery: Collect physically ৳{parseFloat(selectedOrder.total).toFixed(2)} cash from customer before handing over food!
                              </div>
                            ) : (
                              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs font-black text-emerald-700 dark:text-emerald-400">
                                ✓ Prepaid Online Order — No cash collection needed.
                              </div>
                            )}

                            <Button
                              size="lg"
                              variant="primary"
                              fullWidth
                              disabled={actionLoading === selectedOrder.id}
                              onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                              className="font-black text-xs py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25"
                              leftIcon={actionLoading === selectedOrder.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            >
                              Mark Delivered & Collect Fee ৳{parseFloat(selectedOrder.riderEarnings || 0).toFixed(2)}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 1: Restaurant Pickup Location Card */}
                  <Card className={`border transition-all ${
                    isWay ? 'border-amber-500/40 bg-card ring-2 ring-amber-500/15 shadow-sm' : 'border-border/60 bg-muted/15 opacity-85'
                  }`}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1.5">
                          <Store size={14} /> 1. Store Pickup Location
                        </span>
                        {isPicked && <Badge variant="soft" color="success" className="text-[9px] font-black">Food Collected</Badge>}
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-foreground">{selectedOrder.restaurant?.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {selectedOrder.restaurant?.address || 'Restaurant address coordinate'}
                        </p>
                      </div>

                      {selectedOrder.restaurant?.phone && (
                        <div className="pt-1">
                          <a
                            href={`tel:${selectedOrder.restaurant.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border hover:bg-muted text-xs font-bold text-foreground transition-colors shadow-2xs"
                          >
                            <Phone size={12} className="text-amber-600 fill-current" />
                            <span>Call Store: {selectedOrder.restaurant.phone}</span>
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Step 2: Customer Destination Card */}
                  <Card className={`border transition-all ${
                    isPicked ? 'border-emerald-500/50 bg-card ring-2 ring-emerald-500/20 shadow-md' : 'border-border/60 bg-muted/15 opacity-85'
                  }`}>
                    <CardContent className="p-5 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1.5">
                          <MapPin size={14} /> 2. Customer Destination
                        </span>
                        <span className="text-[10px] font-black text-foreground">
                          {selectedOrder.paymentMethod === 'COD' ? `COD: ৳${parseFloat(selectedOrder.total).toFixed(2)}` : 'Prepaid Online'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-foreground">{selectedOrder.user?.name || 'Customer'}</h4>
                          <Badge variant="soft" color="success" className="text-[9px] font-black uppercase px-2 py-0.5">
                            Customer
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {formatDeliveryAddress(selectedOrder)}
                        </p>
                      </div>

                      {/* Customer Phone & Quick Actions Callout Box */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/25 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-1">
                            <Phone size={11} className="fill-current" /> Customer Contact
                          </span>
                          <span className="text-xs font-black text-foreground tracking-wide font-mono">
                            {selectedOrder.user?.phone || '+880 1571-323156'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-0.5">
                          <a
                            href={`tel:${selectedOrder.user?.phone || '+8801571323156'}`}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-transform active:scale-98 shadow-sm text-center"
                          >
                            <Phone size={13} className="fill-current" />
                            <span>Call: {selectedOrder.user?.phone || '+880 1571-323156'}</span>
                          </a>

                          <a
                            href={`https://wa.me/${(selectedOrder.user?.phone || '+8801571323156').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-card border border-border hover:bg-muted font-bold text-xs text-foreground transition-colors shrink-0 shadow-2xs"
                            title="Chat with customer on WhatsApp"
                          >
                            <span>💬 WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Food Items in Bag Manifest */}
                  {selectedOrder.items && selectedOrder.items.length > 0 && (
                    <Card className="border border-border bg-card">
                      <CardContent className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <ShoppingBag size={12} /> Food Parcel Contents ({selectedOrder.items.length})
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground">Verify items before leaving</span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {selectedOrder.items.map((it: any) => (
                            <span key={it.id} className="text-xs bg-muted/40 border border-border/50 px-2.5 py-1 rounded-xl font-bold text-foreground">
                              {it.quantity}x {it.foodName}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                </div>

              </div>
            );
          })()}

        </div>
      ) : (

        /* ========================================================================= */
        /* SCENARIO 2: CLEAN MASTER ORDER DISPATCH LIST VIEW */
        /* ========================================================================= */
        <div className="space-y-6">
          
          {/* Pro Telemetry Dispatch Header */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/20 shadow-sm relative overflow-hidden space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Rider Online & Ready</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold">Vehicle: {riderProfile?.vehicleType || 'Motorbike'}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  Active Delivery Dispatch Board
                </h1>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Real-time matched delivery orders. Tap any job to activate live turn navigation and order route telemetry.
                </p>
              </div>

              {/* Stats pill & refresh button */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="px-4 py-2 rounded-2xl bg-card border border-border shadow-xs text-right">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block leading-none">Queue Earnings</span>
                  <span className="text-base font-black text-primary">৳{totalEarningsInQueue.toFixed(2)}</span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchRiderOrders}
                  leftIcon={<RefreshCw size={13} />}
                  className="font-bold text-xs bg-card hover:bg-muted"
                >
                  Refresh
                </Button>
              </div>
            </div>

            {/* Filter Tabs Switcher */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 relative z-10">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card/70 hover:bg-card text-muted-foreground border border-border/60'
                }`}
              >
                All Tasks ({assignedOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PICKUP')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  statusFilter === 'PICKUP'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-card/70 hover:bg-card text-muted-foreground border border-border/60'
                }`}
              >
                <Store size={12} />
                <span>Store Pickup ({assignedOrders.filter(o => o.status === 'RIDER_ASSIGNED' || o.status === 'ON_THE_WAY').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('DELIVERY')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  statusFilter === 'DELIVERY'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-card/70 hover:bg-card text-muted-foreground border border-border/60'
                }`}
              >
                <MapPin size={12} />
                <span>Out for Delivery ({assignedOrders.filter(o => o.status === 'PICKED_UP').length})</span>
              </button>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <Card className="border-dashed border-2 border-border/70 bg-card/40">
              <CardContent className="py-20 text-center space-y-3">
                <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
                  <Bike size={32} className="animate-bounce" />
                </div>
                <h3 className="text-base font-extrabold text-foreground">No Deliveries Matching Filter</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  You are online. When new orders are prepared by restaurants in your zone, they will immediately appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {filteredOrders.map((order) => {
                const isAssigned = order.status === 'RIDER_ASSIGNED';
                const isWay = order.status === 'ON_THE_WAY';
                const isPicked = order.status === 'PICKED_UP';

                return (
                  <Card 
                    key={order.id} 
                    className="border border-border/70 bg-card hover:border-primary/40 hover:shadow-md transition-all rounded-2xl overflow-hidden group shadow-2xs"
                  >
                    <div className="p-4 sm:p-4.5 space-y-3">
                      
                      {/* Top Row: Order ID, Merchant, Stage, Fee & Payment */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-6 px-2 rounded-lg bg-primary/10 text-primary font-black text-xs inline-flex items-center justify-center">
                            #{order.id}
                          </span>
                          <h3 className="text-sm sm:text-base font-black text-foreground group-hover:text-primary transition-colors truncate">
                            {order.restaurant?.name || 'Restaurant'}
                          </h3>
                          <Badge 
                            variant="soft" 
                            color={isAssigned ? 'warning' : isWay ? 'primary' : 'success'} 
                            className="text-[9px] font-black uppercase px-2 py-0.5"
                          >
                            {isAssigned ? 'New Assignment' : isWay ? 'Heading to Store' : 'Out for Delivery'}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground hidden sm:inline">
                            • {order.items?.length || 1} item{(order.items?.length || 1) > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Fee:</span>
                            <span className="text-sm sm:text-base font-black text-primary">
                              ৳{parseFloat(order.riderEarnings || 0).toFixed(2)}
                            </span>
                          </div>
                          <Badge 
                            variant="soft" 
                            color={order.paymentMethod === 'COD' ? 'warning' : 'success'} 
                            className="text-[9px] font-extrabold uppercase px-2 py-0.5"
                          >
                            {order.paymentMethod === 'COD' ? `COD: ৳${parseFloat(order.total || 0).toFixed(2)}` : 'Prepaid Online'}
                          </Badge>
                        </div>
                      </div>

                      {/* Middle Row: Clean Minimal Route */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs py-2 px-3 rounded-xl bg-muted/20 border border-border/40">
                        <div className="flex items-center gap-2 min-w-0">
                          <Store size={13} className="text-amber-500 shrink-0" />
                          <span className="text-muted-foreground text-[11px] shrink-0 font-medium">Pickup:</span>
                          <span className="font-semibold text-foreground truncate">{order.restaurant?.address || 'Store Location'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin size={13} className="text-emerald-500 shrink-0" />
                          <span className="text-muted-foreground text-[11px] shrink-0 font-medium">Dropoff:</span>
                          <span className="font-semibold text-foreground truncate">{formatDeliveryAddress(order)}</span>
                        </div>
                      </div>

                      {/* Bottom Row: Customer Info & Action CTA */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground text-[11px]">Customer:</span>
                            <strong className="text-foreground font-bold">{order.user?.name || 'Customer'}</strong>
                          </div>

                          <a
                            href={`tel:${order.user?.phone || '+8801571323156'}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px] transition-colors"
                            title="Call customer directly"
                          >
                            <Phone size={10} className="fill-current" />
                            <span>{order.user?.phone || '+880 1571-323156'}</span>
                          </a>

                          <a
                            href={`https://wa.me/${(order.user?.phone || '+8801571323156').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-[11px] font-bold transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <span>💬 WhatsApp</span>
                          </a>
                        </div>

                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleSelectOrder(order.id)}
                          rightIcon={<ChevronRight size={13} />}
                          className="font-black text-xs px-4 py-1.5 shadow-xs"
                        >
                          View Order & Live Map
                        </Button>
                      </div>

                    </div>
                  </Card>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
