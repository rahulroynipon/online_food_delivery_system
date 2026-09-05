import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  AppShell,
  Sidebar,
  SidebarTrigger,
  Header,
  Main,
  Content,
  Dropdown,
  Button,
  Badge,
  toast 
} from '../design-system';
import { 
  Bike, 
  MapPin, 
  Store, 
  User, 
  Mail, 
  Phone, 
  ClipboardList, 
  CheckCircle2, 
  LogOut, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Bell, 
  Wallet, 
  Check, 
  Loader2, 
  VolumeX, 
  Volume2, 
  ShoppingBag, 
  CreditCard, 
  Settings, 
  History,
  LayoutDashboard,
  ShieldCheck,
  Package,
  Star
} from 'lucide-react';
import api from '../lib/axios';

const getRelativeTime = (dateInput: any) => {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
};

export default function RiderDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, token } = useAuthStore();
  const [riderProfile, setRiderProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [activeTasksCount, setActiveTasksCount] = useState(0);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('notif_sound') === 'off');

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    localStorage.setItem('notif_sound', nextState ? 'off' : 'on');
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/onboarding/my-rider');
      if (response.data?.success) {
        setRiderProfile(response.data.rider);
      }
    } catch {
      // ignore
    }
  };

  const fetchActiveCount = async () => {
    try {
      const res = await api.get('/orders/rider');
      if (res.data?.success) {
        setActiveTasksCount((res.data.orders || []).length);
      }
    } catch {
      // ignore
    }
  };

  const handleToggleAvailability = async () => {
    setIsTogglingAvailability(true);
    try {
      const response = await api.put('/onboarding/my-rider/toggle-availability');
      if (response.data?.success) {
        setRiderProfile((prev: any) => prev ? { ...prev, isAvailable: response.data.isAvailable } : prev);
        toast.success(response.data.message);
      }
    } catch {
      toast.error('Failed to update availability status.');
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  // Sound notification trigger (Dual-tone ascending chime)
  const playNotificationSound = () => {
    if (localStorage.getItem('notif_sound') === 'off') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.14);
      gain2.gain.setValueAtTime(0.35, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.55);
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
    fetchActiveCount();
    fetchNotifications();
  }, []);

  // Live WebSocket support for notifications & real-time assignments
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

      console.log('[WebSocket Rider] Connecting to:', wsUrl);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket Rider] Connected successfully');
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.event === 'NEW_ASSIGNMENT' || payload.event === 'NEW_ORDER') {
            const data = payload.data;
            const message = data?.message || `New delivery assignment received for Order #${data?.orderId || ''}!`;
            toast.success(message, { duration: 8000 });
            playNotificationSound();
            fetchNotifications();
            fetchActiveCount();
            window.dispatchEvent(new CustomEvent('NEW_RIDER_ORDER', { detail: data }));
          } else if (payload.event === 'NOTIFICATION_ADDED') {
            fetchNotifications();
            playNotificationSound();
          }
        } catch (err) {
          console.error('[WebSocket Rider] Error handling message:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WebSocket Rider] Disconnected');
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

  const menuItems = [
    {
      id: 'overview',
      label: 'Live Dashboard',
      icon: <LayoutDashboard size={18} />,
      path: '/rider',
    },
    {
      id: 'deliveries',
      label: 'Active Deliveries',
      icon: <Package size={18} />,
      path: '/rider/deliveries',
      badge: activeTasksCount > 0 ? (
        <span className="h-5 min-w-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center bg-primary text-primary-foreground shadow-xs">
          {activeTasksCount}
        </span>
      ) : null
    },
    {
      id: 'history',
      label: 'Delivery History',
      icon: <History size={18} />,
      path: '/rider/history',
    },
    {
      id: 'reviews',
      label: 'Reviews & Ratings',
      icon: <Star size={18} />,
      path: '/rider/reviews',
    },
    {
      id: 'wallet',
      label: 'Earnings & Wallet',
      icon: <Wallet size={18} />,
      path: '/rider/wallet',
    },
    {
      id: 'profile',
      label: 'Profile & Vehicle',
      icon: <User size={18} />,
      path: '/rider/profile',
    }
  ];

  return (
    <AppShell sidebarWidth={256} collapsedWidth={64} desktopBehavior="collapse" defaultCollapsed={false}>
      {/* Sidebar navigation */}
      <Sidebar className="border-r border-border/40 bg-card flex flex-col select-none overflow-y-auto shrink-0">
        {/* Sidebar Header Brand */}
        <div className="h-16 flex items-center px-6 border-b border-border/10 gap-3 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/10">
            <Bike size={18} className="text-primary-foreground" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-foreground appshell-sidebar-label">Rider Portal</span>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.id === 'overview'}
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
                    <span className="appshell-sidebar-label text-nowrap">{item.label}</span>
                  </div>
                  {item.badge}
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
                {riderProfile?.user?.name || user?.name || 'Delivery Partner'}
              </h1>
              <p className="text-[9px] text-muted-foreground -mt-0.5 font-medium">
                Vehicle: {riderProfile?.vehicleType || 'MOTORBIKE'}
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            
            {/* Online / Offline Availability Toggle */}
            <button
              onClick={handleToggleAvailability}
              disabled={isTogglingAvailability}
              title={riderProfile?.isAvailable ? 'Click to go Offline' : 'Click to go Online'}
              className={`
                relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-extrabold tracking-wide uppercase transition-all duration-200 cursor-pointer select-none
                ${riderProfile?.isAvailable
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20'
                  : 'bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/60'
                }
                ${isTogglingAvailability ? 'opacity-60 cursor-not-allowed' : ''}
              `}
            >
              {isTogglingAvailability ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <span className={`h-2 w-2 rounded-full ${riderProfile?.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
              )}
              <span>{riderProfile?.isAvailable ? 'Online & Available' : 'Offline'}</span>
            </button>

            {/* Notification Dropdown */}
            <Dropdown>
              <Dropdown.Trigger>
                <button className="relative p-2 rounded-full hover:bg-muted transition-colors cursor-pointer">
                  <Bell className="h-[18px] w-[18px] text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-1 bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center shadow-md ring-2 ring-card animate-bounce">
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
                      <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bell size={12} className="text-primary" />
                      </div>
                      <span className="font-bold text-[13px] text-foreground tracking-tight">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="h-5 min-w-5 px-1.5 bg-primary text-primary-foreground text-[10px] font-black rounded-full flex items-center justify-center">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarkAllAsRead(); }}
                        className="text-[10px] font-bold text-primary/80 hover:text-primary hover:underline cursor-pointer transition-colors px-2 py-0.5 rounded-md hover:bg-primary/5"
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
                  notifications.slice(0, 5).map((notif) => {
                    const isOrder = notif.event === 'ORDER';
                    const isDelivery = notif.event === 'DELIVERY';
                    const isPayment = notif.event === 'PAYMENT';

                    let avatarStyle = 'bg-gradient-to-br from-pink-400 to-rose-600 text-white';
                    let avatarIcon = <Settings size={15} />;
                    let eventLabel = 'System';
                    let chipStyle = 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';

                    if (isOrder) {
                      avatarStyle = 'bg-gradient-to-br from-indigo-400 to-blue-600 text-white';
                      avatarIcon = <ShoppingBag size={15} />;
                      eventLabel = 'Order';
                      chipStyle = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400';
                    } else if (isDelivery) {
                      avatarStyle = 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white';
                      avatarIcon = <Bike size={15} />;
                      eventLabel = 'Delivery';
                      chipStyle = 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400';
                    } else if (isPayment) {
                      avatarStyle = 'bg-gradient-to-br from-amber-400 to-orange-500 text-white';
                      avatarIcon = <CreditCard size={15} />;
                      eventLabel = 'Payment';
                      chipStyle = 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
                    }

                    return (
                      <Dropdown.Item 
                        key={notif.id}
                        closeOnClick={true}
                        onClick={() => handleMarkAsRead(notif.id)}
                        content={
                          <div className={`flex items-start gap-3 w-full group py-0.5 ${!notif.read ? '' : 'opacity-60'}`}>
                            <div className="relative shrink-0 mt-0.5">
                              <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${avatarStyle}`}>
                                {avatarIcon}
                              </div>
                              {!notif.read && (
                                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary border-[2.5px] border-popover shadow-sm animate-pulse" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${chipStyle}`}>
                                  {eventLabel}
                                </span>
                                {!notif.read && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs leading-snug line-clamp-2 ${!notif.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                {notif.message}
                              </p>
                              <span className="text-[9px] text-muted-foreground/75 mt-0.5 block">
                                {getRelativeTime(notif.createdAt)}
                              </span>
                            </div>

                            {!notif.read && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id, e); }}
                                className="shrink-0 opacity-0 group-hover:opacity-100 mt-1 p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-all cursor-pointer"
                                title="Mark as read"
                              >
                                <Check size={11} />
                              </button>
                            )}
                          </div>
                        }
                      />
                    );
                  })
                )}

                <Dropdown.Separator />

                {/* Footer Sound Settings Toggle */}
                <Dropdown.Item
                  closeOnClick={false}
                  onClick={toggleMute}
                  content={
                    <div className={`flex items-center gap-2 w-full text-[11px] font-semibold ${isMuted ? 'text-rose-500' : 'text-muted-foreground'}`}>
                      <div className={`relative h-5 w-5 rounded-md flex items-center justify-center ${isMuted ? 'bg-rose-50 dark:bg-rose-500/10' : 'bg-muted'}`}>
                        {isMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                        {!isMuted && (
                          <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-popover" />
                        )}
                      </div>
                      <span>{isMuted ? 'Notifications muted' : 'Sound enabled'}</span>
                    </div>
                  }
                />
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
