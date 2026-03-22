import React from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom';
import { useHomeProducts } from '../../hooks/useHomeProducts';
import ProductCard from '../components/ProductCard';

const Home: React.FC = () => {
  const { products, biggestDiscount, categories, saleProducts, loading, usedProducts } = useHomeProducts();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
        
        {/* 1. Hero Banner */}
        <section className="relative rounded-xl overflow-hidden h-[240px] md:h-[300px] bg-slate-900 group shadow-sm">
           <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')" }}></div>
           <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex items-center px-8 sm:px-12">
             <div className="max-w-md space-y-3">
               <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-widest shadow-md">
                 Siêu Sale Tháng Mới
               </span>
               <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight drop-shadow-md">
                 Săn Deal Gấp Bội
               </h2>
               <div className="pt-2">
                 <Link to="/products" className="inline-block bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold transition-transform transform hover:scale-105 shadow-lg shadow-primary/30">
                   Mua Sắm Ngay
                 </Link>
               </div>
             </div>
           </div>
        </section>

        {/* 2. DEEP SALE SECTION */}
        <section className="bg-gradient-to-r from-orange-50 to-primary/10 dark:from-slate-800 dark:to-primary/20 rounded-xl p-4 border border-primary/20 shadow-sm">
          <div className="flex items-end justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-xl">bolt</span>
              </div>
              <h3 className="text-2xl font-bold text-primary italic uppercase tracking-tight">DEEP SALE</h3>
              <span className="hidden sm:inline-block ml-3 px-2.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                Giảm tới {biggestDiscount}%
              </span>
            </div>
            <Link to="/products?sale=deep" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              Xem tất cả <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {saleProducts.slice(0, 5).map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        </section>

        {/* 3. GÓC PASS ĐỒ CŨ (USED PRODUCTS) */}
        <section className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold">
                <span className="material-symbols-outlined text-amber-500 text-2xl">recycling</span>
                <h3 className="text-2xl italic uppercase tracking-tight">Góc Pass Đồ</h3>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-full text-xs font-bold">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                Sản phẩm đã qua sử dụng, được duyệt trước khi đăng bán
              </div>
            </div>
            
            <Link to="/products?condition=Used" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-1">
              Xem tất cả <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
          </div>
          
          {usedProducts && usedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {usedProducts.map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
              <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">inbox</span>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Hiện chưa có món đồ cũ nào được đăng bán.</p>
            </div>
          )}
        </section>

        {/* 4. Categories - Hiển thị dạng lưới gọn gàng */}
        <section className="bg-white dark:bg-slate-900 rounded-xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
           <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white uppercase">Danh Mục</h3>
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 lg:gap-4">
             
             {/* 👇 CỤC "ĐỒ 2ND" MỚI THÊM VÀO ĐÂY 👇 */}
             <Link 
                to={`/products?condition=Used`} 
                className="group flex flex-col items-center justify-center p-3 rounded-xl border border-transparent hover:border-amber-500/20 bg-amber-50 dark:bg-amber-900/20 transition-all duration-200 text-amber-700 dark:text-amber-400"
             >
                <div className="w-12 h-12 mb-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-amber-200 dark:border-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-amber-500">recycling</span>
                </div>
                <p className="text-center font-bold text-xs leading-tight line-clamp-2">Đồ 2nd (Pass)</p>
             </Link>
             {/* 👆 KẾT THÚC CỤC "ĐỒ 2ND" 👆 */}

             {categories.map((item) => ( 
                <Link 
                  to={`/products?category=${item._id}`} 
                  key={item._id} 
                  className="group flex flex-col items-center justify-center p-3 rounded-xl border border-transparent hover:border-primary/20 bg-slate-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-primary/10 transition-all duration-200 text-slate-700 dark:text-slate-300 hover:text-primary"
                >
                   <div className="w-12 h-12 mb-2 rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                     <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">category</span>
                   </div>
                   <p className="text-center font-medium text-xs leading-tight line-clamp-2">{item.name}</p>
                </Link>
             ))}
           </div>
        </section>

        {/* 5. Gợi Ý Hôm Nay (Trending Now) */}
        <section className="pt-4">
          <div className="bg-white dark:bg-slate-900 border-b-2 border-primary sticky top-[64px] z-30 mb-4 p-4 shadow-sm text-center uppercase text-primary font-bold text-lg tracking-wider">
             Gợi Ý Hôm Nay
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {(products || []).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
              
              {(!products || products.length === 0) && !loading && (
                <div className="col-span-full text-center py-10 text-slate-500">
                    Không có sản phẩm nào.
                </div>
              )}
            </div>
          )}

          <div className="mt-8 text-center pb-8">
             <Link 
               to="/products" 
               className="inline-block bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-10 py-2.5 rounded-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
             >
               Xem Thêm
             </Link>
          </div>
        </section>

      </div>
    </Layout>
  );
};

export default Home;