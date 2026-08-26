import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, Button, Select, Input, Checkbox, toast } from '../../design-system';
import { ArrowLeft, Plus, Trash2, Loader2, Upload, ImageIcon, Save } from 'lucide-react';
import api from '../../lib/axios';

export default function FoodFormPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const isEditMode = !!slug;

  const [categories, setCategories] = useState<any[]>([]);
  const [addonsList, setAddonsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [restaurantCategoryId, setRestaurantCategoryId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [foodImageFile, setFoodImageFile] = useState<File | null>(null);
  const [foodImagePreview, setFoodImagePreview] = useState<string | null>(null);
  
  // Variants and Addons selections
  const [variants, setVariants] = useState<{
    name: string;
    price: string;
    image?: string;
    imageFile?: File | null;
    imagePreview?: string | null;
  }[]>([
    { name: 'Regular', price: '', image: '', imageFile: null, imagePreview: null }
  ]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);
  const [originalFoodId, setOriginalFoodId] = useState<number | null>(null);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const base = api.defaults.baseURL || 'http://localhost:5005/api/v1';
    return `${base}/${imagePath}`;
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/restaurant-categories');
      if (response.data?.success) {
        setCategories(response.data.categories || []);
        if (response.data.categories?.length > 0 && !isEditMode) {
          setRestaurantCategoryId(String(response.data.categories[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to fetch restaurant categories:', err);
    }
  };

  const fetchAddons = async () => {
    try {
      const response = await api.get('/addons');
      if (response.data?.success) {
        setAddonsList(response.data.addons || []);
      }
    } catch (err) {
      console.error('Failed to fetch restaurant addons:', err);
    }
  };

  const fetchFoodDetails = async () => {
    if (!slug) return;
    setFetchingDetails(true);
    try {
      const response = await api.get(`/foods/details/${slug}`);
      if (response.data?.success && response.data.food) {
        const f = response.data.food;
        setOriginalFoodId(f.id);
        setName(f.name || '');
        setDescription(f.description || '');
        setRestaurantCategoryId(f.restaurantCategoryId ? String(f.restaurantCategoryId) : '');
        setStatus(f.status || 'ACTIVE');
        setFoodImagePreview(f.image ? getImageUrl(f.image) : null);
        
        // Populate variants with image attributes
        if (f.variants && f.variants.length > 0) {
          setVariants(f.variants.map((v: any) => ({
            name: v.name,
            price: String(v.price),
            image: v.image || '',
            imageFile: null,
            imagePreview: v.image ? getImageUrl(v.image) : null
          })));
        } else {
          setVariants([{ name: 'Regular', price: '', image: '', imageFile: null, imagePreview: null }]);
        }

        // Populate selected addons
        if (f.addons && f.addons.length > 0) {
          setSelectedAddonIds(f.addons.map((a: any) => a.id));
        }
      }
    } catch {
      toast.error('Could not retrieve food item details.');
      navigate('/restaurant/menu');
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleFoodFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFoodImageFile(file);
      setFoodImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddVariantRow = () => {
    setVariants([...variants, { name: '', price: '', image: '', imageFile: null, imagePreview: null }]);
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

  const handleAddonToggle = (addonId: number) => {
    if (selectedAddonIds.includes(addonId)) {
      setSelectedAddonIds(selectedAddonIds.filter(id => id !== addonId));
    } else {
      setSelectedAddonIds([...selectedAddonIds, addonId]);
    }
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !restaurantCategoryId) {
      toast.error('Item Name and Category Mapping are required.');
      return;
    }

    // Validate active status variants constraint
    const validVariants = variants.filter(v => v.name && v.price);
    if (status === 'ACTIVE' && validVariants.length === 0) {
      toast.error('At least one pricing variant is required to set storefront status as ACTIVE.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('restaurantCategoryId', restaurantCategoryId);
      formData.append('status', status);
      formData.append('addonIds', JSON.stringify(selectedAddonIds));

      // Append binary files and build JSON data list
      const serializedVariants = validVariants.map((v, idx) => {
        if (v.imageFile) {
          formData.append(`variant_image_${idx}`, v.imageFile);
        }
        return {
          name: v.name,
          price: v.price,
          image: v.image || null,
        };
      });
      formData.append('variants', JSON.stringify(serializedVariants));
      
      // Default base price mapping fallback
      if (validVariants[0]) {
        formData.append('price', validVariants[0].price);
      }

      if (foodImageFile) {
        formData.append('image', foodImageFile);
      }

      let response;
      if (isEditMode && originalFoodId) {
        response = await api.put(`/foods/${originalFoodId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post('/foods', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.data?.success) {
        toast.success(isEditMode ? 'Food item updated successfully!' : 'Food item created successfully!');
        navigate('/restaurant/menu');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save food item details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchCategories();
      await fetchAddons();
      if (isEditMode) {
        await fetchFoodDetails();
      }
    };
    init();
  }, [slug]);

  if (fetchingDetails) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-semibold">Retrieving food details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/restaurant/menu')}
          leftIcon={<ArrowLeft size={16} />}
          className="border-border/60 hover:bg-muted"
        >
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">
            {isEditMode ? 'Edit Food Item' : 'Create Food Item'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure storefront item details, sizes, variants, pricing, and addon customizations.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveFood} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Basic info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-border/40 shadow-xs bg-card">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider border-b border-border/10 pb-2">
                Basic Food Info
              </h3>

              <Input
                label="Food Item Name"
                required
                placeholder="e.g. Buffalo Chicken Burger"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                  value={restaurantCategoryId}
                  onValueChange={(val) => setRestaurantCategoryId(val)}
                  options={categories.map(c => ({
                    value: String(c.id),
                    label: c.name
                  }))}
                />
              )}

              <Input
                label="Description"
                placeholder="Describe the ingredients, preparation details, and flavors..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <Select
                label="Storefront Visibility"
                value={status}
                onValueChange={(val) => setStatus(val)}
                options={[
                  { value: 'ACTIVE', label: 'Active (Visible in storefront)' },
                  { value: 'INACTIVE', label: 'Hidden (Save as Draft / Inactive)' }
                ]}
              />

              {/* Food Image upload dropzone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  Food Item Image
                </label>
                <div className="flex items-center gap-4 p-4 bg-muted/20 border border-dashed border-border/60 rounded-2xl">
                  <div className="h-16 w-16 rounded-xl border border-border bg-card flex items-center justify-center overflow-hidden shrink-0">
                    {foodImagePreview ? (
                      <img src={foodImagePreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <Upload size={20} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      id="food-form-image-file"
                      accept="image/*"
                      onChange={handleFoodFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="food-form-image-file"
                      className="inline-flex items-center justify-center px-3.5 py-1.5 border border-border bg-card rounded-lg text-xs font-semibold text-foreground hover:bg-muted/10 cursor-pointer transition-colors shadow-xs"
                    >
                      Choose Image File
                    </label>
                    <p className="text-[10px] text-muted-foreground">JPEG, PNG, WEBP formats allowed.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Variants config */}
          <Card className="border border-border/40 shadow-xs bg-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/10 pb-2">
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                  Pricing & Variants
                </h3>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  leftIcon={<Plus size={12} />}
                  onClick={handleAddVariantRow}
                  className="border-primary/20 text-primary hover:bg-primary/5"
                >
                  Add Size / Option
                </Button>
              </div>

              {status === 'ACTIVE' && (
                <p className="text-[11px] text-amber-600 leading-normal bg-amber-500/5 p-2 border border-amber-500/10 rounded-lg italic">
                  Note: A storefront status of ACTIVE requires at least one variant with a price to be configured.
                </p>
              )}

              <div className="space-y-3">
                {variants.map((variant, index) => (
                  <div key={index} className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-muted/10 p-3.5 rounded-2xl border border-border/30 animate-fade-in">
                    <div className="flex-1 min-w-[150px]">
                      <Input
                        label={`Variant #${index + 1} Name`}
                        required
                        placeholder="e.g. Regular, Small, Double Cheese"
                        value={variant.name}
                        onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="w-[120px]">
                      <Input
                        label="Price (৳ Taka)"
                        required
                        type="number"
                        step="0.01"
                        placeholder="e.g. 250"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                      />
                    </div>

                    {/* Variant Image File Select */}
                    <div className="flex flex-col gap-2 shrink-0 pb-1">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Image</span>
                      <div className="flex items-center gap-2">
                        <div className="h-[38px] w-[38px] rounded-xl border border-border bg-card flex items-center justify-center overflow-hidden shrink-0">
                          {variant.imagePreview ? (
                            <img src={variant.imagePreview} alt="Variant" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon size={14} className="text-muted-foreground" />
                          )}
                        </div>
                        <input
                          type="file"
                          id={`variant-image-file-${index}`}
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const updated = [...variants];
                              updated[index].imageFile = file;
                              updated[index].imagePreview = URL.createObjectURL(file);
                              setVariants(updated);
                            }
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor={`variant-image-file-${index}`}
                          className="h-[38px] inline-flex items-center justify-center px-3 border border-border bg-card rounded-xl text-xs font-semibold text-foreground hover:bg-muted/10 cursor-pointer transition-colors shadow-xs"
                        >
                          Upload
                        </label>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRemoveVariantRow(index)}
                      disabled={variants.length <= 1}
                      className="h-[38px] w-[38px] flex items-center justify-center border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white shrink-0 p-0 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-rose-500 mb-1"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Add-ons selection & save panel */}
        <div className="space-y-6">
          <Card className="border border-border/40 shadow-xs bg-card">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider border-b border-border/10 pb-2">
                Menu Add-on Extras
              </h3>

              {addonsList.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground space-y-2">
                  <p className="text-[11px] font-semibold">No addons configured yet.</p>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => navigate('/restaurant/addons')}
                  >
                    Go to Add-ons Tab
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  <p className="text-[10px] text-muted-foreground leading-normal mb-2">
                    Select customizable extra options that customers can add to this dish:
                  </p>
                  {addonsList.map((addon) => {
                    const isChecked = selectedAddonIds.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => handleAddonToggle(addon.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                          isChecked
                            ? 'border-primary/40 bg-primary/5 shadow-xs'
                            : 'border-border/50 hover:bg-muted/10 bg-card'
                        }`}
                      >
                        <div className="pointer-events-none shrink-0">
                          <Checkbox
                            checked={isChecked}
                            ignoreGroup
                          />
                        </div>
                        
                        {/* Addon Image Preview */}
                        <div className="h-9 w-9 rounded-lg border border-border/80 bg-card flex items-center justify-center overflow-hidden shrink-0">
                          {addon.image ? (
                            <img src={getImageUrl(addon.image)} alt={addon.name} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon size={12} className="text-muted-foreground" />
                          )}
                        </div>

                        {/* Addon Details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-[11px] text-foreground truncate">{addon.name}</p>
                          {addon.description && (
                            <p className="text-[9px] text-muted-foreground truncate italic mt-0.5 leading-none">{addon.description}</p>
                          )}
                        </div>

                        {/* Addon Price tag */}
                        <span className="text-[11px] font-black text-primary shrink-0 pr-1">
                          +৳{Number(addon.price).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions Card */}
          <Card className="border border-border/40 shadow-xs bg-card p-2">
            <CardContent className="p-4 space-y-3">
              <Button
                variant="primary"
                type="submit"
                size="sm"
                disabled={loading}
                leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={14} />}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground shadow-xs border-transparent font-bold py-2.5 rounded-xl"
              >
                {loading ? 'Saving Changes...' : isEditMode ? 'Update Food Item' : 'Create Food Item'}
              </Button>
              <Button
                variant="outline"
                type="button"
                size="sm"
                onClick={() => navigate('/restaurant/menu')}
                className="w-full border-border/60 hover:bg-muted py-2"
              >
                Cancel & Exit
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
