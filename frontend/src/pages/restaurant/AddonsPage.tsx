import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Badge, DataTable, Select, Input, Modal, toast } from '../../design-system';
import { Plus, Edit, Trash2, Loader2, Upload, ImageIcon, Power, Layers } from 'lucide-react';
import api from '../../lib/axios';

export default function AddonsPage() {
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal Form State
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<any | null>(null);
  const [addonImageFile, setAddonImageFile] = useState<File | null>(null);
  const [addonImagePreview, setAddonImagePreview] = useState<string | null>(null);
  const [deleteTargetAddon, setDeleteTargetAddon] = useState<any | null>(null);
  const [addonStatusFilter, setAddonStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [addonForm, setAddonForm] = useState({
    name: '',
    description: '',
    price: '',
    status: 'ACTIVE'
  });

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const base = api.defaults.baseURL || 'http://localhost:5005/api/v1';
    return `${base}/${imagePath}`;
  };

  const fetchAddons = async () => {
    setLoading(true);
    try {
      const response = await api.get('/addons');
      if (response.data?.success) {
        setAddons(response.data.addons || []);
      }
    } catch {
      toast.error('Could not fetch store addon items.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAddonImageFile(file);
      setAddonImagePreview(URL.createObjectURL(file));
    }
  };

  const handleToggleAddonStatus = async (addon: any) => {
    const nextStatus = addon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const response = await api.put(`/addons/${addon.slug}/status`);
      if (response.data?.success) {
        toast.success(`Successfully set addon status to ${nextStatus}.`);
        fetchAddons();
      }
    } catch (err: any) {
      toast.error('Failed to toggle addon status.');
    }
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonForm.name || addonForm.price === '') {
      toast.error('Name and Price are required.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', addonForm.name);
      formData.append('description', addonForm.description);
      formData.append('price', addonForm.price);
      formData.append('status', addonForm.status);
      if (addonImageFile) {
        formData.append('image', addonImageFile);
      }

      if (editingAddon) {
        const response = await api.put(`/addons/${editingAddon.slug}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data?.success) {
          toast.success('Addon updated successfully!');
          fetchAddons();
          setIsAddonModalOpen(false);
        }
      } else {
        const response = await api.post('/addons', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data?.success) {
          toast.success('Addon created successfully!');
          fetchAddons();
          setIsAddonModalOpen(false);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save addon.');
    }
  };

  const handleDeleteAddon = async () => {
    if (!deleteTargetAddon) return;
    try {
      const response = await api.delete(`/addons/${deleteTargetAddon.slug}`);
      if (response.data?.success) {
        toast.success('Addon deleted successfully (soft delete).');
        fetchAddons();
        setDeleteTargetAddon(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete addon.');
    }
  };

  const openAddAddon = () => {
    setEditingAddon(null);
    setAddonImageFile(null);
    setAddonImagePreview(null);
    setAddonForm({
      name: '',
      description: '',
      price: '',
      status: 'ACTIVE'
    });
    setIsAddonModalOpen(true);
  };

  const openEditAddon = (addon: any) => {
    setEditingAddon(addon);
    setAddonImageFile(null);
    setAddonImagePreview(addon.image ? getImageUrl(addon.image) : null);
    setAddonForm({
      name: addon.name || '',
      description: addon.description || '',
      price: String(addon.price || ''),
      status: addon.status || 'ACTIVE'
    });
    setIsAddonModalOpen(true);
  };

  useEffect(() => {
    fetchAddons();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Store Add-ons</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage global menu modifiers, extras, and item options.</p>
        </div>
        <Button
          size="sm"
          onClick={openAddAddon}
          leftIcon={<Plus size={16} />}
          className="font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-xs border-transparent"
        >
          Create Add-on
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-semibold">Loading addon items...</span>
        </div>
      ) : (
        <>
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl w-fit">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => {
              const count = status === 'ALL'
                ? addons.length
                : addons.filter((a: any) => a.status === status).length;
              const isSelected = addonStatusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setAddonStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                  {count > 0 && (
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Addons List Table */}
          <Card className="bg-transparent border-none shadow-none">
            <CardContent className="p-0">
              <DataTable
                data={addonStatusFilter === 'ALL' ? addons : addons.filter((a: any) => a.status === addonStatusFilter)}
                pagination={false}
                searchable={false}
                toolbar={null}
                columns={[
                  {
                    id: 'addon',
                    label: 'Add-on Details',
                    cell: ({ row }: { row: any }) => (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                          {row.image ? (
                            <img src={getImageUrl(row.image)} alt={row.name} className="h-full w-full object-cover" />
                          ) : (
                            <Layers size={14} className="text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-foreground">{row.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic max-w-sm">{row.description || 'No description'}</p>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: 'price',
                    label: 'Add-on Price',
                    cell: ({ row }: { row: any }) => (
                      <span className="font-extrabold text-foreground">৳{Number(row.price || 0).toFixed(2)}</span>
                    )
                  },
                  {
                    id: 'status',
                    label: 'Status',
                    cell: ({ row }: { row: any }) => (
                      row.status === 'ACTIVE'
                        ? <Badge variant="soft" color="success" className="font-bold text-[9px] uppercase px-2 py-0.5">Active</Badge>
                        : <Badge variant="soft" color="neutral" className="font-bold text-[9px] uppercase px-2 py-0.5">Hidden</Badge>
                    )
                  },
                  {
                    id: 'actions',
                    label: '',
                    align: 'right' as const,
                    cell: ({ row }: { row: any }) => (
                      <div className="flex items-center justify-end gap-2 shrink-0 w-max">
                        <Button
                          size="xs"
                          variant={row.status === 'ACTIVE' ? 'tertiary' : 'primary'}
                          onClick={() => handleToggleAddonStatus(row)}
                          leftIcon={<Power size={12} />}
                          className="font-semibold"
                        >
                          {row.status === 'ACTIVE' ? 'Hide' : 'Activate'}
                        </Button>
                        <Button
                          size="xs"
                          variant="tertiary"
                          onClick={() => openEditAddon(row)}
                          leftIcon={<Edit size={12} />}
                          className="font-semibold"
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="danger-soft"
                          onClick={() => setDeleteTargetAddon(row)}
                          leftIcon={<Trash2 size={12} />}
                          className="font-semibold"
                        >
                          Delete
                        </Button>
                      </div>
                    )
                  }
                ]}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Add / Edit Addon Modal */}
      {isAddonModalOpen && (
        <Modal open={isAddonModalOpen} onClose={() => setIsAddonModalOpen(false)} size="md">
          <Modal.Header
            title={editingAddon ? 'Edit Add-on Option' : 'Create Add-on Option'}
            description="Add or update customization extras (like double cheese, special dips, toppings)."
          />
          <form onSubmit={handleSaveAddon}>
            <Modal.Content className="space-y-4">
              <Input
                label="Add-on Name"
                required
                placeholder="e.g. Double Cheddar Cheese"
                value={addonForm.name}
                onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })}
              />
              <Input
                label="Price (৳ Taka)"
                required
                type="number"
                step="0.01"
                placeholder="e.g. 1.50"
                value={addonForm.price}
                onChange={(e) => setAddonForm({ ...addonForm, price: e.target.value })}
              />
              <Input
                label="Description"
                placeholder="Briefly describe what this extra includes..."
                value={addonForm.description}
                onChange={(e) => setAddonForm({ ...addonForm, description: e.target.value })}
              />
              <Select
                label="Status"
                value={addonForm.status}
                onValueChange={(val) => setAddonForm({ ...addonForm, status: val })}
                options={[
                  { value: 'ACTIVE', label: 'Active (Available)' },
                  { value: 'INACTIVE', label: 'Hidden (Unavailable)' }
                ]}
              />

              {/* Addon Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  Add-on Image (Optional)
                </label>
                <div className="flex items-center gap-4 p-3 bg-muted/20 border border-dashed border-border/60 rounded-2xl">
                  <div className="h-14 w-14 rounded-xl border border-border bg-card flex items-center justify-center overflow-hidden shrink-0">
                    {addonImagePreview ? (
                      <img src={addonImagePreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <Upload size={18} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      id="store-addon-image-file"
                      accept="image/*"
                      onChange={handleAddonFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="store-addon-image-file"
                      className="inline-flex items-center justify-center px-3 py-1.5 border border-border bg-card rounded-lg text-xs font-semibold text-foreground hover:bg-muted/10 cursor-pointer transition-colors shadow-xs"
                    >
                      Choose Image File
                    </label>
                    <p className="text-[10px] text-muted-foreground">JPEG, PNG, WEBP formats allowed.</p>
                  </div>
                </div>
              </div>
            </Modal.Content>
            <Modal.Footer>
              <div className="flex gap-2 justify-end w-full">
                <Button variant="ghost" size="sm" onClick={() => setIsAddonModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" size="sm" className="bg-primary hover:bg-primary/95 text-primary-foreground shadow-xs border-transparent font-semibold">
                  {editingAddon ? 'Update Addon' : 'Create Addon'}
                </Button>
              </div>
            </Modal.Footer>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      {deleteTargetAddon && (
        <Modal open={!!deleteTargetAddon} onClose={() => setDeleteTargetAddon(null)} size="sm">
          <Modal.Header
            title="Confirm Deletion"
            description={`Are you absolutely sure you want to permanently delete addon extra "${deleteTargetAddon.name}"?`}
          />
          <Modal.Footer>
            <div className="flex gap-2 justify-end w-full">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTargetAddon(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteAddon}
                className="bg-rose-500 hover:bg-rose-600 text-white shadow-xs border-transparent"
              >
                Delete Addon
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
