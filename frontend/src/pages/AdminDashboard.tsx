import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/axios';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  toast,
  Badge,
  AppShell,
  Sidebar,
  SidebarTrigger,
  Header,
  Main,
  Content,
  Dropdown
} from '../design-system';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Bike, 
  ClipboardList, 
  MapPin, 
  CreditCard, 
  ArrowDownToLine, 
  CheckSquare, 
  Layers, 
  Map, 
  BarChart3, 
  Settings, 
  Bell, 
  LogOut, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  DollarSign,
  Wallet,
  ArrowUpRight,
  Loader2,
  Check,
  Volume2,
  VolumeX
} from 'lucide-react';

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

export default function AdminDashboard() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<{ id: number; event: string; message: string; createdAt: string; read: boolean; user?: { id: number; name: string; email: string } }[]>([]);

  // Notification sound — persisted in localStorage
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('notif_sound') === 'off';
  });

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem('notif_sound', next ? 'off' : 'on');
      return next;
    });
  };

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);        // A5
      oscillator.frequency.setValueAtTime(1046, ctx.currentTime + 0.1); // C6

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Audio API not available
    }
  };

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

  const handleNotifClick = async (id: number, event: string) => {
    await handleMarkAsRead(id);
    if (event === 'NEW_RESTAURANT_APPLICATION') {
      navigate('/admin/restaurants');
    } else if (event === 'NEW_RIDER_APPLICATION') {
      navigate('/admin/riders');
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
    fetchNotifications();
  }, []);

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

      console.log('[WebSocket] Connecting to:', wsUrl);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connected successfully');
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'NEW_RESTAURANT_APPLICATION') {
            const message = `New Restaurant: "${payload.data.name}" by ${payload.data.owner}`;
            toast.success(message, { duration: 6000 });
            if (localStorage.getItem('notif_sound') !== 'off') playNotificationSound();
            fetchNotifications();
          } else if (payload.event === 'NEW_RIDER_APPLICATION') {
            const message = `New Rider: ${payload.data.fullName} (${payload.data.vehicleType})`;
            toast.info(message, { duration: 6000 });
            if (localStorage.getItem('notif_sound') !== 'off') playNotificationSound();
            fetchNotifications();
          }
        } catch (err) {
          console.error('[WebSocket] Parsing message error:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Connection error:', err);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Connection closed');
        if (isMounted) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`[WebSocket] Reconnecting in ${delay}ms...`);
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
    { id: 'dashboard',   label: 'Dashboard',   icon: <LayoutDashboard size={18} />,  path: '/admin' },
    { id: 'users',       label: 'Users',        icon: <Users size={18} />,            path: '/admin/users' },
    { id: 'restaurants', label: 'Restaurants',  icon: <Store size={18} />,            path: '/admin/restaurants' },
    { id: 'riders',      label: 'Riders',       icon: <Bike size={18} />,             path: '/admin/riders' },
    { id: 'orders',      label: 'Orders',       icon: <ClipboardList size={18} />,    path: '/admin/orders' },
    { id: 'delivery',    label: 'Delivery',     icon: <MapPin size={18} />,           path: '/admin/delivery' },
    { id: 'payments',    label: 'Payments',     icon: <CreditCard size={18} />,       path: '/admin/payments' },
    { id: 'withdrawals', label: 'Withdrawals',  icon: <ArrowDownToLine size={18} />,  path: '/admin/withdrawals' },
    { id: 'settlements', label: 'Settlements',  icon: <CheckSquare size={18} />,      path: '/admin/settlements' },
    { id: 'categories',  label: 'Categories',   icon: <Layers size={18} />,           path: '/admin/categories' },
    { id: 'zones',       label: 'Zones',        icon: <Map size={18} />,              path: '/admin/zones' },
    { id: 'reports',     label: 'Reports',      icon: <BarChart3 size={18} />,        path: '/admin/reports' },
    { id: 'settings',    label: 'Settings',     icon: <Settings size={18} />,         path: '/admin/settings' },
  ];

  return (
    <AppShell sidebarWidth={256} collapsedWidth={64} desktopBehavior="collapse" defaultCollapsed={false}>
      {/* Left Navigation Sidebar */}
      <Sidebar className="border-r border-border/40 bg-card flex flex-col select-none overflow-y-auto shrink-0">
        {/* Sidebar Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-border/10 gap-3 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/10">
            <span className="font-bold text-sm text-primary-foreground">BS</span>
          </div>
          <span className="font-extrabold text-sm tracking-tight text-foreground appshell-sidebar-label">FoodGo Admin</span>
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
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-4">
            {/* Notification Dropdown */}
            <Dropdown>
              <Dropdown.Trigger>
                <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
                  <Bell className="h-[18px] w-[18px] text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-1 bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center shadow-md ring-2 ring-card">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </Dropdown.Trigger>

              <Dropdown.Menu align="end" width={340} sideOffset={10}>
                {/* ── Header ── */}
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

                {/* ── Notification list ── */}
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
                  notifications.map((notif) => {
                    const isRestaurant = notif.event === 'NEW_RESTAURANT_APPLICATION';
                    const isRider = notif.event === 'NEW_RIDER_APPLICATION';

                    // Avatar initial
                    let initial = '?';
                    if (isRestaurant) {
                      const m = notif.message.match(/"([^"]+)"/);
                      if (m?.[1]) initial = m[1][0].toUpperCase();
                    } else if (isRider) {
                      const m = notif.message.match(/New Rider:\s*([^\s(]+)/);
                      if (m?.[1]) initial = m[1][0].toUpperCase();
                    }

                    // Color scheme per event type
                    const avatarStyle = isRestaurant
                      ? 'bg-gradient-to-br from-orange-400 to-rose-500 text-white'
                      : isRider
                        ? 'bg-gradient-to-br from-sky-400 to-indigo-500 text-white'
                        : 'bg-gradient-to-br from-violet-400 to-purple-600 text-white';

                    const eventLabel = isRestaurant ? 'Restaurant' : isRider ? 'Rider' : 'System';
                    const chipStyle = isRestaurant
                      ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
                      : isRider
                        ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400'
                        : 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400';

                    return (
                      <Dropdown.Item
                        key={notif.id}
                        closeOnClick={false}
                        onClick={() => handleNotifClick(notif.id, notif.event)}
                        content={
                          <div className={`flex items-start gap-3 w-full group py-0.5 ${!notif.read ? '' : 'opacity-60'}`}>
                            {/* Gradient avatar */}
                            <div className="relative shrink-0 mt-0.5">
                              <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${avatarStyle}`}>
                                {isRestaurant ? <Store size={15} /> : initial}
                              </div>
                              {!notif.read && (
                                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary border-[2.5px] border-popover shadow-sm" />
                              )}
                            </div>

                            {/* Content */}
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
                              <p className={`text-xs leading-snug ${!notif.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                {notif.message}
                              </p>
                              <span className="text-[10px] text-muted-foreground/70 mt-0.5 block">
                                {getRelativeTime(notif.createdAt)}
                              </span>
                            </div>

                            {/* Mark read on hover */}
                            {!notif.read && (
                              <button
                                onClick={(e) => handleMarkAsRead(notif.id, e)}
                                className="shrink-0 opacity-0 group-hover:opacity-100 mt-1 p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-all"
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

                {/* ── Footer: sound toggle ── */}
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

            {/* Profile Dropdown / Trigger */}
            <div className="flex items-center gap-2 border-l border-border/30 pl-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-foreground leading-none">{user?.name || 'Admin'}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5 leading-none">Administrator</p>
              </div>
            </div>

            {/* Logout */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              className="p-2 rounded-full hover:bg-muted text-rose-500 hover:text-rose-600 ml-1"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </Header>

        {/* Right Main Content */}
        <Content className="p-8 overflow-y-auto">
          <Outlet/>
        </Content>
      </Main>
    </AppShell>
  );
}
