import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Card, CardHeader, CardTitle, CardContent, Button, Tabs, toast } from '../design-system';
import { LogOut, Bike, MapPin, Store, User, Phone, CheckCircle, RefreshCw, Loader2, DollarSign, Wallet, ArrowRight, XCircle } from 'lucide-react';
import api from '../lib/axios';

export default function RiderDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [wallet, setWallet] = useState<{ balance: number; transactions: any[] }>({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchRiderData = async () => {
    try {
      const res = await api.get('/orders/rider');
      if (res.data?.success) {
        setAssignedOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load rider orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletData = async () => {
    setWalletLoading(true);
    try {
      const res = await api.get('/wallets/balance');
      if (res.data?.success) {
        setWallet({
          balance: parseFloat(res.data.walletBalance || 0),
          transactions: res.data.transactions || []
        });
      }
    } catch (err) {
      console.error('Failed to load rider wallet details:', err);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderData();
    fetchWalletData();
    const interval = setInterval(fetchRiderData, 7000);
    return () => clearInterval(interval);
  }, []);

  const handleRiderResponse = async (orderId: number, action: 'ACCEPT' | 'REJECT') => {
    setActionLoading(orderId);
    try {
      const res = await api.put(`/orders/${orderId}/rider-response`, { action });
      if (res.data?.success) {
        toast.success(action === 'ACCEPT' ? 'Order accepted! Navigate to restaurant.' : 'Assignment rejected.');
        fetchRiderData();
        fetchWalletData();
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
        fetchRiderData();
        fetchWalletData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      
      {/* Rider Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Bike className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-black text-white">Rider Portal</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Active: {user?.name}</span>
            <button
              onClick={handleLogout}
              className="h-8 w-8 rounded-full border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <Tabs defaultValue="tasks" className="w-full">
          
          <div className="flex justify-between items-center border-b border-slate-900 mb-8 pb-1">
            <div className="flex gap-2">
              <Tabs.Trigger value="tasks" className="pb-3 text-xs font-bold px-3 cursor-pointer">
                Deliveries ({assignedOrders.length})
              </Tabs.Trigger>
              <Tabs.Trigger value="wallet" className="pb-3 text-xs font-bold px-3 cursor-pointer">
                Rider Wallet
              </Tabs.Trigger>
            </div>
            <button 
              onClick={() => { fetchRiderData(); fetchWalletData(); }} 
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-800 hover:bg-slate-900 text-[9px] font-bold text-slate-400 cursor-pointer"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              Refresh
            </button>
          </div>

          {/* DELIVERIES TAB */}
          <Tabs.Content value="tasks" className="outline-none space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : assignedOrders.length === 0 ? (
              <div className="text-center py-24 text-slate-500 bg-slate-900/10 border border-dashed border-slate-900 rounded-3xl">
                <Bike className="h-10 w-10 mx-auto opacity-30 mb-3 text-primary animate-bounce" />
                <h3 className="text-sm font-black text-slate-300">Searching for new orders</h3>
                <p className="text-[10px] text-slate-500 mt-1">Keep this tab active. We will notify you when a food packet is ready.</p>
              </div>
            ) : (
              assignedOrders.map((order) => {
                const isAssigned = order.status === 'RIDER_ASSIGNED';
                const isWay = order.status === 'ON_THE_WAY';
                const isPicked = order.status === 'PICKED_UP';

                return (
                  <Card key={order.id} className="border border-slate-900 bg-slate-950/40 relative overflow-hidden shadow-2xl">
                    {actionLoading === order.id && (
                      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center z-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                    <CardContent className="p-6 space-y-6">
                      
                      {/* Top Header info */}
                      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                        <div>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Assignment Details</p>
                          <h3 className="text-sm font-black text-white mt-0.5">Order #{order.id}</h3>
                        </div>
                        <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                          Fee Earning: ৳{parseFloat(order.riderEarnings).toFixed(2)}
                        </span>
                      </div>

                      {/* Status indicator banners */}
                      {isAssigned && (
                        <div className="p-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                          <div>
                            <h4 className="text-xs font-black text-white">Incoming Order Assigned</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">Accept order to start delivery, or reject to pass to the next rider.</p>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto shrink-0">
                            <Button
                              onClick={() => handleRiderResponse(order.id, 'REJECT')}
                              variant="outline"
                              className="text-red-500 hover:bg-red-500/5 hover:border-red-500/50 flex-1 sm:flex-none py-1.5 text-[11px]"
                            >
                              Reject
                            </Button>
                            <Button
                              onClick={() => handleRiderResponse(order.id, 'ACCEPT')}
                              variant="primary"
                              className="flex-1 sm:flex-none py-1.5 text-[11px] font-bold"
                            >
                              Accept Job
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Map routing splits */}
                      {!isAssigned && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                          
                          {/* Pick Up from */}
                          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-900 space-y-2">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                              <Store className="h-3.5 w-3.5 text-primary" />
                              1. Restaurant Pickup
                            </p>
                            <div>
                              <h4 className="text-xs font-bold text-white">{order.restaurant?.name}</h4>
                              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                                Address: {order.restaurant?.address || 'Restaurant zone coordinates'}
                              </p>
                            </div>
                            {isWay && (
                              <Button
                                onClick={() => handleUpdateStatus(order.id, 'PICKED_UP')}
                                variant="primary"
                                fullWidth
                                className="py-2 text-[11px] font-bold mt-2"
                              >
                                Mark Picked Up
                              </Button>
                            )}
                          </div>

                          {/* Drop Off to */}
                          <div className={`p-4 rounded-2xl bg-slate-900/40 border border-slate-900 space-y-2 ${isWay ? 'opacity-50' : ''}`}>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-primary" />
                              2. Customer Dropoff
                            </p>
                            <div>
                              <h4 className="text-xs font-bold text-white">{order.user?.name} ({order.user?.phone || 'No phone'})</h4>
                              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                                Address: {order.deliveryAddressText.split(', Lat/Lng:')[0]}
                              </p>
                            </div>
                            <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-1.5 font-bold uppercase">
                              <span>Payment:</span>
                              <span className={`px-2 py-0.5 rounded-md ${
                                order.paymentMethod === 'COD' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                              }`}>
                                {order.paymentMethod === 'COD' ? `COD (Collect ৳${parseFloat(order.total).toFixed(2)})` : 'ONLINE (PREPAID)'}
                              </span>
                            </div>
                            {isPicked && (
                              <Button
                                onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                                variant="primary"
                                fullWidth
                                className="py-2 text-[11px] font-bold mt-2"
                              >
                                Mark Delivered
                              </Button>
                            )}
                          </div>

                        </div>
                      )}

                    </CardContent>
                  </Card>
                );
              })
            )}
          </Tabs.Content>

          {/* WALLET TAB */}
          <Tabs.Content value="wallet" className="outline-none space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Cash collection liability balance */}
              <Card className="border border-slate-900 bg-slate-950/40 col-span-1">
                <CardContent className="p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-bold">Ledger Balance</span>
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className={`text-2xl font-black ${wallet.balance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    ৳{wallet.balance.toFixed(2)}
                  </h2>
                  <p className="text-[10px] text-slate-500 leading-normal font-medium">
                    {wallet.balance < 0 
                      ? 'You hold COD cash collected. Settle this with the admin to make your balance positive.' 
                      : 'Platform owes you this balance in delivery fees.'}
                  </p>
                </CardContent>
              </Card>

              {/* Transactions Ledger */}
              <Card className="border border-slate-900 bg-slate-950/40 md:col-span-2">
                <CardHeader className="pb-2 border-b border-slate-900">
                  <CardTitle className="text-xs font-black flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Transaction Logs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {walletLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : wallet.transactions.length === 0 ? (
                    <p className="text-center py-10 text-xs text-slate-600">No transactions recorded yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-900 max-h-80 overflow-y-auto pr-1">
                      {wallet.transactions.map((tx) => (
                        <div key={tx.id} className="p-4 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-black text-white">{tx.description}</p>
                            <span className="text-[9px] text-slate-500 font-semibold uppercase">{tx.type} • {new Date(tx.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span className={`font-black text-sm ${parseFloat(tx.amount) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {parseFloat(tx.amount) < 0 ? '-' : '+'}৳{Math.abs(parseFloat(tx.amount)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </Tabs.Content>

        </Tabs>
      </main>
    </div>
  );
}
