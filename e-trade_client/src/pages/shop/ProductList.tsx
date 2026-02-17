import React from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/common/ProductCard';
import { useProductList } from '../../hooks/useProductList';

const ProductList: React.FC = () => {
  const { products, categories , totalPages, currentPage, loading, goToPage } = useProductList();

  return (
    <Layout>
      <div class="max-w-7xl mx-auto px-6 py-8">
        <div class="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link to="/" class="hover:text-primary">Home</Link>
          <span class="material-symbols-outlined text-xs">chevron_right</span>
          <span class="text-primary font-medium">All Products</span>
        </div>

        <div class="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside class="w-full lg:w-72 flex-shrink-0 space-y-8">
            <div>
              <h3 class="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                <span class="material-symbols-outlined text-primary">tune</span> Filters
              </h3>
              <div class="border-t border-slate-200 dark:border-primary/10 py-6 space-y-3">
                 <h4 class="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-400">Categories</h4>
                 {categories.map(cat => (
                   <label key={cat._id} class="flex items-center gap-3 cursor-pointer group">
                     <input type="checkbox" class="rounded border-slate-300 text-primary focus:ring-primary bg-transparent" />
                     <span class="text-sm dark:text-slate-300 group-hover:text-primary transition-colors">{cat.name}</span>
                   </label>
                 ))}
              </div>
            </div>
          </aside>

          {/* Grid Products */}
          <div className="flex-1">
             {/* Toolbar */}
             <div className="flex justify-between gap-4 mb-8 bg-white dark:bg-primary/5 p-4 rounded-2xl border border-slate-200 dark:border-primary/10">
                <p className="text-sm font-medium dark:text-white">
                  Showing results for page {currentPage}
                </p>
             </div>

             {/* Loading State */}
             {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-2xl"></div>
                  ))}
                </div>
             ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-10">
                      <button 
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-bold ${
                              currentPage === pageNum 
                                ? 'bg-primary text-white' 
                                : 'bg-white border hover:bg-slate-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button 
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-50"
                      >
                        Next
                      </button>
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