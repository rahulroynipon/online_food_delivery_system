import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Badge, DataTable } from '../../design-system';
import { 
  CheckCircle2, 
  DollarSign, 
  Loader2, 
  RefreshCw, 
  Store, 
  PackageCheck,
  Eye,
  Phone,
  Star
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

export default function RiderHistoryPage() {
  const navigate = useNavigate();
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DELIVERED' | 'CANCELLED'>('ALL');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/rider?history=true');
      if (res.data?.success) {
        setHistoryOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load rider history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredOrders = statusFilter === 'ALL'
    ? historyOrders
    : historyOrders.filter((o) => o.status === statusFilter);

  const totalDelivered = historyOrders.filter((o) => o.status === 'DELIVERED').length;
  const totalEarned = historyOrders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((acc, curr) => acc + (parseFloat(curr.riderEarnings) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Delivery History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log of completed dropoffs, earnings per trip, and cancelled assignments.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchHistory}
          leftIcon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
          className="font-bold text-xs"
        >
          Refresh Logs
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Delivered</span>
              <h3 className="text-2xl font-black text-foreground mt-0.5">{totalDelivered}</h3>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Fees Collected</span>
              <h3 className="text-2xl font-black text-foreground mt-0.5">৳{totalEarned.toFixed(2)}</h3>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Average Fee / Trip</span>
              <h3 className="text-2xl font-black text-foreground mt-0.5">
                ৳{totalDelivered > 0 ? (totalEarned / totalDelivered).toFixed(2) : '0.00'}
              </h3>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <PackageCheck size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl w-fit border border-border/40">
        {(['ALL', 'DELIVERED', 'CANCELLED'] as const).map((st) => {
          const count = st === 'ALL'
            ? historyOrders.length
            : historyOrders.filter((o) => o.status === st).length;
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

      {/* History Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-semibold">Loading delivery logs...</span>
        </div>
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
                  minWidth: '180px',
                  cell: ({ row }: { row: any }) => (
                    <div 
                      onClick={() => navigate(`/rider/history/${row.id}`)}
                      className="space-y-0.5 cursor-pointer group"
                    >
                      <p className="font-black text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        Order #{row.id}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                        <Store size={11} className="text-primary shrink-0" />
                        <span className="truncate">{row.restaurant?.name || 'Restaurant'}</span>
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
                      onClick={() => navigate(`/rider/history/${row.id}`)}
                      className="space-y-0.5 max-w-[220px] cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs text-foreground truncate hover:text-primary transition-colors">{row.user?.name || 'Customer'}</p>
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
                  id: 'payment',
                  label: 'PAYMENT MODE',
                  minWidth: '150px',
                  cell: ({ row }: { row: any }) => {
                    const isCod = row.paymentMethod === 'COD';
                    return (
                      <div className="flex flex-col items-start gap-0.5">
                        <Badge variant="soft" color={isCod ? 'warning' : 'success'} className="font-bold text-[9px] uppercase px-2 py-0.5">
                          {isCod ? 'COD' : 'Prepaid Online'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {isCod ? `Cash Liability: -৳${parseFloat(row.total || 0).toFixed(2)}` : 'Prepaid Online (No Cash)'}
                        </span>
                      </div>
                    );
                  }
                },
                {
                  id: 'earnings',
                  label: 'FEE EARNED',
                  minWidth: '140px',
                  cell: ({ row }: { row: any }) => (
                    <div className="flex flex-col">
                      <span className="font-extrabold text-emerald-600 font-mono text-sm">
                        +৳{parseFloat(row.riderEarnings || 0).toFixed(2)}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600/80 uppercase tracking-wider">
                        + TRIP FEE EARNED
                      </span>
                    </div>
                  )
                },
                {
                  id: 'date',
                  label: 'COMPLETED ON',
                  width: '160px',
                  cell: ({ row }: { row: any }) => (
                    <div className="text-[11px] text-muted-foreground font-medium">
                      {new Date(row.updatedAt || row.createdAt).toLocaleDateString()} at{' '}
                      {new Date(row.updatedAt || row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )
                },
                {
                  id: 'rating',
                  label: 'RATING',
                  width: '100px',
                  cell: ({ row }: { row: any }) => (
                    row.review?.riderRating ? (
                      <div className="flex items-center gap-1 font-bold text-xs text-foreground">
                        <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                        <span>{row.review.riderRating}.0</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-medium">—</span>
                    )
                  )
                },
                {
                  id: 'status',
                  label: 'STATUS',
                  width: '110px',
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
                  width: '110px',
                  align: 'right' as const,
                  cell: ({ row }: { row: any }) => (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => navigate(`/rider/history/${row.id}`)}
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
