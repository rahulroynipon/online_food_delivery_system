import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Badge, DataTable, Modal, toast, Input } from '../../design-system';
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
  Receipt,
  Filter
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
      <Card className="border border-border/40 bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Input
                placeholder="Search partner name, phone, email, restaurant, account number, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
                className="w-full text-xs pr-8"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-muted-foreground mr-1 hidden sm:inline">Role:</span>
              {[
                { id: 'ALL', label: 'All Roles', count: requests.length },
                { id: 'RESTAURANT', label: 'Restaurants', count: requests.filter((r) => r.user?.role === 'RESTAURANT').length },
                { id: 'RIDER', label: 'Riders', count: requests.filter((r) => r.user?.role === 'RIDER').length },
              ].map((r) => {
                const isSelected = roleFilter === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoleFilter(r.id as any)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                  >
                    <span>{r.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {r.count}
                    </span>
                  </button>
                );
              })}

              {(searchQuery || statusFilter !== 'ALL' || roleFilter !== 'ALL') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setRoleFilter('ALL');
                  }}
                  className="text-xs font-bold shrink-0 text-muted-foreground hover:text-foreground ml-1"
                  leftIcon={<X size={12} />}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-border/20">
            {[
              { id: 'ALL', label: 'All Requests', count: requests.length },
              { id: 'PENDING', label: 'Pending Review', count: pendingRequests.length },
              { id: 'PROCESSED', label: 'Disbursed / Paid', count: processedRequests.length },
              { id: 'REJECTED', label: 'Rejected', count: rejectedRequests.length },
            ].map((t) => {
              const isSelected = statusFilter === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setStatusFilter(t.id as any)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-foreground text-background shadow-xs scale-[1.02]'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
                  }`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Table Content */}
      <Card className="border border-border/40 bg-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground font-semibold">Loading withdrawal requests...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Receipt className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="font-bold text-foreground text-sm">No Withdrawal Requests Found</p>
            <p className="text-xs text-muted-foreground">
              {searchQuery || statusFilter !== 'ALL' || roleFilter !== 'ALL'
                ? 'Try adjusting your search keyword or filter tabs.'
                : 'When partners submit payout requests, they will appear here.'}
            </p>
            {(searchQuery || statusFilter !== 'ALL' || roleFilter !== 'ALL') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setRoleFilter('ALL');
                }}
                className="font-bold text-xs mt-2"
                leftIcon={<X size={12} />}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <DataTable
            data={filteredRequests}
            pagination={false}
            searchable={false}
            toolbar={null}
            getRowId={(item) => String(item.id)}
            columns={[
              {
                id: 'id',
                label: 'ID',
                width: '70px',
                cell: ({ row }: { row: any }) => (
                  <span className="font-mono font-black text-xs text-primary">
                    #{row.id}
                  </span>
                )
              },
              {
                id: 'requester',
                label: 'Partner & Role',
                width: '210px',
                cell: ({ row }: { row: any }) => (
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-xs text-foreground truncate">
                        {row.user?.name || 'Partner'}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          row.user?.role === 'RESTAURANT'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                            : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                        }`}
                      >
                        {row.user?.role === 'RESTAURANT' ? 'Restaurant' : 'Rider'}
                      </span>
                    </div>
                    {row.user?.restaurant?.name && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold truncate">
                        <Store size={11} className="text-amber-500 shrink-0" />
                        <span>{row.user.restaurant.name}</span>
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      {row.user?.phone || row.user?.email || 'N/A'}
                    </p>
                  </div>
                )
              },
              {
                id: 'amount',
                label: 'Requested Amount',
                width: '150px',
                cell: ({ row }: { row: any }) => (
                  <div className="space-y-0.5">
                    <p className="font-black text-sm text-foreground font-mono">
                      ৳{parseFloat(row.amount || 0).toFixed(2)}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-medium block">
                      Wallet: ৳{parseFloat(row.user?.walletBalance || 0).toFixed(2)}
                    </span>
                  </div>
                )
              },
              {
                id: 'channel',
                label: 'Destination Channel',
                width: '190px',
                cell: ({ row }: { row: any }) => (
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                          row.paymentMethod === 'BKASH'
                            ? 'bg-pink-500/10 text-pink-600 border border-pink-500/20'
                            : row.paymentMethod === 'NAGAD'
                            ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                            : row.paymentMethod === 'ROCKET'
                            ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                        }`}
                      >
                        {row.paymentMethod}
                      </span>
                      <span className="text-xs font-bold font-mono text-foreground">
                        {row.accountNumber}
                      </span>
                    </div>
                    {row.paymentMethod === 'BANK_TRANSFER' && (
                      <p className="text-[10px] text-muted-foreground font-medium truncate">
                        {row.bankName} {row.branchName ? `(${row.branchName})` : ''} • {row.accountHolderName}
                      </p>
                    )}
                    {row.notes && (
                      <p className="text-[10px] text-muted-foreground/80 italic line-clamp-1">
                        "{row.notes}"
                      </p>
                    )}
                  </div>
                )
              },
              {
                id: 'status',
                label: 'Status',
                width: '130px',
                cell: ({ row }: { row: any }) => {
                  if (row.status === 'PROCESSED') {
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <CheckCircle2 size={11} /> Disbursed
                      </span>
                    );
                  }
                  if (row.status === 'REJECTED') {
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-500/10 text-rose-600 border border-rose-500/20">
                        <XCircle size={11} /> Rejected
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      <Clock size={11} /> Pending
                    </span>
                  );
                }
              },
              {
                id: 'adminRemarks',
                label: 'Admin Remarks',
                width: '160px',
                cell: ({ row }: { row: any }) => (
                  <div className="text-xs">
                    {row.adminNote ? (
                      <p className="text-foreground/90 font-medium text-[11px] line-clamp-2">
                        {row.adminNote}
                      </p>
                    ) : (
                      <span className="italic text-muted-foreground/40 text-[11px]">—</span>
                    )}
                  </div>
                )
              },
              {
                id: 'date',
                label: 'Requested At',
                width: '130px',
                cell: ({ row }: { row: any }) => (
                  <div className="text-[11px] text-muted-foreground font-medium">
                    <p className="font-semibold text-foreground/80">{new Date(row.createdAt).toLocaleDateString()}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )
              },
              {
                id: 'actions',
                label: 'Actions',
                width: '140px',
                align: 'right' as const,
                cell: ({ row }: { row: any }) => {
                  if (row.status === 'PENDING') {
                    return (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => handleOpenActionModal(row, 'APPROVE')}
                          leftIcon={<Check size={11} />}
                          className="font-black text-[10px] h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          Approve
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleOpenActionModal(row, 'REJECT')}
                          leftIcon={<X size={11} />}
                          className="font-black text-[10px] h-7 px-2 text-rose-600 hover:bg-rose-500/10 border-rose-300 hover:border-rose-400"
                        >
                          Reject
                        </Button>
                      </div>
                    );
                  }
                  return (
                    <span className="text-[11px] text-muted-foreground/70 font-semibold italic">
                      Completed
                    </span>
                  );
                }
              }
            ]}
          />
        )}
      </Card>

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
                  variant={actionType === 'APPROVE' ? 'primary' : 'danger'}
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
