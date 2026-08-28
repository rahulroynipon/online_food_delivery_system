import { create } from 'zustand';

export interface CartItem {
  restaurantId: number;
  restaurantName: string;
  restaurantSlug?: string;
  foodId: number;
  foodName: string;
  image?: string;
  basePrice: number;
  price: number; // calculated total price per unit (base + variant + addons)
  quantity: number;
  variant: {
    id: number;
    name: string;
    price: number;
  } | null;
  addons: {
    id: number;
    name: string;
    price: number;
    quantity: number;
  }[];
}

export interface Zone {
  id: number;
  name: string;
  latitude?: string | number;
  longitude?: string | number;
  radiusKm?: string | number;
}

interface CustomerState {
  selectedZone: Zone | null;
  selectedAddress: any | null;
  activeScopeKey: string; // e.g. "guest" or "address_12" or "zone_2"
  cart: CartItem[];
  cartsByScope: Record<string, CartItem[]>;
  setSelectedZone: (zone: Zone | null) => void;
  setSelectedAddress: (address: any | null) => void;
  setCartScope: (scopeKey: string) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, delta: number) => void;
  clearCart: () => void;
}

export const useCustomerStore = create<CustomerState>((set) => {
  // Load initial values from localStorage
  const savedZone = localStorage.getItem('selected_delivery_zone');
  const savedAddress = localStorage.getItem('selected_delivery_address');
  const savedCartsByScope = localStorage.getItem('customer_carts_by_scope');
  const savedScopeKey = localStorage.getItem('customer_cart_scope_key') || 'guest';

  const cartsByScope = savedCartsByScope ? JSON.parse(savedCartsByScope) : {};
  const activeScopeKey = savedScopeKey;
  const cart = cartsByScope[activeScopeKey] || [];

  return {
    selectedZone: savedZone ? JSON.parse(savedZone) : null,
    selectedAddress: savedAddress ? JSON.parse(savedAddress) : null,
    activeScopeKey,
    cart,
    cartsByScope,

    setSelectedZone: (zone) => {
      if (zone) {
        localStorage.setItem('selected_delivery_zone', JSON.stringify(zone));
      } else {
        localStorage.removeItem('selected_delivery_zone');
      }
      set({ selectedZone: zone });
    },

    setSelectedAddress: (address) => {
      if (address) {
        localStorage.setItem('selected_delivery_address', JSON.stringify(address));
      } else {
        localStorage.removeItem('selected_delivery_address');
      }
      set({ selectedAddress: address });
    },

    setCartScope: (scopeKey) => {
      localStorage.setItem('customer_cart_scope_key', scopeKey);
      set((state) => {
        const targetCart = state.cartsByScope[scopeKey] || [];
        return {
          activeScopeKey: scopeKey,
          cart: targetCart,
        };
      });
    },

    addToCart: (item) => {
      set((state) => {
        // If adding item from a different restaurant, clear the cart first (standard food delivery rule)
        const isDifferentRestaurant = state.cart.length > 0 && state.cart[0].restaurantId !== item.restaurantId;
        const currentCart = isDifferentRestaurant ? [] : [...state.cart];

        // Check if the exact same item already exists in the cart (same food, variant, and addons)
        const existingItemIndex = currentCart.findIndex((cartItem) => {
          if (cartItem.foodId !== item.foodId) return false;
          
          // Compare variants
          if (cartItem.variant?.id !== item.variant?.id) return false;

          // Compare addons
          if (cartItem.addons.length !== item.addons.length) return false;
          const sortedAddons1 = [...cartItem.addons].sort((a, b) => a.id - b.id);
          const sortedAddons2 = [...item.addons].sort((a, b) => a.id - b.id);
          return sortedAddons1.every((addon1, idx) => {
            const addon2 = sortedAddons2[idx];
            return addon1.id === addon2.id && addon1.quantity === addon2.quantity;
          });
        });

        if (existingItemIndex > -1) {
          // Increment quantity
          currentCart[existingItemIndex].quantity += item.quantity;
        } else {
          // Add new item
          currentCart.push(item);
        }

        const updatedCarts = {
          ...state.cartsByScope,
          [state.activeScopeKey]: currentCart
        };
        localStorage.setItem('customer_carts_by_scope', JSON.stringify(updatedCarts));
        return { 
          cart: currentCart,
          cartsByScope: updatedCarts
        };
      });
    },

    removeFromCart: (index) => {
      set((state) => {
        const currentCart = state.cart.filter((_, idx) => idx !== index);
        const updatedCarts = {
          ...state.cartsByScope,
          [state.activeScopeKey]: currentCart
        };
        localStorage.setItem('customer_carts_by_scope', JSON.stringify(updatedCarts));
        return { 
          cart: currentCart,
          cartsByScope: updatedCarts
        };
      });
    },

    updateQuantity: (index, delta) => {
      set((state) => {
        const currentCart = [...state.cart];
        const item = currentCart[index];
        if (!item) return {};
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
          // Remove the item if quantity drops to 0
          currentCart.splice(index, 1);
        } else {
          currentCart[index] = { ...item, quantity: newQty };
        }
        
        const updatedCarts = {
          ...state.cartsByScope,
          [state.activeScopeKey]: currentCart
        };
        localStorage.setItem('customer_carts_by_scope', JSON.stringify(updatedCarts));
        return { 
          cart: currentCart,
          cartsByScope: updatedCarts
        };
      });
    },

    clearCart: () => {
      set((state) => {
        const updatedCarts = {
          ...state.cartsByScope,
          [state.activeScopeKey]: []
        };
        localStorage.setItem('customer_carts_by_scope', JSON.stringify(updatedCarts));
        return {
          cart: [],
          cartsByScope: updatedCarts
        };
      });
    },
  };
});
