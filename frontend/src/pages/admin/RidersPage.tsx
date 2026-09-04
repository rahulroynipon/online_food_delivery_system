import { useState, useEffect } from 'react';
import { Card, CardContent, Button, toast, Badge, Modal, DataTable, Avatar, Input, Select, type DataTableColumn } from '../../design-system';
import { 
  Bike, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Search, 
  Eye, 
  User, 
  Phone, 
  Mail,
  Calendar,
  Info,
  Edit,
  ShieldCheck,
  FileText,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import api from '../../lib/axios';

export default function RidersPage() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'REJECTED'>('ALL');

  // Modal Details State
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit State
  const [editApp, setEditApp] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    vehicleType: 'MOTORBIKE',
    vehicleNumber: '',
    status: 'PENDING'
  });

  // Delete State
  const [riderToDelete, setRiderToDelete] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // DataTable Column Definitions
  const columns: DataTableColumn<any>[] = [
    {
      id: 'rider',
      label: 'Rider Partner',
      width: '240px',
      cell: ({ row }) => (
        <div className="flex items-center gap-3 min-w-[180px] max-w-[240px]">
          <Avatar 
            src="" 
            alt={row.user?.name} 
            fallback={<User size={14} />} 
            size="md"
            className="shrink-0"
          />
          <div className="min-w-0">
            <p className="font-extrabold text-sm text-foreground truncate">{row.user?.name || 'N/A'}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 capitalize truncate">
              {row.vehicleType?.toLowerCase() || 'N/A'} Rider
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'contact',
      label: 'Contact Info',
      width: '190px',
      cell: ({ row }) => (
        <div className="min-w-[140px] max-w-[190px]">
          <p className="font-semibold text-foreground text-xs truncate" title={row.user?.email}>{row.user?.email || 'N/A'}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{row.user?.phone || 'N/A'}</p>
        </div>
      )
    },
    {
      id: 'vehicle',
      label: 'License / Plate No.',
      width: '160px',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/20">
          {row.vehicleNumber || 'N/A'}
        </span>
      )
    },
    {
      id: 'status',
      label: 'Status',
      width: '100px',
      cell: ({ row }) => getStatusBadge(row.status)
    },
    {
      id: 'date',
      label: 'Applied Date',
      width: '130px',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
          {new Date(row.createdAt).toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
      )
    },
    {
      id: 'actions',
      label: '',
      align: 'right' as const,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5 shrink-0 w-max">
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleOpenDetails(row)}
            leftIcon={<Eye size={12} />}
            className="font-semibold"
          >
            View
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleOpenEdit(row)}
            leftIcon={<Edit size={12} />}
            className="font-semibold border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white"
          >
            Edit
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => { setRiderToDelete(row); setIsDeleteModalOpen(true); }}
            leftIcon={<Trash2 size={12} />}
            className="font-semibold border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/onboarding/applications');
      if (response.data?.success) {
        setRiders(response.data.riders || []);
      }
    } catch {
      toast.error('Failed to load rider applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchApplications(); 
  }, []);

  const handleApprove = async (id: number) => {
    setActionLoading(`approve-${id}`);
    try {
      await api.post(`/onboarding/applications/rider/${id}/approve`);
      toast.success('Rider application approved!');
      
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp((prev: any) => ({ ...prev, status: 'ACTIVE', user: prev.user ? { ...prev.user, status: 'ACTIVE' } : null }));
      }
      
      fetchApplications();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve rider.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(`reject-${id}`);
    try {
      await api.post(`/onboarding/applications/rider/${id}/reject`);
      toast.info('Rider application rejected.');
      
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp((prev: any) => ({ ...prev, status: 'REJECTED', user: prev.user ? { ...prev.user, status: 'REJECTED' } : null }));
      }
      
      fetchApplications();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject rider.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenDetails = (app: any) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!riderToDelete) return;
    setActionLoading(`delete-${riderToDelete.id}`);
    try {
      await api.delete(`/onboarding/applications/rider/${riderToDelete.id}`);
      toast.success('Rider and associated account deleted successfully.');
      setIsDeleteModalOpen(false);
      setRiderToDelete(null);
      fetchApplications();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete rider.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenEdit = (app: any) => {
    setEditApp(app);
    setEditForm({
      fullName: app.user?.name || '',
      email: app.user?.email || '',
      phone: app.user?.phone || '',
      vehicleType: app.vehicleType || 'MOTORBIKE',
      vehicleNumber: app.vehicleNumber || '',
      status: app.status || 'PENDING'
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editApp) return;

    setActionLoading(`save-${editApp.id}`);
    try {
      const response = await api.put(`/onboarding/applications/rider/${editApp.id}`, editForm);
      if (response.data?.success) {
        toast.success('Rider updated successfully!');
        setIsEditModalOpen(false);
        fetchApplications();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update rider application.');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter & Search Logic
  const filteredRiders = riders.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch = 
      (r.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.vehicleNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.vehicleType || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="soft" color="warning" className="font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5">Pending</Badge>;
      case 'ACTIVE':
        return <Badge variant="soft" color="success" className="font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5">Active</Badge>;
      case 'REJECTED':
        return <Badge variant="soft" color="danger" className="font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5">Rejected</Badge>;
      default:
        return <Badge variant="soft" color="neutral" className="font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Delivery Riders</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage new delivery rider applications, vehicle licenses and statuses.</p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-4 rounded-2xl border border-border/40 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl w-fit">
          {(['ALL', 'PENDING', 'ACTIVE', 'REJECTED'] as const).map((status) => {
            const count = status === 'ALL' 
              ? riders.length 
              : riders.filter(r => r.status === status).length;
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-card text-foreground shadow-xs font-bold' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
                {count > 0 && (
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by rider name, email, license number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/20 border border-border/40 rounded-xl text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all text-foreground"
          />
        </div>
      </div>

      {/* Table Container */}
      <Card className="bg-transparent border-none shadow-none">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Loading applications...</span>
            </div>
          ) : filteredRiders.length === 0 ? (
            <div className="text-center py-20">
              <Bike className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-foreground">No riders found</h4>
              <p className="text-xs text-muted-foreground mt-1">There are no onboarding riders matching the filters.</p>
            </div>
          ) : (
            <DataTable
              data={filteredRiders}
              columns={columns}
              pagination={false}
              searchable={false}
              toolbar={null}
            />
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedApp && (
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
          <Modal.Header 
            title="Rider Application details" 
            description="Review details, vehicle licenses and onboarding status."
          />
          <Modal.Content className="space-y-6">
            {/* Split Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Rider Contacts */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-primary border-b border-border/10 pb-2">
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Full Name</label>
                    <div className="flex items-center gap-2 mt-1">
                      <User size={14} className="text-muted-foreground" />
                      <p className="text-xs font-semibold text-foreground">{selectedApp.user?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Email Address</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail size={14} className="text-muted-foreground" />
                      <p className="text-xs font-medium text-foreground">{selectedApp.user?.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Phone Number</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone size={14} className="text-muted-foreground" />
                      <p className="text-xs font-medium text-foreground">{selectedApp.user?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Vehicle & Status */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-primary border-b border-border/10 pb-2">
                  Vehicle & Verification Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Vehicle Type</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Bike size={14} className="text-muted-foreground" />
                      <p className="text-xs font-semibold text-foreground capitalize">{selectedApp.vehicleType?.toLowerCase() || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">License Number</label>
                    <div className="flex items-center gap-2 mt-1">
                      <FileText size={14} className="text-muted-foreground" />
                      <p className="text-xs font-mono text-foreground font-bold">{selectedApp.vehicleNumber || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Application Status</label>
                      <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Submitted On</label>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Calendar size={13} />
                        <span>
                          {new Date(selectedApp.createdAt).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Content>
          
          <Modal.Footer>
            <div className="flex items-center justify-between w-full">
              {/* Left Note */}
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground max-w-sm">
                <Info size={12} className="shrink-0" />
                <span>Approving will allow this rider partner to accept orders and login.</span>
              </div>
              
              {/* Right Action buttons */}
              <div className="flex gap-2.5">
                <Button
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="font-semibold text-xs"
                >
                  Close
                </Button>
                
                {selectedApp.status === 'PENDING' && (
                  <>
                    <Button
                      variant="outline"
                      className="border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white font-semibold text-xs"
                      loading={actionLoading === `reject-${selectedApp.id}`}
                      disabled={actionLoading !== null}
                      onClick={() => handleReject(selectedApp.id)}
                      leftIcon={<XCircle size={14} />}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      className="bg-emerald-600 hover:bg-emerald-700 font-semibold text-xs border-transparent shadow-sm text-white"
                      loading={actionLoading === `approve-${selectedApp.id}`}
                      disabled={actionLoading !== null}
                      onClick={() => handleApprove(selectedApp.id)}
                      leftIcon={<CheckCircle size={14} />}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Modal.Footer>
        </Modal>
      )}

      {/* Edit Modal */}
      {editApp && (
        <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} size="lg">
          <Modal.Header 
            title="Edit Rider Details" 
            description="Modify personal contacts, vehicle license, and active onboarding status."
          />
          <form onSubmit={handleSaveEdit}>
            <Modal.Content className="space-y-6">
              {/* Split Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Personal info */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-primary border-b border-border/10 pb-2">
                    Personal Information
                  </h3>
                  <div className="space-y-4">
                    <Input
                      label="Full Name"
                      required
                      leftIcon={<User size={15} className="text-muted-foreground" />}
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      required
                      leftIcon={<Mail size={15} className="text-muted-foreground" />}
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                    <Input
                      label="Phone Number"
                      required
                      leftIcon={<Phone size={15} className="text-muted-foreground" />}
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Right Column: Vehicle & Status info */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-primary border-b border-border/10 pb-2">
                    Vehicle Details & Status
                  </h3>
                  <div className="space-y-4">
                    <Select
                      label="Vehicle Type"
                      value={editForm.vehicleType}
                      onValueChange={(val) => setEditForm({ ...editForm, vehicleType: val })}
                      options={[
                        { value: 'BICYCLE', label: 'Bicycle' },
                        { value: 'MOTORBIKE', label: 'Motorbike' },
                        { value: 'CAR', label: 'Car' }
                      ]}
                    />
                    <Input
                      label="License / Plate Number"
                      required
                      leftIcon={<FileText size={15} className="text-muted-foreground" />}
                      value={editForm.vehicleNumber}
                      onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value })}
                    />
                    <Select
                      label="Application Status"
                      value={editForm.status}
                      onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                      options={[
                        { value: 'PENDING', label: 'PENDING' },
                        { value: 'ACTIVE', label: 'ACTIVE' },
                        { value: 'SUSPENDED', label: 'SUSPENDED' },
                        { value: 'REJECTED', label: 'REJECTED' }
                      ]}
                    />
                  </div>
                </div>
              </div>
            </Modal.Content>
            
            <Modal.Footer>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Info size={12} />
                  <span>Saves will update both corresponding rider profile and user credential tables.</span>
                </div>
                <div className="flex gap-2.5">
                  <Button
                    variant="ghost"
                    onClick={() => setIsEditModalOpen(false)}
                    className="font-semibold text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs shadow-xs"
                    loading={actionLoading === `save-${editApp.id}`}
                    disabled={actionLoading !== null}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Modal.Footer>
          </form>
        </Modal>
      )}
      {/* Delete Confirmation Modal */}
      {riderToDelete && (
        <Modal open={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setRiderToDelete(null); }} size="sm">
          <Modal.Header
            title="Delete Rider"
            description="This will permanently delete the rider profile and its associated account. This action cannot be undone."
          />
          <Modal.Content>
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle size={28} className="text-rose-500" />
              </div>
              <div>
                <p className="font-bold text-foreground">Delete <span className="text-rose-500">{riderToDelete.user?.name || 'this rider'}</span>?</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {riderToDelete.user?.email || 'N/A'} &bull; {riderToDelete.vehicleType || 'N/A'}
                </p>
              </div>
            </div>
          </Modal.Content>
          <Modal.Footer>
            <div className="flex justify-end gap-2.5 w-full">
              <Button
                variant="ghost"
                onClick={() => { setIsDeleteModalOpen(false); setRiderToDelete(null); }}
                className="font-semibold text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmDelete}
                leftIcon={<Trash2 size={13} />}
                loading={actionLoading === `delete-${riderToDelete.id}`}
                disabled={actionLoading !== null}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs border-transparent shadow-xs"
              >
                Yes, Delete
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
