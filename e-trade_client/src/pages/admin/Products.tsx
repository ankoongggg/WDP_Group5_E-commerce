// src/pages/admin/AdminProducts.tsx
import React, { useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { useAdminCategories } from '../../hooks/admin/useAdminCategories';
import { useAdminPendingProducts } from '../../hooks/admin/useAdminPendingProducts'; // Hook mới
import { useCurrency } from '../../context/CurrencyContext'; // Format tiền
import { Link } from 'react-router-dom';

// --- TYPES ---
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

// --- MODAL COMPONENTS ---

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
              {/* Here you would ideally populate the store owner's details */}
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

export const AdminProducts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'categories'>('pending');
  const { formatPrice } = useCurrency();

  // Hook Category
  const {
    categories,
    loading: catLoading,
    handleAddCategory,
    handleUpdateCategory,
    handleToggleHideAndShowCategory
  } = useAdminCategories();

  // Hook Pending Products
  const {
    pendingProducts,
    loading: prodLoading,
    handleApproveProduct,
    handleRejectProduct
  } = useAdminPendingProducts();

  // --- Category States & Functions ---
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Modal States
  const [modalType, setModalType] = useState<'product' | 'seller' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(null);

  const onSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAddCategory(newCatName);
    setNewCatName(''); 
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const saveEditing = async (id: string) => {
    await handleUpdateCategory(id, editingName);
    setEditingId(null); 
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedProduct(null);
  };

  const handleViewProduct = (product: PendingProduct) => {
    setSelectedProduct(product);
    setModalType('product');
  };

  const handleViewSeller = () => {
    setModalType('seller');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`pb-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
          >
            Duyệt sản phẩm
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`pb-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'categories' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
          >
            Quản lý Danh mục
          </button>
        </div>

        {/* TAB 1: DUYỆT SẢN PHẨM */}
        {activeTab === 'pending' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-red-50/50 dark:bg-red-900/10">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <span className="material-symbols-outlined text-red-500">warning</span>
                     Sản phẩm chứa từ khóa cấm cần kiểm duyệt ({pendingProducts.length})
                 </h3>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[700px]">
                 <thead>
                   <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                     <th className="p-4 font-medium w-[40%]">Sản phẩm</th>
                     <th className="p-4 font-medium">Cửa hàng</th>
                     <th className="p-4 font-medium">Giá</th>
                     <th className="p-4 font-medium text-center">Hành động</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                   {prodLoading ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
                   ) : pendingProducts.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-emerald-500 font-medium">Tuyệt vời! Không có sản phẩm nào vi phạm chờ duyệt.</td></tr>
                   ) : (
                     pendingProducts.map((product) => (
                       <tr key={product._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <td className="p-4 flex gap-3 items-center">
                           <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                             <img src={product.main_image || `https://placehold.co/80x80?text=SP`} alt={product.name} className="w-full h-full object-cover" />
                           </div>
                           <div>
                             <p className="font-bold text-slate-800 dark:text-white line-clamp-2 max-w-[300px]" title={product.name}>
                               {product.name}
                             </p>
                             <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs uppercase tracking-wider">
                               {product.condition}
                             </span>
                           </div>
                         </td>
                         <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                           {product.store_id ? (
                               <div className="flex items-center gap-2">
                                   <span className="material-symbols-outlined text-base text-slate-400">storefront</span>
                                   <span className="font-semibold text-primary">{product.store_id.shop_name}</span>
                               </div>
                           ) : product.user_id ? (
                               <div className="flex items-center gap-2">
                                   <span className="material-symbols-outlined text-base text-slate-400">person</span>
                                   <span className="font-semibold text-amber-600">{product.user_id.full_name}</span>
                               </div>
                           ) : (
                               <span className="text-slate-400">Không xác định</span>
                           )}
                         </td>
                         <td className="p-4 font-bold text-primary">
                           {formatPrice(product.price)}
                         </td>
                         <td className="p-4">
                           <div className="flex justify-center gap-2">
                             <button 
                               onClick={() => handleViewProduct(product)}
                               className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-1"
                               title="Xem chi tiết"
                             >
                               <span className="material-symbols-outlined text-[18px]">visibility</span> Chi tiết
                             </button>
                             <button 
                               onClick={() => handleApproveProduct(product._id)}
                               className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold hover:bg-emerald-500 hover:text-white transition-colors flex items-center gap-1"
                               title="Cho phép hiển thị"
                             >
                               <span className="material-symbols-outlined text-[18px]">check_circle</span> Duyệt
                             </button>
                             <button 
                               onClick={() => handleRejectProduct(product._id)}
                               className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1"
                               title="Khóa sản phẩm"
                             >
                               <span className="material-symbols-outlined text-[18px]">block</span> Từ chối
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
        )}

        {/* TAB 2: QUẢN LÝ DANH MỤC */}
        {activeTab === 'categories' && (
           /* ... Giữ nguyên phần UI Tab Categories như bài viết trước ... */
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Form Thêm danh mục */}
             <div className="col-span-1 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
               <h3 className="font-bold text-lg mb-4 dark:text-white">Thêm Danh Mục Mới</h3>
               <form onSubmit={onSubmitAdd} className="space-y-4">
                 <div>
                   <label className="text-sm text-slate-500 mb-1 block">Tên danh mục</label>
                   <input 
                     type="text" 
                     value={newCatName}
                     onChange={(e) => setNewCatName(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 dark:text-white transition-all" 
                     placeholder="VD: Đồ điện tử..." 
                     disabled={catLoading}
                   />
                 </div>
                 <button 
                   type="submit"
                   disabled={catLoading || !newCatName.trim()}
                   className="w-full bg-primary text-white font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                 >
                   {catLoading ? 'Đang xử lý...' : 'Thêm mới'}
                 </button>
               </form>
             </div>

             {/* List danh mục */}
             <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                   <tr>
                     <th className="p-4 font-medium w-[50%]">Tên danh mục</th>
                     <th className="p-4 font-medium">Trạng thái</th>
                     <th className="p-4 font-medium text-right">Hành động</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                   {categories.length === 0 ? (
                     <tr>
                        <td colSpan={3} className="p-6 text-center text-slate-500">Chưa có danh mục nào.</td>
                     </tr>
                   ) : (
                     categories.map((cat) => (
                       <tr key={cat._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                         {/* Cột Tên */}
                         <td className="p-4 font-medium dark:text-white">
                           {editingId === cat._id ? (
                             <input 
                               type="text" 
                               value={editingName}
                               onChange={(e) => setEditingName(e.target.value)}
                               className="w-full bg-white dark:bg-slate-900 border border-primary rounded-lg px-3 py-1 outline-none dark:text-white"
                               autoFocus
                             />
                           ) : (
                             <span className={!cat.is_active ? 'text-slate-400 line-through' : ''}>
                               {cat.name}
                             </span>
                           )}
                         </td>

                         {/* Cột Trạng thái */}
                         <td className="p-4">
                           {cat.is_active ? (
                             <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Hiển thị</span>
                           ) : (
                             <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-full font-medium">Đã ẩn</span>
                           )}
                         </td>

                         {/* Cột Hành động */}
                         <td className="p-4 text-right">
                           {editingId === cat._id ? (
                             <div className="flex justify-end gap-2">
                               <button onClick={() => saveEditing(cat._id)} className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded transition-colors" title="Lưu">
                                 <span className="material-symbols-outlined text-[20px]">check</span>
                               </button>
                               <button onClick={cancelEditing} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded transition-colors" title="Hủy">
                                 <span className="material-symbols-outlined text-[20px]">close</span>
                               </button>
                             </div>
                           ) : (
                             <div className="flex justify-end items-center gap-3">
                               <button 
                                 onClick={() => startEditing(cat._id, cat.name)} 
                                 className="text-blue-500 hover:text-blue-700 font-medium transition-colors"
                               >
                                 Sửa
                               </button>
                               <span className="text-slate-300">|</span>
                               <button 
                                 onClick={() =>   handleToggleHideAndShowCategory(cat._id)} 
                                 className={`${cat.is_active ? 'text-amber-500 hover:text-amber-700' : 'text-emerald-500 hover:text-emerald-700'} font-medium transition-colors`}
                               >
                                 {cat.is_active ? 'Ẩn' : 'Hiện'}
                               </button>
                             </div>
                           )}
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
           </div>
        )}
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