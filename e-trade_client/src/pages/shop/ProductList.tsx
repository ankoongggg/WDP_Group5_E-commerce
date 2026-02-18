// src/pages/shop/ProductList.tsx
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Link, useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/common/ProductCard';
import { useProductList } from '../../hooks/useProductList';

const ProductList: React.FC = () => {
  // Lấy thêm fallbackProducts từ hook
  const { products, fallbackProducts, categories, totalPages, currentPage, loading, goToPage } = useProductList();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const filterParam = searchParams.get('filter') || '';
  const categoryParam = searchParams.get('category') || '';

  // Tạo mảng category ID từ URL để so sánh checkbox
  const selectedCategoryIds = categoryParam ? categoryParam.split(',').filter(Boolean) : [];

  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [shippingArea, setShippingArea] = useState('');

  // Xác định sort filter nào đang active (latest hoặc popular)
  const activeSortFilter = filterParam === 'latest' || filterParam === 'popular' ? filterParam : '';

  // Hàm xử lý toggle sort (Newest/Popular)
  const handleSortToggle = (sortType: 'latest' | 'popular') => {
    setSearchParams(prev => {
      // Nếu nhấn cùng filter đang active -> bỏ filter
      if (activeSortFilter === sortType) {
        prev.delete('filter');
      } else {
        // Nhấn filter khác -> đặt filter mới
        prev.set('filter', sortType);
      }
      prev.delete('page'); // Reset về trang 1
      return prev;
    });
  };

  // Hàm xử lý select Price
  const handlePriceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const priceFilter = e.target.value;
    setSearchParams(prev => {
      if (priceFilter) {
        prev.set('filter', priceFilter);
      } else {
        prev.delete('filter');
      }
      prev.delete('page');
      return prev;
    });
  };

  // Hàm xử lý chọn Category (Sửa lỗi logic)
  const handleCategoryChange = (id: string) => {
    setSearchParams(prev => {
      // Lấy danh sách hiện tại từ URL
      const currentCats = prev.get('category') ? prev.get('category')!.split(',').filter(Boolean) : [];
      
      let newCats;
      if (currentCats.includes(id)) {
        // Nếu đã có -> Xóa đi (Uncheck)
        newCats = currentCats.filter(c => c !== id);
      } else {
        // Nếu chưa có -> Thêm vào (Check)
        newCats = [...currentCats, id];
      }

      // Cập nhật lại URL
      if (newCats.length > 0) {
        prev.set('category', newCats.join(','));
      } else {
        prev.delete('category');
      }
      
      prev.delete('page'); // Reset về trang 1 khi filter
      return prev;
    });
  };

  // ... (Giữ nguyên các hàm applyPriceRange, etc.)

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-medium">All Products</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0 space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                <span className="material-symbols-outlined text-primary">tune</span> Filters
              </h3>
              <div className="border-t border-slate-200 dark:border-primary/10 py-6 space-y-3">
                 <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-400">Categories</h4>
                 {categories.map(cat => (
                   <label key={cat._id} className="flex items-center gap-3 cursor-pointer group">
                     <input
                       type="checkbox"
                       // So sánh ID có trong mảng URL không
                       checked={selectedCategoryIds.includes(cat._id)}
                       onChange={() => handleCategoryChange(cat._id)}
                       className="rounded border-slate-300 text-primary focus:ring-primary bg-transparent"
                     />
                     <span className={`text-sm transition-colors ${selectedCategoryIds.includes(cat._id) ? 'text-primary font-bold' : 'dark:text-slate-300 group-hover:text-primary'}`}>
                       {cat.name}
                     </span>
                   </label>
                 ))}
              </div>
            </div>
          </aside>

          {/* Grid Products */}
          <div className="flex-1">
             {/* Toolbar */}
             <div className="flex flex-wrap justify-between items-center gap-4 mb-8 bg-white dark:bg-primary/5 p-4 rounded-2xl border border-slate-200 dark:border-primary/10">
                <p className="text-sm font-medium dark:text-white">
                  {keyword ? (
                    <span>Results for "<span className="font-bold text-primary">{keyword}</span>"</span>
                  ) : (
                    <span>Showing all products</span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Sort Toggle Buttons */}
                  <button
                    onClick={() => handleSortToggle('latest')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      activeSortFilter === 'latest'
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm inline mr-1">schedule</span>
                    Newest
                  </button>
                  <button
                    onClick={() => handleSortToggle('popular')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      activeSortFilter === 'popular'
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm inline mr-1">trending_up</span>
                    Popular
                  </button>

                  {/* Price Select Dropdown */}
                  <select
                    value={filterParam.startsWith('price-') ? filterParam : ''}
                    onChange={handlePriceSelect}
                    className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 hover:border-slate-400"
                  >
                    <option value="">Sort by Price</option>
                    <option value="price-asc">Price: Low → High</option>
                    <option value="price-desc">Price: High → Low</option>
                  </select>
                </div>
             </div>

             {/* Content Area */}
             {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-2xl"></div>
                  ))}
                </div>
             ) : (
                <>
                  {/* Case: Có sản phẩm */}
                  {products.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {products.map((product) => (
                          <ProductCard key={product._id} product={product} />
                        ))}
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-10">
                          {/* ... Code Pagination cũ ... */}
                          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-50">Prev</button>
                          <span className="px-4 py-2 font-bold">{currentPage} / {totalPages}</span>
                          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-50">Next</button>
                        </div>
                      )}
                    </>
                  ) : (
                    // Case: KHÔNG có sản phẩm (No Results)
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                        <span className="material-symbols-outlined text-3xl text-slate-400">search_off</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No products found</h3>
                      <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        We couldn't find any products matching your search criteria.
                      </p>

                      {/* Hiển thị Fallback Products (Nếu có) */}
                      {fallbackProducts.length > 0 && (
                        <div className="mt-12 text-left">
                          <h4 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white border-t border-slate-200 pt-8">
                            <span className="material-symbols-outlined text-primary">lightbulb</span>
                            However, you might like these items in the same category:
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                            {fallbackProducts.map((product) => (
                              <ProductCard key={product._id} product={product} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
             )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductList;