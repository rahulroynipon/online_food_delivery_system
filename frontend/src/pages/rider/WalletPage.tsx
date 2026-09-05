import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, DataTable, Modal, Input, toast } from '../../design-system';
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Info,
  CreditCard,
  Search,
  Receipt,
  Eye,
  Store,
  User,
  Phone,
  Bike,
  ArrowDownToLine,
  Send,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import api from '../../lib/axios';

export default function RiderWalletPage() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<{ balance: number; transactions: any[] }>({ balance: 0, transactions: [] });
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'DELIVERIES' | 'WITHDRAWALS'>('DELIVERIES');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DELIVERY_FEE' | 'COD_COLLECTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    paymentMethod: 'BKASH' as 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK_TRANSFER',
    accountNumber: '',
    accountType: 'PERSONAL' as 'PERSONAL' | 'MERCHANT',
    bankName: '',
    branchName: '',
    accountHolderName: '',
    notes: '',
  });

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const [walletRes, withdrawRes] = await Promise.all([
        api.get('/wallets/balance'),
        api.get('/wallets/withdrawals/my'),
      ]);

      if (walletRes.data?.success) {
        setWallet({
          balance: parseFloat(walletRes.data.walletBalance || 0),
          transactions: walletRes.data.transactions || []
        });
      }

      if (withdrawRes.data?.success) {
        setWithdrawals(withdrawRes.data.requests || []);
      }
    } catch (err) {
      console.error('Failed to load rider wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  // Consolidate transactions so each order appears as exactly 1 row
  const consolidatedTransactions = React.useMemo(() => {
    const orderMap = new Map<number, any>();
    const nonOrderTxns: any[] = [];

    for (const tx of wallet.transactions) {
      if (tx.orderId) {
        if (!orderMap.has(tx.orderId)) {
          orderMap.set(tx.orderId, {
            id: tx.id,
            orderId: tx.orderId,
            order: tx.order,
            createdAt: tx.createdAt,
            deliveryFeeEarned: parseFloat(tx.order?.riderEarnings || 0),
            codCashCollected: tx.order?.paymentMethod === 'COD' ? parseFloat(tx.order?.total || 0) : 0,
            netAmount: parseFloat(tx.amount || 0),
            isCod: tx.order?.paymentMethod === 'COD' || tx.type === 'COD_COLLECTION',
            rawTransactions: []
          });
        }
        const item = orderMap.get(tx.orderId)!;
        item.rawTransactions.push(tx);

        const amt = parseFloat(tx.amount) || 0;
        if (tx.type === 'DELIVERY_FEE' || amt > 0) {
          if (item.deliveryFeeEarned === 0) item.deliveryFeeEarned = amt;
        } else if (tx.type === 'COD_COLLECTION' || amt < 0) {
          if (item.codCashCollected === 0) item.codCashCollected = Math.abs(amt);
          item.isCod = true;
        }

        if (new Date(tx.createdAt) > new Date(item.createdAt)) {
          item.createdAt = tx.createdAt;
        }
        if (!item.order && tx.order) {
          item.order = tx.order;
        }
      } else {
        const amt = parseFloat(tx.amount) || 0;
        nonOrderTxns.push({
          ...tx,
          netAmount: amt,
          deliveryFeeEarned: amt > 0 ? amt : 0,
          codCashCollected: amt < 0 ? Math.abs(amt) : 0,
          isCod: false,
          isNonOrder: true
        });
      }
    }

    // Ensure all orders have correct fee and cash breakdown
    for (const item of orderMap.values()) {
      if (item.deliveryFeeEarned === 0 && item.order?.riderEarnings) {
        item.deliveryFeeEarned = parseFloat(item.order.riderEarnings);
      }
      if (item.isCod && item.codCashCollected === 0 && item.order?.total) {
        item.codCashCollected = parseFloat(item.order.total);
      }
      if (item.isCod && (!item.netAmount || item.netAmount === 0)) {
        item.netAmount = item.deliveryFeeEarned - item.codCashCollected;
      }
    }

    const orderList = Array.from(orderMap.values());
    const all = [...orderList, ...nonOrderTxns];
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return all;
  }, [wallet.transactions]);

  const grossBalance = wallet.balance;
  const totalDeliveryFees = consolidatedTransactions
    .reduce((acc, curr) => acc + (parseFloat(curr.deliveryFeeEarned) || 0), 0);

  const totalCodCollected = consolidatedTransactions
    .filter((tx) => tx.isCod)
    .reduce((acc, curr) => acc + (parseFloat(curr.codCashCollected) || 0), 0);

  const pendingWithdrawalsAmount = withdrawals
    .filter((w) => w.status === 'PENDING')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const availableToWithdraw = Math.max(0, grossBalance - pendingWithdrawalsAmount);

  // Submit withdrawal request
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmt = parseFloat(withdrawForm.amount);

    if (!withdrawAmt || withdrawAmt <= 0) {
      toast.error('Please enter a valid amount greater than 0.');
      return;
    }

    if (withdrawAmt > availableToWithdraw) {
      toast.error(`Insufficient available balance. You have ৳${availableToWithdraw.toFixed(2)} available for new payouts (৳${pendingWithdrawalsAmount.toFixed(2)} is pending review).`);
      return;
    }

    if (!withdrawForm.accountNumber) {
      toast.error('Please provide an account or wallet phone number.');
      return;
    }

    if (withdrawForm.paymentMethod === 'BANK_TRANSFER' && (!withdrawForm.bankName || !withdrawForm.accountHolderName)) {
      toast.error('Please enter Bank Name and Account Holder Name for bank transfer.');
      return;
    }

    setWithdrawLoading(true);
    try {
      const formattedAccount = withdrawForm.paymentMethod === 'BANK_TRANSFER' 
        ? withdrawForm.accountNumber 
        : (withdrawForm.accountNumber.startsWith('+88') 
            ? withdrawForm.accountNumber 
            : `+88${withdrawForm.accountNumber.startsWith('0') ? withdrawForm.accountNumber : `0${withdrawForm.accountNumber}`}`);

      const res = await api.post('/wallets/withdrawals', {
        ...withdrawForm,
        accountNumber: formattedAccount
      });
      if (res.data?.success) {
        toast.success('Payout request submitted successfully for Admin review.');
        setIsWithdrawModalOpen(false);
        setWithdrawForm({
          amount: '',
          paymentMethod: 'BKASH',
          accountNumber: '',
          accountType: 'PERSONAL',
          bankName: '',
          branchName: '',
          accountHolderName: '',
          notes: '',
        });
        fetchWallet();
        setActiveTab('WITHDRAWALS');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit withdrawal request.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = consolidatedTransactions.filter((tx) => {
    const isCod = tx.isCod || tx.codCashCollected > 0;
    const matchesType = typeFilter === 'ALL'
      ? true
      : typeFilter === 'DELIVERY_FEE'
      ? !isCod || tx.deliveryFeeEarned > 0
      : isCod;

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = query === ''
      ? true
      : (tx.description || '').toLowerCase().includes(query) ||
        String(tx.id).includes(query) ||
        String(tx.orderId || '').includes(query) ||
        (tx.order?.user?.name || '').toLowerCase().includes(query) ||
        (tx.order?.restaurant?.name || '').toLowerCase().includes(query);

    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Earnings & Ledger Wallet</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track your delivery fees earned, cash-on-delivery settlements, and payout logs.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchWallet}
            leftIcon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
            className="font-bold text-xs"
          >
            Refresh
          </Button>

          <Button
            size="sm"
            variant="primary"
            disabled={availableToWithdraw <= 0}
            onClick={() => setIsWithdrawModalOpen(true)}
            leftIcon={<ArrowDownToLine size={14} />}
            className="font-extrabold text-xs shadow-md shadow-primary/15"
          >
            Request Payout
          </Button>
        </div>
      </div>

      {/* Hero Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Balance Card */}
        <Card className="border border-border/60 bg-card md:col-span-1 shadow-2xs">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {grossBalance < 0 ? 'Current Net Liability' : 'Available to Withdraw'}
              </span>
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Wallet size={18} />
              </div>
            </div>

            <div>
              <h2 className={`text-3xl sm:text-4xl font-black ${grossBalance < 0 ? 'text-rose-500' : availableToWithdraw > 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                {grossBalance < 0 ? `-৳${Math.abs(grossBalance).toFixed(2)}` : `৳${availableToWithdraw.toFixed(2)}`}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block ${
                  grossBalance < 0 
                    ? 'bg-rose-500/10 text-rose-600' 
                    : availableToWithdraw > 0 
                    ? 'bg-emerald-500/10 text-emerald-600' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {grossBalance < 0 ? 'Net Cash Liability (Held in Hand)' : availableToWithdraw > 0 ? 'Ready for Payout' : 'All Funds in Review'}
                </span>
                {pendingWithdrawalsAmount > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    ৳{pendingWithdrawalsAmount.toFixed(2)} Pending
                  </span>
                )}
              </div>
            </div>

            {/* Balance Breakdown list */}
            {grossBalance >= 0 && (
              <div className="pt-2 border-t border-border/40 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Total Positive Balance:</span>
                  <span className="font-bold text-foreground font-mono">৳{grossBalance.toFixed(2)}</span>
                </div>
                {pendingWithdrawalsAmount > 0 && (
                  <div className="flex justify-between items-center text-amber-600 dark:text-amber-500">
                    <span>Locked in Review:</span>
                    <span className="font-bold font-mono">-৳{pendingWithdrawalsAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              {grossBalance < 0 
                ? 'You are currently holding physical cash collected from Cash on Delivery orders. Settle with platform admin to restore balance.' 
                : 'Your net platform earnings in trip delivery fees ready for payout transfer (bKash, Nagad, Bank).'}
            </p>
          </CardContent>
        </Card>

        {/* Lifetime Metrics */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <Card className="border border-border/60 bg-card shadow-2xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Delivery Fees Earned</span>
                <h3 className="text-2xl font-black text-emerald-600">+৳{totalDeliveryFees.toFixed(2)}</h3>
                <p className="text-[10px] text-muted-foreground">Credited trip earnings from completed orders</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight size={22} />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card shadow-2xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total COD Cash Collected</span>
                <h3 className="text-2xl font-black text-rose-500">-৳{totalCodCollected.toFixed(2)}</h3>
                <p className="text-[10px] text-muted-foreground">Physical cash collected from customers</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <ArrowDownLeft size={22} />
              </div>
            </CardContent>
          </Card>

          {/* Ledger explanation alert */}
          <div className="sm:col-span-2 p-4 rounded-2xl bg-primary/5 border border-primary/15 flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
            <Info size={16} className="text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-foreground">How COD Accounting & Net Liability Works:</span>
              <p className="mt-0.5">
                On each COD delivery, you keep your <strong className="text-emerald-600">Trip Fee (+৳)</strong> from the cash collected. The remaining amount (Food + Tax) is your <strong className="text-rose-500">Net Liability (-৳)</strong> to settle with the platform.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Main Section Navigation: Deliveries vs Withdrawal Requests */}
      <div className="border-b border-border/40 flex items-center gap-6 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('DELIVERIES')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'DELIVERIES'
              ? 'border-primary text-primary font-black'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt size={15} />
          <span>Deliveries &amp; Ledger</span>
          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-foreground">
            {consolidatedTransactions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('WITHDRAWALS')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'WITHDRAWALS'
              ? 'border-primary text-primary font-black'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ArrowDownToLine size={15} />
          <span>Withdrawal Requests</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            pendingWithdrawalsAmount > 0 ? 'bg-amber-500/15 text-amber-600 font-bold' : 'bg-muted text-foreground'
          }`}>
            {withdrawals.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Deliveries & Ledger */}
      {activeTab === 'DELIVERIES' && (
        <div className="space-y-4">
          
          {/* Table Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            
            <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl w-fit border border-border/40">
              {(['ALL', 'DELIVERY_FEE', 'COD_COLLECTION'] as const).map((t) => {
                const isSelected = typeFilter === t;
                const count = t === 'ALL'
                  ? consolidatedTransactions.length
                  : t === 'DELIVERY_FEE'
                  ? consolidatedTransactions.filter((tx) => !tx.isCod || tx.deliveryFeeEarned > 0).length
                  : consolidatedTransactions.filter((tx) => tx.isCod).length;

                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-card text-foreground shadow-xs font-bold border border-border/50'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t === 'ALL' ? 'All Deliveries' : t === 'DELIVERY_FEE' ? 'Trip Fee Earnings' : 'COD Orders'}
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
                placeholder="Search order #, customer, store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border/60 bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
              />
            </div>

          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground font-semibold">Loading ledger transactions...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <Card className="border-dashed border-2 border-border/70 bg-card/40">
              <CardContent className="py-16 text-center text-xs text-muted-foreground space-y-2">
                <Receipt className="h-10 w-10 text-muted-foreground mx-auto opacity-40 mb-2" />
                <p className="font-bold text-foreground">No transactions found</p>
                <p className="text-[11px] text-muted-foreground">
                  {searchQuery ? 'Try changing your search query.' : 'Completed delivery trips will generate accounting records here.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none bg-transparent shadow-none">
              <CardContent className="p-0">
                <DataTable
                  data={filteredTransactions}
                  pagination={false}
                  searchable={false}
                  toolbar={null}
                  columns={[
                    {
                      id: 'order',
                      label: 'ORDER / REFERENCE',
                      minWidth: '170px',
                      cell: ({ row }: { row: any }) => (
                        <div className="space-y-0.5">
                          {row.orderId ? (
                            <div 
                              onClick={() => navigate(`/rider/history/${row.orderId}`)}
                              className="cursor-pointer group"
                            >
                              <p className="font-black text-xs text-foreground group-hover:text-primary transition-colors">
                                Order #{row.orderId}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Txn #{row.id} • {row.order?.items?.length || 0} item{row.order?.items?.length === 1 ? '' : 's'}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold text-xs text-foreground">Manual Settlement</p>
                              <p className="text-[10px] text-muted-foreground">Txn #{row.id} • Platform Adjustment</p>
                            </div>
                          )}
                        </div>
                      )
                    },
                    {
                      id: 'parties',
                      label: 'CUSTOMER & RESTAURANT',
                      minWidth: '190px',
                      cell: ({ row }: { row: any }) => (
                        <div className="space-y-0.5">
                          {row.order ? (
                            <>
                              <p className="font-bold text-xs text-foreground truncate flex items-center gap-1">
                                <User size={10} className="text-muted-foreground shrink-0" />
                                <span>{row.order.user?.name || 'Customer'}</span>
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                                <Store size={10} className="text-primary shrink-0" />
                                <span>{row.order.restaurant?.name || 'Partner Restaurant'}</span>
                              </p>
                            </>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">Admin Settlement Action</span>
                          )}
                        </div>
                      )
                    },
                    {
                      id: 'payment',
                      label: 'PAYMENT',
                      width: '120px',
                      cell: ({ row }: { row: any }) => {
                        if (!row.order) {
                          return (
                            <Badge variant="soft" color="primary" className="font-bold text-[9px] uppercase px-2 py-0.5">
                              Settlement
                            </Badge>
                          );
                        }
                        const isCod = row.order.paymentMethod === 'COD' || row.isCod;
                        return (
                          <Badge variant="soft" color={isCod ? 'warning' : 'success'} className="font-bold text-[9px] uppercase px-2 py-0.5">
                            {isCod ? 'COD' : 'Online Prepaid'}
                          </Badge>
                        );
                      }
                    },
                    {
                      id: 'earned',
                      label: 'TRIP FEE EARNED',
                      width: '130px',
                      cell: ({ row }: { row: any }) => {
                        const fee = parseFloat(row.deliveryFeeEarned) || 0;
                        if (fee === 0 && row.isNonOrder) return <span className="text-xs text-muted-foreground">—</span>;
                        return (
                          <span className="font-bold text-xs text-emerald-600 dark:text-emerald-500 font-mono">
                            +৳{fee.toFixed(2)}
                          </span>
                        );
                      }
                    },
                    {
                      id: 'cashCollected',
                      label: 'COD CASH COLLECTED',
                      width: '150px',
                      cell: ({ row }: { row: any }) => {
                        const isCod = row.isCod || row.codCashCollected > 0;
                        if (!isCod) {
                          return (
                            <span className="text-[11px] text-muted-foreground italic font-medium">
                              ৳0.00 (Online)
                            </span>
                          );
                        }
                        return (
                          <span className="font-bold text-xs text-rose-500 font-mono">
                            -৳{parseFloat(row.codCashCollected).toFixed(2)}
                          </span>
                        );
                      }
                    },
                    {
                      id: 'netBalance',
                      label: 'NET LIABILITY IMPACT',
                      width: '160px',
                      cell: ({ row }: { row: any }) => {
                        const net = parseFloat(row.netAmount);
                        const isNegative = net < 0;
                        return (
                          <div className="flex flex-col">
                            <span className={`font-black font-mono text-sm ${isNegative ? 'text-rose-500' : 'text-emerald-600'}`}>
                              {net > 0 ? '+' : ''}৳{net.toFixed(2)}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                              {isNegative ? 'Owed to Platform' : 'Credited Earnings'}
                            </span>
                          </div>
                        );
                      }
                    },
                    {
                      id: 'date',
                      label: 'DELIVERY TIME',
                      width: '150px',
                      cell: ({ row }: { row: any }) => (
                        <div className="text-[11px] text-muted-foreground font-medium">
                          {new Date(row.createdAt).toLocaleDateString()} at{' '}
                          {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )
                    },
                    {
                      id: 'actions',
                      label: 'ACTION',
                      width: '90px',
                      align: 'right' as const,
                      cell: ({ row }: { row: any }) => {
                        if (row.orderId) {
                          return (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => navigate(`/rider/history/${row.orderId}`)}
                              leftIcon={<Eye size={12} className="text-primary" />}
                              className="font-extrabold text-xs h-8 px-2.5 rounded-lg border-border/80 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all shadow-2xs cursor-pointer"
                            >
                              View
                            </Button>
                          );
                        }
                        return null;
                      }
                    }
                  ]}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: Rider Withdrawal Requests History */}
      {activeTab === 'WITHDRAWALS' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground font-semibold">Loading payout requests...</span>
            </div>
          ) : withdrawals.length === 0 ? (
            <Card className="border-dashed border-2 border-border/70 bg-card/40">
              <CardContent className="py-16 text-center text-xs text-muted-foreground space-y-3">
                <ArrowDownToLine className="h-10 w-10 text-muted-foreground mx-auto opacity-40 mb-2" />
                <p className="font-bold text-foreground text-sm">No Payout Requests Yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When you request a payout for your positive trip delivery earnings, its review status will appear here.
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={wallet.balance <= 0}
                  onClick={() => setIsWithdrawModalOpen(true)}
                  leftIcon={<ArrowDownToLine size={14} />}
                  className="font-bold mt-2"
                >
                  Request Payout Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none bg-transparent shadow-none">
              <CardContent className="p-0">
                <DataTable
                  data={withdrawals}
                  pagination={false}
                  searchable={false}
                  toolbar={null}
                  columns={[
                    {
                      id: 'id',
                      label: 'REQ ID',
                      width: '90px',
                      cell: ({ row }: { row: any }) => (
                        <span className="font-bold text-xs font-mono text-foreground">
                          #{row.id}
                        </span>
                      )
                    },
                    {
                      id: 'amount',
                      label: 'AMOUNT',
                      width: '130px',
                      cell: ({ row }: { row: any }) => (
                        <span className="font-black text-sm font-mono text-foreground">
                          ৳{parseFloat(row.amount).toFixed(2)}
                        </span>
                      )
                    },
                    {
                      id: 'channel',
                      label: 'CHANNEL & ACCOUNT',
                      minWidth: '200px',
                      cell: ({ row }: { row: any }) => (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="soft" color="primary" className="text-[9px] font-extrabold uppercase px-1.5 py-0.2">
                              {row.paymentMethod}
                            </Badge>
                            <span className="text-xs font-bold font-mono text-foreground">{row.accountNumber}</span>
                          </div>
                          {row.paymentMethod === 'BANK_TRANSFER' && row.bankName && (
                            <p className="text-[10px] text-muted-foreground">
                              {row.bankName} {row.branchName ? `(${row.branchName})` : ''} • {row.accountHolderName}
                            </p>
                          )}
                        </div>
                      )
                    },
                    {
                      id: 'status',
                      label: 'STATUS',
                      minWidth: '140px',
                      cell: ({ row }: { row: any }) => {
                        if (row.status === 'PROCESSED') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 whitespace-nowrap select-none">
                              <CheckCircle2 size={12} className="shrink-0 text-emerald-600" />
                              <span>Disbursed</span>
                            </span>
                          );
                        }
                        if (row.status === 'REJECTED') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/10 text-rose-600 border border-rose-500/20 whitespace-nowrap select-none">
                              <XCircle size={12} className="shrink-0 text-rose-600" />
                              <span>Rejected</span>
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20 whitespace-nowrap select-none">
                            <Clock size={12} className="shrink-0 text-amber-600" />
                            <span>Pending Review</span>
                          </span>
                        );
                      }
                    },
                    {
                      id: 'adminNote',
                      label: 'ADMIN REMARKS',
                      minWidth: '180px',
                      cell: ({ row }: { row: any }) => (
                        <div className="text-xs text-muted-foreground">
                          {row.adminNote ? (
                            <span className="text-foreground/90 font-medium">{row.adminNote}</span>
                          ) : (
                            <span className="italic text-muted-foreground/60">Awaiting review</span>
                          )}
                        </div>
                      )
                    },
                    {
                      id: 'date',
                      label: 'REQUESTED AT',
                      width: '160px',
                      cell: ({ row }: { row: any }) => (
                        <div className="text-[11px] text-muted-foreground font-medium">
                          {new Date(row.createdAt).toLocaleDateString()} at{' '}
                          {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )
                    }
                  ]}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modal: Request Rider Payout */}
      <Modal
        open={isWithdrawModalOpen}
        onClose={() => !withdrawLoading && setIsWithdrawModalOpen(false)}
        size="md"
      >
        <Modal.Header
          title="Request Rider Earnings Payout"
          description="Transfer your net positive delivery trip earnings to your personal bKash, Nagad, Rocket, or Bank account."
          icon={<ArrowDownToLine className="text-primary" size={20} />}
        />
        <Modal.Content>
          <form onSubmit={handleWithdrawSubmit} className="space-y-4 pt-1">
          
          {/* Balance info banner */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/15 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground font-semibold">Available for New Payout</span>
                <p className="text-xl font-black text-emerald-600">৳{availableToWithdraw.toFixed(2)}</p>
              </div>
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={availableToWithdraw <= 0}
                onClick={() => setWithdrawForm({ ...withdrawForm, amount: String(availableToWithdraw.toFixed(2)) })}
                className="text-[10px] font-bold"
              >
                Withdraw All
              </Button>
            </div>
            {pendingWithdrawalsAmount > 0 && (
              <div className="text-[11px] text-amber-600 dark:text-amber-500 flex items-center gap-1 pt-1.5 border-t border-primary/10">
                <Clock size={12} className="shrink-0" />
                <span>৳{pendingWithdrawalsAmount.toFixed(2)} is pending review (Total Positive Balance: ৳{grossBalance.toFixed(2)})</span>
              </div>
            )}
          </div>

          {/* Amount input */}
          <Input
            label="Withdrawal Amount (৳ BDT)"
            required
            type="number"
            step="0.01"
            min="10"
            max={availableToWithdraw}
            prefix="৳"
            placeholder={`e.g. ${availableToWithdraw.toFixed(2)}`}
            value={withdrawForm.amount}
            onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
            inputClassName="font-mono"
          />

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-0.5 select-none text-[var(--color-foreground)]">
              Payout Channel <span className="font-bold text-[var(--color-danger)]">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'BKASH', label: 'bKash' },
                { id: 'NAGAD', label: 'Nagad' },
                { id: 'ROCKET', label: 'Rocket' },
                { id: 'BANK_TRANSFER', label: 'Bank' },
              ].map((method) => (
                <button
                  type="button"
                  key={method.id}
                  onClick={() => setWithdrawForm({ ...withdrawForm, paymentMethod: method.id as any })}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    withdrawForm.paymentMethod === method.id
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Account Number */}
          <Input
            label={withdrawForm.paymentMethod === 'BANK_TRANSFER' ? 'Bank Account Number' : `${withdrawForm.paymentMethod} Personal Phone Number`}
            required
            type={withdrawForm.paymentMethod === 'BANK_TRANSFER' ? 'text' : 'tel'}
            prefix={withdrawForm.paymentMethod === 'BANK_TRANSFER' ? undefined : '+88'}
            maxLength={withdrawForm.paymentMethod === 'BANK_TRANSFER' ? 30 : 11}
            placeholder={withdrawForm.paymentMethod === 'BANK_TRANSFER' ? 'e.g. 1023456789012' : '01XXXXXXXXX'}
            value={withdrawForm.accountNumber}
            onChange={(e) => {
              let val = e.target.value;
              if (withdrawForm.paymentMethod !== 'BANK_TRANSFER') {
                val = val.replace(/[^0-9]/g, '');
                if (val.startsWith('880')) val = '0' + val.slice(3);
              }
              setWithdrawForm({ ...withdrawForm, accountNumber: val });
            }}
            inputClassName="font-mono"
          />

          {/* Bank specific fields */}
          {withdrawForm.paymentMethod === 'BANK_TRANSFER' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-muted/20 border border-border/40">
              <div className="sm:col-span-2">
                <Input
                  label="Account Holder Name"
                  required
                  placeholder="e.g. Rahul Roy"
                  value={withdrawForm.accountHolderName}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolderName: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="Bank Name"
                  required
                  placeholder="e.g. BRAC Bank, Dutch-Bangla"
                  value={withdrawForm.bankName}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                />
              </div>

              <div>
                <Input
                  label="Branch Name"
                  placeholder="e.g. Dhanmondi Branch"
                  value={withdrawForm.branchName}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, branchName: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <Input
            label="Optional Note"
            placeholder="e.g. Rider earnings withdrawal"
            value={withdrawForm.notes}
            onChange={(e) => setWithdrawForm({ ...withdrawForm, notes: e.target.value })}
          />

          {/* Action CTAs */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/30">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={withdrawLoading}
              onClick={() => setIsWithdrawModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={withdrawLoading}
              leftIcon={<Send size={13} />}
              className="font-extrabold shadow-sm shadow-primary/20"
            >
              Submit Request
            </Button>
          </div>

        </form>
        </Modal.Content>
      </Modal>

    </div>
  );
}
