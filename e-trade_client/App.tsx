import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { CartProvider } from './src/context/CartContext';
import ProtectedRoute from './src/components/ProtectedRoute';
import { CurrencyProvider } from './src/context/CurrencyContext';

// Auth Pages
import Login from './src/pages/auth/Login';
import Register from './src/pages/auth/Register';
import SecurityOtp from './src/pages/auth/SecurityOtp';
import ForgotPassword from './src/pages/auth/ForgotPassword';
import ResetPassword from './src/pages/auth/ResetPassword';

// Shop Pages
import Home from './src/pages/shop/Home';
import ProductList from './src/pages/shop/ProductList';
import ProductDetail from './src/pages/shop/ProductDetail';
import Cart from './src/pages/shop/Cart';
import Checkout from './src/pages/shop/Checkout';
import StoreDetail from './src/pages/shop/StoreDetail';

// Account Pages
import Profile from './src/pages/account/Profile';
import Orders from './src/pages/account/Orders';
import OrderDetail from './src/pages/account/OrderDetail';
import Settings from './src/pages/account/Settings';


// Admin Pages
import AdminDashboard from './src/pages/admin/Dashboard';
import {AdminUsers} from './src/pages/admin/Accounts';
import {AdminProducts} from './src/pages/admin/Products';
import {AdminReports} from './src/pages/admin/Reports';
import {AdminBlacklist} from './src/pages/admin/BlackList';
// import UserManagement from './src/pages/admin/UserManagement';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppRoutes: React.FC = () => {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/security" element={<SecurityOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/blacklist" element={<AdminBlacklist />} />

        
        {/* Shop Routes (Public) */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductList />} />
        {/* Giữ nguyên products/:id để không bị trắng màn hình */}
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/store/:id" element={<StoreDetail />} />

        {/* Protected Routes (Phải đăng nhập mới vào được) */}
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/account/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/account/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/account/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <ToastProvider>
        <CurrencyProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </CurrencyProvider>
      </ToastProvider>
    </HashRouter>
  );
};

export default App;