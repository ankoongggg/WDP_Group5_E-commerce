import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ProductCard from '../components/ProductCard'; // Re-use existing component
import {AccountLayout} from '../components/AccountLayout';
import { useAuth } from '../../context/AuthContext';
// --- Interfaces ---
interface Product {
  _id: string;
  name: string;
  main_image: string;
  price: number;
  original_price?: number;
  stock?: number;
  store_id?: { shop_name: string };
}

interface Store {
  _id: string;
  shop_name: string;
  description: string;
  user_id: { avatar: string };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const WishlistAndFollowing: React.FC = () => {
  const { toast } = useToast();
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'wishlist' | 'following'>('wishlist');

  // Wishlist State
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [wishlistPagination, setWishlistPagination] = useState<Pagination | null>(null);
  const [wishlistSearch, setWishlistSearch] = useState('');
  const debouncedWishlistSearch = useDebounce(wishlistSearch, 500);

  // Following Stores State
  const [following, setFollowing] = useState<Store[]>([]);
  const [followingLoading, setFollowingLoading] = useState(true);
  const [followingPagination, setFollowingPagination] = useState<Pagination | null>(null);
  const [followingSearch, setFollowingSearch] = useState('');
  const debouncedFollowingSearch = useDebounce(followingSearch, 500);

  const fetchWishlist = useCallback(async (page = 1, search = '') => {
    setWishlistLoading(true);
    try {
      const response = await authApi.getWishlist({ page, search, limit: 8 });
      setWishlist(response.data);
      setWishlistPagination(response.pagination);
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải danh sách yêu thích.');
    } finally {
      setWishlistLoading(false);
    }
  }, [toast]);

  const fetchFollowingStores = useCallback(async (page = 1, search = '') => {
    setFollowingLoading(true);
    try {
      const response = await authApi.getFollowingStores({ page, search, limit: 8 });
      setFollowing(response.data);
      setFollowingPagination(response.pagination);
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải danh sách cửa hàng.');
    } finally {
      setFollowingLoading(false);
    }
  }, [toast]);

  // --- Optimized Data Fetching ---

  // This effect handles the initial data load when a tab is activated for the first time.
  // It fetches data only if the corresponding list is empty, thus caching the result on tab switches.
  useEffect(() => {
    if (activeTab === 'wishlist' && wishlist.length === 0) {
      fetchWishlist();
    } else if (activeTab === 'following' && following.length === 0) {
      fetchFollowingStores();
    }
  }, [activeTab, wishlist.length, following.length, fetchWishlist, fetchFollowingStores]);

  // This effect handles re-fetching data when the user types in the search box.
  const isInitialRender = useRef(true);
  useEffect(() => {
    // We use a ref to skip the effect on the very first render of the component,
    // because the initial data is already being fetched by the effect above.
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (activeTab === 'wishlist') {
      fetchWishlist(1, debouncedWishlistSearch);
    } else if (activeTab === 'following') {
      fetchFollowingStores(1, debouncedFollowingSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedWishlistSearch, debouncedFollowingSearch]);

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      const response = await authApi.toggleWishlist(productId);
      toast.success(response.message);
      // Cập nhật AuthContext bằng functional update để tránh race condition
      if (setUser) {
        setUser(currentUser => currentUser ? { ...currentUser, wishlist: response.data || [] } : null);
      }
      fetchWishlist(wishlistPagination?.currentPage || 1, debouncedWishlistSearch);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi xóa sản phẩm.');
    }
  };

  const handleUnfollowStore = async (storeId: string) => {
    try {
      const response = await authApi.toggleFollowStore(storeId);
      toast.success(response.message);
      // Cập nhật AuthContext bằng functional update để tránh race condition
      if (setUser) {
        setUser(currentUser => currentUser ? { ...currentUser, following_stores: response.data || [] } : null);
      }
      fetchFollowingStores(followingPagination?.currentPage || 1, debouncedFollowingSearch);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi bỏ theo dõi.');
    }
  };

  const renderWishlist = () => (
    <div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm yêu thích..."
          value={wishlistSearch}
          onChange={(e) => setWishlistSearch(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
        />
      </div>
      {wishlistLoading ? (
        <div className="text-center py-10">Đang tải...</div>
      ) : wishlist.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map(product => (
              <div key={product._id} className="relative">
                <ProductCard product={product} />
                <button
                  onClick={() => handleRemoveFromWishlist(product._id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 backdrop-blur-sm transition-colors"
                  title="Xóa khỏi danh sách yêu thích"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>
            ))}
          </div>
          {/* Pagination */}
          {wishlistPagination && wishlistPagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: wishlistPagination.totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => fetchWishlist(page, debouncedWishlistSearch)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm ${wishlistPagination.currentPage === page ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-slate-500">
          <span className="material-symbols-outlined text-6xl mb-4">favorite</span>
          <p>Bạn chưa có sản phẩm yêu thích nào.</p>
        </div>
      )}
    </div>
  );

  const renderFollowing = () => (
    <div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm cửa hàng đã theo dõi..."
          value={followingSearch}
          onChange={(e) => setFollowingSearch(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
        />
      </div>
      {followingLoading ? (
        <div className="text-center py-10">Đang tải...</div>
      ) : following.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {following.map(store => (
              <div key={store._id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center flex flex-col items-center">
                <img
                  src={store.user_id?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.shop_name)}&background=random&color=fff`}
                  alt={store.shop_name}
                  className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-slate-200 dark:border-slate-700"
                />
                <h4 className="font-bold text-lg dark:text-white truncate w-full">{store.shop_name}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 h-10 mb-4">{store.description}</p>
                <div className="mt-auto w-full flex flex-col gap-2">
                    <Link to={`/store/${store._id}`} className="w-full px-4 py-2 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90">
                        Ghé thăm
                    </Link>
                    <button
                        onClick={() => handleUnfollowStore(store._id)}
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                        Bỏ theo dõi
                    </button>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination */}
          {followingPagination && followingPagination.totalPages > 1 && (
             <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: followingPagination.totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => fetchFollowingStores(page, debouncedFollowingSearch)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm ${followingPagination.currentPage === page ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-slate-500">
          <span className="material-symbols-outlined text-6xl mb-4">storefront</span>
          <p>Bạn chưa theo dõi cửa hàng nào.</p>
        </div>
      )}
    </div>
  );

  return (
    <AccountLayout>
      <div>
        <h1 className="text-2xl font-bold mb-2 dark:text-white">Yêu thích & Theo dõi</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Quản lý danh sách sản phẩm và cửa hàng bạn quan tâm.</p>

        <div className="border-b border-slate-200 dark:border-slate-800 mb-6">
            <nav className="-mb-px flex gap-6">
            <button
                onClick={() => setActiveTab('wishlist')}
                className={`shrink-0 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === 'wishlist'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
            >
                Sản phẩm yêu thích
            </button>
            <button
                onClick={() => setActiveTab('following')}
                className={`shrink-0 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === 'following'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
            >
                Cửa hàng theo dõi
            </button>
            </nav>
        </div>

        {activeTab === 'wishlist' ? renderWishlist() : renderFollowing()}
      </div>
    </AccountLayout>
  );
};

export default WishlistAndFollowing;