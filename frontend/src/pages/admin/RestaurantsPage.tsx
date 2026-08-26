import { useState, useEffect } from 'react';
import { Card, CardContent, Button, toast, Badge, Modal, DataTable, Avatar, Input, Textarea, Select, type DataTableColumn } from '../../design-system';
import { 
  Store, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Search, 
  Eye, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  Calendar,
  Info,
  Edit
} from 'lucide-react';
import api from '../../lib/axios';

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // DataTable Column Definitions
  const columns: DataTableColumn<any>[] = [
    {
      id: 'restaurant',
      label: 'Restaurant',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar 
            src={row.logo} 
            alt={row.name} 
            fallback={<Store size={14} />} 
            size="md"
          />
          <div>
            <p className="font-extrabold text-sm text-foreground text-nowrap">{row.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic max-w-xs truncate">
              {row.description || 'No description provided'}
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'owner',
      label: 'Owner / Contact',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-foreground">{row.user?.name || 'N/A'}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{row.user?.email || 'N/A'}</p>
        </div>
      )
    },
    {
      id: 'address',
      label: 'Address',
      cell: ({ row }) => <span className="text-muted-foreground font-medium">{row.address}</span>
    },
    {
      id: 'status',
      label: 'Status',
      cell: ({ row }) => getStatusBadge(row.status)
    },
    {
      id: 'date',
      label: 'Submitted Date',
      cell: ({ row }) => new Date(row.createdAt).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    },
    {
      id: 'actions',
      label: '',
      align: 'right' as const,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
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
        </div>
      )
    }
  ];

  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'REJECTED'>('ALL');
  
  // Modal State
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit State
  const [editApp, setEditApp] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    latitude: '',
    longitude: '',
    status: 'PENDING',
    ownerName: '',
    email: '',
    userPhone: ''
  });

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/onboarding/applications');
      if (response.data?.success) {
        setRestaurants(response.data.restaurants || []);
      }
    } catch {
      toast.error('Failed to load restaurant applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (app: any) => {
    setEditApp(app);
    setEditForm({
      name: app.name || '',
      description: app.description || '',
      address: app.address || '',
      phone: app.phone || '',
      latitude: String(app.latitude || ''),
      longitude: String(app.longitude || ''),
      status: app.status || 'PENDING',
      ownerName: app.user?.name || '',
      email: app.user?.email || '',
      userPhone: app.user?.phone || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editApp) return;
    
    setActionLoading(`save-${editApp.id}`);
    try {
      const response = await api.put(`/onboarding/applications/restaurant/${editApp.id}`, editForm);
      if (response.data?.success) {
        toast.success('Restaurant updated successfully!');
        setIsEditModalOpen(false);
        fetchApplications();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update application.');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => { 
    fetchApplications(); 
  }, []);

  const handleApprove = async (id: number) => {
    setActionLoading(`approve-${id}`);
    try {
      await api.post(`/onboarding/applications/restaurant/${id}/approve`);
      toast.success('Restaurant application approved!');
      
      // Update local state if modal is open
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp((prev: any) => ({ ...prev, status: 'ACTIVE', user: prev.user ? { ...prev.user, status: 'ACTIVE' } : null }));
      }
      
      fetchApplications();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve application.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(`reject-${id}`);
    try {
      await api.post(`/onboarding/applications/restaurant/${id}/reject`);
      toast.info('Restaurant application rejected.');
      
      // Update local state if modal is open
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp((prev: any) => ({ ...prev, status: 'REJECTED', user: prev.user ? { ...prev.user, status: 'REJECTED' } : null }));
      }
      
      fetchApplications();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject application.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenDetails = (app: any) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  // Filter & Search Logic
  const filteredRestaurants = restaurants.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch = 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.address || '').toLowerCase().includes(searchQuery.toLowerCase());
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
          <h2 className="text-2xl font-black text-foreground tracking-tight">Restaurant Partners</h2>
          <p className="text-xs text-muted-foreground mt-0.5">View and manage restaurant onboarding applications and store details.</p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-4 rounded-2xl border border-border/40 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl w-fit">
          {(['ALL', 'PENDING', 'ACTIVE', 'REJECTED'] as const).map((status) => {
            const count = status === 'ALL' 
              ? restaurants.length 
              : restaurants.filter(r => r.status === status).length;
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
            placeholder="Search by restaurant, owner, email, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/20 border border-border/40 rounded-xl text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all text-foreground"
          />
        </div>
      </div>

      {/* Table Container */}
      <Card className="border border-border/40 shadow-xs bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Loading applications...</span>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-20">
              <Store className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-foreground">No applications found</h4>
              <p className="text-xs text-muted-foreground mt-1">There are no onboarding applications matching the filters.</p>
            </div>
          ) : (
            <DataTable
              data={filteredRestaurants}
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
            title="Restaurant Application" 
            description="Review details and approve or reject onboarding status."
          />
          <Modal.Content className="space-y-6">
            {/* Split Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Restaurant Profile */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-primary border-b border-border/10 pb-2">
                  Restaurant Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Restaurant Name</label>
                    <p className="text-sm font-extrabold text-foreground mt-0.5">{selectedApp.name}</p>
                  </div>
                  {selectedApp.description && (
                    <div>
                      <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Description</label>
                      <p className="text-xs text-muted-foreground leading-relaxed italic bg-muted/10 p-2.5 rounded-xl border border-border/20 mt-1">
                        "{selectedApp.description}"
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Business Address</label>
                    <div className="flex items-start gap-2 mt-1">
                      <MapPin size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-xs text-foreground leading-relaxed">{selectedApp.address}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Latitude</label>
                      <p className="text-xs font-mono text-foreground mt-0.5">{selectedApp.latitude}</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Longitude</label>
                      <p className="text-xs font-mono text-foreground mt-0.5">{selectedApp.longitude}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Owner & Meta Profile */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-primary border-b border-border/10 pb-2">
                  Owner & Verification
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Owner Name</label>
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
                <span>Approving will instantly grant partner login and display shop on the map.</span>
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
            title="Edit Restaurant Details" 
            description="Modify application details, coordinates, owner contacts, and current status."
          />
          <form onSubmit={handleSaveEdit}>
            <Modal.Content className="space-y-6">
              {/* Split Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Restaurant Details */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-primary border-b border-border/10 pb-2">
                    Restaurant Details
                  </h3>
                  <div className="space-y-4">
                    <Input
                      label="Restaurant Name"
                      required
                      leftIcon={<Store size={15} className="text-muted-foreground" />}
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <Textarea
                      label="Description"
                      rows={3}
                      resize={false}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                    <Textarea
                      label="Business Address"
                      rows={3}
                      required
                      resize={false}
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Latitude"
                        type="number"
                        step="any"
                        required
                        leftIcon={<MapPin size={15} className="text-muted-foreground" />}
                        value={editForm.latitude}
                        onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                      />
                      <Input
                        label="Longitude"
                        type="number"
                        step="any"
                        required
                        leftIcon={<MapPin size={15} className="text-muted-foreground" />}
                        value={editForm.longitude}
                        onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Owner & Status info */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-primary border-b border-border/10 pb-2">
                    Owner Details & Onboarding Status
                  </h3>
                  <div className="space-y-4">
                    <Input
                      label="Owner Name"
                      required
                      leftIcon={<User size={15} className="text-muted-foreground" />}
                      value={editForm.ownerName}
                      onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
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
                      value={editForm.userPhone}
                      onChange={(e) => setEditForm({ ...editForm, userPhone: e.target.value })}
                    />
                    <Select
                      label="Application Status"
                      value={editForm.status}
                      onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                      width="100%"
                      options={[
                        { value: 'PENDING', label: 'PENDING' },
                        { value: 'ACTIVE', label: 'ACTIVE' },
                        { value: 'INACTIVE', label: 'INACTIVE' },
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
                  <span>Saves will update both corresponding restaurant and user profile tables.</span>
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
    </div>
  );
}

