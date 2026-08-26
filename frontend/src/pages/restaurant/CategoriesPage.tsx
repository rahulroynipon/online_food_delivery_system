import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Badge, DataTable, Select, Input, Modal, toast } from '../../design-system';
import { Plus, Edit, Trash2, Loader2, Upload, ImageIcon, Power } from 'lucide-react';
import api from '../../lib/axios';

export default function CategoriesPage() {
  // Custom Store Categories state & loading state
  const [restaurantCategories, setRestaurantCategories] = useState<any[]>([]);
  const [platformCategories, setPlatformCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Category Modal Form State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    platformCategoryId: '',
    status: 'ACTIVE'
  });
  const [deleteTargetCategory, setDeleteTargetCategory] = useState<any | null>(null);
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const base = api.defaults.baseURL || 'http://localhost:5005/api/v1';
    return `${base}/${imagePath}`;
  };

  const handleCategoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCategoryImageFile(file);
      setCategoryImagePreview(URL.createObjectURL(file));
    }
  };

  const fetchRestaurantCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await api.get('/restaurant-categories');
      if (response.data?.success) {
        setRestaurantCategories(response.data.categories || []);
      }
    } catch {
      toast.error('Could not fetch store categories.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchPlatformCategories = async () => {
    try {
      const response = await api.get('/platform-categories');
      if (response.data?.success) {
        setPlatformCategories(response.data.platformCategories || []);
      }
    } catch (err) {
      console.error('Failed to fetch platform categories:', err);
    }
  };

  const handleToggleCategoryStatus = async (category: any) => {
    const nextStatus = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const response = await api.put(`/restaurant-categories/${category.slug}/status`);
      if (response.data?.success) {
        toast.success(`Successfully set "${category.name}" to ${nextStatus.toLowerCase()}.`);
        fetchRestaurantCategories();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle category status.');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name || !categoryForm.platformCategoryId) {
      toast.error('Name and Platform Category selection are required.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', categoryForm.name);
      formData.append('description', categoryForm.description);
      formData.append('platformCategoryId', categoryForm.platformCategoryId);
      formData.append('status', categoryForm.status);
      if (categoryImageFile) {
        formData.append('image', categoryImageFile);
      }

      if (editingCategory) {
        const response = await api.put(`/restaurant-categories/${editingCategory.slug}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data?.success) {
          toast.success('Category updated successfully!');
          fetchRestaurantCategories();
          setIsCategoryModalOpen(false);
        }
      } else {
        const response = await api.post('/restaurant-categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data?.success) {
          toast.success('Category created successfully!');
          fetchRestaurantCategories();
          setIsCategoryModalOpen(false);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save category.');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteTargetCategory) return;
    try {
      const response = await api.delete(`/restaurant-categories/${deleteTargetCategory.slug}`);
      if (response.data?.success) {
        toast.success('Category deleted successfully.');
        fetchRestaurantCategories();
        setDeleteTargetCategory(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryImageFile(null);
    setCategoryImagePreview(null);
    setCategoryForm({
      name: '',
      description: '',
      platformCategoryId: platformCategories[0]?.id ? String(platformCategories[0].id) : '',
      status: 'ACTIVE'
    });
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setCategoryImageFile(null);
    setCategoryImagePreview(cat.image ? getImageUrl(cat.image) : null);
    setCategoryForm({
      name: cat.name || '',
      description: cat.description || '',
      platformCategoryId: cat.platformCategoryId ? String(cat.platformCategoryId) : '',
      status: cat.status || 'ACTIVE'
    });
    setIsCategoryModalOpen(true);
  };

  useEffect(() => {
    fetchRestaurantCategories();
    fetchPlatformCategories();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Store Menu Categories</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage custom categories for your menu items, mapped to global platform categories.</p>
        </div>
        <Button
          size="sm"
          onClick={openAddCategory}
          leftIcon={<Plus size={16} />}
          className="font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-xs border-transparent"
        >
          Create Store Category
        </Button>
      </div>

      {categoriesLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-semibold">Loading custom categories...</span>
        </div>
      ) : (
        <>
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl w-fit">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => {
              const count = status === 'ALL'
                ? restaurantCategories.length
                : restaurantCategories.filter((c: any) => c.status === status).length;
              const isSelected = categoryStatusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setCategoryStatusFilter(status)}
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

          <Card className="bg-transparent border-none shadow-none">
            <CardContent className="p-0">
              <DataTable
                data={categoryStatusFilter === 'ALL' ? restaurantCategories : restaurantCategories.filter((c: any) => c.status === categoryStatusFilter)}
                pagination={false}
                searchable={false}
                toolbar={null}
                columns={[
                  {
                    id: 'category',
                    label: 'Category Name',
                    cell: ({ row }: { row: any }) => (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                          {row.image ? (
                            <img src={getImageUrl(row.image)} alt={row.name} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon size={14} className="text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-foreground">{row.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic max-w-sm">
                            {row.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: 'platformCategory',
                    label: 'Platform Mapping',
                    cell: ({ row }: { row: any }) => (
                      <Badge variant="soft" color="primary" className="font-bold text-[9px] uppercase px-2.5 py-0.5">
                        {row.platformCategory?.name || 'Unmapped'}
                      </Badge>
                    )
                  },
                  {
                    id: 'status',
                    label: 'Status',
                    cell: ({ row }: { row: any }) => (
                      row.status === 'ACTIVE'
                        ? <Badge variant="soft" color="success" className="font-bold text-[9px] uppercase px-2 py-0.5">Active</Badge>
                        : <Badge variant="soft" color="neutral" className="font-bold text-[9px] uppercase px-2 py-0.5">Inactive</Badge>
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
                          onClick={() => handleToggleCategoryStatus(row)}
                          leftIcon={<Power size={12} />}
                          className="font-semibold"
                        >
                          {row.status === 'ACTIVE' ? 'Hide' : 'Activate'}
                        </Button>
                        <Button
                          size="xs"
                          variant="tertiary"
                          onClick={() => openEditCategory(row)}
                          leftIcon={<Edit size={12} />}
                          className="font-semibold"
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="danger-soft"
                          onClick={() => setDeleteTargetCategory(row)}
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

      {/* Custom Category Form Modal */}
      {isCategoryModalOpen && (
        <Modal open={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} size="md">
          <Modal.Header
            title={editingCategory ? 'Edit Store Category' : 'Create Store Category'}
            description="Custom category entry for your menu mapping."
          />
          <form onSubmit={handleSaveCategory}>
            <Modal.Content className="space-y-4">
              <Select
                label="Platform Category Mapping"
                required
                placeholder="Select Platform Category"
                value={categoryForm.platformCategoryId}
                onValueChange={(val) => setCategoryForm({ ...categoryForm, platformCategoryId: val })}
                options={platformCategories.map((pc: any) => ({
                  value: String(pc.id),
                  label: pc.name
                }))}
              />
              <Input
                label="Category Name"
                required
                placeholder="e.g. Traditional Hand-Tossed Pizzas"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
              <Input
                label="Description"
                placeholder="Describe the category items..."
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
              <Select
                label="Status"
                value={categoryForm.status}
                onValueChange={(val) => setCategoryForm({ ...categoryForm, status: val })}
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' }
                ]}
              />

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  Category Image
                </label>
                <div className="flex items-center gap-4 p-3 bg-muted/20 border border-dashed border-border/60 rounded-2xl">
                  {/* Preview box */}
                  <div className="h-14 w-14 rounded-xl border border-border bg-card flex items-center justify-center overflow-hidden shrink-0">
                    {categoryImagePreview ? (
                      <img src={categoryImagePreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <Upload size={18} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      id="store-category-image-file"
                      accept="image/*"
                      onChange={handleCategoryFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="store-category-image-file"
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
                <Button variant="ghost" size="sm" onClick={() => setIsCategoryModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" size="sm" className="bg-primary hover:bg-primary/95 text-primary-foreground shadow-xs border-transparent font-semibold">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </Modal.Footer>
          </form>
        </Modal>
      )}

      {/* Custom Category Confirm Delete Modal */}
      {deleteTargetCategory && (
        <Modal open={!!deleteTargetCategory} onClose={() => setDeleteTargetCategory(null)} size="sm">
          <Modal.Header
            title="Confirm Deletion"
            description={`Are you absolutely sure you want to permanently delete custom category "${deleteTargetCategory.name}"? This action is irreversible.`}
          />
          <Modal.Footer>
            <div className="flex gap-2 justify-end w-full">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTargetCategory(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteCategory}
                className="bg-rose-500 hover:bg-rose-600 text-white shadow-xs border-transparent"
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
