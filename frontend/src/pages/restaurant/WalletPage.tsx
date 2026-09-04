import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../design-system';
import { DollarSign, Wallet, RefreshCw, Loader2 } from 'lucide-react';
import api from '../../lib/axios';

export default function RestaurantWalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    try {
      const res = await api.get('/wallets/balance');
      if (res.data?.success) {
        setBalance(parseFloat(res.data.walletBalance || 0));
        setTransactions(res.data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load merchant wallet info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Earnings & Wallet</h2>
          <p className="text-xs text-muted-foreground mt-0.5">View your merchant balance, payout cycles, and ledger transactions.</p>
        </div>
        <button 
          onClick={fetchWallet} 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[10px] font-bold text-foreground cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Balance Card */}
        <Card className="border border-border/40 shadow-xs h-fit">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-bold">Payout Balance</span>
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-foreground">
              ৳{balance.toFixed(2)}
            </h2>
            <div className="p-3.5 bg-muted/20 border border-border/30 rounded-xl text-[10px] text-muted-foreground leading-normal font-semibold">
              <p className="font-bold text-foreground">Automatic Payout Settlements:</p>
              <p className="mt-0.5">The platform processes payouts directly to your registered bank account weekly. Contact admin helpdesk for express clearances.</p>
            </div>
          </CardContent>
        </Card>

        {/* Ledger Transaction History List */}
        <Card className="border border-border/40 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2 border-b border-border/10">
            <CardTitle className="text-xs font-black flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Earning & Payout Ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground font-semibold">
                No ledger logs recorded. Start serving food packets to generate credits!
              </div>
            ) : (
              <div className="divide-y divide-border/10 max-h-[420px] overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex justify-between items-center text-xs font-semibold">
                    <div>
                      <p className="font-extrabold text-foreground">{tx.description}</p>
                      <span className="text-[9px] text-muted-foreground uppercase">{tx.type} • {new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className={`font-black text-sm ${parseFloat(tx.amount) < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {parseFloat(tx.amount) < 0 ? '-' : '+'}৳{Math.abs(parseFloat(tx.amount)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
