import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import ProtectedRoute from './src/components/ProtectedRoute';

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

// Account Pages
import Profile from './src/pages/account/Profile';
import Orders from './src/pages/account/Orders';
import OrderDetail from './src/pages/account/OrderDetail';
import Settings from './src/pages/account/Settings';

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

        {/* Shop Routes (Public) */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductList />} />
        {/* Giữ nguyên products/:id để không bị trắng màn hình */}
        <Route path="/products/:id" element={<ProductDetail />} />

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
        <AppRoutes />
      </ToastProvider>
    </HashRouter>
  );
};

export default App;