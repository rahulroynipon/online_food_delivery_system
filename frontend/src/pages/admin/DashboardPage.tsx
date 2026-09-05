import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '../../design-system';
import { 
  ArrowUpRight, 
  ClipboardList, 
  TrendingUp, 
  DollarSign, 
  Store, 
  Wallet, 
  Loader2, 
  RefreshCw,
  Clock,
  PackageCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';

interface DashboardStats {
  totalOrders: number;
  deliveredOrders: number;
  activeOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalCommission: number;
  totalTax?: number;
  totalPlatformRevenue?: number;
  restaurantPayable: number;
  riderEarnings: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/admin/stats');
      if (res.data?.success) {
        setStats(res.data.stats);
        setRecentOrders(res.data.recentOrders || []);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge variant="success" size="sm" className="font-extrabold text-[10px]">DELIVERED</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger" size="sm" className="font-extrabold text-[10px]">CANCELLED</Badge>;
      case 'ON_THE_WAY':
        return <Badge variant="warning" size="sm" className="font-extrabold text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">ON THE WAY</Badge>;
      case 'PICKED_UP':
      case 'READY':
      case 'PREPARING':
        return <Badge variant="warning" size="sm" className="font-extrabold text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">{status}</Badge>;
      case 'CONFIRMED':
        return <Badge variant="info" size="sm" className="font-extrabold text-[10px]">CONFIRMED</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="outline" size="sm" className="font-extrabold text-[10px] text-muted-foreground">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-border/10">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Dashboard Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time performance index and live platform metrics.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          className="font-bold text-xs"
          leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh Stats
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-semibold">Loading platform metrics...</p>
        </div>
      ) : (
        <>
          {/* Metrics Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-border/50 bg-card hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Total Orders</span>
                  <h3 className="text-3xl font-black text-foreground mt-1">{stats?.totalOrders || 0}</h3>
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-2">
                    <PackageCheck size={12} className="mr-0.5" /> {stats?.deliveredOrders || 0} Delivered
                  </span>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ClipboardList size={22} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Total Revenue</span>
                  <h3 className="text-3xl font-black text-foreground mt-1">৳{(stats?.totalRevenue || 0).toFixed(0)}</h3>
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-2">
                    <ArrowUpRight size={12} className="mr-0.5" /> Paid Orders
                  </span>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <TrendingUp size={22} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Platform Earnings</span>
                  <h3 className="text-3xl font-black text-foreground mt-1">৳{(stats?.totalCommission || 0).toFixed(0)}</h3>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="inline-flex items-center text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      <DollarSign size={12} className="mr-0.5" /> ৳{(stats?.totalCommission || 0).toFixed(0)} Cut
                    </span>
                    {(stats?.totalTax || 0) > 0 && (
                      <span className="inline-flex items-center text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        +৳{(stats?.totalTax || 0).toFixed(0)} Tax
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <DollarSign size={22} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Restaurant Payable</span>
                  <h3 className="text-2xl font-black text-foreground mt-1">৳{(stats?.restaurantPayable || 0).toFixed(0)}</h3>
                  <p className="text-[10px] text-muted-foreground mt-2">Merchant sales ready for withdrawal / settlement</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <Store size={22} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Rider Earnings</span>
                  <h3 className="text-2xl font-black text-foreground mt-1">৳{(stats?.riderEarnings || 0).toFixed(0)}</h3>
                  <p className="text-[10px] text-muted-foreground mt-2">Aggregated rider delivery fee earnings</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                  <Wallet size={22} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders Table */}
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/10 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Recent Orders</CardTitle>
                <CardDescription>Listing last active platform order actions</CardDescription>
              </div>
              <Link to="/admin/orders">
                <Button variant="ghost" size="xs" className="font-bold text-xs">
                  View All Orders &rarr;
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b border-border/10">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Restaurant</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10 font-medium text-foreground">
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic">
                          No orders recorded yet.
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-muted/15 transition-colors">
                          <td className="px-6 py-4 font-semibold text-primary">#{ord.id}</td>
                          <td className="px-6 py-4 font-bold">{ord.user?.name || 'Customer'}</td>
                          <td className="px-6 py-4">{ord.restaurant?.name || 'Restaurant'}</td>
                          <td className="px-6 py-4 font-black">৳{parseFloat(String(ord.total || 0)).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            {getStatusBadge(ord.status)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
