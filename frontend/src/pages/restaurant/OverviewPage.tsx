import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, toast } from '../../design-system';
import { 
  ClipboardList, 
  Activity, 
  DollarSign, 
  AlertTriangle, 
  Loader2, 
  TrendingUp, 
  PackageCheck, 
  Wallet, 
  ShoppingBag, 
  Clock, 
  Store, 
  Calendar,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';

interface MerchantOrder {
  id: number;
  total: number | string;
  subtotal?: number | string;
  restaurantEarnings?: number | string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt: string;
  user?: { id: number; name: string; phone?: string };
  rider?: { id: number; name: string; phone?: string };
  items?: any[];
}

const CustomMerchantTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-md border border-border/60 shadow-xl rounded-xl p-3 text-xs space-y-1.5 z-50">
        <p className="font-extrabold text-foreground border-b border-border/20 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => {
          const isCount = entry.name?.toLowerCase().includes('order');
          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-black text-foreground">
                {isCount ? entry.value : `৳${Number(entry.value).toFixed(2)}`}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function OverviewPage() {
  const navigate = useNavigate();
  const [restaurantProfile, setRestaurantProfile] = useState<any>(null);
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [activeFoodsCount, setActiveFoodsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<'7DAYS' | '14DAYS' | '30DAYS'>('7DAYS');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [profileRes, ordersRes, foodsRes, walletRes] = await Promise.all([
        api.get('/onboarding/my-restaurant').catch(() => ({ data: { success: false } })),
        api.get('/orders/merchant').catch(() => ({ data: { success: false, orders: [] } })),
        api.get('/foods').catch(() => ({ data: { success: false, foods: [] } })),
        api.get('/wallets/balance').catch(() => ({ data: { success: false, walletBalance: 0 } }))
      ]);

      if (profileRes.data?.success) {
        setRestaurantProfile(profileRes.data.restaurant);
      }
      if (ordersRes.data?.success) {
        setOrders(ordersRes.data.orders || []);
      }
      if (foodsRes.data?.success) {
        const foodList = foodsRes.data.foods || [];
        const active = foodList.filter((f: any) => f.status === 'ACTIVE').length;
        setActiveFoodsCount(active);
      }
      if (walletRes.data?.success) {
        setWalletBalance(parseFloat(walletRes.data.walletBalance || 0));
      }
    } catch (err) {
      console.error('Failed to load merchant overview:', err);
      toast.error('Could not refresh store analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute real metrics from real orders
  const metrics = useMemo(() => {
    const now = new Date();
    
    // Today's orders
    const todayOrders = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });

    const todayDelivered = todayOrders.filter((o) => o.status === 'DELIVERED');
    const todayRevenue = todayDelivered.reduce(
      (sum, o) => sum + Number(o.restaurantEarnings || 0),
      0
    );

    const allDelivered = orders.filter((o) => o.status === 'DELIVERED');
    const totalEarnings = allDelivered.reduce(
      (sum, o) => sum + Number(o.restaurantEarnings || 0),
      0
    );

    const activeOrders = orders.filter(
      (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
    );

    return {
      todayOrdersCount: todayOrders.length,
      todayRevenue,
      totalOrdersCount: orders.length,
      deliveredOrdersCount: allDelivered.length,
      totalEarnings,
      activeOrdersCount: activeOrders.length
    };
  }, [orders]);

  // Compute daily income trend strictly from real orders for Recharts
  const dailyIncomeChartData = useMemo(() => {
    const numDays = dateRange === '7DAYS' ? 7 : dateRange === '14DAYS' ? 14 : 30;
    const daysMap: Record<string, { date: string; fullDate: string; NetIncome: number; Orders: number }> = {};
    const now = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daysMap[key] = { date: label, fullDate: key, NetIncome: 0, Orders: 0 };
    }

    orders.forEach((o) => {
      const key = o.createdAt ? o.createdAt.split('T')[0] : '';
      if (key && daysMap[key]) {
        if (o.status === 'DELIVERED' || o.paymentStatus === 'PAID') {
          daysMap[key].NetIncome += Number(o.restaurantEarnings || 0);
        }
        daysMap[key].Orders += 1;
      }
    });

    return Object.values(daysMap);
  }, [orders, dateRange]);

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/10">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Merchant Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Store operations, real-time earnings, and performance metrics.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboardData}
          className="font-bold text-xs self-start sm:self-auto"
          leftIcon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
        >
          Sync Data
        </Button>
      </div>

      {/* Status Banner */}
      {restaurantProfile && restaurantProfile.status !== 'ACTIVE' && (
        <div className="flex gap-3.5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-extrabold">Store Application Under Verification</p>
            <p className="mt-1 leading-normal opacity-85">
              Your merchant application is currently being verified by the platform team. You can continue managing your menu and settings.
            </p>
          </div>
        </div>
      )}

      {/* Primary KPI Grid (Real Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Net Revenue */}
        <Card className="border border-border/40 shadow-xs bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Today's Net Income</p>
              <h3 className="text-2xl font-black text-emerald-500">
                ৳{metrics.todayRevenue.toFixed(2)}
              </h3>
              <p className="text-[10px] text-muted-foreground font-semibold">
                {metrics.todayOrdersCount} orders placed today
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <DollarSign size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Total Net Earnings */}
        <Card className="border border-border/40 shadow-xs bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Total Sales Settled</p>
              <h3 className="text-2xl font-black text-foreground">
                ৳{metrics.totalEarnings.toFixed(2)}
              </h3>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                <PackageCheck size={11} />
                <span>{metrics.deliveredOrdersCount} completed orders</span>
              </div>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Available Wallet Balance */}
        <Card className="border border-border/40 shadow-xs bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Available Wallet</p>
              <h3 className="text-2xl font-black text-blue-500">
                ৳{walletBalance.toFixed(2)}
              </h3>
              <Link to="/restaurant/wallet" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
                Withdrawals <ArrowUpRight size={10} />
              </Link>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Wallet size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Active Menu Foods */}
        <Card className="border border-border/40 shadow-xs bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Live Menu Items</p>
              <h3 className="text-2xl font-black text-foreground">{activeFoodsCount}</h3>
              <Link to="/restaurant/menu" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
                Manage Menu <ArrowUpRight size={10} />
              </Link>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <ShoppingBag size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Professional Recharts Income Graph */}
      <Card className="border border-border/40 shadow-xs bg-card">
        <CardHeader className="pb-2 border-b border-border/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              Merchant Net Income & Sales Progression
            </CardTitle>
            <CardDescription className="text-xs">
              Live calculated net restaurant revenue curve from completed deliveries
            </CardDescription>
          </div>

          {/* Date range switcher */}
          <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border/40 self-start sm:self-auto">
            {(
              [
                { id: '7DAYS', label: '7 Days' },
                { id: '14DAYS', label: '14 Days' },
                { id: '30DAYS', label: '30 Days' }
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDateRange(t.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dateRange === t.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyIncomeChartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="merchantIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => `৳${val}`}
                />
                <Tooltip content={<CustomMerchantTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 'bold' }}
                />

                <Area
                  type="monotone"
                  dataKey="NetIncome"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#merchantIncomeGradient)"
                  name="Net Merchant Earnings (৳)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/10 text-xs font-bold text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-emerald-500" />
              <span>Net Merchant Earnings (৳)</span>
            </div>
            <div className="flex items-center gap-1.5 text-foreground">
              <span>Selected Period Total:</span>
              <span className="text-emerald-500 font-black">
                ৳{dailyIncomeChartData.reduce((s, x) => s + x.NetIncome, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Profile Card */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-semibold">Fetching store details...</span>
        </div>
      ) : restaurantProfile ? (
        <Card className="border border-border/40 shadow-xs bg-card">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4 border-b border-border/10 pb-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-black">
                {restaurantProfile.name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{restaurantProfile.name}</h3>
                <p className="text-xs text-muted-foreground italic mt-0.5">{restaurantProfile.description || 'No description provided.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Business Address</p>
                <p className="text-foreground text-xs mt-1 leading-relaxed">{restaurantProfile.address || 'N/A'}</p>
              </div>

              <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Store Owner</p>
                <p className="text-foreground text-xs mt-1">{restaurantProfile.user?.name || 'N/A'}</p>
              </div>

              <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Contact Credentials</p>
                <p className="text-foreground text-xs mt-1 font-bold">{restaurantProfile.user?.email}</p>
                <p className="text-muted-foreground text-[10px] mt-0.5">{restaurantProfile.user?.phone || 'N/A'}</p>
              </div>

              <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Delivery Zone Coordinates</p>
                <p className="text-foreground text-xs mt-1 font-mono">
                  Lat: {Number(restaurantProfile.latitude || 0).toFixed(6)} | Lng: {Number(restaurantProfile.longitude || 0).toFixed(6)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
