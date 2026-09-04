import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, CardHeader, CardTitle, CardContent, Button, toast, Modal } from '../../design-system';
import { ShieldCheck, Sliders, DollarSign, Wallet, RefreshCw, UserCheck, ArrowRight, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import api from '../../lib/axios';

export default function SettingsPage() {
  const { user } = useAuthStore();

  const [platformSettings, setPlatformSettings] = useState<any>({
    commissionRate: 15,
    riderBaseFee: 30,
    riderFeePerKm: 15,
    taxRate: 5
  });
  const [saveLoading, setSaveLoading] = useState(false);

  // Wallet balances state
  const [merchants, setMerchants] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Settlement modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [settlementType, setSettlementType] = useState<'PAYOUT' | 'SETTLEMENT'>('PAYOUT');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submittingSettlement, setSubmittingSettlement] = useState(false);

  const fetchPlatformSettings = async () => {
    try {
      const res = await api.get('/settings/platform');
      if (res.data?.success) {
        setPlatformSettings({
          commissionRate: parseFloat(res.data.settings.commissionRate),
          riderBaseFee: parseFloat(res.data.settings.riderBaseFee),
          riderFeePerKm: parseFloat(res.data.settings.riderFeePerKm),
          taxRate: parseFloat(res.data.settings.taxRate)
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const fetchWalletOverview = async () => {
    setOverviewLoading(true);
    try {
      const res = await api.get('/wallets/admin-overview');
      if (res.data?.success) {
        setMerchants(res.data.merchants || []);
        setRiders(res.data.riders || []);
      }
    } catch (err) {
      console.error('Failed to load wallet overview:', err);
    } finally {
      setOverviewLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformSettings();
    fetchWalletOverview();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const res = await api.put('/settings/platform', platformSettings);
      if (res.data?.success) {
        toast.success('Platform configurations updated successfully!');
        fetchPlatformSettings();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaveLoading(false);
    }
  };

  const openSettlementModal = (targetUser: any, defaultType: 'PAYOUT' | 'SETTLEMENT') => {
    setSelectedUser(targetUser);
    setSettlementType(defaultType);
    setAmount(Math.abs(parseFloat(targetUser.walletBalance)).toString());
    setDescription('');
    setIsModalOpen(true);
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    setSubmittingSettlement(true);
    try {
      const res = await api.post('/wallets/payout', {
        userId: selectedUser.id,
        type: settlementType,
        amount: parseFloat(amount),
        description
      });

      if (res.data?.success) {
        toast.success('Settlement transaction posted successfully!');
        setIsModalOpen(false);
        fetchWalletOverview();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post settlement.');
    } finally {
      setSubmittingSettlement(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in select-none">
      
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">System Configuration & Settlements</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Configure platform commission structures, delivery costs, and reconcile balances.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Platform settings config form */}
        <div className="space-y-6">
          <Card className="border border-border/40 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-xs font-black flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                Fee Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSaveSettings} className="space-y-4">
                
                {/* Commission percentage */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Platform Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={platformSettings.commissionRate}
                    onChange={(e) => setPlatformSettings((p: any) => ({ ...p, commissionRate: parseFloat(e.target.value) }))}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-border bg-background focus:border-primary outline-none"
                    required
                  />
                </div>

                {/* Rider base fee */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Rider Base Delivery Fee (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={platformSettings.riderBaseFee}
                    onChange={(e) => setPlatformSettings((p: any) => ({ ...p, riderBaseFee: parseFloat(e.target.value) }))}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-border bg-background focus:border-primary outline-none"
                    required
                  />
                </div>

                {/* Rider fee per KM */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Rider Distance Fee per KM (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={platformSettings.riderFeePerKm}
                    onChange={(e) => setPlatformSettings((p: any) => ({ ...p, riderFeePerKm: parseFloat(e.target.value) }))}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-border bg-background focus:border-primary outline-none"
                    required
                  />
                </div>

                {/* Tax rate */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">System VAT / Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={platformSettings.taxRate}
                    onChange={(e) => setPlatformSettings((p: any) => ({ ...p, taxRate: parseFloat(e.target.value) }))}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-border bg-background focus:border-primary outline-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  loading={saveLoading}
                  variant="primary"
                  fullWidth
                  className="font-bold text-xs py-2 shadow-md shadow-primary/10 mt-2"
                >
                  Save Settings
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Wallet balances table overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/40 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/10 flex flex-row justify-between items-center">
              <CardTitle className="text-xs font-black flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                Ledger Settlement Board
              </CardTitle>
              <button onClick={fetchWalletOverview} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer">
                <RefreshCw className={`h-3.5 w-3.5 ${overviewLoading ? 'animate-spin' : ''}`} />
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              
              {overviewLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Merchants list section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-foreground border-b border-border/10 pb-1.5">Restaurant Account Balances</h3>
                    {merchants.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground">No merchant balances found.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {merchants.map((m) => (
                          <div key={m.id} className="p-3 bg-muted/20 border border-border/30 rounded-xl flex justify-between items-center text-xs font-semibold">
                            <div>
                              <p className="text-foreground">{m.name}</p>
                              <span className="text-[9px] text-muted-foreground font-medium">{m.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-emerald-500 font-bold">৳{parseFloat(m.walletBalance).toFixed(2)}</span>
                              <Button
                                onClick={() => openSettlementModal(m, 'PAYOUT')}
                                variant="outline"
                                className="py-1 px-2.5 text-[9px] hover:bg-primary/5 hover:text-primary flex items-center gap-1 border-primary/20 text-primary"
                              >
                                <ArrowUpRight className="h-3 w-3" /> Payout
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Riders list section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-foreground border-b border-border/10 pb-1.5">Rider Account Balances (COD Liabilities)</h3>
                    {riders.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground">No rider balances found.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {riders.map((r) => {
                          const bal = parseFloat(r.walletBalance);
                          return (
                            <div key={r.id} className="p-3 bg-muted/20 border border-border/30 rounded-xl flex justify-between items-center text-xs font-semibold">
                              <div>
                                <p className="text-foreground">{r.name}</p>
                                <span className="text-[9px] text-muted-foreground font-medium">{r.email}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`font-bold ${bal < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                  {bal < 0 ? '-' : ''}৳{Math.abs(bal).toFixed(2)}
                                </span>
                                <Button
                                  onClick={() => openSettlementModal(r, 'SETTLEMENT')}
                                  variant="outline"
                                  className="py-1 px-2.5 text-[9px] hover:bg-emerald-500/5 hover:text-emerald-500 flex items-center gap-1 border-emerald-500/20 text-emerald-500"
                                >
                                  <ArrowDownLeft className="h-3 w-3" /> Settle Cash
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </CardContent>
          </Card>
        </div>

      </div>

      {/* Payout/Settlement Trigger Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} size="md" className="border border-border bg-card">
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-black text-foreground">Post Settlement Transaction</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Reconcile balances for {selectedUser?.name} ({selectedUser?.email}).
            </p>
          </div>

          <form onSubmit={handleSettleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Action Type</label>
              <select
                value={settlementType}
                onChange={(e: any) => setSettlementType(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-border bg-background text-foreground outline-none"
              >
                <option value="PAYOUT">PAYOUT (Platform pays Merchant/User)</option>
                <option value="SETTLEMENT">SETTLEMENT (User pays Platform COD cash back)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Settlement Amount (৳)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-border bg-background text-foreground outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Reference Description</label>
              <input
                type="text"
                placeholder="e.g. Bank transfer ref #3430, Weekly COD cash deposit"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-border bg-background text-foreground outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs py-1.5">
                Cancel
              </Button>
              <Button type="submit" loading={submittingSettlement} variant="primary" className="text-xs py-1.5 font-bold">
                Submit Settlement
              </Button>
            </div>

          </form>
        </div>
      </Modal>

    </div>
  );
}
