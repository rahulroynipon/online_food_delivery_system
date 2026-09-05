import React, { useState, useEffect } from 'react';
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
  Package
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-semibold">Loading active tasks...</span>
      </div>
    );
  }

  // Active focused order (if selected)
  const selectedOrder = assignedOrders.find((o) => o.id === selectedOrderId);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      
      {/* ========================================================================= */}
      {/* SCENARIO 1: PRO COMMAND CENTER DUAL-COLUMN ORDER VIEW */}
      {/* ========================================================================= */}
      {selectedOrder ? (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Command Breadcrumb Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-3xl bg-card border border-border shadow-xs">
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBackToList}
                leftIcon={<ArrowLeft size={14} />}
                className="font-bold text-xs"
              >
                Back to List ({assignedOrders.length})
              </Button>

              <div className="h-4 w-px bg-border hidden sm:block"></div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                  #{selectedOrder.id}
                </div>
                <h2 className="text-base font-black text-foreground">{selectedOrder.restaurant?.name}</h2>
                <Badge variant="soft" color="primary" className="text-xs font-black px-2 py-0.5">
                  Fee: ৳{parseFloat(selectedOrder.riderEarnings || 0).toFixed(2)}
                </Badge>
                <Badge variant="soft" color={selectedOrder.paymentMethod === 'COD' ? 'warning' : 'success'} className="text-[10px] font-extrabold uppercase">
                  {selectedOrder.paymentMethod === 'COD' ? `COD: ৳${parseFloat(selectedOrder.total || 0).toFixed(2)}` : 'Prepaid Online'}
                </Badge>
                <a
                  href={`tel:${selectedOrder.user?.phone || '+8801571323156'}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold hover:bg-emerald-500/20 transition-colors shadow-2xs"
                  title="Direct call customer"
                >
                  <Phone size={12} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Customer: {selectedOrder.user?.phone || '+8801571323156'}</span>
                </a>
              </div>
            </div>

            {/* Quick Order Switcher */}
            {assignedOrders.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] font-black uppercase text-muted-foreground mr-1">Switch:</span>
                {assignedOrders.map((ord) => (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => handleSelectOrder(ord.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                      ord.id === selectedOrder.id
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-muted/40 hover:bg-muted text-foreground border border-border/50'
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
                  
                  {/* Status Pipeline Progress Indicator */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold select-none p-1.5 bg-card rounded-2xl border border-border shadow-xs">
                    <div className={`p-2.5 rounded-xl border transition-all ${
                      isAssigned ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'bg-muted/30 text-muted-foreground border-transparent'
                    }`}>
                      1. Job Assigned
                    </div>
                    <div className={`p-2.5 rounded-xl border transition-all ${
                      isWay ? 'bg-primary text-primary-foreground border-primary shadow-xs' : isPicked ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-muted/30 text-muted-foreground border-transparent'
                    }`}>
                      2. Store Pickup
                    </div>
                    <div className={`p-2.5 rounded-xl border transition-all ${
                      isPicked ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'bg-muted/30 text-muted-foreground border-transparent'
                    }`}>
                      3. Customer Dropoff
                    </div>
                  </div>

                  {/* Accept / Reject Decision Banner if New Assignment */}
                  {isAssigned && (
                    <div className="p-4 rounded-3xl bg-primary/10 border border-primary/25 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-foreground">Incoming Delivery Job</h4>
                        <p className="text-[11px] text-muted-foreground">
                          Earn ৳{parseFloat(selectedOrder.riderEarnings || 0).toFixed(2)} upon completing this delivery.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRiderResponse(selectedOrder.id, 'REJECT')}
                          className="flex-1 sm:flex-none text-rose-500 hover:bg-rose-500/10 font-bold"
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleRiderResponse(selectedOrder.id, 'ACCEPT')}
                          className="flex-1 sm:flex-none font-bold shadow-xs"
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
                      height="520px"
                    />
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT 5 COLS: COMMAND PANEL (ACTIONS, PICKUP, DROPOFF, BAG) */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Immediate Action Execution Card */}
                  {!isAssigned && (
                    <Card className="border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                            Current Delivery Action
                          </span>
                          <Badge variant="soft" color={isWay ? 'warning' : 'success'} className="text-[10px] font-black uppercase">
                            {isWay ? 'Pickup Pending' : 'Dropoff Pending'}
                          </Badge>
                        </div>

                        {isWay && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              Ride to <strong className="text-foreground">{selectedOrder.restaurant?.name}</strong> and collect the food parcel.
                            </p>
                            <Button
                              size="lg"
                              variant="primary"
                              fullWidth
                              disabled={actionLoading === selectedOrder.id}
                              onClick={() => handleUpdateStatus(selectedOrder.id, 'PICKED_UP')}
                              className="font-black text-xs py-3 shadow-md"
                              leftIcon={actionLoading === selectedOrder.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            >
                              Mark Picked Up (Food in Bag)
                            </Button>
                          </div>
                        )}

                        {isPicked && (
                          <div className="space-y-3">
                            {selectedOrder.paymentMethod === 'COD' ? (
                              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs font-black text-amber-700 dark:text-amber-400 leading-snug">
                                ⚠️ Cash on Delivery: Collect physical cash ৳{parseFloat(selectedOrder.total).toFixed(2)} from the customer before handing over the food parcel!
                              </div>
                            ) : (
                              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs font-black text-emerald-700 dark:text-emerald-400">
                                ✓ Prepaid Online Order — No cash collection needed. Hand over parcel to customer.
                              </div>
                            )}

                            <Button
                              size="lg"
                              variant="primary"
                              fullWidth
                              disabled={actionLoading === selectedOrder.id}
                              onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                              className="font-black text-xs py-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                              leftIcon={actionLoading === selectedOrder.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
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
                    isWay ? 'border-primary/40 bg-card ring-1 ring-primary/20 shadow-xs' : 'border-border/60 bg-muted/15 opacity-80'
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
                            <Phone size={12} className="text-primary" />
                            <span>Call Merchant: {selectedOrder.restaurant.phone}</span>
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
                            <Phone size={11} /> Customer Contact Number
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
                          <span className="text-[10px] font-bold text-muted-foreground">Verify items before leaving store</span>
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
          
          {/* List Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/15">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-foreground tracking-tight">Active Deliveries</h2>
                <Badge variant="solid" color="primary" className="text-[10px] font-black uppercase px-2 py-0.5">
                  {assignedOrders.length} Tasks Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select any delivery below to open the dedicated command center with interactive GPS road map and turn navigation.
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={fetchRiderOrders}
              leftIcon={<RefreshCw size={13} />}
              className="font-bold text-xs bg-card"
            >
              Refresh List
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
                  You are currently online and ready for orders. When a nearby merchant prepares food, you will receive an audio chime and matched task here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {assignedOrders.map((order) => {
                const isAssigned = order.status === 'RIDER_ASSIGNED';
                const isWay = order.status === 'ON_THE_WAY';
                const isPicked = order.status === 'PICKED_UP';

                return (
                  <Card 
                    key={order.id} 
                    className="border border-border bg-card shadow-xs hover:shadow-md hover:border-primary/40 transition-all overflow-hidden"
                  >
                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                      
                      {/* Left: Order Info & Routing summary */}
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center text-primary font-black shrink-0">
                          <span className="text-[10px] uppercase font-bold text-primary/70">Order</span>
                          <span className="text-sm">#{order.id}</span>
                        </div>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-foreground truncate">
                              {order.restaurant?.name || 'Restaurant'}
                            </h3>

                            <Badge 
                              variant="soft" 
                              color={isAssigned ? 'warning' : isWay ? 'primary' : 'success'} 
                              className="text-[10px] font-black uppercase px-2 py-0.5"
                            >
                              {isAssigned ? 'New Assignment' : isWay ? '1. Pickup Stage' : '2. Out for Delivery'}
                            </Badge>
                          </div>

                          {/* Route Summary Trail */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                            <div className="flex items-center gap-1.5 truncate">
                              <Store size={13} className="text-amber-500 shrink-0" />
                              <span className="font-semibold text-foreground truncate">{order.restaurant?.address || 'Store Location'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin size={13} className="text-emerald-500 shrink-0" />
                              <span className="font-semibold text-foreground truncate">
                                {formatDeliveryAddress(order)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                            <div className="flex items-center gap-1.5">
                              <span>Customer:</span>
                              <strong className="text-foreground font-bold">{order.user?.name || 'Customer'}</strong>
                            </div>
                            <span>•</span>
                            <a
                              href={`tel:${order.user?.phone || '+8801571323156'}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px] hover:bg-emerald-500/20 transition-colors shadow-2xs"
                              title="Call customer directly"
                            >
                              <Phone size={10} className="fill-current" />
                              <span>{order.user?.phone || '+880 1571-323156'}</span>
                            </a>
                            <span>•</span>
                            <span>{order.items?.length || 0} items in bag</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Fees, Payment & View Details Button */}
                      <div className="flex sm:flex-col md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border/50">
                        <div className="space-y-0.5 text-left md:text-right">
                          <div className="flex items-center md:justify-end gap-2">
                            <span className="text-xs text-muted-foreground font-bold">Your Fee:</span>
                            <span className="text-base font-black text-primary">৳{parseFloat(order.riderEarnings || 0).toFixed(2)}</span>
                          </div>
                          <Badge 
                            variant="soft" 
                            color={order.paymentMethod === 'COD' ? 'warning' : 'success'} 
                            className="text-[10px] font-extrabold uppercase px-2 py-0.5"
                          >
                            {order.paymentMethod === 'COD' ? `Collect COD: ৳${parseFloat(order.total || 0).toFixed(2)}` : 'Prepaid Online'}
                          </Badge>
                        </div>

                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleSelectOrder(order.id)}
                          rightIcon={<ChevronRight size={14} />}
                          className="font-black text-xs shadow-xs px-4"
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
