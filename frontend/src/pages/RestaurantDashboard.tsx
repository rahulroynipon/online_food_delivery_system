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
import { NavLink, useLocation, Outlet, useOutletContext } from 'react-router-dom';

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

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
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

  const activeOrdersCount = 3;

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
      id: 'addons',
      label: 'Store Add-ons',
      icon: <Layers size={18} />,
      path: '/restaurant/addons',
    },
    {
      id: 'orders',
      label: 'Incoming Orders',
      icon: <ClipboardList size={18} />,
      path: '/restaurant/orders',
      badge: activeOrdersCount > 0 ? (
        <span className={`h-5 min-w-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center bg-primary text-primary-foreground shadow-xs`}>
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
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/10">
            <UtensilsCrossed size={18} className="text-primary-foreground" />
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
          <Outlet />
        </Content>
      </Main>
    </AppShell>
  );
}
