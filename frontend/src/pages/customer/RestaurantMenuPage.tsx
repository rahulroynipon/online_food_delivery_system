import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCustomerStore, CartItem } from '../../store/useCustomerStore';
import api from '../../lib/axios';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Phone, 
  Clock, 
  Utensils,
  Plus,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';
import { Button, Card, toast } from '../../design-system';
import CustomerLayout from '../../components/CustomerLayout';
import FoodCustomizerModal from '../../components/FoodCustomizerModal';

interface Food {
  id: number;
  name: string;
  description: string;
  image?: string;
  variants: { id: number; name: string; price: number | string }[];
  addons: { id: number; name: string; price: number | string }[];
}

interface MenuCategory {
  id: number;
  name: string;
  foods: Food[];
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

export default function RestaurantMenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart, cart, clearCart } = useCustomerStore();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab state: 'menu' | 'reviews'
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');
  const [reviewData, setReviewData] = useState<{
    stats: {
      totalReviews: number;
      averageRating: number;
      ratingBreakdown: Record<number, number>;
      popularTags: Array<{ tag: string; count: number }>;
    };
    reviews: any[];
  } | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Scroll spy active category id state
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  // Customizer Modal state
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // "Switch restaurant?" warning state
  const [pendingFood, setPendingFood] = useState<Food | null>(null);
  const [isSwitchWarningOpen, setIsSwitchWarningOpen] = useState(false);
  const cartRestaurantName = cart.length > 0 ? cart[0].restaurantName : null;

  // Image error states
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Set default active category when categories load
  useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories]);

  // Category smooth scroll click handler
  const handleCategoryClick = (e: React.MouseEvent, catId: number) => {
    e.preventDefault();
    const element = document.getElementById(`category-${catId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveCategoryId(catId);
    }
  };

  // Scroll Spy IntersectionObserver Effect
  useEffect(() => {
    if (categories.length === 0) return;

    const activeSections = new Map<number, boolean>();

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const idStr = entry.target.id.replace('category-', '');
        const id = parseInt(idStr, 10);
        if (entry.isIntersecting) {
          activeSections.set(id, true);
        } else {
          activeSections.delete(id);
        }
      });

      if (activeSections.size > 0) {
        const activeList = Array.from(activeSections.keys());
        const firstActive = categories.find((cat) => activeList.includes(cat.id));
        if (firstActive) {
          setActiveCategoryId(firstActive.id);
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null, // viewport
      rootMargin: '-20% 0px -60% 0px', // active when section is in the top-middle range of viewport
      threshold: 0
    });

    categories.forEach((cat) => {
      const el = document.getElementById(`category-${cat.id}`);
      if (el) {
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [categories]);

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '';
    const [hourStr, minStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minStr} ${ampm}`;
  };

  const fetchReviews = async (restaurantId: number) => {
    setLoadingReviews(true);
    try {
      const res = await api.get(`/reviews/restaurant/${restaurantId}`);
      if (res.data?.success) {
        setReviewData({
          stats: res.data.stats,
          reviews: res.data.reviews || []
        });
      }
    } catch (err) {
      console.error('Failed to load restaurant reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    const fetchRestaurantAndMenu = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/public/restaurants/${slug}`);
        if (res.data?.success) {
          setRestaurant(res.data.restaurant);
          setCategories(res.data.categories || []);
          if (res.data.restaurant?.id) {
            fetchReviews(res.data.restaurant.id);
          }
        }
      } catch (err: any) {
        console.error('Failed to load menu:', err);
        toast.error(err.response?.data?.message || 'Failed to load restaurant menu.');
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurantAndMenu();
  }, [slug]);

  const handleOpenCustomizer = (food: Food) => {
    if (!restaurant?.isOpen) {
      toast.error('This restaurant is currently closed. You cannot add items to the cart.');
      return;
    }
    // Warn if cart has items from a different restaurant
    if (cart.length > 0 && cart[0].restaurantId !== restaurant?.id) {
      setPendingFood(food);
      setIsSwitchWarningOpen(true);
      return;
    }
    setSelectedFood(food);
    setIsCustomizerOpen(true);
  };

  const handleConfirmSwitch = () => {
    clearCart();
    setIsSwitchWarningOpen(false);
    if (pendingFood) {
      setSelectedFood(pendingFood);
      setIsCustomizerOpen(true);
      setPendingFood(null);
    }
  };

  const handleAddToCart = (item: CartItem) => {
    addToCart(item);
    toast.success(`Added ${item.foodName} (${item.quantity}x) to cart!`);
  };

  const getFoodPriceLabel = (food: Food) => {
    if (!food.variants || food.variants.length === 0) return '৳0.00';
    const prices = food.variants.map((v) => parseFloat(String(v.price || 0)));
    const minPrice = Math.min(...prices);
    
    if (food.variants.length > 1) {
      return `From ৳${minPrice.toFixed(2)}`;
    }
    return `৳${minPrice.toFixed(2)}`;
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

  const getFoodImage = (food: Food) => {
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
    <CustomerLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <Link to="/restaurants" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors select-none">
          <ArrowLeft className="h-4 w-4" />
          Back to Restaurants
        </Link>

        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-52 rounded-3xl bg-card border border-border/20" />
            <div className="h-60 rounded-3xl bg-card border border-border/20" />
          </div>
        ) : !restaurant ? (
          <Card className="p-8 text-center bg-card/30 border border-border/30 max-w-sm mx-auto">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-foreground">Restaurant Unavailable</h3>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              The requested restaurant could not be found or has not been approved yet.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Restaurant Cover Banner Image */}
            <div className="h-52 md:h-72 w-full relative overflow-hidden rounded-3xl border border-border/10 shadow-2xs select-none">
              {restaurant.banner && !bannerError ? (
                <img
                  src={getBannerUrl(restaurant.banner)}
                  alt={`${restaurant.name} banner`}
                  onError={() => setBannerError(true)}
                  className="h-full w-full object-cover animate-fade-in"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-primary/20 via-primary/10 to-amber-500/10 flex flex-col items-center justify-center gap-2">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Utensils className="h-8 w-8" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">
                    {restaurant.name}
                  </span>
                </div>
              )}
            </div>

            {/* Restaurant Profile Overlap Header Card */}
            <section className="relative z-10 -mt-16 mx-4 md:mx-8 rounded-3xl bg-card/95 backdrop-blur-md border border-border/40 p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-md">
              <div className="flex flex-col md:flex-row gap-5 items-start">
                
                {/* Restaurant Logo Avatar */}
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl border border-border/20 bg-background overflow-hidden shrink-0 flex items-center justify-center shadow-xs select-none">
                  {restaurant.logo && !logoError ? (
                    <img
                      src={getLogoUrl(restaurant.logo)}
                      alt={restaurant.name}
                      onError={() => setLogoError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-black text-2xl">
                      {restaurant.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Details text */}
                <div className="space-y-3 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight truncate">
                      {restaurant.name}
                    </h1>
                    <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md border shadow-3xs shrink-0 select-none ${
                      restaurant.isOpen 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                        : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}>
                      {restaurant.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                  
                  <p className="text-xs md:text-sm text-muted-foreground leading-normal max-w-2xl font-medium">
                    {restaurant.description || 'Tasty cuisines, fast delivery, and premium quality meals prepared with fresh ingredients.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground font-semibold pt-1 border-t border-border/10">
                    {reviewData && reviewData.stats.totalReviews > 0 ? (
                      <button
                        onClick={() => setActiveTab('reviews')}
                        className="flex items-center gap-1.5 hover:text-primary transition-all cursor-pointer group text-left"
                        title="Click to view all reviews and ratings"
                      >
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
                        <span className="text-foreground font-bold group-hover:text-primary transition-colors">
                          {reviewData.stats.averageRating.toFixed(1)}
                        </span>
                        <span className="group-hover:underline underline-offset-2">
                          ({reviewData.stats.totalReviews} {reviewData.stats.totalReviews === 1 ? 'review' : 'reviews'})
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveTab('reviews')}
                        className="flex items-center gap-1.5 hover:text-primary transition-all cursor-pointer group text-left text-muted-foreground"
                        title="Click to view reviews"
                      >
                        <Star className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-amber-400 group-hover:scale-110 transition-transform" />
                        <span className="group-hover:underline underline-offset-2 font-medium">
                          No reviews yet
                        </span>
                      </button>
                    )}
                    <span>&bull;</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate max-w-[200px]">{restaurant.address}</span>
                    </div>
                    <span>&bull;</span>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-foreground/75" />
                      <span>{restaurant.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Restaurant Hours Card */}
              <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3 shrink-0 shadow-3xs select-none self-start lg:self-center">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="text-xs">
                  <p className="font-extrabold text-foreground">
                    {restaurant.openingTime && restaurant.closingTime 
                      ? `${formatTime(restaurant.openingTime)} - ${formatTime(restaurant.closingTime)}`
                      : 'Open 24 Hours'}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Operating Hours</p>
                </div>
              </div>
            </section>

            {/* Navigation Tabs Switcher */}
            <div className="flex items-center gap-3 border-b border-border/30 pb-3 select-none">
              <button
                onClick={() => setActiveTab('menu')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'menu'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Utensils className="h-4 w-4" />
                <span>Menu & Dishes</span>
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>Reviews & Ratings</span>
                {reviewData && reviewData.stats.totalReviews > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                  }`}>
                    {reviewData.stats.totalReviews}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: Menu & Foods */}
            {activeTab === 'menu' && (
              <div className="flex flex-col md:flex-row items-start gap-8 animate-fade-in">
                
                {/* Category Sticky Sidebar Navigation */}
                {categories.length > 0 && (
                  <aside className="w-full md:w-56 sticky top-[72px] md:top-20 z-10 shrink-0 select-none bg-card/95 backdrop-blur-md p-3.5 md:p-3 rounded-2xl border border-border/40 md:space-y-1.5 flex flex-row overflow-x-auto gap-2.5 md:flex-col md:overflow-x-visible scrollbar-none">
                    <p className="hidden md:block text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-3 py-1 pb-2 border-b border-border/10">
                      Menu Categories
                    </p>
                    {categories.map((cat) => {
                      const isActive = activeCategoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={(e) => handleCategoryClick(e, cat.id)}
                          className={`inline-block shrink-0 px-4 py-1.5 md:py-2.5 md:pl-3 md:pr-4 rounded-full md:rounded-r-xl md:rounded-l-none text-xs font-bold transition-all truncate cursor-pointer text-left md:border-l-4 ${
                            isActive
                              ? 'bg-primary text-primary-foreground md:bg-primary/10 md:text-primary md:border-primary md:font-extrabold shadow-2xs md:shadow-none'
                              : 'bg-[#F5F6F8] text-foreground/70 border border-neutral-200/20 hover:bg-[#EAECEF] md:bg-transparent md:border-none md:text-foreground/75 md:hover:bg-muted/30 md:hover:text-foreground md:border-transparent'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </aside>
                )}

                {/* Menu Categories List */}
                <div className="flex-1 w-full space-y-12">
                  {categories.length === 0 ? (
                    <Card className="p-8 text-center bg-card/30 border border-border/30">
                      <Utensils className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <h3 className="text-sm font-bold text-foreground">No dishes available</h3>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        This kitchen hasn't added any menu categories or dishes yet.
                      </p>
                    </Card>
                  ) : (
                    categories.map((category) => (
                      <section
                        key={category.id}
                        id={`category-${category.id}`}
                        className="space-y-4 scroll-mt-24"
                      >
                        <h2 className="text-lg font-black text-foreground border-b border-border/10 pb-2">
                          {category.name}
                        </h2>

                        {category.foods.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic font-medium">
                            No items available in this category.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.foods.map((food) => (
                              <div 
                                key={food.id} 
                                className="p-4 flex gap-4 items-stretch justify-between border border-border/40 hover:border-primary/25 bg-card/65 hover:bg-card hover:shadow-xs rounded-2xl transition-all duration-300 group"
                              >
                                {/* Left: Food Text Details */}
                                <div className="flex-1 flex flex-col justify-between min-w-0 pr-2">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors truncate">
                                        {food.name}
                                      </h4>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                                      {food.description || 'Delicious freshly prepared recipe.'}
                                    </p>
                                  </div>
                                  <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xs font-black text-foreground">
                                      {getFoodPriceLabel(food)}
                                    </span>
                                  </div>
                                </div>

                                {/* Right: Food Image & Add Button (Overlap Style) */}
                                <div className="h-20 w-20 md:h-24 md:w-24 shrink-0 relative rounded-xl overflow-hidden shadow-2xs border border-border/10 select-none">
                                  <img
                                    src={getFoodImage(food)}
                                    alt={food.name}
                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  
                                  {/* Floating add button on bottom-right of image */}
                                  <div className="absolute bottom-1.5 right-1.5 z-10">
                                    <Button
                                      size="icon-xs"
                                      variant="primary"
                                      rounded="lg"
                                      onClick={() => handleOpenCustomizer(food)}
                                      disabled={!restaurant.isOpen}
                                      className="h-7 w-7 shadow-md border border-white/10 hover:scale-110 active:scale-95 transition-all animate-fade-in"
                                      title="Add to Basket"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>
                    ))
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: Customer Reviews & Ratings */}
            {activeTab === 'reviews' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Stats Header Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Overall Score */}
                  <Card className="border border-border/40 bg-gradient-to-br from-amber-500/10 via-card to-card p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-4xl font-black text-foreground">
                      {reviewData?.stats.averageRating ? reviewData.stats.averageRating.toFixed(1) : '4.8'}
                    </span>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="h-5 w-5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground font-bold">
                      Based on {reviewData?.stats.totalReviews || 0} customer reviews
                    </p>
                  </Card>

                  {/* Rating Breakdown Bars */}
                  <Card className="border border-border/40 p-6 md:col-span-2 space-y-2.5">
                    <p className="text-xs font-black uppercase text-foreground tracking-wider mb-2">
                      Rating Breakdown
                    </p>
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = reviewData?.stats.ratingBreakdown[stars] || 0;
                      const total = reviewData?.stats.totalReviews || 1;
                      const pct = reviewData?.stats.totalReviews ? Math.round((count / total) * 100) : (stars === 5 ? 85 : stars === 4 ? 15 : 0);

                      return (
                        <div key={stars} className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                          <span className="w-12 text-foreground flex items-center gap-1 shrink-0">
                            {stars} <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" />
                          </span>
                          <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-[10px] text-muted-foreground">{pct}%</span>
                        </div>
                      );
                    })}
                  </Card>
                </div>

                {/* Popular Tags */}
                {reviewData?.stats.popularTags && reviewData.stats.popularTags.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      Customer Highlights
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {reviewData.stats.popularTags.map(({ tag, count }) => (
                        <span
                          key={tag}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5"
                        >
                          {tag}
                          <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded-full font-black">
                            {count}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Reviews List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-foreground border-b border-border/10 pb-2">
                    Recent Customer Reviews ({reviewData?.reviews.length || 0})
                  </h3>

                  {loadingReviews ? (
                    <div className="py-12 text-center text-muted-foreground text-xs font-semibold">
                      Loading customer reviews...
                    </div>
                  ) : !reviewData || reviewData.reviews.length === 0 ? (
                    <Card className="p-8 text-center bg-card/30 border border-border/30">
                      <Star className="h-8 w-8 text-amber-400/40 mx-auto mb-2" />
                      <h4 className="text-xs font-bold text-foreground">No customer reviews yet</h4>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Be the first to order and leave a review for {restaurant.name}!
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {reviewData.reviews.map((rev) => (
                        <Card key={rev.id} className="border border-border/40 bg-card p-5 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-xs">
                                {rev.user?.name ? rev.user.name.charAt(0) : 'C'}
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-foreground">{rev.user?.name || 'Verified Customer'}</h4>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(rev.createdAt).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>

                            {/* Stars */}
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3.5 w-3.5 ${
                                    s <= rev.foodRating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-muted/20 text-muted-foreground/20'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Ordered items pill */}
                          {rev.order?.items && rev.order.items.length > 0 && (
                            <p className="text-[10px] text-muted-foreground font-semibold">
                              <span className="text-foreground font-bold">Ordered: </span>
                              {rev.order.items.map((it: any) => `${it.quantity}× ${it.foodName}`).join(', ')}
                            </p>
                          )}

                          {/* Tags */}
                          {rev.foodTags && rev.foodTags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {rev.foodTags.map((tag: string, i: number) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-bold bg-muted/40 text-foreground px-2 py-0.5 rounded-md border border-border/40"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Review comment */}
                          {rev.foodReview && (
                            <p className="text-xs text-foreground/90 leading-relaxed font-medium bg-muted/10 p-3 rounded-xl border border-border/20">
                              "{rev.foodReview}"
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {/* Overlay customizer modal component */}
      {restaurant && (
        <FoodCustomizerModal
          isOpen={isCustomizerOpen}
          onClose={() => setIsCustomizerOpen(false)}
          food={selectedFood}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          restaurantSlug={restaurant.slug}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Switch Restaurant Warning Dialog */}
      {isSwitchWarningOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border/50 bg-card shadow-2xl p-6 space-y-5 animate-scale-in">
            {/* Icon */}
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
              <ShoppingBag className="h-7 w-7 text-amber-500" />
            </div>

            {/* Text */}
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-extrabold text-foreground">Start a New Order?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Your cart already has items from{' '}
                <span className="font-bold text-foreground">{cartRestaurantName}</span>.
                <br />
                Each delivery requires a separate order per restaurant. Starting a new order from{' '}
                <span className="font-bold text-foreground">{restaurant?.name}</span> will clear your current cart.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 font-bold text-xs"
                onClick={() => { setIsSwitchWarningOpen(false); setPendingFood(null); }}
              >
                Keep Current
              </Button>
              <Button
                variant="primary"
                className="flex-1 font-bold text-xs"
                onClick={handleConfirmSwitch}
              >
                Start New Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
