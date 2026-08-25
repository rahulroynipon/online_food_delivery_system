import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from './design-system';
import { Loader2, LogOut, User as UserIcon, Calendar, Phone, ShieldCheck, Mail } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function Dashboard() {
  const { user, logout } = useAuthStore();

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
          <Button 
            variant="ghost" 
            size="sm"
            onClick={logout}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Sign Out
          </Button>
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
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
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
