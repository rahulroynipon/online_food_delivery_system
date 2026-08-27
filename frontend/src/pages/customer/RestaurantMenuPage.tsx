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
  AlertCircle
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
}

export default function RestaurantMenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCustomerStore();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Customizer Modal state
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '';
    const [hourStr, minStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minStr} ${ampm}`;
  };

  useEffect(() => {
    const fetchRestaurantAndMenu = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/public/restaurants/${slug}`);
        if (res.data?.success) {
          setRestaurant(res.data.restaurant);
          setCategories(res.data.categories || []);
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
    setSelectedFood(food);
    setIsCustomizerOpen(true);
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
            <div className="h-40 rounded-3xl bg-card border border-border/20" />
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
            {/* Restaurant Profile Cover Header Card */}
            <section className="relative rounded-3xl overflow-hidden bg-radial from-card/65 via-card/45 to-background border border-border/40 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
              <div className="space-y-3 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
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
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-foreground font-bold">
                      {restaurant.rating ? Number(restaurant.rating).toFixed(1) : '4.5'}
                    </span>
                    <span>(100+ ratings)</span>
                  </div>
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

              {/* Restaurant Hours Card */}
              <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3 shrink-0 shadow-3xs select-none">
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

            {/* Menu Listing Container */}
            <div className="flex flex-col md:flex-row items-start gap-8">
              
              {/* Category Sticky Sidebar Navigation */}
              {categories.length > 0 && (
                <aside className="w-full md:w-56 sticky top-20 z-10 shrink-0 select-none bg-card/45 p-3 rounded-2xl border border-border/40 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-3 py-1 pb-2 border-b border-border/10">
                    Menu Categories
                  </p>
                  {categories.map((cat) => (
                    <a
                      key={cat.id}
                      href={`#category-${cat.id}`}
                      className="block w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-foreground/80 hover:text-primary hover:bg-primary/5 transition-all truncate"
                    >
                      {cat.name}
                    </a>
                  ))}
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
                              className="p-4 flex gap-4 items-center justify-between border border-border/40 hover:border-primary/20 bg-card/65 hover:bg-card transition-all duration-200 rounded-2xl shadow-3xs"
                            >
                              {/* Left Column: Image, Name, Description, Price */}
                              <div className="flex gap-3 items-start ">
                                <img
                                  src={getFoodImage(food)}
                                  alt={food.name}
                                  className="h-16 w-16 rounded-xl object-cover border border-border/10 shrink-0"
                                />
                                <div className="min-w-0 flex-1 space-y-1">
                                  <h4 className="text-xs font-extrabold text-foreground truncate">
                                    {food.name}
                                  </h4>
                                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                                    {food.description || 'Delicious freshly made recipe.'}
                                  </p>
                                  <p className="text-xs font-black text-foreground">
                                    {getFoodPriceLabel(food)}
                                  </p>
                                </div>
                              </div>

                              {/* Right Column: Plus Button */}
                              <div className="w-12 flex justify-end">
                                <Button
                                  size="icon-sm"
                                  variant="primary"
                                  rounded="full"
                                  onClick={() => handleOpenCustomizer(food)}
                                  disabled={!restaurant.isOpen}
                                >
                                  <Plus className="h-4.5 w-4.5" />
                                </Button>
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
          onAddToCart={handleAddToCart}
        />
      )}
    </CustomerLayout>
  );
}
