import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCustomerStore, Zone } from '../../store/useCustomerStore';
import api from '../../lib/axios';
import { 
  Search, 
  MapPin, 
  Star, 
  Utensils, 
  SlidersHorizontal,
  Clock,
  ThumbsUp,
  Sliders
} from 'lucide-react';
import { Button, Card, Input } from '../../design-system';
import CustomerLayout from '../../components/CustomerLayout';

interface PlatformCategory {
  id: number;
  name: string;
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

export default function RestaurantsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedZone, setSelectedZone } = useCustomerStore();

  const [categories, setCategories] = useState<PlatformCategory[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allZones, setAllZones] = useState<Zone[]>([]);
  
  // Local Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [sortByRating, setSortByRating] = useState(false);
  
  const [loading, setLoading] = useState(true);

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

  // Sync URL search queries to state
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || '');
  }, [searchParams]);

  // Fetch initial setup data (categories & zones)
  useEffect(() => {
    const loadSetupData = async () => {
      try {
        const [catRes, zoneRes] = await Promise.all([
          api.get('/platform-categories'),
          api.get('/delivery-zones')
        ]);
        if (catRes.data?.success) {
          setCategories(catRes.data.platformCategories || []);
        }
        if (zoneRes.data?.success) {
          setAllZones((zoneRes.data.deliveryZones || []).filter((z: any) => z.status === 'ACTIVE'));
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    loadSetupData();
  }, []);

  // Fetch filtered restaurant list
  useEffect(() => {
    const fetchFilteredRestaurants = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (selectedZone) params.zone = selectedZone.id;
        if (searchQuery.trim()) params.search = searchQuery;
        if (selectedCategory) params.category = selectedCategory;

        const res = await api.get('/public/restaurants', { params });
        if (res.data?.success) {
          let list = res.data.restaurants || [];
          
          // Client-side Open/Closed filter
          if (showOpenOnly) {
            list = list.filter((r: Restaurant) => r.isOpen);
          }

          // Client-side Sorting by Rating
          if (sortByRating) {
            list.sort((a: Restaurant, b: Restaurant) => {
              const ratA = parseFloat(String(a.rating || '4.5'));
              const ratB = parseFloat(String(b.rating || '4.5'));
              return ratB - ratA;
            });
          }

          setRestaurants(list);
        }
      } catch (err) {
        console.error('Failed to query restaurants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredRestaurants();
  }, [selectedZone, searchQuery, selectedCategory, showOpenOnly, sortByRating]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const newParams = new URLSearchParams(searchParams);
    if (categoryId) {
      newParams.set('category', categoryId);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    const newParams = new URLSearchParams(searchParams);
    if (query.trim()) {
      newParams.set('search', query);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Title bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/10 pb-4">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Browse Restaurants
            </h1>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">
              {restaurants.length} active matching kitchens delivering to you
            </p>
          </div>

          {/* Quick Search bar */}
          <div className="w-full md:max-w-xs relative">
            <Input
              placeholder="Search restaurant names..."
              value={searchQuery}
              onChange={handleSearchChange}
              leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
              className="w-full h-9 text-xs"
            />
          </div>
        </div>

        {/* Categories horizontal list pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => handleCategorySelect('')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0 cursor-pointer ${
              !selectedCategory 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-card/45 hover:bg-card border-border/40 text-foreground/80'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(String(cat.id))}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                selectedCategory === String(cat.id)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card/45 hover:bg-card border-border/40 text-foreground/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Filter Widget Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-border/40 bg-card/65 shadow-2xs select-none">
          <div className="flex flex-wrap items-center gap-3">
            {/* Delivery Zone dropdown filter */}
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Deliver To:</span>
              <select
                value={selectedZone?.id || ''}
                onChange={(e) => {
                  const zone = allZones.find(z => String(z.id) === e.target.value);
                  setSelectedZone(zone || null);
                }}
                className="bg-background border border-border/40 rounded-lg px-2 py-1 outline-none text-foreground font-bold cursor-pointer"
              >
                {allZones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>

            <div className="h-4 w-[1px] bg-border/20" />

            {/* Toggle open only */}
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground/80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOpenOnly}
                onChange={(e) => setShowOpenOnly(e.target.checked)}
                className="rounded border-border/40 text-primary focus:ring-primary/20 accent-primary"
              />
              <span>Open Restaurants Only</span>
            </label>
          </div>

          {/* Sort trigger widget */}
          <button
            onClick={() => setSortByRating(!sortByRating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              sortByRating 
                ? 'bg-primary/10 text-primary border-primary/20' 
                : 'bg-background hover:bg-muted border-border/40 text-foreground/80'
            }`}
          >
            <Star className="h-3.5 w-3.5" />
            <span>Sort by Rating</span>
          </button>
        </div>

        {/* Grid List view */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-48 rounded-2xl bg-card/45 border border-border/20 animate-pulse" />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <Card className="p-12 text-center bg-card/30 border border-border/30 max-w-md mx-auto">
            <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-4">
              <Utensils className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No matching restaurants found</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
              We couldn't find any approved kitchens matching your active query in this delivery zone. Try clearing your search filters.
            </p>
            {(searchQuery || selectedCategory || showOpenOnly) && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4 font-bold"
                onClick={() => {
                  setSearchParams({});
                  setShowOpenOnly(false);
                  setSortByRating(false);
                }}
              >
                Reset Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {restaurants.map((res) => (
              <Link key={res.id} to={`/restaurant/${res.slug}`} className="group">
                <Card className="overflow-hidden border border-border/40 hover:border-primary/30 bg-card/65 group-hover:bg-card transition-all duration-300 shadow-2xs group-hover:shadow-xs rounded-2xl relative h-full flex flex-col justify-between">
                  
                  {/* Banner */}
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
                    
                    {/* Status badge */}
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
      </div>
    </CustomerLayout>
  );
}
