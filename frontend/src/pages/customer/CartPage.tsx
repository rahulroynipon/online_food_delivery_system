import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerStore, CartItem } from '../../store/useCustomerStore';
import CustomerLayout from '../../components/CustomerLayout';
import FoodCustomizerModal from '../../components/FoodCustomizerModal';
import { Button, toast } from '../../design-system';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Trash2,
  Pencil,
  ArrowLeft,
  MapPin,
  Store,
  ChevronRight,
  PackageOpen,
  ChevronDown,
  Compass,
} from 'lucide-react';
import api from '../../lib/axios';

type SelectedVariant = { id: number; name: string; price: number; quantity: number };
type SelectedAddon   = { id: number; name: string; price: number; quantity: number };

export default function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { cart, removeFromCart, addToCart, clearCart, selectedZone, setCartScope, selectedAddress, setSelectedAddress } = useCustomerStore();

  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [isAddrDropdownOpen, setIsAddrDropdownOpen] = useState(false);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [restaurantZones, setRestaurantZones] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Distance calculator (Haversine formula in KM)
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fetched full menu foods indexed by foodId
  const [menuFoods, setMenuFoods] = useState<Record<number, any>>({});
  const [menuLoading, setMenuLoading] = useState(false);

  // Fetch platform fee settings (tax, base fee, per km fee)
  useEffect(() => {
    api.get('/settings/platform')
      .then((res) => {
        if (res.data?.success && res.data.settings) {
          setSettings(res.data.settings);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch platform settings on cart:', err);
      });
  }, []);

  // Modal state
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [modalFood, setModalFood]           = useState<any>(null);
  const [editingIdx, setEditingIdx]         = useState<number | null>(null);
  const [initVariants, setInitVariants]     = useState<SelectedVariant[] | undefined>(undefined);
  const [initAddons,   setInitAddons]       = useState<SelectedAddon[]   | undefined>(undefined);

  const restaurantName = cart.length > 0 ? cart[0].restaurantName : null;
  const restaurantSlug = cart.length > 0 ? cart[0].restaurantSlug : null;
  const restaurantId   = cart.length > 0 ? cart[0].restaurantId   : null;

  // Fetch restaurant menu so we have full food+variants+addons data
  useEffect(() => {
    const fetchMenu = async () => {
      let slug = restaurantSlug;
      
      // Fallback: if slug is missing but we have restaurantId, fetch all restaurants to find the slug
      if (!slug && restaurantId) {
        try {
          const res = await api.get('/public/restaurants');
          if (res.data?.success) {
            const list = res.data.restaurants || [];
            const matched = list.find((r: any) => r.id === restaurantId);
            if (matched) {
              slug = matched.slug;
              setRestaurant(matched);
            }
          }
        } catch (err) {
          console.error('Failed to fetch restaurant list for slug fallback:', err);
        }
      }

      if (!slug) return;

      setMenuLoading(true);
      try {
        const res = await api.get(`/public/restaurants/${slug}`);
        if (res.data?.success) {
          const foods: Record<number, any> = {};
          (res.data.categories || []).forEach((cat: any) => {
            (cat.foods || []).forEach((food: any) => { foods[food.id] = food; });
          });
          setMenuFoods(foods);
          if (res.data.restaurant) {
            setRestaurant(res.data.restaurant);
            setRestaurantZones(res.data.restaurant.deliveryZones || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch restaurant menu:', err);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenu();
  }, [restaurantSlug, restaurantId]);

  // Fetch customer saved addresses
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'CUSTOMER') {
      api.get('/user-addresses')
        .then((res) => {
          if (res.data?.success) {
            const list = res.data.addresses || [];
            setUserAddresses(list);
            
            // Set active address (keep manually selected address if it still exists in the fetched list)
            if (list.length > 0) {
              const stillExists = list.find((a: any) => selectedAddress && a.id === selectedAddress.id);
              if (!stillExists) {
                const defAddr = list.find((a: any) => a.isDefault) || list[0];
                setSelectedAddress(defAddr || null);
              }
            } else {
              setSelectedAddress(null);
            }
          }
        });
    }
  }, [isAuthenticated, user]);

  // Sync cart scope in CartPage if address is changed
  useEffect(() => {
    if (selectedAddress) {
      setCartScope(`address_${selectedAddress.id}`);
    }
  }, [selectedAddress]);

  const handleAddressChange = (addr: any) => {
    setSelectedAddress(addr);
    setIsAddrDropdownOpen(false);
    toast.success(`Active delivery address set to "${addr.label}"`);
  };

  // Verify coordinates coverage
  const isAddressCovered = React.useMemo(() => {
    if (!selectedAddress || restaurantZones.length === 0) return true; // fallback to true during loading
    const lat = Number(selectedAddress.latitude);
    const lng = Number(selectedAddress.longitude);
    
    for (const zone of restaurantZones) {
      const zoneLat = Number(zone.latitude || 0);
      const zoneLng = Number(zone.longitude || 0);
      const zoneRadius = Number(zone.radiusKm || 0);
      
      const dist = getDistanceKm(lat, lng, zoneLat, zoneLng);
      if (dist <= zoneRadius) {
        return true;
      }
    }
    return false;
  }, [selectedAddress, restaurantZones]);

  const getItemImage = (image?: string) => {
    if (!image) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
    if (image.startsWith('http') || image.startsWith('/')) return image;
    const cleanPath = image.startsWith('uploads/') ? image.substring(8) : image;
    return `${api.defaults.baseURL}/uploads/${cleanPath}`;
  };

  /** Open modal pre-filled with the cart item's current selections */
  const handleEdit = (idx: number) => {
    const cartItem = cart[idx];
    const food = menuFoods[cartItem.foodId];
    if (!food) {
      toast.error('Food details not loaded yet, please wait a moment.');
      return;
    }

    // Build pre-selected state from the existing cart row
    const preVariants: SelectedVariant[] = cartItem.variant
      ? [{ id: cartItem.variant.id, name: cartItem.variant.name, price: cartItem.variant.price, quantity: cartItem.quantity }]
      : [];

    const preAddons: SelectedAddon[] = cartItem.addons.map(a => ({
      id: a.id, name: a.name, price: a.price, quantity: a.quantity,
    }));

    setEditingIdx(idx);
    setModalFood(food);
    setInitVariants(preVariants);
    setInitAddons(preAddons);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalFood(null);
    setEditingIdx(null);
    setInitVariants(undefined);
    setInitAddons(undefined);
  };

  /** On "Add to Basket" from the modal — always edit in-place (replace old row) */
  const handleModalSave = (item: CartItem) => {
    if (editingIdx !== null) {
      removeFromCart(editingIdx);
      addToCart(item);
      toast.success(`${item.foodName} updated!`);
    } else {
      addToCart(item);
      toast.success(`${item.foodName} added to cart!`);
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  let distance = 0;
  const baseFee = Number(settings?.riderBaseFee || 30.00);
  let deliveryFee = cart.length > 0 ? baseFee : 0;

  if (cart.length > 0 && selectedAddress && restaurant) {
    distance = getDistanceKm(
      Number(selectedAddress.latitude),
      Number(selectedAddress.longitude),
      Number(restaurant.latitude || 0),
      Number(restaurant.longitude || 0)
    );
    const costPerKm = Number(settings?.riderFeePerKm || 15.00);
    const calculatedDistanceFee = costPerKm * distance;
    deliveryFee = Math.max(baseFee, calculatedDistanceFee);
  }

  const taxRate = Number(settings?.taxRate ?? 5.00);
  const tax = cart.length > 0 ? subtotal * (taxRate / 100) : 0;
  const total = subtotal + deliveryFee + tax;

  return (
    <CustomerLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors select-none cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </button>

        <h1 className="text-2xl font-black text-foreground tracking-tight">Your Cart</h1>

        {cart.length === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4 rounded-3xl border border-border/30 bg-card/40">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <PackageOpen className="h-10 w-10 text-primary/60" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Your cart is empty</h2>
              <p className="text-sm text-muted-foreground mt-1 font-medium max-w-xs mx-auto">
                Browse restaurants and add delicious items to your order.
              </p>
            </div>
            <Link to="/restaurants">
              <Button variant="primary" size="sm" className="mt-2 px-6 font-bold">
                Browse Restaurants
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── Cart Items ── */}
            <div className="flex-1 space-y-3">
              {/* Restaurant badge */}
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-card border border-border/40">
                <div className="flex items-center gap-2.5 text-xs font-bold text-foreground">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Store className="h-4 w-4 text-primary" />
                  </div>
                  <span>{restaurantName}</span>
                </div>
                <Link
                  to={restaurantSlug ? `/restaurant/${restaurantSlug}` : '/restaurants'}
                  className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5"
                >
                  View Menu <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Items list */}
              <div className="rounded-3xl border border-border/40 bg-card/60 overflow-hidden divide-y divide-border/10">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 items-center group hover:bg-card transition-colors">
                    {/* Image */}
                    <div className="h-16 w-16 rounded-xl overflow-hidden border border-border/10 shrink-0">
                      <img
                        src={getItemImage(item.image)}
                        alt={item.foodName}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-xs font-extrabold text-foreground truncate">{item.foodName}</p>
                      {item.variant && (
                        <p className="text-[10px] text-muted-foreground font-medium">
                          Size: <span className="text-foreground/80">{item.variant.name}</span>
                          {item.quantity > 1 && <span className="ml-1.5 font-black text-foreground">×{item.quantity}</span>}
                        </p>
                      )}
                      {item.addons.length > 0 && (
                        <p className="text-[10px] text-muted-foreground font-medium truncate">
                          + {item.addons.map(a => `${a.quantity}× ${a.name}`).join(', ')}
                        </p>
                      )}
                      <p className="text-xs font-black text-foreground pt-0.5">
                        ৳{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Edit — opens modal pre-filled */}
                      <button
                        onClick={() => handleEdit(idx)}
                        disabled={menuLoading}
                        className="h-7 w-7 rounded-lg border border-border/40 bg-muted/30 hover:border-primary/50 hover:bg-primary/5 hover:text-primary text-muted-foreground flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Edit item"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="h-7 w-7 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-muted-foreground/50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear cart */}
              <div className="flex justify-end">
                <button
                  onClick={clearCart}
                  className="text-[11px] font-bold text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer select-none"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Cart
                </button>
              </div>
            </div>

            {/* ── Order Summary ── */}
            <div className="w-full lg:w-72 shrink-0 rounded-3xl border border-border/40 bg-card/70 p-5 space-y-4 sticky top-24">
              <h2 className="text-sm font-extrabold text-foreground border-b border-border/10 pb-3">Order Summary</h2>

              {/* Delivery Address Scoped Selector */}
              {isAuthenticated && user && user.role === 'CUSTOMER' ? (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Select Delivery Location</span>
                  {userAddresses.length === 0 ? (
                    <div className="text-center p-3 rounded-2xl border border-dashed border-border/80 bg-background/50 space-y-2">
                      <p className="text-[10px] text-muted-foreground">No saved delivery addresses found.</p>
                      <Link to="/?add-address=true" className="inline-block text-[10px] text-primary font-bold hover:underline">
                        + Configure Address
                      </Link>
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsAddrDropdownOpen(!isAddrDropdownOpen)}
                        className="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl border border-border/60 bg-background hover:bg-muted/40 text-xs font-bold text-foreground transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{selectedAddress ? selectedAddress.label : 'Choose Address'}</span>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </button>
                      
                      {isAddrDropdownOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-1.5 max-h-48 overflow-y-auto rounded-2xl border border-border bg-card shadow-lg p-1.5 z-50 animate-fade-in">
                          {userAddresses.map((addr) => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => handleAddressChange(addr)}
                              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-muted/50 transition-colors flex items-center justify-between gap-1.5 ${
                                selectedAddress?.id === addr.id ? 'text-primary bg-primary/5' : 'text-foreground/80'
                              }`}
                            >
                              <div className="truncate pr-1.5">
                                <p className="font-extrabold text-[10px]">{addr.label}</p>
                                <p className="text-[9px] text-muted-foreground truncate">{addr.address}</p>
                              </div>
                              {selectedAddress?.id === addr.id && <span className="h-1 w-1 rounded-full bg-primary shrink-0" />}
                            </button>
                          ))}
                          <div className="border-t border-border/40 my-1" />
                          <Link
                            to="/?add-address=true"
                            className="block text-center py-1.5 text-[9px] font-bold text-primary hover:bg-primary/5 transition-colors rounded-lg"
                          >
                            + Add Address
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedAddress && (
                    <div className="text-[10px] text-muted-foreground bg-muted/40 rounded-xl px-3 py-2 leading-relaxed">
                      <p className="font-bold text-foreground/90">{selectedAddress.label}</p>
                      <p className="truncate mt-0.5">{selectedAddress.address}</p>
                    </div>
                  )}

                  {/* Coverage Status badge */}
                  {selectedAddress && (
                    <div className="pt-0.5">
                      {isAddressCovered ? (
                        <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Served by this restaurant.</span>
                        </div>
                      ) : (
                        <div className="text-[9px] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-rose-500 animate-pulse" />
                          <span>Outside restaurant service range.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Guest zone fallback display */
                selectedZone && (
                  <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground bg-muted/30 rounded-xl px-3 py-2">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Delivering to <span className="font-bold text-foreground">{selectedZone.name}</span></span>
                  </div>
                )
              )}

              {/* Price breakdown */}
              <div className="space-y-2 text-xs font-medium text-muted-foreground select-none">
                <div className="flex justify-between">
                  <span>Subtotal ({cart.reduce((a, c) => a + c.quantity, 0)} items)</span>
                  <span className="font-bold text-foreground">৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span>Delivery Fee</span>
                    {distance > 0 && (
                      <span className="text-[9px] text-muted-foreground block">
                        Dist: {distance.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-foreground">৳{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT / Tax ({taxRate}%)</span>
                  <span className="font-bold text-foreground">৳{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border/10 pt-2 text-sm font-black text-foreground">
                  <span>Total</span>
                  <span className="text-primary font-black">৳{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full font-bold py-3 text-sm"
                disabled={
                  (isAuthenticated && user?.role === 'CUSTOMER' && (userAddresses.length === 0 || !isAddressCovered))
                }
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </Button>

              <p className="text-[10px] text-muted-foreground text-center font-medium">
                You can only order from one restaurant at a time.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Customizer Modal — pre-filled with current cart item state */}
      {restaurantId && (
        <FoodCustomizerModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          food={modalFood}
          restaurantId={restaurantId}
          restaurantName={restaurantName || ''}
          restaurantSlug={restaurantSlug || undefined}
          initialVariants={initVariants}
          initialAddons={initAddons}
          onAddToCart={handleModalSave}
        />
      )}
    </CustomerLayout>
  );
}
