import { useState, useEffect } from 'react';
import { Card, CardContent, Button, toast, Badge, Modal, DataTable, Avatar, Input, Select, type DataTableColumn } from '../../design-system';
import { 
  Layers, 
  Loader2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import api from '../../lib/axios';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  // Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  
  // Form State
  const [form, setForm] = useState({
    name: '',
    status: 'ACTIVE',
    imageFile: null as File | null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const base = api.defaults.baseURL || 'http://localhost:5005/api/v1';
    return `${base}/${imagePath}`;
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/platform-categories');
      if (response.data?.success) {
        setCategories(response.data.platformCategories || []);
      }
    } catch {
      toast.error('Failed to load platform categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('ADD');
    setSelectedCategory(null);
    setForm({
      name: '',
      status: 'ACTIVE',
      imageFile: null
    });
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: any) => {
    setModalMode('EDIT');
    setSelectedCategory(category);
    setForm({
      name: category.name || '',
      status: category.status || 'ACTIVE',
      imageFile: null
    });
    setImagePreview(category.image ? getImageUrl(category.image) : null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setForm((prev) => ({ ...prev, imageFile: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('submit');

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('status', form.status);
    if (form.imageFile) {
      formData.append('image', form.imageFile);
    }

    try {
      if (modalMode === 'ADD') {
        const response = await api.post('/platform-categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data?.success) {
          toast.success('Category created successfully!');
          setIsModalOpen(false);
          fetchCategories();
        }
      } else {
        const response = await api.put(`/platform-categories/${selectedCategory.slug}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data?.success) {
          toast.success('Category updated successfully!');
          setIsModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save platform category.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenDelete = (category: any) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setActionLoading(`delete-${categoryToDelete.slug}`);
    try {
      const response = await api.delete(`/platform-categories/${categoryToDelete.slug}`);
      if (response.data?.success) {
        toast.success('Category deleted successfully.');
        setIsDeleteModalOpen(false);
        fetchCategories();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete category.');
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
  const filteredCategories = categories.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const columns: DataTableColumn<any>[] = [
    {
      id: 'category',
      label: 'Category',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar 
            src={row.image ? getImageUrl(row.image) : ''} 
            alt={row.name} 
            fallback={<Layers size={14} />} 
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
          <h2 className="text-2xl font-black text-foreground tracking-tight">Platform Food Categories</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage food categories shown to users on the customer storefront application.</p>
        </div>
        <Button
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus size={16} />}
          className="font-bold w-fit shadow-xs bg-primary text-white hover:bg-primary/95"
        >
          Add Category
        </Button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-4 rounded-2xl border border-border/40 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl w-fit">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => {
            const count = status === 'ALL' 
              ? categories.length 
              : categories.filter(c => c.status === status).length;
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
            placeholder="Search category name or slug..."
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
              <span className="text-xs font-semibold text-muted-foreground">Loading categories...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-20">
              <Layers className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-foreground">No categories found</h4>
              <p className="text-xs text-muted-foreground mt-1">There are no food categories matching the filters.</p>
            </div>
          ) : (
            <DataTable
              data={filteredCategories}
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
            title={modalMode === 'ADD' ? 'Add Platform Category' : 'Edit Category Details'} 
            description={modalMode === 'ADD' ? 'Create a new food category category with image upload.' : 'Update category name, status and image.'}
          />
          <form onSubmit={handleSubmit}>
            <Modal.Content className="space-y-5">
              <div className="space-y-4">
                <Input
                  label="Category Name"
                  required
                  placeholder="e.g. Fast Food, Desserts"
                  leftIcon={<Layers size={15} className="text-muted-foreground" />}
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

                {/* Upload Image Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">
                    Category Image {modalMode === 'ADD' && <span className="text-rose-500">*</span>}
                  </label>
                  
                  <div className="flex items-center gap-4 p-3 bg-muted/20 border border-dashed border-border/60 rounded-2xl">
                    {/* Preview box */}
                    <div className="h-14 w-14 rounded-xl border border-border bg-card flex items-center justify-center overflow-hidden shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <Upload size={18} className="text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <input
                        type="file"
                        id="category-image-file"
                        accept="image/*"
                        required={modalMode === 'ADD'}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label 
                        htmlFor="category-image-file"
                        className="inline-flex items-center justify-center px-3 py-1.5 border border-border bg-card rounded-lg text-xs font-semibold text-foreground hover:bg-muted/10 cursor-pointer transition-colors shadow-xs"
                      >
                        Choose Image File
                      </label>
                      <p className="text-[10px] text-muted-foreground">JPEG, PNG, WEBP formats allowed.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Modal.Content>
            
            <Modal.Footer>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Info size={12} />
                  <span>Images are uploaded and served statically from backend storage.</span>
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
                    {modalMode === 'ADD' ? 'Create Category' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </Modal.Footer>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} size="sm">
          <Modal.Header 
            title="Delete Platform Category" 
            description="Are you sure you want to delete this category? It will immediately disappear from client applications."
          />
          <Modal.Content>
            <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl">
              <Avatar 
                src={categoryToDelete.image ? getImageUrl(categoryToDelete.image) : ''} 
                alt={categoryToDelete.name} 
                fallback={<Layers size={14} />} 
                size="md"
              />
              <div>
                <p className="font-extrabold text-sm text-foreground">{categoryToDelete.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">slug: {categoryToDelete.slug}</p>
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
                loading={actionLoading === `delete-${categoryToDelete.slug}`}
                disabled={actionLoading !== null}
                onClick={handleConfirmDelete}
              >
                Delete Category
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
