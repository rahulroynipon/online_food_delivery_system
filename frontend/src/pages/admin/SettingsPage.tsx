import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, toast, Badge, Input } from '../../design-system';
import { 
  Percent, 
  Bike, 
  MapPin, 
  Receipt, 
  Edit3, 
  RefreshCw,
  Sliders,
  CheckCircle2,
  Store,
  TrendingUp,
  Save,
  X,
  Calculator,
  ArrowRight,
  Info
} from 'lucide-react';
import api from '../../lib/axios';

interface PlatformFeeConfig {
  commissionRate: number;
  riderBaseFee: number;
  riderFeePerKm: number;
  taxRate: number;
}

export default function SettingsPage() {
  const [platformSettings, setPlatformSettings] = useState<PlatformFeeConfig>({
    commissionRate: 15,
    riderBaseFee: 30,
    riderFeePerKm: 15,
    taxRate: 5
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<PlatformFeeConfig>({
    commissionRate: 15,
    riderBaseFee: 30,
    riderFeePerKm: 15,
    taxRate: 5
  });

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  // Live order preview calculation state
  const [previewSubtotal, setPreviewSubtotal] = useState<number>(500);
  const [previewDistance, setPreviewDistance] = useState<number>(3.5);

  const fetchPlatformSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/platform');
      if (res.data?.success && res.data.settings) {
        const config = {
          commissionRate: parseFloat(res.data.settings.commissionRate) || 15,
          riderBaseFee: parseFloat(res.data.settings.riderBaseFee) || 30,
          riderFeePerKm: parseFloat(res.data.settings.riderFeePerKm) || 15,
          taxRate: parseFloat(res.data.settings.taxRate) || 5
        };
        setPlatformSettings(config);
        setEditForm(config);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast.error('Failed to load platform fee configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformSettings();
  }, []);

  const handleStartEdit = () => {
    setEditForm({ ...platformSettings });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditForm({ ...platformSettings });
    setIsEditing(false);
  };

  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const payload = {
        commissionRate: Math.max(0, parseFloat(String(editForm.commissionRate)) || 0),
        riderBaseFee: Math.max(0, parseFloat(String(editForm.riderBaseFee)) || 0),
        riderFeePerKm: Math.max(0, parseFloat(String(editForm.riderFeePerKm)) || 0),
        taxRate: Math.max(0, parseFloat(String(editForm.taxRate)) || 0)
      };

      const res = await api.put('/settings/platform', payload);
      if (res.data?.success) {
        toast.success('Platform fees updated successfully!');
        setPlatformSettings(payload);
        setIsEditing(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update fee configuration.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Preview calculations based on active (or currently edited) rates
  // Delivery Fee Formula: max(riderBaseFee, previewDistance * riderFeePerKm)
  const activeRates = isEditing ? editForm : platformSettings;
  const calculatedDistanceFee = previewDistance * activeRates.riderFeePerKm;
  const isBaseFeeApplied = activeRates.riderBaseFee >= calculatedDistanceFee;
  const deliveryFee = Math.max(activeRates.riderBaseFee, calculatedDistanceFee);

  const taxAmount = (previewSubtotal * activeRates.taxRate) / 100;
  const platformCommission = (previewSubtotal * activeRates.commissionRate) / 100;
  const customerTotal = previewSubtotal + deliveryFee + taxAmount;
  const restaurantPayout = previewSubtotal - platformCommission;
  const riderPayout = deliveryFee;

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-foreground tracking-tight">Platform Fee Settings</h2>
            <Badge variant="soft" color="primary" className="font-bold text-[10px] uppercase tracking-wider">
              {isEditing ? 'Editing Mode' : 'Active Rates'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Configure platform commission, rider base delivery floor / distance charges, and statutory VAT.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchPlatformSettings}
                disabled={loading}
                leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />}
                className="text-xs font-semibold"
              >
                Sync Rates
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleStartEdit}
                leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                className="shadow-md shadow-primary/20 text-xs font-bold"
              >
                Edit Fee Rates
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                leftIcon={<X className="h-3.5 w-3.5" />}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSavePlatformSettings}
                loading={saveLoading}
                leftIcon={<Save className="h-3.5 w-3.5" />}
                className="shadow-md shadow-primary/20 text-xs font-bold"
              >
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Fee Settings Form / Cards (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleSavePlatformSettings}>
            <Card className="border border-border/50 bg-card shadow-xs overflow-hidden">
              <CardHeader className="p-5 pb-3 border-b border-border/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-primary" />
                    Fee Configuration Parameters
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isEditing ? 'Modify the values below and click "Save Changes".' : 'Current active platform rates used during checkout and payouts.'}
                  </p>
                </div>
                {!isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleStartEdit}
                    leftIcon={<Edit3 className="h-3 w-3" />}
                    className="text-xs font-bold"
                  >
                    Edit
                  </Button>
                )}
              </CardHeader>

              <CardContent className="p-5 space-y-4.5 divide-y divide-border/20">
                
                {/* 1. Platform Commission Rate */}
                <div className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Percent className="h-3.5 w-3.5" />
                      </div>
                      <label className="text-xs font-bold text-foreground">
                        Platform Commission Rate
                      </label>
                      <Badge variant="soft" color="warning" className="text-[9px] font-bold uppercase">
                        Restaurant
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed pl-9">
                      Percentage deducted from restaurant food sales on every completed order.
                    </p>
                  </div>

                  <div className="w-full sm:w-52 shrink-0">
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={editForm.commissionRate}
                        onChange={(e) => setEditForm(p => ({ ...p, commissionRate: parseFloat(e.target.value) || 0 }))}
                        suffix={<span className="font-bold text-xs">%</span>}
                        inputClassName="font-bold text-right pr-2"
                        className="w-full"
                        required
                      />
                    ) : (
                      <div className="text-right flex items-center justify-end h-[38px] px-3 bg-muted/20 border border-border/30 rounded-lg">
                        <span className="text-base font-black font-mono text-foreground">
                          {platformSettings.commissionRate}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Rider Base Delivery Fee */}
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Bike className="h-3.5 w-3.5" />
                      </div>
                      <label className="text-xs font-bold text-foreground">
                        Rider Base Delivery Fee
                      </label>
                      <Badge variant="soft" color="success" className="text-[9px] font-bold uppercase">
                        Rider
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed pl-9">
                      Minimum delivery fee baseline. If distance calculation is lower, this base fee is applied.
                    </p>
                  </div>

                  <div className="w-full sm:w-52 shrink-0">
                    {isEditing ? (
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={editForm.riderBaseFee}
                        onChange={(e) => setEditForm(p => ({ ...p, riderBaseFee: parseFloat(e.target.value) || 0 }))}
                        prefix={<span className="font-bold text-xs">৳</span>}
                        inputClassName="font-bold text-right pr-2"
                        className="w-full"
                        required
                      />
                    ) : (
                      <div className="text-right flex items-center justify-end h-[38px] px-3 bg-muted/20 border border-border/30 rounded-lg">
                        <span className="text-base font-black font-mono text-foreground">
                          ৳{platformSettings.riderBaseFee.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Rider Distance Fee Per KM */}
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <label className="text-xs font-bold text-foreground">
                        Rider Distance Fee Per KM
                      </label>
                      <Badge variant="soft" color="success" className="text-[9px] font-bold uppercase">
                        Rider
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed pl-9">
                      Per-KM transit rate. When (Distance × Rate) exceeds base fee, the higher calculated rate applies.
                    </p>
                  </div>

                  <div className="w-full sm:w-52 shrink-0">
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={editForm.riderFeePerKm}
                        onChange={(e) => setEditForm(p => ({ ...p, riderFeePerKm: parseFloat(e.target.value) || 0 }))}
                        prefix={<span className="font-bold text-xs">৳</span>}
                        suffix={<span className="font-bold text-xs text-muted-foreground">/km</span>}
                        inputClassName="font-bold text-right pr-2"
                        className="w-full"
                        required
                      />
                    ) : (
                      <div className="text-right flex items-center justify-end h-[38px] px-3 bg-muted/20 border border-border/30 rounded-lg">
                        <span className="text-base font-black font-mono text-foreground">
                          ৳{platformSettings.riderFeePerKm.toFixed(2)}
                          <span className="text-xs text-muted-foreground font-normal ml-1">/ km</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. System VAT / Food Tax */}
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                        <Receipt className="h-3.5 w-3.5" />
                      </div>
                      <label className="text-xs font-bold text-foreground">
                        System VAT / Tax Rate
                      </label>
                      <Badge variant="soft" color="neutral" className="text-[9px] font-bold uppercase">
                        Government
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed pl-9">
                      Statutory government consumption tax applied to the order food subtotal.
                    </p>
                  </div>

                  <div className="w-full sm:w-52 shrink-0">
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={editForm.taxRate}
                        onChange={(e) => setEditForm(p => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))}
                        suffix={<span className="font-bold text-xs">%</span>}
                        inputClassName="font-bold text-right pr-2"
                        className="w-full"
                        required
                      />
                    ) : (
                      <div className="text-right flex items-center justify-end h-[38px] px-3 bg-muted/20 border border-border/30 rounded-lg">
                        <span className="text-base font-black font-mono text-foreground">
                          {platformSettings.taxRate}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </CardContent>

              {isEditing && (
                <div className="p-4 bg-muted/15 border-t border-border/20 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={saveLoading}
                    leftIcon={<Save className="h-3.5 w-3.5" />}
                    className="font-bold shadow-md shadow-primary/20"
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </Card>
          </form>
        </div>

        {/* Right Column: Live Order Calculation & Revenue Split Simulation (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border border-border/50 bg-card shadow-xs p-5 space-y-4.5 rounded-xl">
            <div>
              <h3 className="text-sm font-black text-foreground tracking-tight flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                Live Order Simulation
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Delivery Fee Formula: <span className="font-mono font-bold text-foreground">max(Base Fee, Distance × Fee/KM)</span>
              </p>
            </div>

            {/* Simulation Controls */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 border border-border/30 rounded-lg">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Sample Subtotal</span>
                <Input
                  type="number"
                  min="50"
                  step="50"
                  size="sm"
                  value={previewSubtotal}
                  onChange={(e) => setPreviewSubtotal(Math.max(0, parseFloat(e.target.value) || 0))}
                  prefix={<span className="font-bold text-xs">৳</span>}
                  inputClassName="font-bold text-right pr-2 text-xs"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Distance (KM)</span>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  size="sm"
                  value={previewDistance}
                  onChange={(e) => setPreviewDistance(Math.max(0, parseFloat(e.target.value) || 0))}
                  suffix={<span className="font-bold text-[10px] text-muted-foreground">km</span>}
                  inputClassName="font-bold text-right pr-2 text-xs"
                />
              </div>
            </div>

            {/* Total Paid by Customer Card */}
            <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary">Customer Pays</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  Food (৳{previewSubtotal}) + Delivery (৳{deliveryFee.toFixed(2)}) + VAT (৳{taxAmount.toFixed(2)})
                </p>
              </div>
              <span className="text-lg font-black text-primary font-mono">
                ৳{customerTotal.toFixed(2)}
              </span>
            </div>

            {/* Split Distribution Breakdown */}
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Earnings & Commission Split</p>
              
              {/* Restaurant Net */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-card">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Store className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Restaurant Receives</p>
                    <p className="text-[9px] text-muted-foreground">Subtotal − {activeRates.commissionRate}% Commission</p>
                  </div>
                </div>
                <span className="font-extrabold font-mono text-xs text-foreground">
                  ৳{restaurantPayout.toFixed(2)}
                </span>
              </div>

              {/* Rider Delivery Earnings */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-card">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Bike className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Rider Receives (Delivery Fee)</p>
                    <p className="text-[9px] text-muted-foreground">
                      {isBaseFeeApplied
                        ? `Base Fee ৳${activeRates.riderBaseFee.toFixed(2)} applied (Distance ৳${calculatedDistanceFee.toFixed(2)} ≤ Base)`
                        : `Distance Fee ৳${calculatedDistanceFee.toFixed(2)} applied (${previewDistance}km × ৳${activeRates.riderFeePerKm} > Base)`}
                    </p>
                  </div>
                </div>
                <span className="font-extrabold font-mono text-xs text-emerald-500">
                  ৳{riderPayout.toFixed(2)}
                </span>
              </div>

              {/* Platform Commission */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
                    <TrendingUp className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">Platform Retains</p>
                    <p className="text-[9px] text-muted-foreground">{activeRates.commissionRate}% Commission on Subtotal</p>
                  </div>
                </div>
                <span className="font-black font-mono text-xs text-primary">
                  ৳{platformCommission.toFixed(2)}
                </span>
              </div>
            </div>

          </Card>
        </div>

      </div>

    </div>
  );
}
