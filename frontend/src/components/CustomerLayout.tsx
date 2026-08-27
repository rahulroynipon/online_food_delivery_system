import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCustomerStore, Zone } from '../store/useCustomerStore';
import api from '../lib/axios';
import { 
  UtensilsCrossed, 
  MapPin, 
  ShoppingCart, 
  User as UserIcon, 
  LogOut, 
  ChevronDown, 
  LogIn, 
  UserPlus,
  Trash2,
  X
} from 'lucide-react';
import { Button, Card, toast } from '../design-system';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { selectedZone, setSelectedZone, cart, removeFromCart, clearCart } = useCustomerStore();
  
  const [zones, setZones] = useState<Zone[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false);

  // Fetch available zones for selector dropdown
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await api.get('/delivery-zones');
        if (response.data?.success) {
          const activeZones = (response.data.deliveryZones || []).filter(
            (z: any) => z.status === 'ACTIVE'
          );
          setZones(activeZones);
          
          // Auto-select first zone if none selected yet
          if (!selectedZone && activeZones.length > 0) {
            setSelectedZone(activeZones[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load delivery zones:', err);
      }
    };
    fetchZones();
  }, [selectedZone, setSelectedZone]);

  const handleZoneSelect = (zone: Zone) => {
    setSelectedZone(zone);
    setIsDropdownOpen(false);
    toast.success(`Delivery zone switched to ${zone.name}`);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const totalCartItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalCartCost = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Translucent Glassmorphism Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 text-primary font-black text-xl tracking-tight select-none">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <span>Bite<span className="text-foreground">Speed</span></span>
          </Link>

          {/* Location / Zone Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 hover:border-primary/50 bg-card/45 hover:bg-card/90 transition-all text-xs font-semibold text-foreground/80 shadow-2xs cursor-pointer select-none"
            >
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>{selectedZone ? selectedZone.name : 'Select Zone'}</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 rounded-xl border border-border/50 bg-card shadow-lg py-1 z-50 animate-fade-in">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-3 py-1.5 border-b border-border/10 select-none">
                  Select Delivery Area
                </p>
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => handleZoneSelect(zone)}
                    className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-muted/50 transition-colors flex items-center justify-between ${
                      selectedZone?.id === zone.id ? 'text-primary bg-primary/5' : 'text-foreground/80'
                    }`}
                  >
                    <span>{zone.name}</span>
                    {selectedZone?.id === zone.id && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <div className="relative">
              <button
                onClick={() => setIsCartPreviewOpen(!isCartPreviewOpen)}
                className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors relative cursor-pointer"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground font-bold text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center shadow-xs animate-scale-in">
                    {totalCartItems}
                  </span>
                )}
              </button>

              {/* Quick Cart Preview Dropdown */}
              {isCartPreviewOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border/50 bg-card shadow-xl p-4 z-50 animate-fade-in max-h-[420px] flex flex-col">
                  <div className="flex items-center justify-between border-b border-border/10 pb-2 mb-3">
                    <h4 className="text-sm font-bold text-foreground">Shopping Cart</h4>
                    <button 
                      onClick={() => setIsCartPreviewOpen(false)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {cart.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-xs text-muted-foreground font-medium">Your cart is empty.</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                        {cart.map((item, idx) => (
                          <div key={idx} className="flex gap-2 justify-between items-start text-xs border-b border-border/5 pb-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-foreground truncate">{item.foodName}</p>
                              {item.variant && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                                  Size: {item.variant.name}
                                </p>
                              )}
                              {item.addons.length > 0 && (
                                <p className="text-[10px] text-muted-foreground truncate font-medium">
                                  + {item.addons.map((a) => a.name).join(', ')}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {item.quantity} x ৳{(item.price).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="font-bold text-foreground">
                                ৳{(item.price * item.quantity).toFixed(2)}
                              </span>
                              <button
                                onClick={() => removeFromCart(idx)}
                                className="text-muted-foreground hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-border/10 pt-3 mt-3">
                        <div className="flex justify-between items-center text-xs font-bold mb-3">
                          <span className="text-muted-foreground">Total Cost:</span>
                          <span className="text-base text-foreground">৳{totalCartCost.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={clearCart}
                            variant="outline" 
                            size="sm" 
                            className="w-full text-[10px] font-bold"
                          >
                            Clear
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="w-full text-[10px] font-bold"
                            onClick={() => {
                              setIsCartPreviewOpen(false);
                              toast.info('Checkout features will be implemented in Phase 2.');
                            }}
                          >
                            Checkout
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Auth Button Controls */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground/80 max-w-[100px] truncate hidden md:inline">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="h-9 w-9 rounded-full bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button size="sm" variant="ghost" className="h-8 text-xs font-semibold px-3" leftIcon={<LogIn className="h-3.5 w-3.5" />}>
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" variant="primary" className="h-8 text-xs font-semibold px-3" leftIcon={<UserPlus className="h-3.5 w-3.5" />}>
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 animate-fade-in">
        {children}
      </main>

      {/* Simple Premium Footer */}
      <footer className="border-t border-border/20 bg-card/25 py-6 text-center text-xs text-muted-foreground font-medium select-none">
        <p>&copy; {new Date().getFullYear()} BiteSpeed Inc. University Food Delivery System Demonstration.</p>
      </footer>
    </div>
  );
}
