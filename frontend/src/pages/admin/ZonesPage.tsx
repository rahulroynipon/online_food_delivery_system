import { useState, useEffect } from 'react';
import { Card, CardContent, Button, toast, Badge, Modal, DataTable, Avatar, Input, Select, type DataTableColumn } from '../../design-system';
import { 
  MapPin, 
  Loader2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Info,
  Map
} from 'lucide-react';
import api from '../../lib/axios';

export default function ZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [selectedZone, setSelectedZone] = useState<any>(null);
  
  // Form State
  const [form, setForm] = useState({
    name: '',
    status: 'ACTIVE'
  });

  // Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<any>(null);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const response = await api.get('/delivery-zones');
      if (response.data?.success) {
        setZones(response.data.deliveryZones || []);
      }
    } catch {
      toast.error('Failed to load delivery zones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('ADD');
    setSelectedZone(null);
    setForm({
      name: '',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (zone: any) => {
    setModalMode('EDIT');
    setSelectedZone(zone);
    setForm({
      name: zone.name || '',
      status: zone.status || 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('submit');

    try {
      if (modalMode === 'ADD') {
        const response = await api.post('/delivery-zones', form);
        if (response.data?.success) {
          toast.success('Delivery zone created successfully!');
          setIsModalOpen(false);
          fetchZones();
        }
      } else {
        const response = await api.put(`/delivery-zones/${selectedZone.slug}`, form);
        if (response.data?.success) {
          toast.success('Delivery zone updated successfully!');
          setIsModalOpen(false);
          fetchZones();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save delivery zone.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenDelete = (zone: any) => {
    setZoneToDelete(zone);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!zoneToDelete) return;

    setActionLoading(`delete-${zoneToDelete.slug}`);
    try {
      const response = await api.delete(`/delivery-zones/${zoneToDelete.slug}`);
      if (response.data?.success) {
        toast.success('Delivery zone deleted successfully.');
        setIsDeleteModalOpen(false);
        fetchZones();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete delivery zone.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="soft" color="success" className="font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5">Active</Badge>;
      case 'INACTIVE':
        return <Badge variant="soft" color="neutral" className="font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5">Inactive</Badge>;
      default:
        return <Badge variant="soft" color="neutral" className="font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5">{status}</Badge>;
    }
  };

  // Filter & Search Logic
  const filteredZones = zones.filter((z) => {
    const matchesStatus = statusFilter === 'ALL' || z.status === statusFilter;
    const matchesSearch = z.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          z.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const columns: DataTableColumn<any>[] = [
    {
      id: 'zone',
      label: 'Delivery Zone',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar 
            src="" 
            alt={row.name} 
            fallback={<Map size={14} />} 
            size="md"
          />
          <div>
            <p className="font-extrabold text-sm text-foreground">{row.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
              slug: {row.slug}
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'status',
      label: 'Status',
      cell: ({ row }) => getStatusBadge(row.status)
    },
    {
      id: 'date',
      label: 'Created Date',
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
            onClick={() => handleOpenEdit(row)}
            leftIcon={<Edit size={12} />}
            className="font-semibold border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white"
          >
            Edit
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleOpenDelete(row)}
            leftIcon={<Trash2 size={12} />}
            className="font-semibold border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Delivery Zones</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage regional boundaries and active delivery coverage areas.</p>
        </div>
        <Button
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus size={16} />}
          className="font-bold w-fit shadow-xs bg-primary text-white hover:bg-primary/95"
        >
          Add Zone
        </Button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-4 rounded-2xl border border-border/40 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl w-fit">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => {
            const count = status === 'ALL' 
              ? zones.length 
              : zones.filter(z => z.status === status).length;
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
            placeholder="Search zone name or slug..."
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
              <span className="text-xs font-semibold text-muted-foreground">Loading zones...</span>
            </div>
          ) : filteredZones.length === 0 ? (
            <div className="text-center py-20">
              <Map className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-foreground">No zones found</h4>
              <p className="text-xs text-muted-foreground mt-1">There are no coverage zones matching the filters.</p>
            </div>
          ) : (
            <DataTable
              data={filteredZones}
              columns={columns}
              pagination={false}
              searchable={false}
              toolbar={null}
            />
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
          <Modal.Header 
            title={modalMode === 'ADD' ? 'Add Delivery Zone' : 'Edit Zone Details'} 
            description={modalMode === 'ADD' ? 'Establish a new regional boundary for store delivery coverage.' : 'Modify coverage zone name and active status.'}
          />
          <form onSubmit={handleSubmit}>
            <Modal.Content className="space-y-4">
              <Input
                label="Zone Name"
                required
                placeholder="e.g. Uttara Zone, Banani & Gulshan"
                leftIcon={<MapPin size={15} className="text-muted-foreground" />}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              
              <Select
                label="Status"
                value={form.status}
                onValueChange={(val) => setForm({ ...form, status: val })}
                options={[
                  { value: 'ACTIVE', label: 'ACTIVE' },
                  { value: 'INACTIVE', label: 'INACTIVE' }
                ]}
              />
            </Modal.Content>
            
            <Modal.Footer>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Info size={12} />
                  <span>Zones serve as boundary filters for stores and rider operations.</span>
                </div>
                <div className="flex gap-2.5">
                  <Button
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="font-semibold text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs shadow-xs"
                    loading={actionLoading === 'submit'}
                    disabled={actionLoading !== null}
                  >
                    {modalMode === 'ADD' ? 'Create Zone' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </Modal.Footer>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {zoneToDelete && (
        <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} size="sm">
          <Modal.Header 
            title="Delete Delivery Zone" 
            description="Are you sure you want to delete this zone? It will immediately stop onboarding under this region."
          />
          <Modal.Content>
            <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl">
              <Avatar 
                src="" 
                alt={zoneToDelete.name} 
                fallback={<Map size={14} />} 
                size="md"
              />
              <div>
                <p className="font-extrabold text-sm text-foreground">{zoneToDelete.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">slug: {zoneToDelete.slug}</p>
              </div>
            </div>
          </Modal.Content>
          <Modal.Footer>
            <div className="flex gap-2.5 justify-end w-full">
              <Button
                variant="ghost"
                onClick={() => setIsDeleteModalOpen(false)}
                className="font-semibold text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs border-transparent shadow-xs"
                loading={actionLoading === `delete-${zoneToDelete.slug}`}
                disabled={actionLoading !== null}
                onClick={handleConfirmDelete}
              >
                Delete Zone
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
