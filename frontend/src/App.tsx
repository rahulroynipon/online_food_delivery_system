import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Partner from './pages/Partner';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import DashboardPage from './pages/admin/DashboardPage';
import RestaurantsPage from './pages/admin/RestaurantsPage';
import RidersPage from './pages/admin/RidersPage';
import SettingsPage from './pages/admin/SettingsPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import ZonesPage from './pages/admin/ZonesPage';
import UsersPage from './pages/admin/UsersPage';
import PlaceholderPage from './pages/admin/PlaceholderPage';
import RestaurantDashboard from './pages/RestaurantDashboard';
import RestaurantOverview from './pages/restaurant/OverviewPage';
import RestaurantCategories from './pages/restaurant/CategoriesPage';
import RestaurantMenu from './pages/restaurant/MenuPage';
import RestaurantOrders from './pages/restaurant/OrdersPage';
import RestaurantAddons from './pages/restaurant/AddonsPage';
import FoodFormPage from './pages/restaurant/FoodFormPage';
import api from './lib/axios';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Tabs, toast } from './design-system';
import { Loader2, LogOut, User as UserIcon, Calendar, Phone, ShieldCheck, Mail, Bell, Store, Bike, Users, CheckCircle, XCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'ADMIN' | 'RESTAURANT' | 'RIDER';
}

function ProtectedRoute({ children, allowedRole = 'ADMIN' }: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized, user, logout } = useAuthStore();

  useEffect(() => {
    if (isInitialized && isAuthenticated && user && user.role !== allowedRole) {
      toast.error(`Access Denied: Only ${allowedRole.toLowerCase()}s are authorized to access this section.`);
      logout();
    }
  }, [isInitialized, isAuthenticated, user, logout, allowedRole]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || (user && user.role !== allowedRole)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function DashboardRedirect() {
  const { isAuthenticated, user, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === 'RESTAURANT') {
    return <Navigate to="/restaurant" replace />;
  }

  // Default fallback for customer/rider
  return <Navigate to="/login" replace />;
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
        <Route path="/signup" element={<Signup />} />
        <Route path="/partner" element={<Partner />} />

        {/* Admin layout — AdminDashboard renders <Outlet /> */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="restaurants" element={<RestaurantsPage />} />
          <Route path="riders" element={<RidersPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="zones" element={<ZonesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path=":section" element={<PlaceholderPage />} />
        </Route>

        <Route
          path="/restaurant"
          element={
            <ProtectedRoute allowedRole="RESTAURANT">
              <RestaurantDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<RestaurantOverview />} />
          <Route path="categories" element={<RestaurantCategories />} />
          <Route path="menu" element={<RestaurantMenu />} />
          <Route path="menu/create" element={<FoodFormPage />} />
          <Route path="menu/edit/:slug" element={<FoodFormPage />} />
          <Route path="orders" element={<RestaurantOrders />} />
          <Route path="addons" element={<RestaurantAddons />} />
        </Route>

        <Route path="/" element={<>hi</>} />
        <Route path="*" element={<DashboardRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
