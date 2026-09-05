import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, DataTable, toast } from '../../design-system';
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
  CreditCard
} from 'lucide-react';
import api from '../../lib/axios';

export default function RiderWalletPage() {
  const [wallet, setWallet] = useState<{ balance: number; transactions: any[] }>({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wallets/balance');
      if (res.data?.success) {
        setWallet({
          balance: parseFloat(res.data.walletBalance || 0),
          transactions: res.data.transactions || []
        });
      }
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const totalDeliveryFees = wallet.transactions
    .filter((tx) => tx.type === 'DELIVERY_FEE')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const totalCodCollected = wallet.transactions
    .filter((tx) => tx.type === 'COD_COLLECTION')
    .reduce((acc, curr) => acc + Math.abs(parseFloat(curr.amount) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Earnings & Ledger Wallet</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track your delivery fees earned, cash-on-delivery settlements, and payout logs.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchWallet}
          leftIcon={<RefreshCw size={13} />}
          className="font-bold text-xs"
        >
          Refresh Balance
        </Button>
      </div>

      {/* Hero Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Balance Card */}
        <Card className="border border-border/60 bg-card md:col-span-1 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Balance</span>
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Wallet size={18} />
              </div>
            </div>

            <div>
              <h2 className={`text-3xl font-black ${wallet.balance < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                ৳{wallet.balance.toFixed(2)}
              </h2>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mt-2 ${
                wallet.balance < 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
              }`}>
                {wallet.balance < 0 ? 'COD Cash Liability' : 'Positive Payout Balance'}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {wallet.balance < 0 
                ? 'You are currently holding cash collected from Cash on Delivery orders. Settle with platform admin to restore balance.' 
                : 'Your platform earnings in trip fees are ready for periodic payout settlements.'}
            </p>
          </CardContent>
        </Card>

        {/* Lifetime Metrics */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <Card className="border border-border/60 bg-card">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Delivery Fees</span>
                <h3 className="text-2xl font-black text-emerald-600">+৳{totalDeliveryFees.toFixed(2)}</h3>
                <p className="text-[10px] text-muted-foreground">Credited from customer orders</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight size={22} />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total COD Cash Collected</span>
                <h3 className="text-2xl font-black text-rose-500">-৳{totalCodCollected.toFixed(2)}</h3>
                <p className="text-[10px] text-muted-foreground">Physical cash held from customers</p>
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
              <span className="font-bold text-foreground">How Rider Ledger Accounting Works:</span>
              <p className="mt-0.5">
                Every completed delivery credits your delivery fee earning. If the customer paid via COD, the order total is debited as cash in your hand. Your net balance is the difference.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Transaction Logs Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-foreground tracking-tight">Ledger Transaction Logs</h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground font-semibold">Loading ledger transactions...</span>
          </div>
        ) : wallet.transactions.length === 0 ? (
          <Card className="border-dashed border-2 border-border/70 bg-card/40">
            <CardContent className="py-12 text-center text-xs text-muted-foreground">
              No transactions recorded in your ledger yet. Completed orders will appear here automatically.
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-transparent border-none shadow-none">
            <CardContent className="p-0">
              <DataTable
                data={wallet.transactions}
                pagination={false}
                searchable={false}
                toolbar={null}
                columns={[
                  {
                    id: 'desc',
                    label: 'Transaction Description',
                    minWidth: '240px',
                    cell: ({ row }: { row: any }) => (
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs text-foreground">{row.description}</p>
                        <p className="text-[10px] text-muted-foreground">ID: #{row.id} • Order: #{row.orderId || 'N/A'}</p>
                      </div>
                    )
                  },
                  {
                    id: 'type',
                    label: 'Type',
                    width: '150px',
                    cell: ({ row }: { row: any }) => (
                      <Badge variant="soft" color={parseFloat(row.amount) < 0 ? 'danger' : 'success'} className="font-bold text-[9px] uppercase px-2 py-0.5">
                        {row.type}
                      </Badge>
                    )
                  },
                  {
                    id: 'date',
                    label: 'Timestamp',
                    width: '160px',
                    cell: ({ row }: { row: any }) => (
                      <span className="text-xs text-muted-foreground">
                        {new Date(row.createdAt).toLocaleDateString()} at{' '}
                        {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )
                  },
                  {
                    id: 'amount',
                    label: 'Amount',
                    width: '140px',
                    align: 'right' as const,
                    cell: ({ row }: { row: any }) => {
                      const isNegative = parseFloat(row.amount) < 0;
                      return (
                        <span className={`font-extrabold font-mono text-sm ${isNegative ? 'text-rose-500' : 'text-emerald-600'}`}>
                          {isNegative ? '-' : '+'}৳{Math.abs(parseFloat(row.amount)).toFixed(2)}
                        </span>
                      );
                    }
                  }
                ]}
              />
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
