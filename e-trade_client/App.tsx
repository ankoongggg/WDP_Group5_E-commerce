import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Login from './src/pages/auth/Login';
import Register from './src/pages/auth/Register';
import SecurityOtp from './src/pages/auth/SecurityOtp';
import Home from './src/pages/shop/Home';
import ProductList from './src/pages/shop/ProductList';
import ProductDetail from './src/pages/shop/ProductDetail';
import Cart from './src/pages/shop/Cart';
import Checkout from './src/pages/shop/Checkout';
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

const App: React.FC = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/security" element={<SecurityOtp />} />

        {/* Shop Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* Account Routes */}
        <Route path="/account" element={<Profile />} />
        <Route path="/account/orders" element={<Orders />} />
        <Route path="/account/orders/:id" element={<OrderDetail />} />
        <Route path="/account/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  );
};

export default App;