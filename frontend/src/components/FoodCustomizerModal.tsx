import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button, Checkbox, toast } from '../design-system';
import { CartItem } from '../store/useCustomerStore';
import api from '../lib/axios';

type SelectedVariant = { id: number; name: string; price: number; quantity: number };
type SelectedAddon  = { id: number; name: string; price: number; quantity: number };

interface FoodCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: any;
  restaurantId: number;
  restaurantName: string;
  restaurantSlug?: string;
  /** Pre-selected variant (for Edit mode) */
  initialVariants?: SelectedVariant[];
  /** Pre-selected addons (for Edit mode) */
  initialAddons?: SelectedAddon[];
  onAddToCart: (item: CartItem) => void;
}

export default function FoodCustomizerModal({
  isOpen,
  onClose,
  food,
  restaurantId,
  restaurantName,
  restaurantSlug,
  initialVariants,
  initialAddons,
  onAddToCart
}: FoodCustomizerModalProps) {
  if (!isOpen || !food) return null;

  const variants = food.variants || [];
  const addons = food.addons || [];

  // Default starting variant: use initialVariants if provided (edit mode), else first variant at qty 1
  const buildDefaultVariants = (): SelectedVariant[] => {
    if (initialVariants && initialVariants.length > 0) return initialVariants;
    return variants[0] ? [{
      id: variants[0].id,
      name: variants[0].name,
      price: parseFloat(String(variants[0].price || 0)),
      quantity: 1
    }] : [];
  };

  const buildDefaultAddons = (): SelectedAddon[] => {
    if (initialAddons && initialAddons.length > 0) return initialAddons;
    return [];
  };

  const [selectedVariants, setSelectedVariants] = useState<SelectedVariant[]>(buildDefaultVariants);
  const [selectedAddons,   setSelectedAddons]   = useState<SelectedAddon[]>(buildDefaultAddons);

  // Re-initialise whenever the food item or initial values change (new edit target)
  useEffect(() => {
    setSelectedVariants(buildDefaultVariants());
    setSelectedAddons(buildDefaultAddons());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [food, initialVariants, initialAddons]);

  const handleVariantToggle = (variant: any) => {
    // Exclusive select: set selection to exactly this variant
    setSelectedVariants([{
      id: variant.id,
      name: variant.name,
      price: parseFloat(String(variant.price || 0)),
      quantity: 1
    }]);
  };

  const handleVariantQuantityChange = (variantId: number, change: number) => {
    setSelectedVariants((prev) => {
      return prev.map((item) => {
        if (item.id === variantId) {
          const nextQty = Math.max(1, item.quantity + change);
          return { ...item, quantity: nextQty };
        }
        return item;
      });
    });
  };

  const handleAddonToggle = (addon: any) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        return [...prev, {
          id: addon.id,
          name: addon.name,
          price: parseFloat(String(addon.price || 0)),
          quantity: 1
        }];
      }
    });
  };

  const handleAddonQuantityChange = (addonId: number, change: number) => {
    setSelectedAddons((prev) => {
      return prev.map((a) => {
        if (a.id === addonId) {
          const nextQty = a.quantity + change;
          return nextQty > 0 ? { ...a, quantity: nextQty } : null;
        }
        return a;
      }).filter(Boolean) as any[];
    });
  };

  // Compute live price (sum of each variant price + selected addons cost) multiplied by its quantity
  const addonsUnitCost = selectedAddons.reduce((sum, a) => sum + a.price * a.quantity, 0);
  const totalPrice = selectedVariants.reduce((acc, sv) => {
    return acc + (sv.price + addonsUnitCost) * sv.quantity;
  }, 0);

  const handleAddToBasket = () => {
    if (selectedVariants.length === 0) {
      toast.error('Please select at least one variant.');
      return;
    }

    // Call onAddToCart for each selected variant to add them as separate cart item rows
    selectedVariants.forEach((selectedV) => {
      const cartItem: CartItem = {
        restaurantId,
        restaurantName,
        restaurantSlug,
        foodId: food.id,
        foodName: food.name,
        image: food.image,
        basePrice: parseFloat(String(food.variants?.[0]?.price || 0)),
        price: selectedV.price + addonsUnitCost, // UNIT price = variant base price + selected addons cost
        quantity: selectedV.quantity,
        variant: {
          id: selectedV.id,
          name: selectedV.name,
          price: selectedV.price
        },
        addons: selectedAddons.map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
          quantity: a.quantity
        }))
      };
      onAddToCart(cartItem);
    });

    onClose();
  };

  const getFoodImage = () => {
    if (food.image) {
      if (food.image.startsWith('http') || food.image.startsWith('/')) {
        return food.image;
      }
      const cleanPath = food.image.startsWith('uploads/') ? food.image.substring(8) : food.image;
      return `${api.defaults.baseURL}/uploads/${cleanPath}`;
    }
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80';
  };

  const getVariantImageUrl = (imagePath?: string | null) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http') || imagePath.startsWith('/')) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith('uploads/') ? imagePath.substring(8) : imagePath;
    return `${api.defaults.baseURL}/uploads/${cleanPath}`;
  };

  const getAddonImageUrl = (imagePath?: string | null) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http') || imagePath.startsWith('/')) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith('uploads/') ? imagePath.substring(8) : imagePath;
    return `${api.defaults.baseURL}/uploads/${cleanPath}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-border/50 bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Title & Close */}
        <div className="p-4 border-b border-border/10 flex justify-between items-center bg-card">
          <h3 className="text-sm font-extrabold text-foreground truncate">Customize Item</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Scrollable Customization Options */}
        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {/* Food Details Header Card */}
          <div className="flex gap-4 items-start">
            <img
              src={getFoodImage()}
              alt={food.name}
              className="h-20 w-20 rounded-xl object-cover border border-border/20"
            />
            <div className="min-w-0">
              <h4 className="text-base font-black text-foreground">{food.name}</h4>
              <p className="text-xs text-muted-foreground leading-normal mt-1">
                {food.description || 'Delectable, authentic recipe prepared by our head chef.'}
              </p>
            </div>
          </div>

          {/* 1. Variants Selection (Checkboxes + Steppers) */}
          {variants.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-foreground tracking-wide uppercase">Variants</span>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">Required</span>
              </div>
              <div className="space-y-4">
                {variants.map((v: any) => {
                  const isChecked = selectedVariants.some((sv) => sv.id === v.id);
                  const currentQty = selectedVariants.find((sv) => sv.id === v.id)?.quantity || 0;

                  return (
                    <div 
                      key={v.id} 
                      onClick={() => handleVariantToggle(v)}
                      className={`p-3 rounded-2xl border transition-all flex flex-col gap-3 cursor-pointer ${
                        isChecked
                          ? 'border-primary/45 bg-primary/5 text-foreground shadow-2xs'
                          : 'border-border/40 hover:border-border/80 bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {/* Variant Main row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0 select-none">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleVariantToggle(v)}
                              size='sm'
                              className="w-auto shrink-0"
                            />
                          </div>
                          
                          {v.image && (
                            <img
                              src={getVariantImageUrl(v.image)}
                              alt={v.name}
                              className="h-10 w-10 rounded-lg object-cover border border-border/25 shrink-0"
                            />
                          )}
                          
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold block text-foreground">{v.name}</span>
                            {v.description && (
                              <span className="text-[10px] text-muted-foreground block leading-tight mt-0.5 font-medium">
                                {v.description}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                          {isChecked && (
                            <div className="flex items-center gap-0.5 border border-border/40 rounded-xl overflow-hidden bg-background">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleVariantQuantityChange(v.id, -1);
                                }}
                                className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer select-none"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="px-2 min-w-[24px] text-center text-[11px] font-black text-foreground">
                                {currentQty}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleVariantQuantityChange(v.id, 1);
                                }}
                                className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer select-none"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          
                          <span className="text-xs font-black text-foreground">
                            ৳{(Number(v.price) * (currentQty || 1)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Add-ons Selection (Flat List) */}
          {addons.length > 0 && (
            <div className="space-y-3.5 mt-6 border-t border-border/10 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-foreground tracking-wide uppercase">Add-ons</span>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md uppercase tracking-wider">Optional</span>
              </div>
              <div className="space-y-2">
                {addons.map((addon: any) => {
                  const isAddonChecked = selectedAddons.some((a) => a.id === addon.id);
                  const addonQty = selectedAddons.find((a) => a.id === addon.id)?.quantity || 1;
                  return (
                    <div
                      key={addon.id}
                      onClick={() => handleAddonToggle(addon)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-xs cursor-pointer ${
                        isAddonChecked
                          ? 'border-primary/25 bg-primary/5 text-foreground'
                          : 'border-border/20 bg-background/35 text-muted-foreground hover:border-border/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0 select-none">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isAddonChecked}
                            onCheckedChange={() => handleAddonToggle(addon)}
                            size="sm"
                            className="w-auto shrink-0"
                          />
                        </div>
                        {addon.image && (
                          <img
                            src={getAddonImageUrl(addon.image)}
                            alt={addon.name}
                            className="h-10 w-10 rounded-lg object-cover border border-border/15 shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-bold block leading-tight text-foreground">{addon.name}</span>
                          {addon.description && (
                            <span className="text-[9px] text-muted-foreground block leading-normal font-medium mt-0.5">
                              {addon.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                        {isAddonChecked && (
                          <div className="flex items-center gap-0.5 border border-border/40 rounded-xl overflow-hidden bg-background">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddonQuantityChange(addon.id, -1);
                              }}
                              className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer select-none"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 min-w-[24px] text-center text-[11px] font-black text-foreground">
                              {addonQty}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddonQuantityChange(addon.id, 1);
                              }}
                              className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer select-none"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] font-extrabold text-foreground">
                          +৳{(Number(addon.price) * addonQty).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Price accumulator) */}
        <div className="p-4 border-t border-border/10 bg-card flex items-center justify-between gap-4">
          {/* Add to Basket button */}
          <Button
            onClick={handleAddToBasket}
            variant="primary"
            className="w-full h-10 font-bold text-sm shadow-md"
            leftIcon={<ShoppingBag className="h-4.5 w-4.5" />}
          >
            Add to Basket &bull; ৳{totalPrice.toFixed(2)}
          </Button>
        </div>

      </div>
    </div>
  );
}
