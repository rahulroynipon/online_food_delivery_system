import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Badge, DataTable, toast } from '../../design-system';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Loader2, 
  RefreshCw, 
  Store, 
  MapPin, 
  PackageCheck 
} from 'lucide-react';
import api from '../../lib/axios';

export default function RiderHistoryPage() {
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
          leftIcon={<RefreshCw size={13} />}
          className="font-bold text-xs"
        >
          Refresh Logs
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/60 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Delivered</span>
              <h3 className="text-xl font-black text-foreground mt-0.5">{totalDelivered}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Fees Collected</span>
              <h3 className="text-xl font-black text-foreground mt-0.5">৳{totalEarned.toFixed(2)}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Average Fee / Trip</span>
              <h3 className="text-xl font-black text-foreground mt-0.5">
                ৳{totalDelivered > 0 ? (totalEarned / totalDelivered).toFixed(2) : '0.00'}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <PackageCheck size={18} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl w-fit">
        {(['ALL', 'DELIVERED', 'CANCELLED'] as const).map((st) => {
          const count = st === 'ALL'
            ? historyOrders.length
            : historyOrders.filter((o) => o.status === st).length;
          const isSelected = statusFilter === st;

          return (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-card text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {st === 'ALL' ? 'All Deliveries' : st.charAt(0) + st.slice(1).toLowerCase()}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* History Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-semibold">Loading delivery logs...</span>
        </div>
      ) : (
        <Card className="bg-transparent border-none shadow-none">
          <CardContent className="p-0">
            <DataTable
              data={filteredOrders}
              pagination={false}
              searchable={false}
              toolbar={null}
              columns={[
                {
                  id: 'order',
                  label: 'Order Info',
                  minWidth: '200px',
                  cell: ({ row }: { row: any }) => (
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-sm text-foreground">Order #{row.id}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                        <Store size={11} className="text-primary" />
                        {row.restaurant?.name || 'Restaurant'}
                      </p>
                    </div>
                  )
                },
                {
                  id: 'customer',
                  label: 'Dropoff Customer',
                  minWidth: '220px',
                  cell: ({ row }: { row: any }) => (
                    <div className="space-y-0.5 max-w-[200px]">
                      <p className="font-bold text-xs text-foreground truncate">{row.user?.name || 'Customer'}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {row.deliveryAddressText?.split(', Lat/Lng:')[0] || 'Customer Address'}
                      </p>
                    </div>
                  )
                },
                {
                  id: 'payment',
                  label: 'Payment Mode',
                  width: '140px',
                  cell: ({ row }: { row: any }) => (
                    <Badge variant="soft" color={row.paymentMethod === 'COD' ? 'warning' : 'success'} className="font-bold text-[9px] uppercase px-2 py-0.5">
                      {row.paymentMethod === 'COD' ? `COD (৳${parseFloat(row.total).toFixed(2)})` : 'Prepaid Online'}
                    </Badge>
                  )
                },
                {
                  id: 'earnings',
                  label: 'Fee Earned',
                  width: '130px',
                  cell: ({ row }: { row: any }) => (
                    <span className="font-extrabold text-emerald-600 font-mono text-sm">
                      +৳{parseFloat(row.riderEarnings || 0).toFixed(2)}
                    </span>
                  )
                },
                {
                  id: 'date',
                  label: 'Completed On',
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
                  label: 'Status',
                  width: '110px',
                  align: 'center' as const,
                  cell: ({ row }: { row: any }) => (
                    row.status === 'DELIVERED'
                      ? <Badge variant="soft" color="success" className="font-bold text-[9px] uppercase px-2.5 py-0.5">Delivered</Badge>
                      : <Badge variant="soft" color="danger" className="font-bold text-[9px] uppercase px-2.5 py-0.5">Cancelled</Badge>
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
