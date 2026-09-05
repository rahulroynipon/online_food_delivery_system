import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  ArrowLeft,
  Loader2,
  Check,
  Building,
  HelpCircle,
  Copy,
  ChevronRight
} from 'lucide-react';
import { Input } from '../../design-system';

/* ── Vector Brand Logos ─────────────────────────────────────────────────── */

function BkashLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="120" height="40" rx="8" fill="#E2136E" />
      <path d="M26 10L36 25H28L23.5 18L21 21.5V25H16V10H21V18L26 10Z" fill="white" />
      <text x="42" y="26" fill="white" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" letterSpacing="-0.5">bKash</text>
    </svg>
  );
}

function NagadLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="120" height="40" rx="8" fill="#F7941D" />
      <circle cx="25" cy="20" r="9" fill="white" />
      <path d="M21 16L29 20L21 24V16Z" fill="#F7941D" />
      <text x="40" y="26" fill="white" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" letterSpacing="-0.5">nagad</text>
    </svg>
  );
}

function RocketLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="120" height="40" rx="8" fill="#8C3494" />
      <path d="M25 11C23 15 20 22 20 28H24C24.5 25 25.5 25 26 28H30C30 22 27 15 25 11Z" fill="white" />
      <circle cx="25" cy="18" r="2" fill="#8C3494" />
      <text x="38" y="26" fill="white" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="17" letterSpacing="-0.5">Rocket</text>
    </svg>
  );
}

function UpayLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="120" height="40" rx="8" fill="#0056B3" />
      <path d="M20 12L28 20L20 28H25L33 20L25 12H20Z" fill="#FFCC00" />
      <text x="40" y="26" fill="white" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" letterSpacing="-0.5">upay</text>
    </svg>
  );
}

function VisaLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <text x="2" y="16" fill="#1A1F71" fontFamily="system-ui, sans-serif" fontStyle="italic" fontWeight="900" fontSize="19" letterSpacing="0.5">VISA</text>
    </svg>
  );
}

function MastercardLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="14" cy="12" r="10" fill="#EB001B" />
      <circle cx="26" cy="12" r="10" fill="#F79E1B" fillOpacity="0.9" />
    </svg>
  );
}

function AmexLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 50 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="50" height="24" rx="4" fill="#006FCF" />
      <text x="6" y="16" fill="white" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="11" letterSpacing="0.8">AMEX</text>
    </svg>
  );
}

export default function PaymentGateway() {
  const [searchParams] = useSearchParams();
  const tranId = searchParams.get('tran_id') || `ORDER_DEMO_${Date.now()}`;
  const orderId = searchParams.get('order_id') || '';
  const amount = searchParams.get('amount') || '0.00';
  const currency = searchParams.get('currency') || 'BDT';
  const storeName = searchParams.get('store_name') || 'BiteSpeed Food Platform';

  const [activeTab, setActiveTab] = useState<'MOBILE' | 'CARDS' | 'NET_BANKING'>('MOBILE');
  const [selectedMfs, setSelectedMfs] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'UPAY'>('BKASH');
  const [selectedCard, setSelectedCard] = useState<'VISA' | 'MASTERCARD' | 'AMEX'>('VISA');
  const [selectedBank, setSelectedBank] = useState<string>('BRAC Bank Astha');

  // Form states
  const [mfsPhone, setMfsPhone] = useState('01700000000');
  const [mfsPin, setMfsPin] = useState('1234');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [cardHolder, setCardHolder] = useState('Valued Customer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const getBackendBaseUrl = () => {
    return import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5005';
  };

  const handleCopyTranId = () => {
    navigator.clipboard.writeText(tranId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaySuccess = () => {
    setIsProcessing(true);
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${getBackendBaseUrl()}/api/v1/payments/sslcommerz/success?order_id=${orderId}`;

    const inputTran = document.createElement('input');
    inputTran.type = 'hidden';
    inputTran.name = 'tran_id';
    inputTran.value = tranId;
    form.appendChild(inputTran);

    const inputVal = document.createElement('input');
    inputVal.type = 'hidden';
    inputVal.name = 'val_id';
    inputVal.value = `VAL_${Date.now()}`;
    form.appendChild(inputVal);

    const inputStatus = document.createElement('input');
    inputStatus.type = 'hidden';
    inputStatus.name = 'status';
    inputStatus.value = 'VALID';
    form.appendChild(inputStatus);

    const inputAmount = document.createElement('input');
    inputAmount.type = 'hidden';
    inputAmount.name = 'amount';
    inputAmount.value = amount;
    form.appendChild(inputAmount);

    document.body.appendChild(form);
    setTimeout(() => form.submit(), 600);
  };

  const handlePayFail = () => {
    setIsProcessing(true);
    window.location.href = `${getBackendBaseUrl()}/api/v1/payments/sslcommerz/fail?tran_id=${tranId}&order_id=${orderId}`;
  };

  const handlePayCancel = () => {
    setIsProcessing(true);
    window.location.href = `${getBackendBaseUrl()}/api/v1/payments/sslcommerz/cancel?tran_id=${tranId}&order_id=${orderId}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-3 sm:p-6 select-none font-sans antialiased">
      
      {/* Top Security & Brand Bar */}
      <div className="w-full max-w-3xl mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-slate-900 text-xl tracking-tighter">SSL<span className="text-red-600">COMMERZ</span></span>
          </div>
          <div className="h-4 w-px bg-slate-300 hidden sm:block" />
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300/80">
            Official Sandbox Gateway
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Lock size={13} className="text-emerald-600" />
          <span>256-Bit SSL Encrypted &amp; PCI-DSS Certified</span>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/70 overflow-hidden flex flex-col">
        
        {/* Merchant & Order Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Merchant</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="font-extrabold text-white text-sm">{storeName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Invoice:</span>
              <span className="font-mono text-slate-200 font-bold">{tranId}</span>
              <button
                type="button"
                onClick={handleCopyTranId}
                className="hover:text-white transition-colors cursor-pointer ml-0.5"
                title="Copy Transaction ID"
              >
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              </button>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Payable Amount</span>
            <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              ৳{parseFloat(amount).toFixed(2)} <span className="text-xs font-bold text-slate-400">{currency}</span>
            </span>
          </div>
        </div>

        {/* 2-Column Gateway Body (Sidebar + Content) */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
          
          {/* Left Sidebar: Payment Channels */}
          <div className="md:col-span-4 bg-slate-50/90 border-r border-slate-200 p-3 space-y-1.5 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
            
            <button
              type="button"
              onClick={() => setActiveTab('MOBILE')}
              className={`w-full text-left p-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between shrink-0 ${
                activeTab === 'MOBILE'
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-sm font-black'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${activeTab === 'MOBILE' ? 'bg-rose-50 text-rose-600' : 'bg-slate-200/70 text-slate-600'}`}>
                  <Smartphone size={16} />
                </div>
                <div>
                  <span className="block font-extrabold">Mobile Banking</span>
                  <span className="text-[10px] text-slate-400 font-normal">bKash, Nagad, Rocket</span>
                </div>
              </div>
              <ChevronRight size={14} className={activeTab === 'MOBILE' ? 'text-rose-600' : 'text-slate-400'} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CARDS')}
              className={`w-full text-left p-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between shrink-0 ${
                activeTab === 'CARDS'
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-sm font-black'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${activeTab === 'CARDS' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200/70 text-slate-600'}`}>
                  <CreditCard size={16} />
                </div>
                <div>
                  <span className="block font-extrabold">Cards</span>
                  <span className="text-[10px] text-slate-400 font-normal">Visa, Mastercard, Amex</span>
                </div>
              </div>
              <ChevronRight size={14} className={activeTab === 'CARDS' ? 'text-blue-600' : 'text-slate-400'} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('NET_BANKING')}
              className={`w-full text-left p-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between shrink-0 ${
                activeTab === 'NET_BANKING'
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-sm font-black'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${activeTab === 'NET_BANKING' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200/70 text-slate-600'}`}>
                  <Building2 size={16} />
                </div>
                <div>
                  <span className="block font-extrabold">Internet Banking</span>
                  <span className="text-[10px] text-slate-400 font-normal">BRAC, City, DBBL, EBL</span>
                </div>
              </div>
              <ChevronRight size={14} className={activeTab === 'NET_BANKING' ? 'text-emerald-600' : 'text-slate-400'} />
            </button>

            {/* Trust badge on sidebar bottom */}
            <div className="hidden md:block pt-6 mt-auto px-2 space-y-2 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>Verified SSL Partner</span>
              </div>
              <p className="leading-relaxed">
                Your transaction details are encrypted with TLS 1.3 protocol.
              </p>
            </div>

          </div>

          {/* Right Content Area */}
          <div className="md:col-span-8 p-5 sm:p-7 space-y-6 bg-white flex flex-col justify-between">
            
            {/* TAB 1: Mobile Banking */}
            {activeTab === 'MOBILE' && (
              <div className="space-y-5">
                
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2.5">
                    Select Mobile Wallet Provider
                  </label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'BKASH', label: 'bKash', component: <BkashLogo className="h-6 w-auto" /> },
                      { id: 'NAGAD', label: 'Nagad', component: <NagadLogo className="h-6 w-auto" /> },
                      { id: 'ROCKET', label: 'Rocket', component: <RocketLogo className="h-6 w-auto" /> },
                      { id: 'UPAY', label: 'Upay', component: <UpayLogo className="h-6 w-auto" /> },
                    ].map((mfs) => {
                      const isSelected = selectedMfs === mfs.id;
                      return (
                        <button
                          key={mfs.id}
                          type="button"
                          onClick={() => setSelectedMfs(mfs.id as any)}
                          className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'border-red-600 bg-red-50/40 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          {mfs.component}
                          <span className="text-[11px] font-bold text-slate-700">{mfs.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-800">
                      {selectedMfs} Verification
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <ShieldCheck size={11} className="text-emerald-600" /> Instant Sandbox
                    </span>
                  </div>

                  <div className="space-y-3">
                    <Input
                      label={`${selectedMfs} Account / Mobile Number`}
                      type="tel"
                      prefix="+88"
                      maxLength={11}
                      value={mfsPhone}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9]/g, '');
                        if (val.startsWith('880')) val = '0' + val.slice(3);
                        setMfsPhone(val);
                      }}
                      placeholder="01XXXXXXXXX"
                      inputClassName="font-mono font-bold text-xs"
                    />

                    <Input
                      label="PIN / Simulation Code"
                      type="password"
                      passwordToggle
                      maxLength={6}
                      value={mfsPin}
                      onChange={(e) => setMfsPin(e.target.value)}
                      placeholder="••••"
                      hint="In sandbox test mode, any 4-6 digit PIN is accepted."
                      inputClassName="font-mono font-bold tracking-widest text-xs"
                    />
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: Cards */}
            {activeTab === 'CARDS' && (
              <div className="space-y-4">
                
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                    Card Brand
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'VISA', label: 'Visa Card', logo: <VisaLogo /> },
                      { id: 'MASTERCARD', label: 'Mastercard', logo: <MastercardLogo /> },
                      { id: 'AMEX', label: 'American Express', logo: <AmexLogo /> },
                    ].map((card) => {
                      const isSelected = selectedCard === card.id;
                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => setSelectedCard(card.id as any)}
                          className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          {card.logo}
                          <span className="text-[10px] font-bold text-slate-700 mt-1">{card.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <Input
                    label="Card Number"
                    leftIcon={<CreditCard size={15} />}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    inputClassName="font-mono font-bold text-xs"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Expiry (MM/YY)"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      inputClassName="font-mono font-bold text-xs"
                    />
                    <Input
                      label="CVV / CVC"
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="888"
                      inputClassName="font-mono font-bold text-xs"
                    />
                  </div>

                  <Input
                    label="Cardholder Name"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="e.g. John Doe"
                    inputClassName="text-xs"
                  />
                </div>

              </div>
            )}

            {/* TAB 3: Net Banking */}
            {activeTab === 'NET_BANKING' && (
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Select Internet Banking Portal
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    'BRAC Bank Astha',
                    'City Touch (City Bank)',
                    'Islami Bank CellFin',
                    'DBBL NexusPay',
                    'Eastern Bank Skybanking',
                    'Standard Chartered Online',
                  ].map((bank) => {
                    const isSelected = selectedBank === bank;
                    return (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`p-3 rounded-xl border-2 cursor-pointer flex items-center gap-2.5 transition-all text-left ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-slate-900 font-bold'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <Building size={16} className={isSelected ? 'text-emerald-600' : 'text-slate-400'} />
                        <span className="text-xs">{bank}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions & Buttons */}
            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePaySuccess}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing Payment Callback...</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Pay ৳{parseFloat(amount).toFixed(2)} BDT</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePayFail}
                  className="py-2 px-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <XCircle size={13} />
                  <span>Simulate Failure</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePayCancel}
                  className="py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft size={13} />
                  <span>Cancel &amp; Return</span>
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* Footer Security Badges */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Powered by SSLCommerz Engine</span>
            <span>•</span>
            <span>PCI-DSS Level 1 Compliant</span>
          </div>
          <div className="flex items-center gap-3 font-semibold text-slate-600">
            <span>Verified by VISA</span>
            <span>MasterCard ID Check</span>
            <span>Norton Secured</span>
          </div>
        </div>

      </div>

    </div>
  );
}
