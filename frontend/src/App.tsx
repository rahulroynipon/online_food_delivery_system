import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Partner from './pages/Partner';
import Signup from './pages/Signup';
import OTPVerify from './pages/OTPVerify';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import DashboardPage from './pages/admin/DashboardPage';
import RestaurantsPage from './pages/admin/RestaurantsPage';
import RidersPage from './pages/admin/RidersPage';
import SettingsPage from './pages/admin/SettingsPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import ZonesPage from './pages/admin/ZonesPage';
import UsersPage from './pages/admin/UsersPage';
import AdminPayoutsPage from './pages/admin/PayoutsPage';
import PlaceholderPage from './pages/admin/PlaceholderPage';
import RestaurantDashboard from './pages/RestaurantDashboard';
import RestaurantOverview from './pages/restaurant/OverviewPage';
import RestaurantCategories from './pages/restaurant/CategoriesPage';
import RestaurantMenu from './pages/restaurant/MenuPage';
import RestaurantOrders from './pages/restaurant/OrdersPage';
import RestaurantHistory from './pages/restaurant/HistoryPage';
import RestaurantOrderDetail from './pages/restaurant/OrderDetailPage';
import RestaurantAddons from './pages/restaurant/AddonsPage';
import RestaurantReviews from './pages/restaurant/ReviewsPage';
import FoodFormPage from './pages/restaurant/FoodFormPage';
import HomePage from './pages/customer/HomePage';
import CustomerRestaurants from './pages/customer/RestaurantsPage';
import CustomerRestaurantMenu from './pages/customer/RestaurantMenuPage';
import CartPage from './pages/customer/CartPage';
import Checkout from './pages/customer/Checkout';
import PaymentGateway from './pages/customer/PaymentGateway';
import OrderTracking from './pages/customer/OrderTracking';
import CustomerOrders from './pages/customer/OrdersPage';
import RiderDashboard from './pages/RiderDashboard';
import RiderOverview from './pages/rider/OverviewPage';
import RiderDeliveries from './pages/rider/DeliveriesPage';
import RiderHistory from './pages/rider/HistoryPage';
import RiderOrderDetail from './pages/rider/OrderDetailPage';
import RiderWallet from './pages/rider/WalletPage';
import RiderProfile from './pages/rider/ProfilePage';
import RiderReviews from './pages/rider/ReviewsPage';
import RestaurantWallet from './pages/restaurant/WalletPage';
import api from './lib/axios';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Tabs, toast } from './design-system';
import { Loader2, LogOut, User as UserIcon, Calendar, Phone, ShieldCheck, Mail, Bell, Store, Bike, Users, CheckCircle, XCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'ADMIN' | 'RESTAURANT' | 'RIDER' | 'CUSTOMER';
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

  if (user.role === 'CUSTOMER') {
    return <Navigate to="/" replace />;
  }

  if (user.role === 'RIDER') {
    return <Navigate to="/rider" replace />;
  }

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
        <Route path="/otp-verify" element={<OTPVerify />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/payment/gateway" element={<PaymentGateway />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRole="CUSTOMER">
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-tracking"
          element={
            <ProtectedRoute allowedRole="CUSTOMER">
              <OrderTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRole="CUSTOMER">
              <CustomerOrders />
            </ProtectedRoute>
          }
        />

        {/* Rider Portal Nested Routes */}
        <Route
          path="/rider"
          element={
            <ProtectedRoute allowedRole="RIDER">
              <RiderDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<RiderOverview />} />
          <Route path="deliveries" element={<RiderDeliveries />} />
          <Route path="history" element={<RiderHistory />} />
          <Route path="history/:orderId" element={<RiderOrderDetail />} />
          <Route path="orders/:orderId" element={<RiderOrderDetail />} />
          <Route path="reviews" element={<RiderReviews />} />
          <Route path="wallet" element={<RiderWallet />} />
          <Route path="profile" element={<RiderProfile />} />
        </Route>

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
          <Route path="withdrawals" element={<AdminPayoutsPage />} />
          <Route path="payouts" element={<AdminPayoutsPage />} />
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
          <Route path="history" element={<RestaurantHistory />} />
          <Route path="history/:orderId" element={<RestaurantOrderDetail />} />
          <Route path="orders/:orderId" element={<RestaurantOrderDetail />} />
          <Route path="addons" element={<RestaurantAddons />} />
          <Route path="reviews" element={<RestaurantReviews />} />
          <Route path="wallet" element={<RestaurantWallet />} />
        </Route>

        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants" element={<CustomerRestaurants />} />
        <Route path="/restaurant/:slug" element={<CustomerRestaurantMenu />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="*" element={<DashboardRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
