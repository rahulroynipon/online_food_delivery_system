import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomerStore } from '../../store/useCustomerStore';
import api from '../../lib/axios';
import { 
  Search, 
  MapPin, 
  Star, 
  Utensils, 
  ArrowRight,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button, Card, Input } from '../../design-system';
import CustomerLayout from '../../components/CustomerLayout';

interface PlatformCategory {
  id: number;
  name: string;
  slug: string;
  image?: string;
}

interface Restaurant {
  id: number;
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  isOpen: boolean;
  rating?: number | string;
  openingTime?: string;
  closingTime?: string;
  logo?: string;
  banner?: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { selectedZone } = useCustomerStore();

  const [categories, setCategories] = useState<PlatformCategory[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Carousel ref and scroll handlers
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '';
    const [hourStr, minStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minStr} ${ampm}`;
  };

  const getLogoUrl = (logoPath?: string | null) => {
    if (!logoPath) return '';
    if (logoPath.startsWith('http') || logoPath.startsWith('/')) {
      return logoPath;
    }
    const cleanPath = logoPath.startsWith('uploads/') ? logoPath.substring(8) : logoPath;
    return `${api.defaults.baseURL}/uploads/${cleanPath}`;
  };

  const getBannerUrl = (bannerPath?: string | null) => {
    if (!bannerPath) return '';
    if (bannerPath.startsWith('http') || bannerPath.startsWith('/')) {
      return bannerPath;
    }
    const cleanPath = bannerPath.startsWith('uploads/') ? bannerPath.substring(8) : bannerPath;
    return `${api.defaults.baseURL}/uploads/${cleanPath}`;
  };

  // Fetch Platform Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/platform-categories');
        if (res.data?.success) {
          setCategories(res.data.platformCategories || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch local restaurants matching selected zone
  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!selectedZone) return;
      setLoading(true);
      try {
        const res = await api.get('/public/restaurants', {
          params: { zone: selectedZone.id }
        });
        if (res.data?.success) {
          setRestaurants(res.data.restaurants || []);
        }
      } catch (err) {
        console.error('Failed to load restaurants:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [selectedZone]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/restaurants?search=${encodeURIComponent(searchQuery)}`);
  };

  const getCategoryImage = (cat: PlatformCategory) => {
    if (cat.image) {
      if (cat.image.startsWith('http') || cat.image.startsWith('/')) {
        return cat.image;
      }
      const cleanPath = cat.image.startsWith('uploads/') ? cat.image.substring(8) : cat.image;
      return `${api.defaults.baseURL}/uploads/${cleanPath}`;
    }
    // Fallback default placeholder
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80';
  };

  return (
    <CustomerLayout>
      <div className="space-y-12">
        {/* HERO Section */}
        <section className="relative rounded-3xl overflow-hidden bg-radial from-card/65 via-card/45 to-background border border-border/40 py-16 px-6 md:px-12 text-center flex flex-col items-center justify-center min-h-[360px] shadow-sm select-none">
          {/* Subtle decoration elements */}
          <div className="absolute top-8 left-10 text-primary/10 animate-bounce duration-3000">
            <Utensils className="h-10 w-10 rotate-12" />
          </div>
          <div className="absolute bottom-8 right-12 text-primary/10 animate-bounce duration-5000">
            <Sparkles className="h-8 w-8" />
          </div>

          <div className="max-w-2xl space-y-4">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-foreground">
              Craving something <span className="text-primary">delicious</span>?
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-medium">
              Discover the best local cuisines and restaurants delivered right to your university doorstep.
            </p>
          </div>

          {/* Search Form Box */}
          <form onSubmit={handleSearchSubmit} className="w-full max-w-lg mt-8 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Search food or restaurant names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
                className="w-full h-11"
              />
            </div>
            <Button type="submit" variant="primary" className="h-11 px-6 text-sm font-bold shadow-md">
              Find Food
            </Button>
          </form>
        </section>

        {/* Categories Section */}
        {categories.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold tracking-tight text-foreground">Categories</h2>
              <Link to="/restaurants" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Horizontal Carousel scroll categories list */}
            <div className="relative group/carousel px-1">
              {/* Left Arrow Button */}
              <button
                onClick={scrollLeft}
                className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card/90 border border-border/60 text-foreground shadow-md hover:bg-muted hover:border-primary/40 flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 duration-200 cursor-pointer focus:outline-none select-none"
                type="button"
                aria-label="Scroll Left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Right Arrow Button */}
              <button
                onClick={scrollRight}
                className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-card/90 border border-border/60 text-foreground shadow-md hover:bg-muted hover:border-primary/40 flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 duration-200 cursor-pointer focus:outline-none select-none"
                type="button"
                aria-label="Scroll Right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Scrollable Row */}
              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scroll-smooth pb-3 px-1 scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/restaurants?category=${cat.id}`}
                    className="w-[128px] shrink-0 group flex flex-col items-center p-3 rounded-2xl border border-border/30 bg-card/45 hover:bg-card hover:border-primary/30 shadow-2xs hover:shadow-xs transition-all duration-200"
                  >
                    <div className="h-14 w-14 rounded-xl overflow-hidden mb-2.5 relative border border-border/20">
                      <img
                        src={getCategoryImage(cat)}
                        alt={cat.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors text-center truncate w-full">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Local Restaurants Section */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border/10 pb-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-1.5">
                Popular Restaurants
                {selectedZone && (
                  <span className="text-xs font-medium text-muted-foreground">
                    in {selectedZone.name}
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Top rated eateries serving your location.
              </p>
            </div>
            
            <Link to="/restaurants">
              <Button variant="outline" size="sm" className="text-xs font-bold shadow-2xs">
                Browse All Restaurants
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-48 rounded-2xl bg-card/45 border border-border/20 animate-pulse" />
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <Card className="p-8 text-center bg-card/30 border border-border/30">
              <div className="h-10 w-10 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No restaurants found in this area</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto font-medium">
                Try switching your delivery zone in the navigation header to browse other areas.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {restaurants.map((res) => (
                <Link key={res.id} to={`/restaurant/${res.slug}`} className="group">
                  <Card className="overflow-hidden border border-border/40 hover:border-primary/30 bg-card/65 group-hover:bg-card transition-all duration-300 shadow-2xs group-hover:shadow-xs rounded-2xl relative h-full flex flex-col justify-between">
                    
                    {/* Header Banner Background */}
                    <div className="h-32 bg-card relative border-b border-border/10 flex items-center justify-center overflow-hidden">
                      {res.banner ? (
                        <img
                          src={getBannerUrl(res.banner)}
                          alt={`${res.name} banner`}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent flex items-center justify-center">
                          <Utensils className="h-8 w-8 text-primary/10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                        </div>
                      )}
                      
                      {/* Active Status Pill */}
                      <span className={`absolute top-2 right-2 text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-md shadow-2xs border z-10 ${
                        res.isOpen 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                      }`}>
                        {res.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>

                    {/* Logo Avatar Overlap Container */}
                    <div className="relative px-4 select-none h-6">
                      <div className="absolute -top-6 left-4 h-12 w-12 rounded-xl border-2 border-card bg-card overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                        {res.logo ? (
                          <img
                            src={getLogoUrl(res.logo)}
                            alt={res.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {res.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <h3 className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors truncate">
                            {res.name}
                          </h3>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-[11px] font-bold text-foreground">
                              {res.rating ? Number(res.rating).toFixed(1) : '4.5'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-normal">
                          {res.description || 'Tasty cuisines, fast delivery, and premium quality meals.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border/10 text-[10px] text-muted-foreground font-semibold">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>
                          {res.openingTime && res.closingTime 
                            ? `Hours: ${formatTime(res.openingTime)} - ${formatTime(res.closingTime)}`
                            : 'Open 24 Hours'}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </CustomerLayout>
  );
}
