import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Badge, DataTable } from '../../design-system';
import { 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Loader2, 
  RefreshCw, 
  ShoppingBag, 
  Bike, 
  User, 
  Phone, 
  MapPin, 
  PackageCheck, 
  Eye, 
  Receipt, 
  ArrowUpRight,
  Sparkles,
  Search,
  TrendingUp,
  CreditCard
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

export default function RestaurantHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/merchant');
      if (res.data?.success) {
        const allOrders = res.data.orders || [];
        const historyOnly = allOrders.filter((o: any) => 
          o.status === 'DELIVERED' || o.status === 'CANCELLED'
        );
        setOrders(historyOnly);
      }
    } catch (err) {
      console.error('Failed to load restaurant delivery history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const totalDelivered = orders.filter((o) => o.status === 'DELIVERED').length;
  const totalRestaurantEarnings = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((acc, curr) => acc + (parseFloat(curr.restaurantEarnings) || 0), 0);
  const totalCommission = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((acc, curr) => acc + (parseFloat(curr.platformCommission) || 0), 0);
  const totalGrossSales = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((acc, curr) => acc + (parseFloat(curr.subtotal || (parseFloat(curr.total) - parseFloat(curr.deliveryFee || 0))) || 0), 0);

  const averageNetPerOrder = totalDelivered > 0
    ? totalRestaurantEarnings / totalDelivered
    : 0;

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesSearch = searchQuery.trim() === '' ||
      String(o.id).includes(searchQuery) ||
      (o.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.rider?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Order History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit log of completed customer orders, gross food sales, platform commission, and net store payouts.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchHistory}
          leftIcon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
          className="font-bold text-xs"
        >
          Refresh History
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* What You Get - Net Earning Highlight */}
        <Card className="border border-emerald-500/30 bg-emerald-500/5 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
                Net Payout (What You Get)
              </span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                ৳{totalRestaurantEarnings.toFixed(2)}
              </h3>
              <p className="text-[10px] text-emerald-700/80 font-semibold mt-0.5">Credited to Store Balance</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Total Delivered */}
        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completed Dropoffs</span>
              <h3 className="text-2xl font-black text-foreground mt-0.5">{totalDelivered}</h3>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Avg Net: ৳{averageNetPerOrder.toFixed(2)} / order</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <PackageCheck size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Total Gross Food Sales */}
        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Gross Food Sales</span>
              <h3 className="text-2xl font-black text-foreground font-mono mt-0.5">
                ৳{totalGrossSales.toFixed(2)}
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Items Value Billed</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Total Platform Fee Deducted */}
        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Platform Commission</span>
              <h3 className="text-2xl font-black text-foreground font-mono mt-0.5">
                -৳{totalCommission.toFixed(2)}
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Standard 15% service fee</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Receipt size={20} />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl w-fit border border-border/40">
          {(['ALL', 'DELIVERED', 'CANCELLED'] as const).map((st) => {
            const count = st === 'ALL'
              ? orders.length
              : orders.filter((o) => o.status === st).length;
            const isSelected = statusFilter === st;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-card text-foreground shadow-xs font-bold border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st === 'ALL' ? 'All Deliveries' : st.charAt(0) + st.slice(1).toLowerCase()}
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-primary/15 text-primary font-bold' : 'bg-muted text-muted-foreground'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search order #, customer, rider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border/60 bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
          />
        </div>
      </div>

      {/* Order History Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-semibold">Loading order history logs...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="border border-border/60 p-12 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-foreground">No Order History Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {searchQuery ? 'No orders match your search term.' : 'Orders that are completed and delivered will automatically appear in this history log.'}
          </p>
        </Card>
      ) : (
        <Card className="border-none bg-transparent overflow-hidden shadow-2xs">
          <CardContent className="p-0">
            <DataTable
              data={filteredOrders}
              pagination={false}
              searchable={false}
              toolbar={null}
              columns={[
                {
                  id: 'order',
                  label: 'ORDER INFO',
                  minWidth: '160px',
                  cell: ({ row }: { row: any }) => (
                    <div 
                      onClick={() => navigate(`/restaurant/history/${row.id}`)}
                      className="space-y-0.5 cursor-pointer group"
                    >
                      <p className="font-black text-sm text-foreground group-hover:text-primary transition-colors">
                        Order #{row.id}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {row.items?.length || 0} item{row.items?.length === 1 ? '' : 's'} ordered
                      </p>
                    </div>
                  )
                },
                {
                  id: 'customer',
                  label: 'DROPOFF CUSTOMER',
                  minWidth: '220px',
                  cell: ({ row }: { row: any }) => (
                    <div 
                      onClick={() => navigate(`/restaurant/history/${row.id}`)}
                      className="space-y-0.5 max-w-[220px] cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs text-foreground truncate hover:text-primary transition-colors">
                          {row.user?.name || 'Customer'}
                        </p>
                        {row.user?.phone && (
                          <a
                            href={`tel:${getCustomerPhone(row)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center text-muted-foreground hover:text-emerald-600 transition-colors p-0.5"
                            title={`Call ${getCustomerPhone(row)}`}
                          >
                            <Phone size={10} />
                          </a>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate" title={formatDeliveryAddress(row)}>
                        {formatDeliveryAddress(row)}
                      </p>
                    </div>
                  )
                },
                {
                  id: 'rider',
                  label: 'DELIVERY RIDER',
                  minWidth: '160px',
                  cell: ({ row }: { row: any }) => (
                    <div className="space-y-0.5">
                      {row.rider ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <Bike size={12} className="text-primary shrink-0" />
                            <span className="font-bold text-xs text-foreground truncate">{row.rider.name}</span>
                          </div>
                          {row.rider.phone && (
                            <a
                              href={`tel:${row.rider.phone}`}
                              className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              <Phone size={9} /> {row.rider.phone}
                            </a>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">Self-Pickup / Unassigned</span>
                      )}
                    </div>
                  )
                },
                {
                  id: 'payment',
                  label: 'PAYMENT',
                  width: '130px',
                  cell: ({ row }: { row: any }) => (
                    <Badge variant="soft" color={row.paymentMethod === 'COD' ? 'warning' : 'success'} className="font-bold text-[9px] uppercase px-2 py-0.5">
                      {row.paymentMethod === 'COD' ? 'COD' : 'Online Paid'}
                    </Badge>
                  )
                },
                {
                  id: 'gross',
                  label: 'FOOD TOTAL',
                  width: '110px',
                  cell: ({ row }: { row: any }) => (
                    <span className="font-bold text-xs text-foreground font-mono">
                      ৳{parseFloat(row.subtotal || (parseFloat(row.total) - parseFloat(row.deliveryFee || 0))).toFixed(2)}
                    </span>
                  )
                },
                {
                  id: 'commission',
                  label: 'COMMISSION',
                  width: '110px',
                  cell: ({ row }: { row: any }) => (
                    <span className="font-semibold text-xs text-amber-600 dark:text-amber-500 font-mono">
                      -৳{parseFloat(row.platformCommission || 0).toFixed(2)}
                    </span>
                  )
                },
                {
                  id: 'earnings',
                  label: 'NET PAYOUT (YOU GET)',
                  width: '150px',
                  cell: ({ row }: { row: any }) => (
                    <div className="flex flex-col">
                      <span className="font-black text-sm text-emerald-600 font-mono">
                        +৳{parseFloat(row.restaurantEarnings || 0).toFixed(2)}
                      </span>
                      <span className="text-[9px] text-emerald-700/80 font-bold uppercase tracking-wider">
                        Store Net
                      </span>
                    </div>
                  )
                },
                {
                  id: 'date',
                  label: 'COMPLETED ON',
                  width: '150px',
                  cell: ({ row }: { row: any }) => (
                    <div className="text-[11px] text-muted-foreground font-medium">
                      {new Date(row.updatedAt || row.createdAt).toLocaleDateString()} at{' '}
                      {new Date(row.updatedAt || row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )
                },
                {
                  id: 'status',
                  label: 'STATUS',
                  width: '100px',
                  align: 'center' as const,
                  cell: ({ row }: { row: any }) => (
                    row.status === 'DELIVERED'
                      ? <Badge variant="soft" color="success" className="font-bold text-[9px] uppercase px-2.5 py-0.5">Delivered</Badge>
                      : <Badge variant="soft" color="danger" className="font-bold text-[9px] uppercase px-2.5 py-0.5">Cancelled</Badge>
                  )
                },
                {
                  id: 'actions',
                  label: 'ACTION',
                  width: '90px',
                  align: 'right' as const,
                  cell: ({ row }: { row: any }) => (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => navigate(`/restaurant/history/${row.id}`)}
                      leftIcon={<Eye size={12} className="text-primary" />}
                      className="font-extrabold text-xs h-8 px-3 rounded-lg border-border/80 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all shadow-2xs cursor-pointer"
                    >
                      View
                    </Button>
                  )
                }
              ]}
            />
          </CardContent>
        </Card>
      )}

    </div>
  );
}
