import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Badge, DataTable, Modal, toast } from '../../design-system';
import { 
  ArrowDownToLine, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw, 
  Search, 
  Store, 
  Bike, 
  Building2, 
  AlertCircle,
  Check,
  X,
  CreditCard,
  User as UserIcon,
  Phone,
  Mail,
  Receipt
} from 'lucide-react';
import api from '../../lib/axios';

export default function AdminPayoutsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PROCESSED' | 'REJECTED'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'RESTAURANT' | 'RIDER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected request for action modal
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wallets/withdrawals/admin');
      if (res.data?.success) {
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin withdrawal requests:', err);
      toast.error('Failed to load withdrawal requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const processedRequests = requests.filter((r) => r.status === 'PROCESSED');
  const rejectedRequests = requests.filter((r) => r.status === 'REJECTED');

  const pendingAmount = pendingRequests.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const processedAmount = processedRequests.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesRole = roleFilter === 'ALL' || r.user?.role === roleFilter;

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = query === ''
      ? true
      : String(r.id).includes(query) ||
        (r.user?.name || '').toLowerCase().includes(query) ||
        (r.user?.email || '').toLowerCase().includes(query) ||
        (r.user?.phone || '').toLowerCase().includes(query) ||
        (r.user?.restaurant?.name || '').toLowerCase().includes(query) ||
        (r.accountNumber || '').toLowerCase().includes(query) ||
        (r.bankName || '').toLowerCase().includes(query);

    return matchesStatus && matchesRole && matchesSearch;
  });

  const handleOpenActionModal = (request: any, type: 'APPROVE' | 'REJECT') => {
    setSelectedRequest(request);
    setActionType(type);
    setAdminNote(type === 'APPROVE' ? `Approved & Disbursed via ${request.paymentMethod}` : '');
  };

  const handleProcessAction = async () => {
    if (!selectedRequest || !actionType) return;

    setActionLoading(true);
    try {
      const res = await api.patch(`/wallets/withdrawals/${selectedRequest.id}/status`, {
        status: actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        adminNote: adminNote.trim() || undefined,
      });

      if (res.data?.success) {
        toast.success(
          actionType === 'APPROVE'
            ? `Payout #${selectedRequest.id} approved and ৳${parseFloat(selectedRequest.amount).toFixed(2)} debited.`
            : `Withdrawal request #${selectedRequest.id} has been rejected.`
        );
        setSelectedRequest(null);
        setActionType(null);
        fetchWithdrawals();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update withdrawal status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <ArrowDownToLine className="h-7 w-7 text-primary" />
            Payouts &amp; Withdrawals Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review, approve, and disburse wallet balance withdrawal requests submitted by Restaurants and Delivery Riders.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchWithdrawals}
          leftIcon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
          className="font-bold text-xs"
        >
          Refresh Data
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pending Requests */}
        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Pending Requests
              </span>
              <h3 className="text-2xl font-black text-amber-500">{pendingRequests.length}</h3>
              <p className="text-[10px] text-muted-foreground">Requires admin approval</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={22} />
            </div>
          </CardContent>
        </Card>

        {/* Pending Amount */}
        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Pending Amount
              </span>
              <h3 className="text-2xl font-black text-foreground">৳{pendingAmount.toFixed(2)}</h3>
              <p className="text-[10px] text-muted-foreground">Total queued for payout</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Wallet size={22} />
            </div>
          </CardContent>
        </Card>

        {/* Disbursed Amount */}
        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Total Disbursed
              </span>
              <h3 className="text-2xl font-black text-emerald-600">৳{processedAmount.toFixed(2)}</h3>
              <p className="text-[10px] text-muted-foreground">{processedRequests.length} processed payouts</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
          </CardContent>
        </Card>

        {/* Rejected Requests */}
        <Card className="border border-border/60 bg-card shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Rejected Requests
              </span>
              <h3 className="text-2xl font-black text-rose-500">{rejectedRequests.length}</h3>
              <p className="text-[10px] text-muted-foreground">Declined or refunded</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <XCircle size={22} />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border/40">
            {[
              { id: 'ALL', label: 'All Status' },
              { id: 'PENDING', label: 'Pending' },
              { id: 'PROCESSED', label: 'Disbursed' },
              { id: 'REJECTED', label: 'Rejected' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setStatusFilter(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                  statusFilter === t.id
                    ? 'bg-card text-foreground shadow-xs font-bold border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border/40">
            {[
              { id: 'ALL', label: 'All Roles' },
              { id: 'RESTAURANT', label: 'Restaurants' },
              { id: 'RIDER', label: 'Riders' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRoleFilter(r.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                  roleFilter === r.id
                    ? 'bg-card text-foreground shadow-xs font-bold border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search partner, phone, bank, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/60 bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
          />
        </div>

      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-semibold">Loading withdrawal requests...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="border-dashed border-2 border-border/70 bg-card/40">
          <CardContent className="py-16 text-center text-xs text-muted-foreground space-y-2">
            <Receipt className="h-10 w-10 text-muted-foreground mx-auto opacity-40 mb-2" />
            <p className="font-bold text-foreground text-sm">No Withdrawal Requests Found</p>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? 'Try matching another search keyword or filter.' : 'When partners submit payout requests, they will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none bg-transparent shadow-none">
          <CardContent className="p-0">
            <DataTable
              data={filteredRequests}
              pagination={false}
              searchable={false}
              toolbar={null}
              columns={[
                {
                  id: 'id',
                  label: 'ID',
                  width: '70px',
                  cell: ({ row }: { row: any }) => (
                    <span className="font-bold text-xs font-mono text-foreground">
                      #{row.id}
                    </span>
                  )
                },
                {
                  id: 'requester',
                  label: 'PARTNER & ROLE',
                  minWidth: '220px',
                  cell: ({ row }: { row: any }) => (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs text-foreground">
                          {row.user?.name || 'Unknown Partner'}
                        </p>
                        <Badge
                          variant="soft"
                          color={row.user?.role === 'RESTAURANT' ? 'primary' : 'success'}
                          className="text-[9px] font-extrabold uppercase px-1.5 py-0.2"
                        >
                          {row.user?.role === 'RESTAURANT' ? 'Restaurant' : 'Rider'}
                        </Badge>
                      </div>
                      {row.user?.restaurant?.name && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Store size={10} className="text-primary" />
                          <span>{row.user.restaurant.name}</span>
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {row.user?.phone || row.user?.email}
                      </p>
                    </div>
                  )
                },
                {
                  id: 'amount',
                  label: 'AMOUNT REQUESTED',
                  width: '160px',
                  cell: ({ row }: { row: any }) => (
                    <div className="space-y-0.5">
                      <span className="font-black text-sm font-mono text-foreground">
                        ৳{parseFloat(row.amount).toFixed(2)}
                      </span>
                      <p className="text-[9px] text-muted-foreground">
                        Available Balance: ৳{parseFloat(row.user?.walletBalance || 0).toFixed(2)}
                      </p>
                    </div>
                  )
                },
                {
                  id: 'channel',
                  label: 'DESTINATION CHANNEL',
                  minWidth: '220px',
                  cell: ({ row }: { row: any }) => (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="soft" color="primary" className="text-[9px] font-extrabold uppercase px-1.5 py-0.2">
                          {row.paymentMethod}
                        </Badge>
                        <span className="text-xs font-bold font-mono text-foreground">{row.accountNumber}</span>
                      </div>
                      {row.paymentMethod === 'BANK_TRANSFER' && (
                        <p className="text-[10px] text-muted-foreground">
                          {row.bankName} {row.branchName ? `(${row.branchName})` : ''} • A/C: {row.accountHolderName}
                        </p>
                      )}
                      {row.notes && (
                        <p className="text-[10px] text-slate-500 italic mt-0.5">
                          &ldquo;{row.notes}&rdquo;
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
                  id: 'adminRemarks',
                  label: 'ADMIN REMARKS',
                  minWidth: '180px',
                  cell: ({ row }: { row: any }) => (
                    <div className="text-xs text-muted-foreground">
                      {row.adminNote ? (
                        <span className="text-foreground/90 font-medium">{row.adminNote}</span>
                      ) : (
                        <span className="italic text-muted-foreground/60">—</span>
                      )}
                    </div>
                  )
                },
                {
                  id: 'date',
                  label: 'REQUESTED AT',
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
                  label: 'ACTIONS',
                  width: '160px',
                  align: 'right' as const,
                  cell: ({ row }: { row: any }) => {
                    if (row.status === 'PENDING') {
                      return (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="xs"
                            variant="primary"
                            onClick={() => handleOpenActionModal(row, 'APPROVE')}
                            leftIcon={<Check size={12} />}
                            className="font-bold text-[11px] h-7.5 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleOpenActionModal(row, 'REJECT')}
                            leftIcon={<X size={12} />}
                            className="font-bold text-[11px] h-7.5 px-2 text-rose-600 hover:bg-rose-500/10 border-rose-200 hover:border-rose-300"
                          >
                            Reject
                          </Button>
                        </div>
                      );
                    }
                    return (
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        Completed
                      </span>
                    );
                  }
                }
              ]}
            />
          </CardContent>
        </Card>
      )}

      {/* Modal: Process Action (Approve / Reject) */}
      <Modal
        open={!!selectedRequest && !!actionType}
        onClose={() => !actionLoading && setSelectedRequest(null)}
        size="md"
      >
        <Modal.Header
          title={actionType === 'APPROVE' ? 'Approve & Disburse Payout' : 'Reject Withdrawal Request'}
          description={
            actionType === 'APPROVE'
              ? `Confirming this will debit ৳${parseFloat(selectedRequest?.amount || 0).toFixed(2)} from ${selectedRequest?.user?.name}'s balance and record a payout ledger transaction.`
              : `Rejecting this request will keep the user's wallet balance unchanged and send them a rejection notice.`
          }
          icon={actionType === 'APPROVE' ? <CheckCircle2 className="text-emerald-500" size={20} /> : <XCircle className="text-rose-500" size={20} />}
        />
        <Modal.Content>
          {selectedRequest && (
            <div className="space-y-4 pt-1">
              
              {/* Requester & Amount summary */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Requester:</span>
                  <span className="font-bold text-foreground">{selectedRequest.user?.name} ({selectedRequest.user?.role})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Requested Amount:</span>
                  <span className="font-black text-sm text-foreground font-mono">৳{parseFloat(selectedRequest.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Current Wallet Balance:</span>
                  <span className="font-bold text-emerald-600 font-mono">৳{parseFloat(selectedRequest.user?.walletBalance || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Payout Channel:</span>
                  <span className="font-bold text-foreground">{selectedRequest.paymentMethod} ({selectedRequest.accountNumber})</span>
                </div>
                {selectedRequest.paymentMethod === 'BANK_TRANSFER' && selectedRequest.bankName && (
                  <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1 border-t border-border/20">
                    <span>Bank &amp; Branch:</span>
                    <span>{selectedRequest.bankName} {selectedRequest.branchName ? `(${selectedRequest.branchName})` : ''} • {selectedRequest.accountHolderName}</span>
                  </div>
                )}
              </div>

              {/* Admin Note Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {actionType === 'APPROVE' ? 'Disbursement Note / TrxID (Optional)' : 'Rejection Reason *'}
                </label>
                <textarea
                  rows={2}
                  required={actionType === 'REJECT'}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={actionType === 'APPROVE' ? 'e.g. Disbursed via bKash TrxID #9X2...' : 'e.g. Account number does not match registered name'}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => setSelectedRequest(null)}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  size="sm"
                  loading={actionLoading}
                  onClick={handleProcessAction}
                  variant={actionType === 'APPROVE' ? 'primary' : 'destructive'}
                  className="font-extrabold shadow-sm"
                >
                  {actionType === 'APPROVE' ? 'Confirm Approval & Disburse' : 'Confirm Rejection'}
                </Button>
              </div>

            </div>
          )}
        </Modal.Content>
      </Modal>

    </div>
  );
}
