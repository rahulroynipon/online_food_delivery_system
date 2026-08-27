import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '../design-system';
import { CartItem } from '../store/useCustomerStore';
import api from '../lib/axios';

interface FoodCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: any;
  restaurantId: number;
  restaurantName: string;
  onAddToCart: (item: CartItem) => void;
}

export default function FoodCustomizerModal({
  isOpen,
  onClose,
  food,
  restaurantId,
  restaurantName,
  onAddToCart
}: FoodCustomizerModalProps) {
  if (!isOpen || !food) return null;

  const variants = food.variants || [];
  const addons = food.addons || [];

  // Default to the first variant if available
  const [selectedVariant, setSelectedVariant] = useState<any>(variants[0] || null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Reset local state when food changes
  useEffect(() => {
    setSelectedVariant(variants[0] || null);
    setSelectedAddons([]);
    setQuantity(1);
  }, [food]);

  const handleAddonToggle = (addon: any) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const incrementQty = () => setQuantity((q) => q + 1);
  const decrementQty = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  // Compute live price
  const variantPrice = selectedVariant ? parseFloat(String(selectedVariant.price || 0)) : 0;
  const addonsPrice = selectedAddons.reduce((acc, curr) => acc + parseFloat(String(curr.price || 0)), 0);
  const unitPrice = variantPrice + addonsPrice;
  const totalPrice = unitPrice * quantity;

  const handleAddToBasket = () => {
    const cartItem: CartItem = {
      restaurantId,
      restaurantName,
      foodId: food.id,
      foodName: food.name,
      image: food.image,
      basePrice: parseFloat(String(food.variants?.[0]?.price || 0)),
      price: unitPrice,
      quantity,
      variant: selectedVariant ? {
        id: selectedVariant.id,
        name: selectedVariant.name,
        price: variantPrice
      } : null,
      addons: selectedAddons.map((a) => ({
        id: a.id,
        name: a.name,
        price: parseFloat(String(a.price || 0))
      }))
    };

    onAddToCart(cartItem);
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

          {/* 1. Size / Variation Group */}
          {variants.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-foreground tracking-wide uppercase">Select Size</span>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">Required</span>
              </div>
              <div className="space-y-2">
                {variants.map((v: any) => (
                  <label
                    key={v.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      selectedVariant?.id === v.id
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border/40 hover:border-border/80 bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="food-variant"
                        checked={selectedVariant?.id === v.id}
                        onChange={() => setSelectedVariant(v)}
                        className="text-primary focus:ring-primary/20 accent-primary"
                      />
                      <span className="text-xs font-bold">{v.name}</span>
                    </div>
                    <span className="text-xs font-black text-foreground">৳{Number(v.price).toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 2. Add-ons Checklist */}
          {addons.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-foreground tracking-wide uppercase">Select Add-ons</span>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md uppercase tracking-wider">Optional</span>
              </div>
              <div className="space-y-2">
                {addons.map((addon: any) => {
                  const isChecked = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <label
                      key={addon.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border/40 hover:border-border/80 bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleAddonToggle(addon)}
                          className="rounded border-border/40 text-primary focus:ring-primary/20 accent-primary"
                        />
                        <span className="text-xs font-bold">{addon.name}</span>
                      </div>
                      <span className="text-xs font-black text-foreground">+৳{Number(addon.price).toFixed(2)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Price accumulator & Stepper) */}
        <div className="p-4 border-t border-border/10 bg-card flex items-center justify-between gap-4">
          {/* Stepper Quantity Counter */}
          <div className="flex items-center border border-border/60 rounded-xl overflow-hidden shadow-2xs shrink-0 select-none">
            <button
              onClick={decrementQty}
              className="h-9 w-9 bg-card hover:bg-muted text-foreground/80 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="px-4 text-xs font-black text-foreground min-w-[36px] text-center">
              {quantity}
            </span>
            <button
              onClick={incrementQty}
              className="h-9 w-9 bg-card hover:bg-muted text-foreground/80 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Add to Basket button */}
          <Button
            onClick={handleAddToBasket}
            variant="primary"
            className="flex-1 h-9 font-bold text-xs shadow-md"
            leftIcon={<ShoppingBag className="h-4 w-4" />}
          >
            Add to Basket &bull; ৳{totalPrice.toFixed(2)}
          </Button>
        </div>

      </div>
    </div>
  );
}
