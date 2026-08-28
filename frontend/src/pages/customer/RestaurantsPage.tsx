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
  Sliders,
  Plus
} from 'lucide-react';
import { Button, Card, Input, toast } from '../../design-system';
import CustomerLayout from '../../components/CustomerLayout';
import FoodCustomizerModal from '../../components/FoodCustomizerModal';

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
  const { selectedZone, setSelectedZone, addToCart } = useCustomerStore();

  const [categories, setCategories] = useState<PlatformCategory[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [foods, setFoods] = useState<any[]>([]);
  const [allZones, setAllZones] = useState<Zone[]>([]);
  
  // Set default view to DISHES if URL filters (search or category) are present
  const [activeTab, setActiveTab] = useState<'RESTAURANTS' | 'DISHES'>(
    searchParams.get('category') || searchParams.get('search') ? 'DISHES' : 'RESTAURANTS'
  );

  // Customizer modal state
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  
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

  // Fetch filtered restaurant list and dishes list in parallel
  useEffect(() => {
    const fetchFilteredData = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (selectedZone) params.zone = selectedZone.id;
        if (searchQuery.trim()) params.search = searchQuery;
        if (selectedCategory) params.category = selectedCategory;

        // Fetch both collections in parallel
        const [restaurantsRes, foodsRes] = await Promise.all([
          api.get('/public/restaurants', { params }),
          api.get('/public/restaurants/foods/search', { params })
        ]);

        // Process Restaurants response
        if (restaurantsRes.data?.success) {
          let list = restaurantsRes.data.restaurants || [];
          
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

        // Process Foods response
        if (foodsRes.data?.success) {
          let list = foodsRes.data.foods || [];

          // Client-side filter for open restaurants
          if (showOpenOnly) {
            list = list.filter((f: any) => f.restaurant?.isOpen);
          }

          setFoods(list);
        }
      } catch (err) {
        console.error('Failed to query catalog:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredData();
  }, [selectedZone, searchQuery, selectedCategory, showOpenOnly, sortByRating]);

  const handleOpenCustomizer = (food: any) => {
    if (!food.restaurant?.isOpen) {
      toast.error('This restaurant is currently closed. You cannot add items to the cart.');
      return;
    }
    setSelectedFood(food);
    setIsCustomizerOpen(true);
  };

  const handleAddToCart = (item: any) => {
    addToCart(item);
    toast.success(`Added ${item.foodName} (${item.quantity}x) to cart!`);
  };

  const getFoodPriceLabel = (food: any) => {
    if (!food.variants || food.variants.length === 0) return '৳0.00';
    const prices = food.variants.map((v: any) => parseFloat(String(v.price || 0)));
    const minPrice = Math.min(...prices);
    if (food.variants.length > 1) {
      return `From ৳${minPrice.toFixed(2)}`;
    }
    return `৳${minPrice.toFixed(2)}`;
  };

  const getFoodImage = (food: any) => {
    if (food.image) {
      if (food.image.startsWith('http') || food.image.startsWith('/')) {
        return food.image;
      }
      const cleanPath = food.image.startsWith('uploads/') ? food.image.substring(8) : food.image;
      return `${api.defaults.baseURL}/uploads/${cleanPath}`;
    }
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80';
  };

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

        {/* Tab Selector */}
        <div className="flex gap-2 border-b border-border/10 pb-2.5">
          <button
            onClick={() => setActiveTab('RESTAURANTS')}
            className={`px-4 py-2 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'RESTAURANTS' 
                ? 'text-primary font-extrabold' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Restaurants ({restaurants.length})
            {activeTab === 'RESTAURANTS' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-fade-in" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('DISHES')}
            className={`px-4 py-2 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'DISHES' 
                ? 'text-primary font-extrabold' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dishes ({foods.length})
            {activeTab === 'DISHES' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-fade-in" />
            )}
          </button>
        </div>

        {/* Grid List view */}
        {activeTab === 'RESTAURANTS' ? (
          loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
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
          )
        ) : (
          loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-44 rounded-2xl bg-card/45 border border-border/20 animate-pulse" />
              ))}
            </div>
          ) : foods.length === 0 ? (
            <Card className="p-12 text-center bg-card/30 border border-border/30 max-w-md mx-auto">
              <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-4">
                <Utensils className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No matching dishes found</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
                We couldn't find any food items matching your active query in this delivery zone.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {foods.map((food) => (
                <Card 
                  key={food.id}
                  className="overflow-hidden border border-border/40 hover:border-primary/35 bg-card/65 hover:bg-card transition-all duration-300 shadow-2xs hover:shadow-xs rounded-2xl flex flex-col justify-between"
                >
                  <div className="h-32 overflow-hidden border-b border-border/10 relative select-none">
                    <img
                      src={getFoodImage(food)}
                      alt={food.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] font-extrabold text-foreground bg-card/90 px-2 py-0.5 rounded-md border border-border/20">
                      {food.restaurant?.name}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-foreground truncate">
                        {food.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {food.description || 'Delicious freshly made authentic recipe.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/10">
                      <span className="text-xs font-black text-foreground">
                        {getFoodPriceLabel(food)}
                      </span>
                      
                      <Button
                        size="xs"
                        variant="primary"
                        className="h-7 w-7 rounded-lg p-0 flex items-center justify-center font-bold"
                        onClick={() => handleOpenCustomizer(food)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </div>

      {selectedFood && (
        <FoodCustomizerModal
          isOpen={isCustomizerOpen}
          onClose={() => setIsCustomizerOpen(false)}
          food={selectedFood}
          restaurantId={selectedFood.restaurant?.id || 0}
          restaurantName={selectedFood.restaurant?.name || ''}
          onAddToCart={handleAddToCart}
        />
      )}
    </CustomerLayout>
  );
}
