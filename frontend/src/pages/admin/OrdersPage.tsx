import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  Button, 
  toast, 
  Badge, 
  Modal, 
  DataTable, 
  Avatar, 
  Input, 
  Select, 
  type DataTableColumn 
} from '../../design-system';
import { 
  ClipboardList, 
  Loader2, 
  Search, 
  Eye, 
  MapPin, 
  User, 
  Phone, 
  RefreshCw, 
  Store, 
  Bike, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Star, 
  TrendingUp, 
  DollarSign, 
  PackageCheck,
  ChevronRight,
  Utensils,
  Receipt,
  Percent,
  X,
  Filter
} from 'lucide-react';
import api from '../../lib/axios';

interface OrderItem {
  id: number;
  foodName: string;
  quantity: number;
  price: number;
  variantName?: string;
  addons?: Array<{ addonName: string; price: number }>;
}

interface OrderRecord {
  id: number;
  userId: number;
  restaurantId: number;
  riderId?: number | null;
  status: string;
  subtotal: string | number;
  deliveryFee: string | number;
  tax: string | number;
  total: string | number;
  paymentMethod: string;
  paymentStatus: string;
  restaurantEarnings?: string | number;
  riderEarnings?: string | number;
  platformCommission?: string | number;
  deliveryAddressText?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string; email: string; phone: string };
  restaurant?: { id: number; name: string; logo?: string; slug?: string; phone?: string };
  rider?: { id: number; name: string; phone?: string } | null;
  items?: OrderItem[];
  review?: {
    id: number;
    foodRating: number;
    foodReview?: string;
    foodTags?: string[];
    riderRating?: number;
    riderReview?: string;
    riderTags?: string[];
  } | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/admin');
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err: any) {
      console.error('Failed to load admin orders:', err);
      toast.error(err.response?.data?.message || 'Failed to load platform orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenDetail = (order: OrderRecord) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsDetailModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus || newStatus === selectedOrder.status) return;
    setUpdatingStatus(true);
    try {
      const res = await api.put(`/orders/${selectedOrder.id}/status`, { status: newStatus });
      if (res.data?.success) {
        toast.success(`Order #${selectedOrder.id} status updated to ${newStatus}`);
        setOrders((prev) =>
          prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: newStatus } : o))
        );
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
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
        return <Badge variant="success" size="sm" className="font-extrabold text-[10px]">DELIVERED</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger" size="sm" className="font-extrabold text-[10px]">CANCELLED</Badge>;
      case 'ON_THE_WAY':
        return <Badge variant="warning" size="sm" className="font-extrabold text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">ON THE WAY</Badge>;
      case 'PICKED_UP':
        return <Badge variant="warning" size="sm" className="font-extrabold text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/20">PICKED UP</Badge>;
      case 'READY':
        return <Badge variant="warning" size="sm" className="font-extrabold text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20">READY</Badge>;
      case 'PREPARING':
        return <Badge variant="warning" size="sm" className="font-extrabold text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">PREPARING</Badge>;
      case 'CONFIRMED':
        return <Badge variant="info" size="sm" className="font-extrabold text-[10px]">CONFIRMED</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="outline" size="sm" className="font-extrabold text-[10px] text-muted-foreground">PENDING</Badge>;
    }
  };

  const STATUS_TABS = [
    { value: 'ALL', label: 'All Orders' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PREPARING', label: 'Preparing' },
    { value: 'READY', label: 'Ready' },
    { value: 'RIDER_ASSIGNED', label: 'Rider Assigned' },
    { value: 'PICKED_UP', label: 'Picked Up' },
    { value: 'ON_THE_WAY', label: 'On The Way' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const idMatch = String(o.id).includes(q) || `#${o.id}`.includes(q);
    const customerMatch = 
      o.user?.name?.toLowerCase().includes(q) || 
      o.user?.phone?.includes(q) || 
      o.user?.email?.toLowerCase().includes(q);
    const restaurantMatch = o.restaurant?.name?.toLowerCase().includes(q);
    const riderMatch = o.rider?.name?.toLowerCase().includes(q) || o.rider?.phone?.includes(q);
    const addressMatch = o.deliveryAddressText?.toLowerCase().includes(q);
    const paymentMatch = 
      o.paymentMethod?.toLowerCase().includes(q) || 
      o.paymentStatus?.toLowerCase().includes(q);
    const itemsMatch = o.items?.some(
      (it: any) =>
        it.foodName?.toLowerCase().includes(q) ||
        it.variantName?.toLowerCase().includes(q)
    );

    return idMatch || customerMatch || restaurantMatch || riderMatch || addressMatch || paymentMatch || itemsMatch;
  });

  // Calculate summary statistics
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((acc, o) => acc + parseFloat(String(o.total || 0)), 0);

  const totalCommission = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((acc, o) => acc + parseFloat(String(o.platformCommission || 0)), 0);

  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const activeCount = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length;

  const columns: DataTableColumn<OrderRecord>[] = [
    {
      id: 'id',
      label: 'Order',
      width: '100px',
      cell: ({ row }) => (
        <Link
          to={`/admin/orders/${row.id}`}
          className="flex flex-col group/link hover:opacity-80 transition-opacity"
        >
          <span className="font-black text-primary text-xs tracking-tight group-hover/link:underline">
            #{row.id}
          </span>
          <span className="text-[10px] text-muted-foreground font-semibold">
            {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </Link>
      )
    },
    {
      id: 'customer',
      label: 'Customer',
      width: '180px',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-bold text-xs text-foreground truncate">{row.user?.name || 'Customer'}</p>
          <p className="text-[10px] text-muted-foreground truncate">{row.user?.phone || row.user?.email || 'N/A'}</p>
        </div>
      )
    },
    {
      id: 'restaurant',
      label: 'Restaurant',
      width: '180px',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            src={row.restaurant?.logo}
            alt={row.restaurant?.name}
            fallback={<Store size={12} />}
            size="sm"
            className="shrink-0"
          />
          <span className="font-extrabold text-xs text-foreground truncate">
            {row.restaurant?.name || 'Restaurant'}
          </span>
        </div>
      )
    },
    {
      id: 'rider',
      label: 'Rider',
      width: '150px',
      cell: ({ row }) => (
        <div className="min-w-0">
          {row.rider ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Bike className="h-3.5 w-3.5 text-purple-500 shrink-0" />
              <span className="truncate">{row.rider.name}</span>
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground italic font-medium">Unassigned</span>
          )}
        </div>
      )
    },
    {
      id: 'items',
      label: 'Items',
      width: '200px',
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="text-xs text-foreground font-semibold truncate">
            {row.items && row.items.length > 0
              ? row.items.map((it) => `${it.quantity}× ${it.foodName}`).join(', ')
              : 'Order items'}
          </p>
          <span className="text-[10px] text-muted-foreground font-medium">
            {row.items?.length || 0} {(row.items?.length || 0) === 1 ? 'item' : 'items'}
          </span>
        </div>
      )
    },
    {
      id: 'amount',
      label: 'Total & Payment',
      width: '140px',
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-black text-foreground">৳{parseFloat(String(row.total || 0)).toFixed(2)}</p>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            {row.paymentMethod === 'ONLINE' ? '💳 Online' : '💵 Cash'} &bull; {row.paymentStatus}
          </span>
        </div>
      )
    },
    {
      id: 'status',
      label: 'Status',
      width: '120px',
      cell: ({ row }) => getStatusBadge(row.status)
    },
    {
      id: 'rating',
      label: 'Review',
      width: '110px',
      cell: ({ row }) =>
        row.review ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-black">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {row.review.foodRating}.0★
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/60 italic font-medium">&mdash;</span>
        )
    },
    {
      id: 'actions',
      label: 'Actions',
      width: '100px',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link to={`/admin/orders/${row.id}`}>
            <Button
              size="xs"
              variant="outline"
              className="font-bold text-[11px] h-7 px-2.5"
              leftIcon={<Eye size={12} />}
            >
              Details
            </Button>
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-border/10">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">Platform Orders</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor, track, and manage food deliveries across all active restaurants and riders.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          className="font-bold text-xs"
          leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh Orders
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/50 bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Orders</span>
              <h3 className="text-2xl font-black text-foreground">{orders.length}</h3>
              <p className="text-[10px] text-muted-foreground font-semibold">Across all kitchens</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ClipboardList size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Deliveries</span>
              <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">{activeCount}</h3>
              <p className="text-[10px] text-muted-foreground font-semibold">In preparation / transit</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Delivered</span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{deliveredCount}</h3>
              <p className="text-[10px] text-muted-foreground font-semibold">Completed orders</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <PackageCheck size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Revenue</span>
              <h3 className="text-2xl font-black text-foreground">৳{totalRevenue.toFixed(0)}</h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ৳{totalCommission.toFixed(0)} platform fee
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border/40 bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex-1 relative">
              <Input
                placeholder="Search by Order #ID, customer, phone, restaurant, rider, or dish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
                className="w-full text-xs pr-8"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(val: string) => setStatusFilter(val)}
                className="w-48 text-xs font-bold"
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'CONFIRMED', label: 'Confirmed' },
                  { value: 'PREPARING', label: 'Preparing' },
                  { value: 'READY', label: 'Ready' },
                  { value: 'RIDER_ASSIGNED', label: 'Rider Assigned' },
                  { value: 'PICKED_UP', label: 'Picked Up' },
                  { value: 'ON_THE_WAY', label: 'On The Way' },
                  { value: 'DELIVERED', label: 'Delivered' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ]}
              />

              {(searchQuery || statusFilter !== 'ALL') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                  }}
                  className="text-xs font-bold shrink-0 text-muted-foreground hover:text-foreground"
                  leftIcon={<X size={12} />}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border border-border/40 bg-card overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-semibold">Loading platform orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <ClipboardList className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <h3 className="text-sm font-bold text-foreground">No orders found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or status filter.'
                : 'No customer orders have been placed on the platform yet.'}
            </p>
            {(searchQuery || statusFilter !== 'ALL') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="font-bold text-xs mt-2"
                leftIcon={<X size={12} />}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredOrders}
            getRowId={(item) => String(item.id)}
            searchable={false}
            toolbar={null}
          />
        )}
      </Card>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Order Details #${selectedOrder.id}`}
          size="lg"
        >
          <div className="space-y-6 text-xs select-none">
            {/* Top Status Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-muted/20 border border-border/40">
              <div className="flex items-center gap-2">
                <span className="font-bold text-muted-foreground">Current Status:</span>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </span>
              </div>
            </div>

            {/* Parties Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Customer Box */}
              <div className="p-4 rounded-2xl border border-border/40 bg-card space-y-2">
                <div className="flex items-center gap-1.5 font-black text-foreground uppercase tracking-wider text-[10px]">
                  <User className="h-3.5 w-3.5 text-primary" />
                  Customer
                </div>
                <p className="font-extrabold text-sm text-foreground">{selectedOrder.user?.name || 'Customer'}</p>
                <p className="text-muted-foreground font-medium flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {selectedOrder.user?.phone || 'No phone'}
                </p>
                <div className="pt-2 border-t border-border/10">
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                    <MapPin className="h-3 w-3 text-primary inline mr-1" />
                    {selectedOrder.deliveryAddressText || 'Standard Delivery Location'}
                  </p>
                </div>
              </div>

              {/* Restaurant Box */}
              <div className="p-4 rounded-2xl border border-border/40 bg-card space-y-2">
                <div className="flex items-center gap-1.5 font-black text-foreground uppercase tracking-wider text-[10px]">
                  <Store className="h-3.5 w-3.5 text-amber-500" />
                  Restaurant
                </div>
                <p className="font-extrabold text-sm text-foreground">{selectedOrder.restaurant?.name || 'Restaurant'}</p>
                <p className="text-muted-foreground font-medium flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {selectedOrder.restaurant?.phone || 'No phone'}
                </p>
                <div className="pt-2 border-t border-border/10">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Merchant Earnings: ৳{parseFloat(String(selectedOrder.restaurantEarnings || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Rider Box */}
              <div className="p-4 rounded-2xl border border-border/40 bg-card space-y-2">
                <div className="flex items-center gap-1.5 font-black text-foreground uppercase tracking-wider text-[10px]">
                  <Bike className="h-3.5 w-3.5 text-purple-500" />
                  Courier / Rider
                </div>
                {selectedOrder.rider ? (
                  <>
                    <p className="font-extrabold text-sm text-foreground">{selectedOrder.rider.name}</p>
                    <p className="text-muted-foreground font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {selectedOrder.rider.phone || 'No phone'}
                    </p>
                    <div className="pt-2 border-t border-border/10">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        Rider Fee: ৳{parseFloat(String(selectedOrder.riderEarnings || 0)).toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground italic font-medium pt-2">No rider assigned yet</p>
                )}
              </div>
            </div>

            {/* Order Items Table */}
            <div className="border border-border/40 rounded-2xl overflow-hidden">
              <div className="bg-muted/30 px-4 py-2.5 font-black text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/10">
                Ordered Items
              </div>
              <div className="divide-y divide-border/10 p-2">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((it) => (
                    <div key={it.id} className="p-2 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-foreground">
                          {it.quantity}× {it.foodName}
                        </p>
                        {it.variantName && (
                          <p className="text-[10px] text-muted-foreground font-medium">Variant: {it.variantName}</p>
                        )}
                        {it.addons && it.addons.length > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            Addons: {it.addons.map((a) => `${a.addonName} (+৳${a.price})`).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-black text-foreground">
                        ৳{parseFloat(String(it.price || 0)).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="p-3 text-muted-foreground italic">No item records found.</p>
                )}
              </div>
            </div>

            {/* Financial Summary & Split */}
            <div className="p-4 rounded-2xl bg-muted/10 border border-border/40 space-y-2 font-medium">
              <div className="space-y-1.5 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-foreground">৳{parseFloat(String(selectedOrder.subtotal || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-foreground">৳{parseFloat(String(selectedOrder.deliveryFee || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax & VAT</span>
                  <span className="font-bold text-foreground">৳{parseFloat(String(selectedOrder.tax || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-foreground pt-2 border-t border-border/20">
                  <span>Total Amount</span>
                  <span className="text-primary">৳{parseFloat(String(selectedOrder.total || 0)).toFixed(2)}</span>
                </div>
              </div>

              {/* Revenue Split Distribution */}
              <div className="pt-3 border-t border-dashed border-border/30 space-y-2 bg-card/60 p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-black text-muted-foreground">Revenue Split Distribution</span>
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Live Split</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-lg bg-muted/30 border border-border/20">
                    <span className="text-[10px] text-muted-foreground font-semibold block">Platform Cut</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400">
                      ৳{parseFloat(String(selectedOrder.platformCommission || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30 border border-border/20">
                    <span className="text-[10px] text-muted-foreground font-semibold block">Tax Collected</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400">
                      ৳{parseFloat(String(selectedOrder.tax || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30 border border-border/20 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-muted-foreground font-semibold block">Total Platform</span>
                    <span className="font-black text-primary">
                      ৳{(parseFloat(String(selectedOrder.platformCommission || 0)) + parseFloat(String(selectedOrder.tax || 0))).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30 border border-border/20">
                    <span className="text-[10px] text-muted-foreground font-semibold block">Merchant Net</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      ৳{parseFloat(String(selectedOrder.restaurantEarnings || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30 border border-border/20">
                    <span className="text-[10px] text-muted-foreground font-semibold block">Rider Net</span>
                    <span className="font-extrabold text-purple-600 dark:text-purple-400">
                      ৳{parseFloat(String(selectedOrder.riderEarnings || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Review Card (Food & Rider) */}
            {selectedOrder.review ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    Customer Reviews & Feedback
                  </span>
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                    Food: {selectedOrder.review.foodRating}.0★ {selectedOrder.review.riderRating ? `| Courier: ${selectedOrder.review.riderRating}.0★` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Food Review */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-700 dark:text-amber-300">
                        <Utensils className="h-3 w-3" />
                        Kitchen / Food
                      </div>
                      <span className="font-black text-[11px] text-amber-700 dark:text-amber-300">
                        {selectedOrder.review.foodRating}.0 / 5.0 ★
                      </span>
                    </div>
                    {selectedOrder.review.foodReview && (
                      <p className="text-xs text-foreground/90 italic font-medium bg-card/70 p-2.5 rounded-xl border border-amber-500/15">
                        "{selectedOrder.review.foodReview}"
                      </p>
                    )}
                    {selectedOrder.review.foodTags && selectedOrder.review.foodTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {selectedOrder.review.foodTags.map((t: string, idx: number) => (
                          <span key={idx} className="text-[9px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rider Review */}
                  {selectedOrder.review.riderRating ? (
                    <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] text-purple-700 dark:text-purple-300">
                          <Bike className="h-3 w-3" />
                          Courier / Rider
                        </div>
                        <span className="font-black text-[11px] text-purple-700 dark:text-purple-300">
                          {selectedOrder.review.riderRating}.0 / 5.0 ★
                        </span>
                      </div>
                      {selectedOrder.review.riderReview && (
                        <p className="text-xs text-foreground/90 italic font-medium bg-card/70 p-2.5 rounded-xl border border-purple-500/15">
                          "{selectedOrder.review.riderReview}"
                        </p>
                      )}
                      {selectedOrder.review.riderTags && selectedOrder.review.riderTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {selectedOrder.review.riderTags.map((t: string, idx: number) => (
                            <span key={idx} className="text-[9px] font-bold bg-purple-500/20 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-md">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Admin Status Override Controller */}
            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
              <span className="font-bold text-foreground">Admin Status Override:</span>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Select
                  value={newStatus}
                  onValueChange={(val: string) => setNewStatus(val)}
                  className="flex-1 text-xs font-bold"
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
                  disabled={updatingStatus || newStatus === selectedOrder.status}
                  className="font-bold text-xs"
                >
                  {updatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Update Status
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
