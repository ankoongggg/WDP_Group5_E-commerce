import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';
import { useSellerProducts } from '../../hooks/seller/useSellerProducts';
import { ProductService } from '../../services/productService';
import SellerLayout from './SellerLayout';

const ProductsManager: React.FC = () => {
  const {
    products,
    loading,
    status,
    setStatus,
    search,
    setSearch,
    refresh,
    page,
    setPage,
    total,
    totalPages,
    limit,
    setLimit,
  } = useSellerProducts();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  // Local state debounce cho ô search
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, setSearch, setPage]);

  const paginationMeta = useMemo(() => {
    const totalItems = total || 0;
    if (totalItems === 0) {
      return { fromIndex: 0, toIndex: 0, totalItems };
    }
    const fromIndex = (page - 1) * limit + 1;
    const toIndex = Math.min(totalItems, page * limit);
    return { fromIndex, toIndex, totalItems };
  }, [total, page, limit]);

  const renderPaginationPages = () => {
    if (totalPages <= 1) return null;

    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const left = Math.max(2, page - 1);
      const right = Math.min(totalPages - 1, page + 1);
      if (left > 2) pages.push('ellipsis');
      for (let i = left; i <= right; i++) pages.push(i);
      if (right < totalPages - 1) pages.push('ellipsis');
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center gap-2">
        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`${p}-${idx}`} className="text-slate-400 px-1 select-none">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`min-w-9 h-9 rounded-lg text-sm font-semibold px-2 transition-colors ${
                p === page
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>
    );
  };

  const handleToggleStatus = async (id: string, currentStatus: string[] | string) => {
    const normalized = Array.isArray(currentStatus) ? currentStatus : [currentStatus];
    const isActive = normalized.includes('active');
    const nextStatus = isActive ? 'inactive' : 'active';
    try {
      await ProductService.updateSellerProductStatus(id, nextStatus);
      refresh();
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi khi cập nhật trạng thái sản phẩm');
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá sản phẩm này? Sản phẩm sẽ bị ẩn khỏi khách hàng.')) return;
    try {
      await ProductService.softDeleteSellerProduct(id);
      refresh();
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi khi xoá sản phẩm');
    }
  };

  // --- LOGIC MỚI: TĂNG SỐ LƯỢNG TỒN KHO ---
  const handleAddStock = async (id: string) => {
    const amountStr = window.prompt('Nhập số lượng hàng bạn vừa nhập thêm vào kho:');
    if (!amountStr) return; // Người dùng ấn Cancel
    
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Số lượng không hợp lệ. Phải là số lớn hơn 0.');
      return;
    }

    try {
      await ProductService.addSellerProductStock(id, amount);
      toast.success(`Đã thêm ${amount} sản phẩm vào kho thành công!`);
      refresh(); // Reload lại bảng
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi khi thêm số lượng');
    }
  };

  // Hàm tính tổng tồn kho để hiển thị ra UI
  const getStock = (p: any) => {
    if (p.product_type && p.product_type.length > 0) {
        return p.product_type.reduce((acc: number, item: any) => acc + (item.stock || 0), 0);
    }
    return p.stock || 0;
  };
  // ----------------------------------------

  const renderStatusBadge = (statusValue: string[] | string) => {
    const statuses = Array.isArray(statusValue) ? statusValue : [statusValue];
    if (statuses.includes('pending')) {
      return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">Chờ duyệt</span>;
    }
    if (statuses.includes('rejected')) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">Bị từ chối</span>;
    }
    if (statuses.includes('inactive')) {
      return <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">Đang ẩn</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium">Đang hiển thị</span>;
  };

  return (
    <SellerLayout>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a110c] px-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Quản lý sản phẩm</h1>
        <button
          onClick={() => navigate('/seller/products/new')}
          className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Thêm sản phẩm
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Sản phẩm của bạn</h2>
              <p className="text-sm text-slate-500">Quản lý danh sách sản phẩm đang bán trong cửa hàng.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Tìm theo tên sản phẩm..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none dark:text-white"
                />
              </div>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-100 min-w-[150px] dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang hiển thị</option>
                <option value="inactive">Đang ẩn</option>
                <option value="pending">Chờ duyệt</option>
                <option value="rejected">Bị từ chối</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                  <th className="p-4 font-medium">Sản phẩm</th>
                  <th className="p-4 font-medium">Giá</th>
                  <th className="p-4 font-medium">Trạng thái</th>
                  <th className="p-4 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {loading && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      Đang tải danh sách sản phẩm...
                    </td>
                  </tr>
                )}
                {!loading && products.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      Chưa có sản phẩm nào.
                    </td>
                  </tr>
                )}
                {!loading &&
                  products.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                          {p.main_image ? (
                            <img src={p.main_image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No image</div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[260px]" title={p.name}>
                            {p.name}
                          </p>
                          {p.created_at && (
                            <p className="text-xs text-slate-500">
                              Tạo ngày: {new Date(p.created_at).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{formatPrice(p.price)}</p>
                        {p.original_price && (
                          <p className="text-xs text-slate-400 line-through">{formatPrice(p.original_price)}</p>
                        )}
                      </td>
                      
                      

                      <td className="p-4">{renderStatusBadge(p.status)}</td>
                      
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                        {!(p.status.includes('cancelled') || p.status.includes('rejected') || p.status.includes('pending'))  && (
                          <>
                          {/* <button
                            onClick={() => navigate(`/seller/products/${p._id}/edit`)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Sửa
                          </button> */}
                          <button
                            onClick={() => handleToggleStatus(p._id, p.status)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {Array.isArray(p.status) ? (p.status.includes('active') ? 'visibility_off' : 'visibility') : p.status === 'active' ? 'visibility_off' : 'visibility'}
                            </span>
                            {Array.isArray(p.status) ? (p.status.includes('active') ? 'Ẩn' : 'Hiển thị') : p.status === 'active' ? 'Ẩn' : 'Hiển thị'}
                          </button>
                          </>

               ) }        <button
                            onClick={() => navigate(`/seller/products/${p._id}/edit`)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Sửa
                          </button>
                          <button
                            onClick={() => handleSoftDelete(p._id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 text-red-600 hover:bg-red-50"
                          >
                            
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {paginationMeta.totalItems > 0 ? (
                <>
                  Hiển thị <span className="font-bold">{paginationMeta.fromIndex}</span>-
                  <span className="font-bold">{paginationMeta.toIndex}</span> /{' '}
                  <span className="font-bold">{paginationMeta.totalItems}</span> sản phẩm
                </>
              ) : (
                <>0 sản phẩm</>
              )}
            </div>

            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">Hiển thị</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-slate-100 min-w-[60px] dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={totalPages <= 1 || page <= 1}
                  className="min-w-10 h-9 rounded-lg text-sm font-semibold px-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  First
                </button>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={totalPages <= 1 || page <= 1}
                  className="min-w-10 h-9 rounded-lg text-sm font-semibold px-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Prev
                </button>

                {renderPaginationPages()}

                <button
                  onClick={() => setPage(Math.min(totalPages || 1, page + 1))}
                  disabled={totalPages <= 1 || page >= totalPages}
                  className="min-w-10 h-9 rounded-lg text-sm font-semibold px-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={totalPages <= 1 || page >= totalPages}
                  className="min-w-10 h-9 rounded-lg text-sm font-semibold px-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </SellerLayout>
  );
};

export default ProductsManager;