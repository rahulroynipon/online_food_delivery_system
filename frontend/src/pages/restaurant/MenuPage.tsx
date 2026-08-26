import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Badge, DataTable, Select, Input, Modal, toast } from '../../design-system';
import { Plus, Edit, Trash2, Loader2, Upload, ImageIcon, UtensilsCrossed, Power, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../../lib/axios';

export default function MenuPage() {
  const [foods, setFoods] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 2-Step Modal State
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [editingFood, setEditingFood] = useState<any | null>(null);
  const [foodImageFile, setFoodImageFile] = useState<File | null>(null);
  const [foodImagePreview, setFoodImagePreview] = useState<string | null>(null);
  const [deleteTargetFood, setDeleteTargetFood] = useState<any | null>(null);
  const [foodsStatusFilter, setFoodsStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [foodForm, setFoodForm] = useState({
    name: '',
    description: '',
    restaurantCategoryId: '',
    status: 'ACTIVE'
  });

  // Variant list state
  const [variants, setVariants] = useState<{ name: string; price: string }[]>([
    { name: 'Regular', price: '' }
  ]);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const base = api.defaults.baseURL || 'http://localhost:5005/api/v1';
    return `${base}/${imagePath}`;
  };

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const response = await api.get('/foods');
      if (response.data?.success) {
        setFoods(response.data.foods || []);
      }
    } catch {
      toast.error('Could not retrieve store menu items.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/restaurant-categories');
      if (response.data?.success) {
        setCategories(response.data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch restaurant categories:', err);
    }
  };

  const handleFoodFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFoodImageFile(file);
      setFoodImagePreview(URL.createObjectURL(file));
    }
  };

  const handleToggleFoodStatus = async (food: any) => {
    const nextStatus = food.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const response = await api.put(`/foods/${food.id}/status`);
      if (response.data?.success) {
        toast.success(`Successfully set ${food.name} storefront status to ${nextStatus}.`);
        fetchFoods();
      }
    } catch (err: any) {
      toast.error('Failed to toggle storefront status.');
    }
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodForm.name || !foodForm.restaurantCategoryId) {
      toast.error('Name and Restaurant Category selection are required.');
      return;
    }

    // Validate Step 2 variants
    const validVariants = variants.filter(v => v.name && v.price);
    if (validVariants.length === 0) {
      toast.error('At least one pricing variant (name and price) is required.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', foodForm.name);
      formData.append('description', foodForm.description);
      formData.append('restaurantCategoryId', foodForm.restaurantCategoryId);
      formData.append('status', foodForm.status);
      formData.append('variants', JSON.stringify(validVariants));
      
      // Fallback for default price if needed
      if (validVariants[0]) {
        formData.append('price', validVariants[0].price);
      }

      if (foodImageFile) {
        formData.append('image', foodImageFile);
      }

      if (editingFood) {
        const response = await api.put(`/foods/${editingFood.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data?.success) {
          toast.success('Food item updated successfully!');
          fetchFoods();
          setIsFoodModalOpen(false);
        }
      } else {
        const response = await api.post('/foods', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data?.success) {
          toast.success('Food item added to menu successfully!');
          fetchFoods();
          setIsFoodModalOpen(false);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save food item.');
    }
  };

  const handleDeleteFood = async () => {
    if (!deleteTargetFood) return;
    try {
      const response = await api.delete(`/foods/${deleteTargetFood.id}`);
      if (response.data?.success) {
        toast.success('Food item deleted from menu successfully.');
        fetchFoods();
        setDeleteTargetFood(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete food item.');
    }
  };

  const openAddFood = () => {
    setEditingFood(null);
    setFoodImageFile(null);
    setFoodImagePreview(null);
    setFoodForm({
      name: '',
      description: '',
      restaurantCategoryId: categories[0]?.id ? String(categories[0].id) : '',
      status: 'ACTIVE'
    });
    setVariants([{ name: 'Regular', price: '' }]);
    setActiveStep(1);
    setIsFoodModalOpen(true);
  };

  const openEditFood = (food: any) => {
    setEditingFood(food);
    setFoodImageFile(null);
    setFoodImagePreview(food.image ? getImageUrl(food.image) : null);
    setFoodForm({
      name: food.name || '',
      description: food.description || '',
      restaurantCategoryId: food.restaurantCategoryId ? String(food.restaurantCategoryId) : '',
      status: food.status || 'ACTIVE'
    });
    
    // Set variants list
    if (food.variants && food.variants.length > 0) {
      setVariants(food.variants.map((v: any) => ({ name: v.name, price: String(v.price) })));
    } else {
      setVariants([{ name: 'Regular', price: '' }]);
    }
    setActiveStep(1);
    setIsFoodModalOpen(true);
  };

  const handleAddVariantRow = () => {
    setVariants([...variants, { name: '', price: '' }]);
  };

  const handleRemoveVariantRow = (index: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index: number, field: 'name' | 'price', value: string) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  useEffect(() => {
    fetchFoods();
    fetchCategories();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Store Menu</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage food dishes, descriptions, prices and storefront visibility.</p>
        </div>
        <Button
          size="sm"
          onClick={openAddFood}
          leftIcon={<Plus size={16} />}
          className="font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-xs border-transparent"
        >
          Add Food Item
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-semibold">Loading menu items...</span>
        </div>
      ) : (
        <>
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl w-fit">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => {
              const count = status === 'ALL'
                ? foods.length
                : foods.filter((f: any) => f.status === status).length;
              const isSelected = foodsStatusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setFoodsStatusFilter(status)}
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

          {/* Foods List Table */}
          <Card className="border border-border/40 shadow-xs bg-card">
            <CardContent className="p-0">
              <DataTable
                data={foodsStatusFilter === 'ALL' ? foods : foods.filter((f: any) => f.status === foodsStatusFilter)}
                pagination={false}
                searchable={false}
                toolbar={null}
                columns={[
                  {
                    id: 'dish',
                    label: 'Dish / Item Name',
                    cell: ({ row }: { row: any }) => (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                          {row.image ? (
                            <img src={getImageUrl(row.image)} alt={row.name} className="h-full w-full object-cover" />
                          ) : (
                            <UtensilsCrossed size={14} className="text-muted-foreground" />
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
                    id: 'category',
                    label: 'Category Mapping',
                    cell: ({ row }: { row: any }) => (
                      <Badge variant="soft" color="neutral" className="font-bold text-[9px] uppercase px-2 py-0.5">
                        {row.restaurantCategory?.name || 'Uncategorized'}
                      </Badge>
                    )
                  },
                  {
                    id: 'price',
                    label: 'Pricing & Variants',
                    cell: ({ row }: { row: any }) => (
                      <div className="space-y-1 py-1">
                        {row.variants && row.variants.length > 0 ? (
                          row.variants.map((v: any) => (
                            <div key={v.id} className="text-[11px] leading-tight">
                              <span className="font-semibold text-muted-foreground">{v.name}:</span>{' '}
                              <span className="font-extrabold text-foreground">${Number(v.price).toFixed(2)}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No pricing details</span>
                        )}
                      </div>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleToggleFoodStatus(row)}
                          leftIcon={<Power size={12} />}
                          className={`font-semibold ${
                            row.status === 'ACTIVE'
                              ? 'border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white'
                              : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                          }`}
                        >
                          {row.status === 'ACTIVE' ? 'Hide' : 'Activate'}
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => openEditFood(row)}
                          leftIcon={<Edit size={12} />}
                          className="border-border/60 hover:bg-muted"
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setDeleteTargetFood(row)}
                          leftIcon={<Trash2 size={12} />}
                          className="border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white"
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

      {/* 2-Step Add / Edit Food Modal */}
      {isFoodModalOpen && (
        <Modal open={isFoodModalOpen} onClose={() => setIsFoodModalOpen(false)} size="md">
          <Modal.Header
            title={editingFood ? 'Edit Food Item' : 'Add Food Item'}
            description={
              activeStep === 1 
                ? "Step 1 of 2: Basic Item Details & Store Categories Mapping" 
                : "Step 2 of 2: Configure Pricing Variants & Sizes"
            }
          />
          <form onSubmit={handleSaveFood}>
            <Modal.Content className="space-y-4">
              
              {/* STEP 1: BASIC DETAILS */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  <Input
                    label="Item Name"
                    required
                    placeholder="e.g. Garlic Parmesan Wings"
                    value={foodForm.name}
                    onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                  />

                  {categories.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-600 text-xs">
                      <p className="font-extrabold">No store categories found!</p>
                      <p className="mt-1">
                        Please create at least one category under the <b>Store Categories</b> tab before adding menu dishes.
                      </p>
                    </div>
                  ) : (
                    <Select
                      label="Store Category Mapping"
                      required
                      value={foodForm.restaurantCategoryId}
                      onValueChange={(val) => setFoodForm({ ...foodForm, restaurantCategoryId: val })}
                      options={categories.map(c => ({
                        value: String(c.id),
                        label: c.name
                      }))}
                    />
                  )}

                  <Input
                    label="Description"
                    placeholder="Describe the ingredients and preparation details..."
                    value={foodForm.description}
                    onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                  />

                  <Select
                    label="Status"
                    value={foodForm.status}
                    onValueChange={(val) => setFoodForm({ ...foodForm, status: val })}
                    options={[
                      { value: 'ACTIVE', label: 'Active (Show in Storefront)' },
                      { value: 'INACTIVE', label: 'Hidden (Storefront Draft)' }
                    ]}
                  />

                  {/* Food Image Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground block">
                      Food Item Image
                    </label>
                    <div className="flex items-center gap-4 p-3 bg-muted/20 border border-dashed border-border/60 rounded-2xl">
                      {/* Preview box */}
                      <div className="h-14 w-14 rounded-xl border border-border bg-card flex items-center justify-center overflow-hidden shrink-0">
                        {foodImagePreview ? (
                          <img src={foodImagePreview} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <Upload size={18} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <input
                          type="file"
                          id="store-food-image-file"
                          accept="image/*"
                          onChange={handleFoodFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="store-food-image-file"
                          className="inline-flex items-center justify-center px-3 py-1.5 border border-border bg-card rounded-lg text-xs font-semibold text-foreground hover:bg-muted/10 cursor-pointer transition-colors shadow-xs"
                        >
                          Choose Image File
                        </label>
                        <p className="text-[10px] text-muted-foreground">JPEG, PNG, WEBP formats allowed.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: VARIANTS & PRICING */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground uppercase tracking-wider">Pricing Mappings</span>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      leftIcon={<Plus size={12} />}
                      onClick={handleAddVariantRow}
                      className="border-primary/20 text-primary hover:bg-primary/5"
                    >
                      Add Size / Option Variant
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {variants.map((variant, index) => (
                      <div key={index} className="flex gap-3 items-end bg-muted/10 p-3 rounded-xl border border-border/30">
                        <div className="flex-1">
                          <Input
                            label={`Variant #${index + 1} Name`}
                            required
                            placeholder="e.g. Regular, Small, Large"
                            value={variant.name}
                            onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="w-[120px]">
                          <Input
                            label="Price ($ USD)"
                            required
                            type="number"
                            step="0.01"
                            placeholder="e.g. 9.99"
                            value={variant.price}
                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleRemoveVariantRow(index)}
                          disabled={variants.length <= 1}
                          className="h-[38px] w-[38px] flex items-center justify-center border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white shrink-0 p-0 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-rose-500"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </Modal.Content>
            <Modal.Footer>
              <div className="flex justify-between items-center w-full">
                {/* Step indicators */}
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${activeStep === 1 ? 'bg-primary' : 'bg-muted'}`} />
                  <span className={`h-2 w-2 rounded-full ${activeStep === 2 ? 'bg-primary' : 'bg-muted'}`} />
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setIsFoodModalOpen(false)}>
                    Cancel
                  </Button>

                  {activeStep === 1 ? (
                    <Button 
                      variant="primary" 
                      type="button" 
                      size="sm" 
                      onClick={() => {
                        if (!foodForm.name || !foodForm.restaurantCategoryId) {
                          toast.error('Item name and category mapping are required.');
                          return;
                        }
                        setActiveStep(2);
                      }}
                      className="bg-primary hover:bg-primary/95 text-primary-foreground shadow-xs border-transparent font-semibold"
                      rightIcon={<ArrowRight size={14} />}
                    >
                      Next: Mappings
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        type="button"
                        size="sm"
                        onClick={() => setActiveStep(1)}
                        leftIcon={<ArrowLeft size={14} />}
                      >
                        Back
                      </Button>
                      <Button 
                        variant="primary" 
                        type="submit" 
                        size="sm" 
                        className="bg-primary hover:bg-primary/95 text-primary-foreground shadow-xs border-transparent font-semibold"
                      >
                        {editingFood ? 'Update Item' : 'Add to Menu'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Modal.Footer>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      {deleteTargetFood && (
        <Modal open={!!deleteTargetFood} onClose={() => setDeleteTargetFood(null)} size="sm">
          <Modal.Header
            title="Confirm Deletion"
            description={`Are you absolutely sure you want to permanently delete "${deleteTargetFood.name}"? This action is irreversible.`}
          />
          <Modal.Footer>
            <div className="flex gap-2 justify-end w-full">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTargetFood(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteFood}
                className="bg-rose-500 hover:bg-rose-600 text-white shadow-xs border-transparent"
              >
                Delete Item
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
