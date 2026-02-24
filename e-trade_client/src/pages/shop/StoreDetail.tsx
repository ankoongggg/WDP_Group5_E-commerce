import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Layout } from '../../../components/Layout';
import ProductCard from './ProductCard';

// --- Interfaces ---
interface Store {
  _id: string;
  shop_name: string;
  description: string;
  avatar: string;
  user_id: {
    account_name: string;
    avatar: string;
  };
  created_at: string;
}

interface StoreStats {
  totalProducts: number;
  totalReviews: number;
  averageRating: number;
}

interface StoreDetailsResponse {
  store: Store;
  stats: StoreStats;
}

interface Product {
  _id: string;
  name: string;
  main_image: string;
  price: number;
  original_price?: number;
}

interface StoreProductsResponse {
  products: Product[];
  currentPage: number;
  totalPages: number;
  totalProducts: number;
}

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const StoreDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Store data state
  const [storeDetails, setStoreDetails] = useState<StoreDetailsResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  
  // UI and loading state
  const [loadingStore, setLoadingStore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('created_at_desc'); // default sort

  // Debounce inputs to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedMinPrice = useDebounce(minPrice, 500);
  const debouncedMaxPrice = useDebounce(maxPrice, 500);

  // Effect to fetch store details
  useEffect(() => {
    const fetchStoreDetails = async () => {
      if (!id) return;
      setLoadingStore(true);
      try {
        const response = await axios.get<StoreDetailsResponse>(`http://localhost:9999/store/${id}`);
        setStoreDetails(response.data);
      } catch (err) {
        setError('Không thể tải thông tin cửa hàng.');
        console.error(err);
      } finally {
        setLoadingStore(false);
      }
    };
    fetchStoreDetails();
  }, [id]);

  // Effect to fetch products based on filters
  useEffect(() => {
    const fetchProducts = async () => {
      if (!id) return;
      setLoadingProducts(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '12',
          sortBy: sortBy,
        });
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        if (debouncedMinPrice) params.append('minPrice', debouncedMinPrice);
        if (debouncedMaxPrice) params.append('maxPrice', debouncedMaxPrice);

        const response = await axios.get<StoreProductsResponse>(`http://localhost:9999/store/${id}/products`, { params });
        
        setProducts(prev => page === 1 ? response.data.products : [...prev, ...response.data.products]);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        setError('Không thể tải danh sách sản phẩm.');
        console.error(err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [id, page, debouncedSearchTerm, debouncedMinPrice, debouncedMaxPrice, sortBy]);

  // Reset page and products when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, debouncedMinPrice, debouncedMaxPrice, sortBy]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  if (loadingStore) {
    return <Layout><div className="text-center py-20">Đang tải cửa hàng...</div></Layout>;
  }

  if (error && !storeDetails) {
    return <Layout><div className="text-center py-20 text-red-500">{error}</div></Layout>;
  }

  if (!storeDetails) {
    return <Layout><div className="text-center py-20">Không tìm thấy cửa hàng.</div></Layout>;
  }

  const { store, stats } = storeDetails;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Store Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-xl bg-slate-100 dark:bg-slate-800 mb-12">
          <img 
            src={store.user_id.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.shop_name)}&background=random&color=fff`} 
            alt={store.shop_name}
            className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg"
          />
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-extrabold dark:text-white">{store.shop_name}</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{store.description}</p>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">inventory_2</span>
                <span>{stats.totalProducts} Sản phẩm</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg fill text-amber-400">star</span>
                <span>{stats.averageRating.toFixed(1)} ({stats.totalReviews} đánh giá)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">calendar_today</span>
                <span>Tham gia từ {new Date(store.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 rounded-lg border border-slate-200 dark:border-white/10">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Tìm kiếm trong cửa hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-slate-100 dark:bg-white/10 border-transparent focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Giá từ"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-slate-100 dark:bg-white/10 border-transparent focus:ring-primary focus:border-primary"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              placeholder="Giá đến"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-slate-100 dark:bg-white/10 border-transparent focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="w-full px-4 py-2 rounded-md bg-slate-100 dark:bg-white/10 border-transparent focus:ring-primary focus:border-primary"
            >
              <option value="created_at_desc">Mới nhất</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loadingProducts && page === 1 ? (
          <div className="text-center py-10">Đang tải sản phẩm...</div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            {page < totalPages && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={loadingProducts}
                  className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 disabled:opacity-70"
                >
                  {loadingProducts ? 'Đang tải...' : 'Xem thêm'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-slate-500">
            Không tìm thấy sản phẩm nào phù hợp.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StoreDetail;
