// src/pages/admin/AdminDashboard.tsx
import React, { useMemo } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Link } from 'react-router-dom';
import { useAdminHomePage } from '@/src/hooks/admin/useAdminHomePage';
import { useAdminReport } from '../../hooks/admin/useAdminReport';
import { useAdminPendingProducts } from '../../hooks/admin/useAdminPendingProducts';
import { useCurrency } from '../../context/CurrencyContext';

// --- TYPES & MODALS CHO PENDING PRODUCTS ---
interface PendingProduct {
  _id: string;
  name: string;
  main_image: string;
  display_files: string[];
  price: number;
  description: string;
  condition: string;
  product_type: { description: string; stock: number; price_difference: number }[];
  store_id?: {
    _id: string;
    shop_name: string;
  };
  user_id?: {
    _id: string;
    full_name: string;
    email: string;
    phone: string;
    status: string;
    avatar?: string;
  };
  category_id: { _id: string; name: string }[];
}

const ProductDetailModal = ({ product, onClose, onViewSeller }: { product: PendingProduct, onClose: () => void, onViewSeller: () => void }) => {
  const { formatPrice } = useCurrency();
  const allImages = [product.main_image, ...(product.display_files || [])].filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h3 className="text-xl font-bold dark:text-white">{product.name}</h3>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="p-6 space-y-6">
          {/* Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <img src={product.main_image} alt="Main" className="w-full aspect-square object-cover rounded-lg border dark:border-slate-700" />
            <div className="grid grid-cols-2 gap-2">
              {(product.display_files || []).slice(0, 4).map((img, i) => (
                <img key={i} src={img} alt={`sub-${i}`} className="w-full aspect-square object-cover rounded-lg border dark:border-slate-700" />
              ))}
            </div>
          </div>
          {/* Details */}
          <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: product.description || 'Không có mô tả.' }} />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong className="text-slate-500">Giá:</strong> <span className="font-bold text-primary">{formatPrice(product.price)}</span></div>
            <div><strong className="text-slate-500">Tình trạng:</strong> <span className="font-semibold">{product.condition}</span></div>
            <div><strong className="text-slate-500">Danh mục:</strong> {product.category_id?.map(c => c.name).join(', ') || 'N/A'}</div>
          </div>
          {/* Variants */}
          {product.product_type && product.product_type.length > 0 && (
            <div>
              <strong className="text-slate-500 text-sm">Phân loại:</strong>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                {product.product_type.map((v, i) => (
                  <li key={i}>{v.description} - Tồn kho: {v.stock} - Chênh lệch giá: {formatPrice(v.price_difference)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900">
          <button onClick={onViewSeller} className="w-full bg-primary/10 text-primary font-bold py-3 rounded-lg hover:bg-primary/20 transition-colors">Xem thông tin người bán</button>
        </div>
      </div>
    </div>
  );
};

const SellerDetailModal = ({ product, onClose, onBack }: { product: PendingProduct, onClose: () => void, onBack: () => void }) => {
  const seller = product.store_id ? null : product.user_id;
  const store = product.store_id;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 relative">
          <h3 className="text-xl font-bold dark:text-white">Thông tin người bán</h3>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="p-6 space-y-3 text-sm">
          {store ? (
            <>
              <p><strong className="text-slate-500 w-24 inline-block">Loại:</strong> Cửa hàng</p>
              <p><strong className="text-slate-500 w-24 inline-block">Tên Shop:</strong> <span className="font-semibold">{store.shop_name}</span></p>
            </>
          ) : seller ? (
            <>
              <p><strong className="text-slate-500 w-24 inline-block">Loại:</strong> Người dùng cá nhân</p>
              <p><strong className="text-slate-500 w-24 inline-block">Họ tên:</strong> <span className="font-semibold">{seller.full_name}</span></p>
              <p><strong className="text-slate-500 w-24 inline-block">Email:</strong> {seller.email}</p>
              <p><strong className="text-slate-500 w-24 inline-block">SĐT:</strong> {seller.phone || 'Chưa có'}</p>
              <p><strong className="text-slate-500 w-24 inline-block">Trạng thái:</strong> <span className={`font-bold ${seller.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>{seller.status}</span></p>
            </>
          ) : <p>Không có thông tin người bán.</p>}
        </div>
        <div className="p-6 border-t border-slate-200 dark:border-slate-800">
          <button onClick={onBack} className="w-full bg-slate-100 dark:bg-slate-800 font-bold py-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Quay lại chi tiết sản phẩm</button>
        </div>
      </div>
    </div>
  );
};

// Component con để render thẻ thống kê
const StatCard = ({ title, value, icon, trend, isPositive, colorClass }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center gap-2">
        <span className={`flex items-center text-sm font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          <span className="material-symbols-outlined text-sm">{isPositive ? 'trending_up' : 'trending_down'}</span>
          {trend}
        </span>
        <span className="text-sm text-slate-400">so với tháng trước</span>
      </div>
    )}
  </div>
);

const AdminDashboard: React.FC = () => {
  // Lấy dữ liệu từ các hook đã xây dựng
  const { totalUsers, comparison, isPositive, loading: loadingUsers } = useAdminHomePage();
  const { totalPlatformFee, data: shops, totalItems, loading: loadingReport } = useAdminReport(); 
  const { pendingProducts, loading: loadingPending, handleApproveProduct, handleRejectProduct } = useAdminPendingProducts();
  const { formatPrice, currency, setCurrency } = useCurrency();

  // Tính toán Top Shop đóng góp hoa hồng cao nhất (Từ dữ liệu data hiện tại)
  const topShops = useMemo(() => {
    if (!shops) return [];
    return [...shops]
      .sort((a, b) => (b.platform_fee || 0) - (a.platform_fee || 0))
      .slice(0, 5); // Lấy top 5
  }, [shops]);

  const maxFee = topShops.length > 0 ? (topShops[0].platform_fee || 1) : 1;

  // States cho Modals
  const [modalType, setModalType] = React.useState<'product' | 'seller' | null>(null);
  const [selectedProduct, setSelectedProduct] = React.useState<PendingProduct | null>(null);

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedProduct(null);
  };
  const handleViewProduct = (product: any) => {
    setSelectedProduct(product as PendingProduct);
    setModalType('product');
  };
  const handleViewSeller = () => setModalType('seller');

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Welcome Section & Nút chuyển đổi tiền tệ */}
        <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 border border-primary/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Chào mừng trở lại, Admin 👋</h2>
                <p className="text-slate-600 dark:text-slate-400">Đây là tổng quan tình hình hoạt động của sàn giao dịch E-Shop Trading hôm nay.</p>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
                {/* Nút Toggle USD/VND */}
                <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center">
                    <button 
                      onClick={() => setCurrency('VND')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${currency === 'VND' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                      VND
                    </button>
                    <button 
                      onClick={() => setCurrency('USD')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${currency === 'USD' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                      USD
                    </button>
                </div>

                <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined">download</span>
                    Xuất báo cáo
                </button>
            </div>
        </div>

        {/* Stats Grid (Sử dụng dữ liệu thật) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Tổng Hoa Hồng Sàn (5%)" 
            value={loadingReport ? "..." : formatPrice(totalPlatformFee)} 
            icon="account_balance_wallet" 
            trend={null} // Ẩn trend nếu chưa có API so sánh tháng trước
            isPositive={true} 
            colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20"
          />
          <StatCard 
            title="Sản phẩm chờ duyệt" 
            value={loadingPending ? "..." : pendingProducts.length} 
            icon="inventory_2" 
            trend={null}
            isPositive={true} 
            colorClass="bg-amber-100 text-amber-600 dark:bg-amber-500/20"
          />
          <StatCard 
            title="Tổng số gian hàng" 
            value={loadingReport ? "..." : totalItems} 
            icon="storefront" 
            trend={null}
            isPositive={true} 
            colorClass="bg-purple-100 text-purple-600 dark:bg-purple-500/20"
          />
          <StatCard 
            title="Người dùng mới" 
            value={loadingUsers ? "..." : totalUsers}
            icon="group_add" 
            trend={comparison !== undefined ? (comparison >= 0 ? `+${comparison}` : `${comparison}`) : null}
            isPositive={isPositive} 
            colorClass="bg-blue-100 text-blue-600 dark:bg-blue-500/20"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Cột trái: Sản phẩm cần duyệt (Hiển thị dữ liệu thật) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-red-50/50 dark:bg-red-900/10">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500">gavel</span>
                        Sản phẩm chờ kiểm duyệt
                    </h3>
                    <Link to="/admin/products" className="text-primary text-sm font-medium hover:underline">Xem tất cả</Link>
                </div>
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                                <th className="p-4 font-medium">Sản phẩm</th>
                                <th className="p-4 font-medium">Người bán</th>
                                <th className="p-4 font-medium">Giá</th>
                                <th className="p-4 font-medium text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                            {loadingPending ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Đang tải...</td></tr>
                            ) : pendingProducts.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-emerald-500 font-medium">Hiện không có sản phẩm nào vi phạm chờ duyệt!</td></tr>
                            ) : (
                                pendingProducts.slice(0, 4).map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                                                <img src={item.main_image || 'https://placehold.co/100x100?text=SP'} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px]" title={item.name}>{item.name}</p>
                                                <p className="text-xs text-slate-500 uppercase">{item.condition}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-1">
                                                {item.store_id ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[16px] text-slate-400">storefront</span>
                                                        {item.store_id.shop_name}
                                                    </span>
                                                ) : item.user_id ? (
                                                    <span className="flex items-center gap-1 text-amber-600">
                                                        <span className="material-symbols-outlined text-[16px]">person</span>
                                                        {item.user_id.full_name || 'Người dùng'}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">N/A</span>
                                                )}
                                            </p>
                                        </td>
                                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                                            {formatPrice(item.price)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleViewProduct(item)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors" title="Xem chi tiết">
                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                </button>
                                                <button onClick={() => handleApproveProduct(item._id)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors" title="Duyệt">
                                                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                                </button>
                                                <button onClick={() => handleRejectProduct(item._id)} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors" title="Từ chối">
                                                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Cột phải: Top Shop đóng góp hoa hồng */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500">bar_chart</span>
                        Top Shop Đóng Góp
                    </h3>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    {loadingReport ? (
                        <div className="text-center text-slate-500 mt-10">Đang tải biểu đồ...</div>
                    ) : topShops.length === 0 ? (
                        <div className="text-center text-slate-500 mt-10">Chưa có dữ liệu doanh thu.</div>
                    ) : (
                        <div className="space-y-5">
                            {topShops.map((shop, index) => {
                                const percent = Math.max((shop.platform_fee / maxFee) * 100, 2); // Tối thiểu 2% để hiển thị thanh
                                return (
                                    <div key={shop._id}>
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 line-clamp-1">
                                                <span className="text-xs text-slate-400 font-normal">#{index + 1}</span> {shop.shop_name}
                                            </span>
                                            <span className="text-sm font-bold text-primary shrink-0">
                                                {formatPrice(shop.platform_fee)}
                                            </span>
                                        </div>
                                        {/* Thanh Progress Bar mô phỏng biểu đồ ngang */}
                                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                              className="h-full bg-gradient-to-r from-orange-400 to-primary rounded-full transition-all duration-1000" 
                                              style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center shrink-0">
                    <Link to="/admin/reports" className="text-sm font-bold text-primary hover:underline flex items-center justify-center gap-1">
                        Xem chi tiết báo cáo <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                </div>
            </div>
        </div>

      </div>

      {/* --- RENDER MODALS --- */}
      {modalType === 'product' && selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={handleCloseModal} 
          onViewSeller={handleViewSeller} 
        />
      )}
      {modalType === 'seller' && selectedProduct && (
        <SellerDetailModal 
          product={selectedProduct} 
          onClose={handleCloseModal} 
          onBack={() => setModalType('product')} />
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;