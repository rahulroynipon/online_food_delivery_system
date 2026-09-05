import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  Button, 
  Badge,
  DataTable,
  type DataTableColumn
} from '../../design-system';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Wallet, 
  Store, 
  Bike, 
  Calendar, 
  Download, 
  RefreshCw, 
  ShoppingBag, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowUpRight, 
  Percent, 
  Search, 
  FileText,
  CreditCard,
  Banknote,
  Receipt,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import api from '../../lib/axios';

interface OrderRecord {
  id: number;
  total: number | string;
  subtotal?: number | string;
  deliveryFee?: number | string;
  tax?: number | string;
  platformCommission?: number | string;
  restaurantEarnings?: number | string;
  riderEarnings?: number | string;
  discount?: number | string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  restaurant?: {
    id: number;
    name: string;
    logo?: string;
    slug?: string;
  };
  rider?: {
    id: number;
    name: string;
    phone?: string;
  };
}

interface AdminStats {
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

type DateRangeFilter = 'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'THIS_MONTH';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

// Professional Glassmorphism Recharts Tooltip
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-md border border-border/60 shadow-xl rounded-xl p-3 text-xs space-y-1.5 z-50">
        <p className="font-extrabold text-foreground border-b border-border/20 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => {
          const isCount = entry.name?.toLowerCase().includes('order') || entry.name?.toLowerCase().includes('count');
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

export default function ReportsPage() {
  const location = useLocation();
  const isReports = location.pathname.includes('/reports');

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('30DAYS');
  const [activeTab, setActiveTab] = useState<'overview' | 'merchants' | 'riders' | 'transactions'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.get('/orders/admin'),
        api.get('/orders/admin/stats')
      ]);

      if (ordersRes.data?.success) {
        setOrders(ordersRes.data.orders || []);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter orders by selected date range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      if (dateFilter === 'TODAY') {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      if (dateFilter === '7DAYS') {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (dateFilter === '30DAYS') {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      if (dateFilter === 'THIS_MONTH') {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [orders, dateFilter]);

  // Aggregate computations for the selected period
  const reportMetrics = useMemo(() => {
    const totalOrdersCount = filteredOrders.length;
    const delivered = filteredOrders.filter((o) => o.status === 'DELIVERED');
    const cancelled = filteredOrders.filter((o) => o.status === 'CANCELLED');
    const inProgress = filteredOrders.filter(
      (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
    );

    const paidOrders = filteredOrders.filter(
      (o) => o.paymentStatus === 'PAID' || o.status === 'DELIVERED'
    );

    const gmv = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const platformCommission = paidOrders.reduce(
      (sum, o) => sum + Number(o.platformCommission || 0),
      0
    );
    const tax = paidOrders.reduce((sum, o) => sum + Number(o.tax || 0), 0);
    const netRevenue = platformCommission + tax;
    const merchantPayouts = paidOrders.reduce(
      (sum, o) => sum + Number(o.restaurantEarnings || 0),
      0
    );
    const riderDisbursements = paidOrders.reduce(
      (sum, o) => sum + Number(o.riderEarnings || 0),
      0
    );

    const aov = paidOrders.length > 0 ? gmv / paidOrders.length : 0;
    const fulfillmentRate =
      totalOrdersCount > 0 ? (delivered.length / totalOrdersCount) * 100 : 0;

    // Payment methods breakdown
    const paymentMethods = paidOrders.reduce((acc: Record<string, { count: number; total: number }>, o) => {
      const method = o.paymentMethod || 'DIGITAL';
      if (!acc[method]) acc[method] = { count: 0, total: 0 };
      acc[method].count += 1;
      acc[method].total += Number(o.total || 0);
      return acc;
    }, {});

    return {
      totalOrdersCount,
      deliveredCount: delivered.length,
      cancelledCount: cancelled.length,
      inProgressCount: inProgress.length,
      paidCount: paidOrders.length,
      gmv,
      platformCommission,
      tax,
      netRevenue,
      merchantPayouts,
      riderDisbursements,
      aov,
      fulfillmentRate,
      paymentMethods
    };
  }, [filteredOrders]);

  // Daily Trend formatted for Recharts AreaChart
  const dailyChartData = useMemo(() => {
    const daysMap: Record<string, { date: string; fullDate: string; GMV: number; Commission: number; Orders: number }> = {};
    const count = dateFilter === '7DAYS' ? 7 : dateFilter === 'TODAY' ? 1 : 14;
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daysMap[key] = { date: label, fullDate: key, GMV: 0, Commission: 0, Orders: 0 };
    }

    filteredOrders.forEach((o) => {
      const key = o.createdAt?.split('T')[0];
      if (key && daysMap[key]) {
        const isPaid = o.paymentStatus === 'PAID' || o.status === 'DELIVERED';
        if (isPaid) {
          daysMap[key].GMV += Number(o.total || 0);
          daysMap[key].Commission += Number(o.platformCommission || 0);
        }
        daysMap[key].Orders += 1;
      }
    });

    return Object.values(daysMap);
  }, [filteredOrders, dateFilter]);

  // Payment Method data for Recharts PieChart
  const paymentPieData = useMemo(() => {
    return Object.entries(reportMetrics.paymentMethods).map(([name, data]) => ({
      name: name === 'COD' ? 'Cash on Delivery' : name,
      value: data.total,
      count: data.count
    }));
  }, [reportMetrics.paymentMethods]);

  // Order Status distribution for PieChart
  const statusPieData = useMemo(() => {
    return [
      { name: 'Delivered', value: reportMetrics.deliveredCount, color: '#10b981' },
      { name: 'In Progress', value: reportMetrics.inProgressCount, color: '#3b82f6' },
      { name: 'Cancelled', value: reportMetrics.cancelledCount, color: '#ef4444' }
    ].filter((d) => d.value > 0);
  }, [reportMetrics]);

  // Merchant Performance Table Aggregation
  const topMerchants = useMemo(() => {
    const map: Record<
      string,
      {
        id: number;
        name: string;
        logo?: string;
        orderCount: number;
        deliveredCount: number;
        gmv: number;
        commissionEarned: number;
        merchantCut: number;
      }
    > = {};

    filteredOrders.forEach((o) => {
      if (!o.restaurant) return;
      const rId = String(o.restaurant.id);
      if (!map[rId]) {
        map[rId] = {
          id: o.restaurant.id,
          name: o.restaurant.name || 'Merchant',
          logo: o.restaurant.logo,
          orderCount: 0,
          deliveredCount: 0,
          gmv: 0,
          commissionEarned: 0,
          merchantCut: 0
        };
      }
      map[rId].orderCount += 1;
      if (o.status === 'DELIVERED') map[rId].deliveredCount += 1;
      const isPaid = o.paymentStatus === 'PAID' || o.status === 'DELIVERED';
      if (isPaid) {
        map[rId].gmv += Number(o.total || 0);
        map[rId].commissionEarned += Number(o.platformCommission || 0);
        map[rId].merchantCut += Number(o.restaurantEarnings || 0);
      }
    });

    return Object.values(map).sort((a, b) => b.gmv - a.gmv);
  }, [filteredOrders]);

  // Rider Performance Table Aggregation
  const topRiders = useMemo(() => {
    const map: Record<
      string,
      {
        id: number;
        name: string;
        phone?: string;
        totalTrips: number;
        deliveredTrips: number;
        earnings: number;
      }
    > = {};

    filteredOrders.forEach((o) => {
      if (!o.rider) return;
      const rId = String(o.rider.id);
      if (!map[rId]) {
        map[rId] = {
          id: o.rider.id,
          name: o.rider.name || 'Rider',
          phone: o.rider.phone,
          totalTrips: 0,
          deliveredTrips: 0,
          earnings: 0
        };
      }
      map[rId].totalTrips += 1;
      if (o.status === 'DELIVERED') {
        map[rId].deliveredTrips += 1;
        map[rId].earnings += Number(o.riderEarnings || 0);
      }
    });

    return Object.values(map).sort((a, b) => b.earnings - a.earnings);
  }, [filteredOrders]);

  // Filtered transactions for the ledger tab
  const transactionsList = useMemo(() => {
    return filteredOrders.filter((o) => {
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesStatus;
      const matchesSearch =
        String(o.id).includes(q) ||
        o.restaurant?.name?.toLowerCase().includes(q) ||
        o.user?.name?.toLowerCase().includes(q) ||
        o.rider?.name?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [filteredOrders, searchQuery, statusFilter]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;

    const headers = [
      'Order ID',
      'Date',
      'Customer',
      'Customer Phone',
      'Restaurant',
      'Rider',
      'Gross Total (BDT)',
      'Subtotal (BDT)',
      'Delivery Fee (BDT)',
      'Platform Commission (BDT)',
      'Tax (BDT)',
      'Restaurant Net (BDT)',
      'Rider Earnings (BDT)',
      'Payment Method',
      'Payment Status',
      'Order Status'
    ];

    const rows = filteredOrders.map((o) => [
      `#${o.id}`,
      o.createdAt ? new Date(o.createdAt).toLocaleString('en-US') : '',
      `"${(o.user?.name || 'Customer').replace(/"/g, '""')}"`,
      `"${o.user?.phone || ''}"`,
      `"${(o.restaurant?.name || 'Restaurant').replace(/"/g, '""')}"`,
      `"${(o.rider?.name || 'Unassigned').replace(/"/g, '""')}"`,
      Number(o.total || 0).toFixed(2),
      Number(o.subtotal || 0).toFixed(2),
      Number(o.deliveryFee || 0).toFixed(2),
      Number(o.platformCommission || 0).toFixed(2),
      Number(o.tax || 0).toFixed(2),
      Number(o.restaurantEarnings || 0).toFixed(2),
      Number(o.riderEarnings || 0).toFixed(2),
      o.paymentMethod || 'DIGITAL',
      o.paymentStatus || 'PENDING',
      o.status
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `bitespeed_financial_report_${dateFilter.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge variant="success" size="sm" className="font-extrabold text-[10px]">DELIVERED</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger" size="sm" className="font-extrabold text-[10px]">CANCELLED</Badge>;
      case 'ON_THE_WAY':
        return <Badge variant="warning" size="sm" className="font-extrabold text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">ON THE WAY</Badge>;
      case 'PREPARING':
      case 'READY':
      case 'PICKED_UP':
        return <Badge variant="warning" size="sm" className="font-extrabold text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">{status}</Badge>;
      case 'CONFIRMED':
        return <Badge variant="info" size="sm" className="font-extrabold text-[10px]">CONFIRMED</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="outline" size="sm" className="font-extrabold text-[10px] text-muted-foreground">PENDING</Badge>;
    }
  };

  const transactionColumns: DataTableColumn<OrderRecord>[] = [
    {
      id: 'id',
      label: 'Order ID',
      width: '90px',
      cell: ({ row }) => (
        <span className="font-mono font-black text-xs text-primary">#{row.id}</span>
      )
    },
    {
      id: 'date',
      label: 'Date & Time',
      width: '130px',
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
        </span>
      )
    },
    {
      id: 'restaurant',
      label: 'Merchant',
      cell: ({ row }) => (
        <div className="font-bold text-xs text-foreground truncate max-w-[140px]">
          {row.restaurant?.name || 'Restaurant'}
        </div>
      )
    },
    {
      id: 'customer',
      label: 'Customer',
      cell: ({ row }) => (
        <div className="text-xs font-semibold text-foreground truncate max-w-[120px]">
          {row.user?.name || 'Customer'}
        </div>
      )
    },
    {
      id: 'gmv',
      label: 'Gross (GMV)',
      align: 'right',
      cell: ({ row }) => (
        <span className="font-black text-xs text-foreground">
          ৳{Number(row.total || 0).toFixed(2)}
        </span>
      )
    },
    {
      id: 'commission',
      label: 'Commission',
      align: 'right',
      cell: ({ row }) => (
        <span className="font-extrabold text-xs text-amber-600">
          ৳{Number(row.platformCommission || 0).toFixed(2)}
        </span>
      )
    },
    {
      id: 'merchantCut',
      label: 'Merchant Net',
      align: 'right',
      cell: ({ row }) => (
        <span className="font-extrabold text-xs text-rose-600">
          ৳{Number(row.restaurantEarnings || 0).toFixed(2)}
        </span>
      )
    },
    {
      id: 'riderFee',
      label: 'Rider Fee',
      align: 'right',
      cell: ({ row }) => (
        <span className="font-extrabold text-xs text-purple-600">
          ৳{Number(row.riderEarnings || 0).toFixed(2)}
        </span>
      )
    },
    {
      id: 'status',
      label: 'Status',
      align: 'right',
      cell: ({ row }) => getStatusBadge(row.status)
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-border/10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {isReports ? 'Financial Reports & Analytics' : 'Dashboard Overview'}
            </h2>
            <Badge variant="soft" color="primary" size="sm" className="font-extrabold text-[10px]">
              {isReports ? 'Live Engine' : 'Live Platform Pulse'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isReports
              ? 'Platform revenue, merchant reconciliations, fee disbursements, and fulfillment analytics.'
              : 'Real-time performance index, live platform metrics, and financial analytics.'}
          </p>
        </div>

        {/* Date Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border/40">
            {(
              [
                { id: 'TODAY', label: 'Today' },
                { id: '7DAYS', label: '7 Days' },
                { id: '30DAYS', label: '30 Days' },
                { id: 'THIS_MONTH', label: 'This Month' },
                { id: 'ALL', label: 'All Time' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dateFilter === tab.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            leftIcon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
            className="font-bold text-xs"
          >
            Sync
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download size={13} />}
            className="font-bold text-xs shadow-xs"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards Row 1: Primary Revenue & Financial Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total GMV */}
        <Card className="border-border/50 bg-card hover:shadow-md transition-all duration-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">
                Gross Merchandise Value
              </span>
              <h3 className="text-2xl font-black text-foreground">
                ৳{reportMetrics.gmv.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500">
                <TrendingUp size={11} />
                <span>{reportMetrics.paidCount} paid transactions</span>
              </div>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <DollarSign size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Platform Net Revenue */}
        <Card className="border-border/50 bg-card hover:shadow-md transition-all duration-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">
                Platform Net Revenue
              </span>
              <h3 className="text-2xl font-black text-amber-500">
                ৳{reportMetrics.netRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </h3>
              <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                <span>৳{reportMetrics.platformCommission.toFixed(0)} cut</span>
                {reportMetrics.tax > 0 && <span>+ ৳{reportMetrics.tax.toFixed(0)} tax</span>}
              </div>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Receipt size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Merchant Settlements */}
        <Card className="border-border/50 bg-card hover:shadow-md transition-all duration-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">
                Merchant Settlements
              </span>
              <h3 className="text-2xl font-black text-rose-500">
                ৳{reportMetrics.merchantPayouts.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </h3>
              <p className="text-[10px] text-muted-foreground font-semibold">
                Net food sales to restaurants
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <Store size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Rider Fleet Earnings */}
        <Card className="border-border/50 bg-card hover:shadow-md transition-all duration-300">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">
                Rider Fleet Earnings
              </span>
              <h3 className="text-2xl font-black text-purple-500">
                ৳{reportMetrics.riderDisbursements.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </h3>
              <p className="text-[10px] text-muted-foreground font-semibold">
                Delivery fees to courier fleet
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Wallet size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Professional Recharts Financial Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Financial Area Chart (GMV & Platform Commission) */}
        <Card className="lg:col-span-2 border-border/50 bg-card shadow-sm">
          <CardHeader className="pb-2 border-b border-border/10 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                Gross Sales & Commission Trajectory
              </CardTitle>
              <CardDescription className="text-xs">
                Time-series progression of daily GMV and platform commission cut
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyChartData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="commGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
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
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 'bold' }}
                  />

                  <Area
                    type="monotone"
                    dataKey="GMV"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gmvGradient)"
                    name="Gross GMV (৳)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Commission"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#commGradient)"
                    name="Platform Commission (৳)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Donut / Breakdown Chart (Payment Channels & Order Mix) */}
        <Card className="border-border/50 bg-card shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2 border-b border-border/10">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <PieChartIcon size={16} className="text-primary" />
              Settlement & Payment Mix
            </CardTitle>
            <CardDescription className="text-xs">
              Revenue distribution across payment methods
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 flex flex-col justify-center items-center">
            {paymentPieData.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-xs text-muted-foreground italic">
                No transaction records in this period
              </div>
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {paymentPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center" 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Micro Breakdown */}
            <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-border/10 text-center">
              <div>
                <span className="text-[10px] text-muted-foreground font-bold">Delivered</span>
                <p className="text-xs font-black text-emerald-500">{reportMetrics.deliveredCount}</p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-bold">Active</span>
                <p className="text-xs font-black text-blue-500">{reportMetrics.inProgressCount}</p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-bold">Cancelled</span>
                <p className="text-xs font-black text-rose-500">{reportMetrics.cancelledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Detailed Breakdown: Top Merchants, Riders, and Transactions Ledger */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1 bg-card/60 backdrop-blur-md rounded-2xl border border-border/40 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Merchant Performance ({topMerchants.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('riders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'riders'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Rider Disbursals ({topRiders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Full Transaction Ledger ({filteredOrders.length})
          </button>
        </div>

        {/* Tab 1: Top Merchants */}
        {activeTab === 'overview' && (
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/10 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black">Merchant Sales & Commission Breakdown</CardTitle>
                <CardDescription className="text-xs">
                  Reconciled gross sales and net payouts calculated per restaurant partner
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b border-border/10">
                    <tr>
                      <th className="px-6 py-4"># Rank</th>
                      <th className="px-6 py-4">Restaurant</th>
                      <th className="px-6 py-4 text-center">Orders (Delivered/Total)</th>
                      <th className="px-6 py-4 text-right">Gross GMV</th>
                      <th className="px-6 py-4 text-right">Platform Cut</th>
                      <th className="px-6 py-4 text-right">Merchant Net Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10 font-medium text-foreground">
                    {topMerchants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                          No merchant transactions recorded in this period.
                        </td>
                      </tr>
                    ) : (
                      topMerchants.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-muted/15 transition-colors">
                          <td className="px-6 py-4 font-black text-muted-foreground">#{idx + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                                <Store size={14} />
                              </div>
                              <span className="font-extrabold text-foreground">{m.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-emerald-500">{m.deliveredCount}</span>
                            <span className="text-muted-foreground"> / {m.orderCount}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-foreground">
                            ৳{m.gmv.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-amber-500">
                            ৳{m.commissionEarned.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-rose-500">
                            ৳{m.merchantCut.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Riders Disbursals */}
        {activeTab === 'riders' && (
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-sm font-black">Rider Fleet Payout Summary</CardTitle>
              <CardDescription className="text-xs">
                Aggregated trip completions and accumulated delivery fee disbursements
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b border-border/10">
                    <tr>
                      <th className="px-6 py-4"># Rank</th>
                      <th className="px-6 py-4">Rider</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4 text-center">Completed Deliveries</th>
                      <th className="px-6 py-4 text-right">Delivery Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10 font-medium text-foreground">
                    {topRiders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                          No rider delivery records found in this period.
                        </td>
                      </tr>
                    ) : (
                      topRiders.map((r, idx) => (
                        <tr key={r.id} className="hover:bg-muted/15 transition-colors">
                          <td className="px-6 py-4 font-black text-muted-foreground">#{idx + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-black text-xs shrink-0">
                                <Bike size={14} />
                              </div>
                              <span className="font-extrabold text-foreground">{r.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground font-mono">{r.phone || 'N/A'}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-emerald-500">{r.deliveredTrips}</span>
                            <span className="text-muted-foreground"> / {r.totalTrips}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-purple-500">
                            ৳{r.earnings.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Full Transactions Ledger */}
        {activeTab === 'transactions' && (
          <Card className="border-border/50 bg-card shadow-sm space-y-4 p-4">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search order #, customer, restaurant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-muted/20 border border-border/40 rounded-xl text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 self-end">
                <span className="text-xs font-bold text-muted-foreground">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-muted/30 border border-border/40 rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-hidden"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>

            <DataTable
              columns={transactionColumns}
              data={transactionsList}
              getRowId={(item) => String(item.id)}
              searchable={false}
              toolbar={null}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
