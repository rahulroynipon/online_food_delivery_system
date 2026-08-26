import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Info from './pages/Info';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, toast } from './design-system';
import { Loader2, LogOut, User as UserIcon, Calendar, Phone, ShieldCheck, Mail, Bell } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function Dashboard() {
  const { user, token, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<{ id: string; event: string; message: string; timestamp: Date }[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:5005?token=${token}`;

    console.log('[WebSocket] Connecting to:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'NEW_RESTAURANT_APPLICATION') {
          const message = `New Restaurant: "${payload.data.name}" by ${payload.data.owner}`;
          toast.success(message, { duration: 6000 });
          setNotifications((prev) => [
            {
              id: payload.data.id + '-' + Date.now(),
              event: payload.event,
              message,
              timestamp: new Date(payload.timestamp),
            },
            ...prev,
          ]);
        } else if (payload.event === 'NEW_RIDER_APPLICATION') {
          const message = `New Rider: ${payload.data.fullName} (${payload.data.vehicleType})`;
          toast.info(message, { duration: 6000 });
          setNotifications((prev) => [
            {
              id: payload.data.id + '-' + Date.now(),
              event: payload.event,
              message,
              timestamp: new Date(payload.timestamp),
            },
            ...prev,
          ]);
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
    };

    return () => {
      ws.close();
    };
  }, [user, token]);

  return (
    <div className="min-h-screen bg-muted/20 text-foreground select-none">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/10">
              <span className="font-bold text-sm text-primary-foreground">BS</span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">BiteSpeed</h1>
              <p className="text-[10px] text-muted-foreground -mt-1 font-medium">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'ADMIN' && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 rounded-full hover:bg-muted"
                >
                  <Bell className="h-5 w-5 text-foreground" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-[10px] font-black rounded-full flex items-center justify-center animate-bounce shadow-md">
                      {notifications.length}
                    </span>
                  )}
                </Button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-card border border-border/80 rounded-2xl shadow-2xl z-50 p-4 animate-fade-in divide-y divide-border/10">
                    <div className="flex justify-between items-center pb-3">
                      <h3 className="font-bold text-sm text-foreground">Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => setNotifications([])}
                          className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No new onboarding applications.
                      </div>
                    ) : (
                      <div className="pt-2 space-y-3">
                        {notifications.map((notif) => (
                          <div key={notif.id} className="text-xs py-2 flex flex-col gap-1">
                            <span className="font-medium text-foreground">{notif.message}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(notif.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              leftIcon={<LogOut className="h-4 w-4" />}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-6">
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold tracking-tight mb-1">Welcome back, {user?.name}!</h2>
            <p className="text-sm text-muted-foreground">Here is your account details and profile overview.</p>
          </div>

          <Card hoverable className="border-border/50 shadow-md">
            <CardHeader className="pb-3 border-b border-border/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="font-semibold text-base">{user?.name}</CardTitle>
                  <CardDescription>{user?.role} Portal Access</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Email Address</p>
                    <p className="text-xs font-medium text-foreground truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card">
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-500 shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Phone Number</p>
                    <p className="text-xs font-medium text-foreground truncate">{user?.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Security Role</p>
                    <p className="text-xs font-medium text-foreground truncate">{user?.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Account Status</p>
                    <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                      {user?.status}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/info" element={<Info />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
