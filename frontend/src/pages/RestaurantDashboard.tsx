import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Card, 
  CardContent, 
  Button, 
  toast, 
  Badge, 
  Input, 
  Select, 
  Modal, 
  DataTable, 
  Avatar, 
  AppShell,
  Sidebar,
  SidebarTrigger,
  Header,
  Main,
  Content,
  Dropdown,
  type DataTableColumn 
} from '../design-system';
import { 
  Store, 
  UtensilsCrossed, 
  Bike, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Layers, 
  Clock, 
  ClipboardList, 
  CheckCircle2, 
  AlertTriangle, 
  LogOut, 
  Plus, 
  Edit, 
  Power,
  Trash2,
  DollarSign,
  TrendingUp,
  Activity,
  Bell,
  Check,
  Loader2,
  Upload,
  ImageIcon
} from 'lucide-react';
import api from '../lib/axios';
import { NavLink, useLocation } from 'react-router-dom';

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, token } = useAuthStore();
  const [restaurantProfile, setRestaurantProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const activePage = location.pathname.endsWith('/menu') 
    ? 'menu' 
    : location.pathname.endsWith('/orders') 
    ? 'orders' 
    : location.pathname.endsWith('/categories')
    ? 'categories'
    : 'dashboard';

  const [notifications, setNotifications] = useState<any[]>([]);

  // Fetch restaurant profile details
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/onboarding/my-restaurant');
      if (response.data?.success) {
        setRestaurantProfile(response.data.restaurant);
      }
    } catch {
      toast.error('Could not retrieve merchant store profile.');
    } finally {
      setLoading(false);
    }
  };

  // Sound notification trigger
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Audio API not supported
    }
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data?.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleMarkAsRead = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Custom Store Categories state & loading state
  const [restaurantCategories, setRestaurantCategories] = useState<any[]>([]);
  const [platformCategories, setPlatformCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Category Modal Form State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    platformCategoryId: '',
    status: 'ACTIVE'
  });
  const [deleteTargetCategory, setDeleteTargetCategory] = useState<any | null>(null);
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const base = api.defaults.baseURL || 'http://localhost:5005/api/v1';
    return `${base}/${imagePath}`;
  };

  const handleCategoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCategoryImageFile(file);
      setCategoryImagePreview(URL.createObjectURL(file));
    }
  };

  const fetchRestaurantCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await api.get('/restaurant-categories');
      if (response.data?.success) {
        setRestaurantCategories(response.data.categories || []);
      }
    } catch {
      toast.error('Could not fetch store categories.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchPlatformCategories = async () => {
    try {
      const response = await api.get('/platform-categories');
      if (response.data?.success) {
        setPlatformCategories(response.data.platformCategories || []);
      }
    } catch (err) {
      console.error('Failed to fetch platform categories:', err);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name || !categoryForm.platformCategoryId) {
      toast.error('Name and Platform Category selection are required.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', categoryForm.name);
      formData.append('description', categoryForm.description);
      formData.append('platformCategoryId', categoryForm.platformCategoryId);
      formData.append('status', categoryForm.status);
      if (categoryImageFile) {
        formData.append('image', categoryImageFile);
      }

      if (editingCategory) {
        const response = await api.put(`/restaurant-categories/${editingCategory.slug}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data?.success) {
          toast.success('Category updated successfully!');
          fetchRestaurantCategories();
          setIsCategoryModalOpen(false);
        }
      } else {
        const response = await api.post('/restaurant-categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data?.success) {
          toast.success('Category created successfully!');
          fetchRestaurantCategories();
          setIsCategoryModalOpen(false);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save category.');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteTargetCategory) return;
    try {
      const response = await api.delete(`/restaurant-categories/${deleteTargetCategory.slug}`);
      if (response.data?.success) {
        toast.success('Category deleted successfully.');
        fetchRestaurantCategories();
        setDeleteTargetCategory(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryImageFile(null);
    setCategoryImagePreview(null);
    setCategoryForm({
      name: '',
      description: '',
      platformCategoryId: platformCategories[0]?.id ? String(platformCategories[0].id) : '',
      status: 'ACTIVE'
    });
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setCategoryImageFile(null);
    setCategoryImagePreview(cat.image ? getImageUrl(cat.image) : null);
    setCategoryForm({
      name: cat.name || '',
      description: cat.description || '',
      platformCategoryId: cat.platformCategoryId ? String(cat.platformCategoryId) : '',
      status: cat.status || 'ACTIVE'
    });
    setIsCategoryModalOpen(true);
  };

  const handleToggleCategoryStatus = async (cat: any) => {
    const nextStatus = cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const response = await api.put(`/restaurant-categories/${cat.slug}`, { status: nextStatus });
      if (response.data?.success) {
        toast.success(`Successfully set category as ${nextStatus}`);
        fetchRestaurantCategories();
      }
    } catch (err: any) {
      toast.error('Failed to toggle category status.');
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
    fetchRestaurantCategories();
    fetchPlatformCategories();
  }, []);

  // Live WebSocket support for notifications
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;
    let reconnectAttempts = 0;

    const connect = () => {
      if (!isMounted) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5005/api/v1';
      const wsBaseUrl = apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
      const wsUrlObj = new URL(wsBaseUrl);
      const protocol = wsUrlObj.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${wsUrlObj.host}?token=${token}`;

      console.log('[WebSocket Merchant] Connecting to:', wsUrl);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket Merchant] Connected successfully');
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          // Trigger updates based on notification broadcasts
          if (payload.event === 'NOTIFICATION_ADDED') {
            fetchNotifications();
            playNotificationSound();
          }
        } catch (err) {
          console.error('[WebSocket Merchant] Error handling message:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WebSocket Merchant] Disconnected');
        if (isMounted) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++;
            connect();
          }, delay);
        }
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [token]);

  // Mock Menu Foods state
  const [foods, setFoods] = useState<any[]>([
    { id: 1, name: 'Double Cheese Beef Burger', description: 'Two flame-grilled beef patties, cheddar slices, special burger sauce, pickles, fresh buns.', price: 8.99, status: 'ACTIVE', category: 'Burgers' },
    { id: 2, name: 'Pepperoni Supreme Pizza', description: 'Authentic sourdough pizza base, marinara sauce, loaded pepperoni, mozzarella cheese, dried oregano.', price: 12.49, status: 'ACTIVE', category: 'Pizza' },
    { id: 3, name: 'Crispy Chicken Wings (8pcs)', description: 'Jumbo chicken wings coated in hot buffalo sauce, served with celery sticks and ranch dip.', price: 7.99, status: 'ACTIVE', category: 'Appetizers' },
    { id: 4, name: 'Premium Chocolate Shake', description: 'Rich chocolate ice cream milkshake topped with whipped cream, cocoa dust, and chocolate drizzle.', price: 4.99, status: 'INACTIVE', category: 'Beverages' }
  ]);

  // Modal State for menu item
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [foodForm, setFoodForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Burgers',
    status: 'ACTIVE'
  });

  const handleToggleFoodStatus = (id: number) => {
    setFoods(prev => prev.map(f => {
      if (f.id === id) {
        const nextStatus = f.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        toast.success(`Successfully set ${f.name} as ${nextStatus}`);
        return { ...f, status: nextStatus };
      }
      return f;
    }));
  };

  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodForm.name || !foodForm.price) {
      toast.error('Please enter name and price.');
      return;
    }
    const newFood = {
      id: Date.now(),
      name: foodForm.name,
      description: foodForm.description,
      price: parseFloat(foodForm.price),
      category: foodForm.category,
      status: foodForm.status
    };
    setFoods(prev => [newFood, ...prev]);
    setIsFoodModalOpen(false);
    toast.success(`${foodForm.name} added to your menu successfully!`);
    setFoodForm({ name: '', description: '', price: '', category: 'Burgers', status: 'ACTIVE' });
  };

  // Mock Orders state
  const [orders, setOrders] = useState<any[]>([
    { id: 101, customerName: 'Nipon Roy', items: '2x Double Cheese Beef Burger, 1x Premium Chocolate Shake', total: 22.97, status: 'PENDING', date: new Date().toLocaleTimeString() },
    { id: 102, customerName: 'Fahim Ahmed', items: '1x Pepperoni Supreme Pizza', total: 12.49, status: 'PREPARING', date: new Date().toLocaleTimeString() },
    { id: 103, customerName: 'Nabil Hasan', items: '1x Crispy Chicken Wings (8pcs)', total: 7.99, status: 'READY', date: new Date().toLocaleTimeString() },
    { id: 104, customerName: 'Tasnim Jahan', items: '1x Double Cheese Beef Burger, 1x Crispy Chicken Wings', total: 16.98, status: 'DELIVERED', date: new Date().toLocaleTimeString() }
  ]);

  const handleUpdateOrderStatus = (orderId: number, nextStatus: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        toast.info(`Order #${orderId} marked as ${nextStatus}`);
        return { ...o, status: nextStatus };
      }
      return o;
    }));
  };

  const activeOrdersCount = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Store Dashboard',
      icon: <Store size={18} />,
      path: '/restaurant',
    },
    {
      id: 'categories',
      label: 'Store Categories',
      icon: <Layers size={18} />,
      path: '/restaurant/categories',
    },
    {
      id: 'menu',
      label: 'Menu & Foods',
      icon: <UtensilsCrossed size={18} />,
      path: '/restaurant/menu',
    },
    {
      id: 'orders',
      label: 'Incoming Orders',
      icon: <ClipboardList size={18} />,
      path: '/restaurant/orders',
      badge: activeOrdersCount > 0 ? (
        <span className={`h-5 min-w-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center bg-amber-500 text-white shadow-xs`}>
          {activeOrdersCount}
        </span>
      ) : null
    }
  ];

  return (
    <AppShell sidebarWidth={256} collapsedWidth={64} desktopBehavior="collapse" defaultCollapsed={false}>
      {/* Sidebar navigation */}
      <Sidebar className="border-r border-border/40 bg-card flex flex-col select-none overflow-y-auto shrink-0">
        {/* Sidebar Header Brand */}
        <div className="h-16 flex items-center px-6 border-b border-border/10 gap-3 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-md shadow-amber-500/10">
            <UtensilsCrossed size={18} className="text-white" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-foreground appshell-sidebar-label">Merchant Portal</span>
        </div>

         {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.id === 'dashboard'}
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/15'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <div className={`transition-transform duration-200 group-hover:scale-105 ${
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    }`}>
                      {item.icon}
                    </div>
                    <span className="appshell-sidebar-label">{item.label}</span>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </Sidebar>

      {/* Main Container */}
      <Main className="min-h-screen bg-muted/20 text-foreground flex flex-col">
        {/* Top Header */}
        <Header className="border-b border-border/50 bg-card/60 backdrop-blur-md h-16 flex items-center justify-between px-6 shrink-0 shadow-xs">
          {/* Left Actions */}
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="hidden sm:block">
              <h1 className="text-sm font-black tracking-tight text-foreground">
                {restaurantProfile?.name || 'Store Merchant'}
              </h1>
              <p className="text-[9px] text-muted-foreground -mt-0.5 font-medium">BiteSpeed Merchant Panel</p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {restaurantProfile?.status === 'ACTIVE' ? (
              <Badge variant="soft" color="success" className="font-extrabold text-[9px] tracking-wide uppercase px-2.5 py-0.5">
                Active
              </Badge>
            ) : (
              <Badge variant="soft" color="warning" className="font-extrabold text-[9px] tracking-wide uppercase px-2.5 py-0.5">
                Pending Verification
              </Badge>
            )}

            {/* Notification Dropdown */}
            <Dropdown>
              <Dropdown.Trigger>
                <button className="relative p-2 rounded-full hover:bg-muted transition-colors cursor-pointer">
                  <Bell className="h-[18px] w-[18px] text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-1 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md ring-2 ring-card animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </Dropdown.Trigger>

              <Dropdown.Menu align="end" width={340} sideOffset={10}>
                {/* Header */}
                <Dropdown.Item closeOnClick={false} content={
                  <div className="flex justify-between items-center w-full py-0.5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Bell size={12} className="text-amber-500" />
                      </div>
                      <span className="font-bold text-[13px] text-foreground tracking-tight">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="h-5 min-w-5 px-1.5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarkAllAsRead(); }}
                        className="text-[10px] font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer transition-colors px-2 py-0.5 rounded-md hover:bg-amber-500/5"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                } />

                <Dropdown.Separator />

                {/* Notifications list */}
                {notifications.length === 0 ? (
                  <Dropdown.Item closeOnClick={false} content={
                    <div className="py-8 w-full flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center">
                        <Bell size={20} className="opacity-30" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-foreground/50">All caught up!</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">No notifications yet.</p>
                      </div>
                    </div>
                  } />
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <Dropdown.Item 
                      key={notif.id}
                      closeOnClick={true}
                      onClick={() => handleMarkAsRead(notif.id)}
                      content={
                        <div className={`flex items-start gap-3 w-full py-1 ${!notif.read ? 'opacity-100 font-semibold' : 'opacity-70'}`}>
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${
                            notif.read ? 'bg-muted text-muted-foreground' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {notif.event?.[0] || 'N'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground leading-normal line-clamp-2">{notif.message}</p>
                            <p className="text-[9px] text-muted-foreground mt-1">
                              {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          {!notif.read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                              className="h-5 w-5 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
                            >
                              <Check size={12} />
                            </button>
                          )}
                        </div>
                      }
                    />
                  ))
                )}
              </Dropdown.Menu>
            </Dropdown>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              leftIcon={<LogOut className="h-4 w-4" />}
              className="text-rose-500 hover:bg-rose-500/5 font-semibold text-xs rounded-xl"
            >
              Sign Out
            </Button>
          </div>
        </Header>

        {/* Main Content Workspace */}
        <Content className="flex-1 p-6 md:p-8 overflow-y-auto">
          {activePage === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Overview Dashboard</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage store details, coordinates, and view metrics.</p>
              </div>

              {/* Status Banner */}
              {restaurantProfile && restaurantProfile.status !== 'ACTIVE' && (
                <div className="flex gap-3.5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-extrabold">Store Application Pending Verification</p>
                    <p className="mt-1 leading-normal opacity-85">
                      Your restaurant application is currently under verification. Our onboarding team is reviewing your address, zone boundary, and merchant contacts. You can configure your menu items and test order workflows below.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Card className="border border-border/40 shadow-xs bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Today's Orders</p>
                      <p className="text-2xl font-black text-foreground mt-1.5">{orders.length}</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <ClipboardList size={18} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/40 shadow-xs bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Active Foods</p>
                      <p className="text-2xl font-black text-foreground mt-1.5">
                        {foods.filter(f => f.status === 'ACTIVE').length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <Activity size={18} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/40 shadow-xs bg-card">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Today's Revenue</p>
                      <p className="text-2xl font-black text-foreground mt-1.5">$50.44</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                      <DollarSign size={18} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Details Card */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                  <span className="text-xs text-muted-foreground font-semibold">Fetching store details...</span>
                </div>
              ) : restaurantProfile ? (
                <Card className="border border-border/40 shadow-xs bg-card">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-4 border-b border-border/10 pb-4">
                      <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl font-bold">
                        {restaurantProfile.name?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-foreground">{restaurantProfile.name}</h3>
                        <p className="text-xs text-muted-foreground italic mt-0.5">{restaurantProfile.description || 'No description provided.'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold">
                      <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Business Address</p>
                        <p className="text-foreground text-xs mt-1 leading-relaxed">{restaurantProfile.address || 'N/A'}</p>
                      </div>

                      <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Store Owner</p>
                        <p className="text-foreground text-xs mt-1">{restaurantProfile.user?.name || 'N/A'}</p>
                      </div>

                      <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Contact Credentials</p>
                        <p className="text-foreground text-xs mt-1 font-bold">{restaurantProfile.user?.email}</p>
                        <p className="text-muted-foreground text-[10px] mt-0.5">{restaurantProfile.user?.phone}</p>
                      </div>

                      <div className="p-3 bg-muted/20 border border-border/30 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Delivery Zone coordinates</p>
                        <p className="text-foreground text-xs mt-1 font-mono">
                          Lat: {Number(restaurantProfile.latitude).toFixed(6)}
                        </p>
                        <p className="text-foreground text-xs font-mono">
                          Lng: {Number(restaurantProfile.longitude).toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          )}

          {activePage === 'categories' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">Store Menu Categories</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage custom categories for your menu items, mapped to global platform categories.</p>
                </div>
                <Button
                  size="sm"
                  onClick={openAddCategory}
                  leftIcon={<Plus size={16} />}
                  className="font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                >
                  Create Store Category
                </Button>
              </div>

              {categoriesLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                  <span className="text-xs text-muted-foreground font-semibold">Loading custom categories...</span>
                </div>
              ) : (
                <>
                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl w-fit">
                    {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => {
                      const count = status === 'ALL'
                        ? restaurantCategories.length
                        : restaurantCategories.filter(c => c.status === status).length;
                      const isSelected = categoryStatusFilter === status;
                      return (
                        <button
                          key={status}
                          onClick={() => setCategoryStatusFilter(status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-card text-foreground shadow-xs font-bold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {status.charAt(0) + status.slice(1).toLowerCase()}
                          {count > 0 && (
                            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                              isSelected ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'
                            }`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <Card className="border border-border/40 shadow-xs bg-card">
                    <CardContent className="p-0">
                      <DataTable
                        data={categoryStatusFilter === 'ALL' ? restaurantCategories : restaurantCategories.filter(c => c.status === categoryStatusFilter)}
                      pagination={false}
                      searchable={false}
                      toolbar={null}
                      columns={[
                        {
                          id: 'category',
                          label: 'Category Name',
                          cell: ({ row }) => (
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                                {row.image ? (
                                  <img src={getImageUrl(row.image)} alt={row.name} className="h-full w-full object-cover" />
                                ) : (
                                  <ImageIcon size={14} className="text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-extrabold text-sm text-foreground">{row.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic max-w-sm">
                                  {row.description || 'No description provided.'}
                                </p>
                              </div>
                            </div>
                          )
                        },
                        {
                          id: 'platformCategory',
                          label: 'Platform Mapping',
                          cell: ({ row }) => (
                            <Badge variant="soft" color="primary" className="font-bold text-[9px] uppercase px-2.5 py-0.5">
                              {row.platformCategory?.name || 'Unmapped'}
                            </Badge>
                          )
                        },
                        {
                          id: 'status',
                          label: 'Status',
                          cell: ({ row }) => (
                            row.status === 'ACTIVE'
                              ? <Badge variant="soft" color="success" className="font-bold text-[9px] uppercase px-2 py-0.5">Active</Badge>
                              : <Badge variant="soft" color="neutral" className="font-bold text-[9px] uppercase px-2 py-0.5">Inactive</Badge>
                          )
                        },
                        {
                          id: 'actions',
                          label: '',
                          align: 'right' as const,
                          cell: ({ row }) => (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => openEditCategory(row)}
                                leftIcon={<Edit size={12} />}
                                className="border-border/60 hover:bg-muted"
                              >
                                Edit
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setDeleteTargetCategory(row)}
                                leftIcon={<Trash2 size={12} />}
                                className="border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white"
                              >
                                Delete
                              </Button>
                            </div>
                          )
                        }
                      ]}
                    />
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Custom Category Form Modal */}
              {isCategoryModalOpen && (
                <Modal open={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} size="md">
                  <Modal.Header
                    title={editingCategory ? 'Edit Store Category' : 'Create Store Category'}
                    description="Custom category entry for your menu mapping."
                  />
                  <form onSubmit={handleSaveCategory}>
                    <Modal.Content className="space-y-4">
                      {/* Platform Category Selector is first, as requested! */}
                      <Select
                        label="Platform Category Mapping"
                        required
                        placeholder="Select Platform Category"
                        value={categoryForm.platformCategoryId}
                        onValueChange={(val) => setCategoryForm({ ...categoryForm, platformCategoryId: val })}
                        options={platformCategories.map(pc => ({
                          value: String(pc.id),
                          label: pc.name
                        }))}
                      />
                      <Input
                        label="Category Name"
                        required
                        placeholder="e.g. Traditional Hand-Tossed Pizzas"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      />
                      <Input
                        label="Description"
                        placeholder="Describe the category items..."
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      />
                      <Select
                        label="Status"
                        value={categoryForm.status}
                        onValueChange={(val) => setCategoryForm({ ...categoryForm, status: val })}
                        options={[
                          { value: 'ACTIVE', label: 'Active' },
                          { value: 'INACTIVE', label: 'Inactive' }
                        ]}
                      />

                      {/* Image Upload */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground block">
                          Category Image
                        </label>
                        <div className="flex items-center gap-4 p-3 bg-muted/20 border border-dashed border-border/60 rounded-2xl">
                          {/* Preview box */}
                          <div className="h-14 w-14 rounded-xl border border-border bg-card flex items-center justify-center overflow-hidden shrink-0">
                            {categoryImagePreview ? (
                              <img src={categoryImagePreview} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                              <Upload size={18} className="text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <input
                              type="file"
                              id="store-category-image-file"
                              accept="image/*"
                              onChange={handleCategoryFileChange}
                              className="hidden"
                            />
                            <label
                              htmlFor="store-category-image-file"
                              className="inline-flex items-center justify-center px-3 py-1.5 border border-border bg-card rounded-lg text-xs font-semibold text-foreground hover:bg-muted/10 cursor-pointer transition-colors shadow-xs"
                            >
                              Choose Image File
                            </label>
                            <p className="text-[10px] text-muted-foreground">JPEG, PNG, WEBP formats allowed.</p>
                          </div>
                        </div>
                      </div>
                    </Modal.Content>
                    <Modal.Footer>
                      <div className="flex gap-2 justify-end w-full">
                        <Button variant="ghost" size="sm" onClick={() => setIsCategoryModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="primary" type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
                          {editingCategory ? 'Update Category' : 'Create Category'}
                        </Button>
                      </div>
                    </Modal.Footer>
                  </form>
                </Modal>
              )}

              {/* Custom Category Confirm Delete Modal */}
              {deleteTargetCategory && (
                <Modal open={!!deleteTargetCategory} onClose={() => setDeleteTargetCategory(null)} size="sm">
                  <Modal.Header
                    title="Confirm Deletion"
                    description={`Are you absolutely sure you want to permanently delete custom category "${deleteTargetCategory.name}"? This action is irreversible.`}
                  />
                  <Modal.Footer>
                    <div className="flex gap-2 justify-end w-full">
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTargetCategory(null)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleDeleteCategory}
                        className="bg-rose-500 hover:bg-rose-600 text-white shadow-xs border-transparent"
                      >
                        Delete Category
                      </Button>
                    </div>
                  </Modal.Footer>
                </Modal>
              )}
            </div>
          )}

          {activePage === 'menu' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">Store Menu</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage food dishes, descriptions, prices and active storefront visibility.</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsFoodModalOpen(true)}
                  leftIcon={<Plus size={16} />}
                  className="font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                >
                  Add Food Item
                </Button>
              </div>

              {/* Foods List Table */}
              <Card className="border border-border/40 shadow-xs bg-card">
                <CardContent className="p-0">
                  <DataTable
                    data={foods}
                    pagination={false}
                    searchable={false}
                    toolbar={null}
                    columns={[
                      {
                        id: 'dish',
                        label: 'Dish / Item Name',
                        cell: ({ row }) => (
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                              <UtensilsCrossed size={14} />
                            </div>
                            <div>
                              <p className="font-extrabold text-sm text-foreground">{row.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic max-w-xs">{row.description || 'No description'}</p>
                            </div>
                          </div>
                        )
                      },
                      {
                        id: 'category',
                        label: 'Category',
                        cell: ({ row }) => (
                          <Badge variant="soft" color="neutral" className="font-bold text-[9px] uppercase px-2 py-0.5">
                            {row.category}
                          </Badge>
                        )
                      },
                      {
                        id: 'price',
                        label: 'Base Price',
                        cell: ({ row }) => (
                          <span className="font-bold text-foreground">${Number(row.price).toFixed(2)}</span>
                        )
                      },
                      {
                        id: 'status',
                        label: 'Status',
                        cell: ({ row }) => (
                          row.status === 'ACTIVE' 
                            ? <Badge variant="soft" color="success" className="font-bold text-[9px] uppercase px-2 py-0.5">Active</Badge>
                            : <Badge variant="soft" color="neutral" className="font-bold text-[9px] uppercase px-2 py-0.5">Hidden</Badge>
                        )
                      },
                      {
                        id: 'actions',
                        label: '',
                        align: 'right' as const,
                        cell: ({ row }) => (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleToggleFoodStatus(row.id)}
                              leftIcon={<Power size={12} />}
                              className={`font-semibold ${
                                row.status === 'ACTIVE' 
                                  ? 'border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white' 
                                  : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                              }`}
                            >
                              {row.status === 'ACTIVE' ? 'Hide' : 'Activate'}
                            </Button>
                          </div>
                        )
                      }
                    ]}
                  />
                </CardContent>
              </Card>

              {/* Add Food Modal */}
              {isFoodModalOpen && (
                <Modal open={isFoodModalOpen} onClose={() => setIsFoodModalOpen(false)} size="md">
                  <Modal.Header 
                    title="Add Food Item" 
                    description="Create a new dish entry on your store storefront menu."
                  />
                  <form onSubmit={handleAddFood}>
                    <Modal.Content className="space-y-4">
                      <Input
                        label="Item Name"
                        required
                        placeholder="e.g. Garlic Parmesan Wings"
                        value={foodForm.name}
                        onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                      />
                      <Input
                        label="Price ($ USD)"
                        required
                        type="number"
                        step="0.01"
                        placeholder="e.g. 9.99"
                        value={foodForm.price}
                        onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                      />
                      <Select
                        label="Category"
                        value={foodForm.category}
                        onValueChange={(val) => setFoodForm({ ...foodForm, category: val })}
                        options={[
                          { value: 'Burgers', label: 'Burgers' },
                          { value: 'Pizza', label: 'Pizza' },
                          { value: 'Appetizers', label: 'Appetizers' },
                          { value: 'Beverages', label: 'Beverages' }
                        ]}
                      />
                      <Input
                        label="Description"
                        placeholder="Describe the ingredients and preparation details..."
                        value={foodForm.description}
                        onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                      />
                    </Modal.Content>
                    <Modal.Footer>
                      <div className="flex gap-2 justify-end w-full">
                        <Button variant="ghost" size="sm" onClick={() => setIsFoodModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="primary" type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shadow-xs">
                          Add to Menu
                        </Button>
                      </div>
                    </Modal.Footer>
                  </form>
                </Modal>
              )}
            </div>
          )}

          {activePage === 'orders' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Store Orders</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage live incoming orders, prepare dishes, and update riders.</p>
              </div>

              {/* Orders List */}
              <div className="grid grid-cols-1 gap-4">
                {orders.map(order => (
                  <Card key={order.id} className="border border-border/40 shadow-xs bg-card">
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-foreground">Order #{order.id}</span>
                          <span className="text-[10px] text-muted-foreground">• Received: {order.date}</span>
                          {order.status === 'PENDING' && <Badge variant="soft" color="warning" className="font-bold text-[9px] px-2 py-0.5">Pending Review</Badge>}
                          {order.status === 'PREPARING' && <Badge variant="soft" color="primary" className="font-bold text-[9px] px-2 py-0.5">Preparing</Badge>}
                          {order.status === 'READY' && <Badge variant="soft" color="success" className="font-bold text-[9px] px-2 py-0.5">Ready for Pickup</Badge>}
                          {order.status === 'DELIVERED' && <Badge variant="soft" color="neutral" className="font-bold text-[9px] px-2 py-0.5">Completed</Badge>}
                        </div>
                        <p className="text-xs font-semibold text-foreground">{order.items}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                          <span>Customer: <strong className="text-foreground">{order.customerName}</strong></span>
                          <span>•</span>
                          <span>Total Amount: <strong className="text-foreground">${order.total.toFixed(2)}</strong></span>
                        </div>
                      </div>

                      {/* Action buttons based on status */}
                      <div className="flex items-center gap-2 shrink-0">
                        {order.status === 'PENDING' && (
                          <Button
                            size="xs"
                            variant="primary"
                            onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                            className="bg-amber-500 hover:bg-amber-600 text-white shadow-xs font-semibold"
                          >
                            Accept & Prepare
                          </Button>
                        )}
                        {order.status === 'PREPARING' && (
                          <Button
                            size="xs"
                            variant="primary"
                            onClick={() => handleUpdateOrderStatus(order.id, 'READY')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold border-transparent"
                          >
                            Mark Ready
                          </Button>
                        )}
                        {order.status === 'READY' && (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                            <CheckCircle2 size={14} />
                            <span>Waiting for delivery rider...</span>
                          </div>
                        )}
                        {order.status === 'DELIVERED' && (
                          <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">Settled</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </Content>
      </Main>
    </AppShell>
  );
}
