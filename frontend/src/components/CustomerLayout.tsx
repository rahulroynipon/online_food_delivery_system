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
  UserPlus
} from 'lucide-react';
import { Button, toast } from '../design-system';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { selectedZone, setSelectedZone, cart } = useCustomerStore();
  
  const [zones, setZones] = useState<Zone[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch available zones for selector dropdown
  useEffect(() => {
    api.get('/delivery-zones')
      .then((res) => {
        if (res.data?.success) {
          const activeZones = (res.data.deliveryZones || []).filter(
            (z: any) => z.status === 'ACTIVE'
          );
          setZones(activeZones);
          
          // Auto-select first zone if none selected yet
          if (!selectedZone && activeZones.length > 0) {
            setSelectedZone(activeZones[0]);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch zones:', err);
      });
  }, [selectedZone, setSelectedZone]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleZoneSelect = (zone: Zone) => {
    setSelectedZone(zone);
    setIsDropdownOpen(false);
    toast.success(`Delivery zone switched to ${zone.name}`);
  };

  const totalCartItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md select-none">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2 font-black text-xl tracking-tight shrink-0">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-primary to-rose-500 bg-clip-text text-transparent">
              BiteSpeed
            </span>
          </Link>

          {/* Delivery Zone Selector Dropdown */}
          <div className="relative mx-4 flex-1 max-w-[240px]">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl border border-border/50 bg-card hover:bg-muted/40 text-xs font-bold text-foreground transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">
                  {selectedZone ? `Deliver to: ${selectedZone.name}` : 'Select Delivery Zone'}
                </span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 max-h-56 overflow-y-auto rounded-2xl border border-border/50 bg-card shadow-lg p-1.5 z-50 animate-fade-in">
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
            <Link
              to="/cart"
              className="relative h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
              title="View Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground font-bold text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center shadow-xs animate-scale-in">
                  {totalCartItems}
                </span>
              )}
            </Link>

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

      {/* Rich Premium Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-400 pt-16 pb-12 w-full mt-auto select-none">
        <div className="max-w-7xl mx-auto px-4 space-y-12">
          
          {/* Top Row: Logo brand & Social media */}
          <div className="flex flex-col sm:flex-row justify-between items-center pb-8 border-b border-slate-900 gap-6">
            <div className="flex items-center gap-2.5 tracking-tight">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-black text-white">
                BiteSpeed <span className="bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent text-sm font-semibold tracking-normal ml-1">Campus Delivery</span>
              </span>
            </div>
            
            {/* Social Links / Developer Portfolios */}
            <div className="flex items-center gap-3">
              <a 
                href="https://github.com/rahulroynipon/online_food_delivery_system" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="h-9 w-9 rounded-xl border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900/50 transition-all"
                title="GitHub Repository"
              >
                <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
              </a>
              <a 
                href="#" 
                className="h-9 w-9 rounded-xl border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900/50 transition-all"
                title="Developer Portfolio"
              >
                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z"/><path d="M6 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z"/><path d="M9 6h6"/><path d="M9 12h6"/><path d="M9 18h6"/></svg>
              </a>
            </div>
          </div>

          {/* Bottom Grid: Info, Navigation, System Architecture, & Contributor detail */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-xs leading-relaxed">
            
            {/* Column 1: System Purpose & Core Concepts */}
            <div className="space-y-4">
              <span className="font-bold text-white tracking-wider uppercase text-[10px]">Project Scope</span>
              <p className="text-slate-400/80 font-normal leading-relaxed">
                A multi-role campus logistics platform providing coordinate-bounded food delivery for university campuses.
              </p>
              <div className="text-[10px] text-slate-500 font-normal space-y-1">
                <p>• Haversine formula zone validation</p>
                <p>• Role-based authentication controls</p>
              </div>
            </div>

            {/* Column 2: Architecture Stack */}
            <div className="space-y-3.5">
              <span className="font-bold text-white tracking-wider uppercase text-[10px]">Platform Stack</span>
              <div className="flex flex-col gap-2 font-normal text-slate-400/85">
                <div>
                  <p className="font-semibold text-slate-300">Frontend</p>
                  <p className="text-[11px] text-slate-500">React, TypeScript, TailwindCSS, Zustand</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-300">Backend</p>
                  <p className="text-[11px] text-slate-500">Node.js, Express, Sequelize ORM</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-300">Database</p>
                  <p className="text-[11px] text-slate-500">PostgreSQL Relational Storage</p>
                </div>
              </div>
            </div>

            {/* Column 3: Site Modules Navigation */}
            <div className="space-y-3.5 flex flex-col">
              <span className="font-bold text-white tracking-wider uppercase text-[10px]">System Portals</span>
              <Link to="/admin" className="hover:text-primary transition-colors">Administrator Console</Link>
              <Link to="/restaurant" className="hover:text-primary transition-colors">Restaurant Merchant Panel</Link>
              <Link to="/partner" className="hover:text-primary transition-colors">Become a Delivery Partner</Link>
              <Link to="/restaurants" className="hover:text-primary transition-colors">Customer Browse Hub</Link>
              <Link to="/cart" className="hover:text-primary transition-colors">Active Orders Cart</Link>
            </div>

            {/* Column 4: Credits and Developer details */}
            <div className="space-y-3.5">
              <span className="font-bold text-white tracking-wider uppercase text-[10px]">Development Team</span>
              <div className="space-y-2.5 font-normal">
                <p className="text-slate-300 select-all font-semibold">
                  Developer: <span className="text-white font-bold">Rahul Roy</span>
                </p>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Developed as a comprehensive project demonstrating secure web application architectures.
                </p>
                <div className="pt-2 border-t border-slate-900 mt-2 text-[10px] text-slate-600">
                  <p>&copy; {new Date().getFullYear()} BiteSpeed Campus.</p>
                  <p>All system architectures implemented.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}
