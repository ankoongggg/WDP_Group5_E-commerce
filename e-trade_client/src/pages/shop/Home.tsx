import React from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/common/ProductCard';
import { useHomeProducts } from '../../hooks/useHomeProducts';

const Home: React.FC = () => {
  const { products, biggestDiscount, categories ,saleProducts, loading } = useHomeProducts();

  return (
    <Layout>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* Hero */}
        <section class="relative rounded-2xl overflow-hidden aspect-[21/9] bg-slate-900 group">
           <div class="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')" }}></div>
           <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center px-8 sm:px-16">
             <div class="max-w-lg space-y-4">
               <span class="inline-block px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-widest">New Arrival</span>
               <h2 class="text-4xl sm:text-6xl font-bold text-white leading-tight">Elevate Your Lifestyle</h2>
               <p class="text-slate-200 text-lg">Experience the future of tech and fashion with our curated summer collection.</p>
               <div class="flex gap-4 pt-4">
                 <Link to="/products" class="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105">Shop Now</Link>
               </div>
             </div>
           </div>
        </section>

        {/* Sale  row */}
        <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Deep Sale Column */}
          <div class="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 border border-primary/10">
            <div class="space-y-1 mb-6">
              <div class="flex items-center gap-2 text-primary font-bold">
                <span class="material-symbols-outlined">bolt</span>
                <h3 class="text-2xl">DEEP SALE</h3>
              </div>
              <p class="text-slate-500 dark:text-slate-400">Giảm giá siêu sâu lên tới <span className="font-bold text-primary">{biggestDiscount}%</span> </p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              {/* Deep Sale Products */}
              {saleProducts.slice(0, Math.ceil(saleProducts.length / 2)).map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
            <div class="mt-6 text-center">
              <Link 
                to="/products?sale=deep" 
                class="inline-block bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full font-bold transition-colors"
              >
                Mở rộng
              </Link>
            </div>
          </div>

          {/* Flash Sale Column */}
          <div class="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 border border-primary/10">
            <div class="space-y-1 mb-6">
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2 text-primary font-bold">
                  <span class="material-symbols-outlined">local_fire_department</span>
                  <h3 class="text-2xl">FLASH SALE</h3>
                </div>
                <div class="flex gap-2">
                  {[["02", "Hours"], ["45", "Min"], ["12", "Sec"]].map(([val, label]) => (
                    <div key={label} class="flex flex-col items-center">
                      <div class="bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/20">{val}</div>
                      <span class="text-[8px] uppercase font-bold mt-0.5 tracking-wider opacity-60 text-center">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p class="text-slate-500 dark:text-slate-400">Giới hạn thời gian - nhanh tay mua sắm</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              {/* Flash Sale Products */}
              {saleProducts.slice(Math.ceil(saleProducts.length / 2)).map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
            <div class="mt-6 text-center">
              <Link 
                to="/products?sale=flash" 
                class="inline-block bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full font-bold transition-colors"
              >
                Mở rộng
              </Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section>
           <h3 class="text-2xl font-bold mb-8 dark:text-white">Shop by Category</h3>
           <div class="flex items-center justify-center gap-6 flex-wrap">
             {categories.map((item) => ( 
                <div key={item._id} class="group cursor-pointer items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-orange-500 hover:text-white hover:shadow-lg transition-all">
                   {/* <div class="aspect-square bg-slate-100 dark:bg-primary/5 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                     <span class="material-symbols-outlined text-4xl">{item.name}</span>
                   </div> */}
                   <p class="text-center font-bold text-sm">{item.name}</p>
                </div>
             ))}
           </div>
        </section>
      </div>
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-center ">
       {/* Products Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-2xl font-bold dark:text-white">Trending Now</h3>
            <Link to="/products" className="text-primary font-bold text-sm hover:underline flex items-center gap-1">
              View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-10">Loading products...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Nút Xem Thêm chuyển trang */}
          <div className="mt-8 text-center">
             <Link 
               to="/products" 
               className="inline-block bg-white border border-slate-200 text-slate-700 px-6 py-2 rounded-full font-bold hover:bg-slate-50 transition-colors"
             >
               View More Products
             </Link>
          </div>
        </section>

      </div>
    </Layout>
  );
};

export default Home;