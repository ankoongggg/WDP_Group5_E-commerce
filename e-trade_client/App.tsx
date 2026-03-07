import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { CartProvider } from './src/context/CartContext';
import ProtectedRoute from './src/components/ProtectedRoute';
import { CurrencyProvider } from './src/context/CurrencyContext';

//Route components
import AdminRoute from './src/routes/adminRoutes';

// Auth Pages
import Login from './src/pages/auth/Login';
import Register from './src/pages/auth/Register';
import SecurityOtp from './src/pages/auth/SecurityOtp';
import ForgotPassword from './src/pages/auth/ForgotPassword';
import ResetPassword from './src/pages/auth/ResetPassword';
import GoogleCallback from './src/pages/auth/GoogleCallback';

// Shop Pages
import Home from './src/pages/shop/Home';
import ProductList from './src/pages/shop/ProductList';
import ProductDetail from './src/pages/shop/ProductDetail';
import Cart from './src/pages/shop/Cart';
import Checkout from './src/pages/shop/Checkout';
import StoreDetail from './src/pages/shop/StoreDetail';
import OrderManagement from './src/pages/shop/OrderManagement';
import SellerDashboard from './src/pages/seller/SellerDashboard';  

// Account Pages
import Profile from './src/pages/account/Profile';
import OrderDetail from './src/pages/account/OrderDetail';
import Settings from './src/pages/account/Settings';
import FeedbackProduct from './src/pages/account/FeedbackProduct';

// Admin Pages
import AdminDashboard from './src/pages/admin/Dashboard';
import {AdminBlacklist} from './src/pages/admin/BlackList';
import {AdminProducts} from './src/pages/admin/Products';
import {AdminReports} from './src/pages/admin/Reports';
import OrderHistory from './src/pages/account/OrderHistory';
// import UserManagement from './src/pages/admin/UserManagement';
import { AdminCategories } from './src/pages/admin/Categories';
import SellerRequests from './src/pages/admin/SellerRequests';
import { AdminStores } from './src/pages/admin/Stores';

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
        <Route path="/auth/google-callback" element={<GoogleCallback />} />

        {/* Shop Routes (Public) */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/store/:id" element={<StoreDetail />} />

        {/* Protected Routes (Phải đăng nhập mới vào được) */}
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/account/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
        <Route path="/account/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/account/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/account/feedback" element={<ProtectedRoute><FeedbackProduct /></ProtectedRoute>} />

        {/* Seller Routes */}
        <Route path="/seller/dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
        <Route path="/seller/orders" element={<ProtectedRoute><OrderManagement /></ProtectedRoute>} />

        {/* Admin Routes (Có thể thêm sau) */}
        <Route element={<AdminRoute />}>
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/blacklist" element={<ProtectedRoute><AdminBlacklist /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
        <Route path="/admin/seller-requests" element={<ProtectedRoute><SellerRequests /></ProtectedRoute>} />
        <Route path="/admin/stores" element={<ProtectedRoute><AdminStores /></ProtectedRoute>} />
        
        </Route>
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