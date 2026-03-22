import React from 'react';
import { AccountLayout } from '../components/AccountLayout';
import { useCurrency } from '../../context/CurrencyContext';
import { useMy2ndListings } from '../../hooks/useMy2ndListings';

const My2ndListings: React.FC = () => {
    const { formatPrice } = useCurrency();
    const {
        listings,
        loading,
        showModal,
        setShowModal,
        isSubmitting,
        formData,
        setFormData,
        editingItem,
        setEditingItem,
        categories,
        uploadingImages,
        imageSlots,
        handleImageSelection,
        handleMainImageSelection,
        addImageSlot,
        removeImageSlot,
        handleSubmit,
        handleEdit,
        handleDelete,
    } = useMy2ndListings();

    const renderStatus = (status: string) => {
        if (status === 'active') return <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-md font-bold shadow-sm">Đang Bán</span>;
        if (status === 'pending') return <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-md font-bold shadow-sm">Chờ Duyệt</span>;
        if (status === 'inactive') return <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-md font-bold shadow-sm">Đã Ẩn</span>;
        return <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-md font-bold shadow-sm">{status}</span>;
    };

    return (
        <AccountLayout>
            <div className="bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white">Đồ Cũ Của Tôi</h2>
                        <p className="text-sm text-slate-500 mt-1">Quản lý các món đồ bạn đang Pass.</p>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 hover:scale-105 transition-all shadow-md shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span> Đăng Bán
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-10 flex flex-col items-center gap-2 text-slate-500">
                        <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">inventory_2</span>
                        <p>Bạn chưa đăng bán món đồ nào.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.map(item => (
                            <div key={item._id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 relative flex flex-col group hover:shadow-lg transition-shadow">
                                <div className="absolute top-3 left-3 z-10">{renderStatus(item.status)}</div>
                                
                                {/* action buttons */}
                                <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-1.5 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-slate-600 shadow-md transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className="p-1.5 bg-white dark:bg-slate-700 text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-slate-600 shadow-md transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                                
                                <div className="aspect-square bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden mb-4 border border-slate-100 dark:border-slate-700">
                                    <img src={item.main_image || "https://placehold.co/300"} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <h3 className="font-bold text-slate-800 dark:text-white line-clamp-2">{item.name}</h3>
                                <p className="text-primary font-black mt-auto pt-3 text-lg">{formatPrice(item.price)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Đăng Bài (Đã Phẫu Thuật Layout) */}
            {showModal && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
                    {/* Tăng max-w-lg lên max-w-2xl và thêm scrollbar nếu màn hình quá thấp */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative">
                        
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 sticky top-0 bg-white dark:bg-slate-900 z-10 pt-2">
                            <h3 className="text-2xl font-black dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">sell</span>
                                {editingItem ? 'Cập nhật bài đăng' : 'Đăng Pass Đồ'}
                            </h3>
                            <button onClick={() => { setShowModal(false); setEditingItem(null); }} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                <span className="material-symbols-outlined block text-[20px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold mb-2 dark:text-white">Tên sản phẩm <span className="text-red-500">*</span></label>
                                <input required className="w-full p-3.5 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" placeholder="VD: Áo Khoác Denim..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2 dark:text-white">Giá Pass (VNĐ) <span className="text-red-500">*</span></label>
                                    <input required type="number" className="w-full p-3.5 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" placeholder="VD: 150000" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 dark:text-white">Giá gốc lúc mua (VNĐ)</label>
                                    <input type="number" className="w-full p-3.5 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" placeholder="VD: 500000" value={formData.original_price} onChange={e => setFormData({...formData, original_price: e.target.value})} />
                                </div>
                            </div>

                            {/* PHẪU THUẬT: KHU VỰC PHÂN LOẠI SẢN PHẨM */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                <label className="block text-sm font-bold mb-3 dark:text-white flex justify-between items-center">
                                    <span>Phân loại (Màu sắc, Kích cỡ...) <span className="text-red-500">*</span></span>
                                </label>
                                
                                {formData.product_type.map((pt, idx) => (
                                    <div key={idx} className="flex gap-2 items-start mb-3 relative">
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                                            <div className="sm:col-span-5">
                                                <input
                                                    type="text"
                                                    placeholder="VD: Đen - Size M"
                                                    value={pt.description}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setFormData(prev => {
                                                            const arr = [...prev.product_type];
                                                            arr[idx] = { ...arr[idx], description: val };
                                                            return { ...prev, product_type: arr };
                                                        });
                                                    }}
                                                    className="w-full p-3 text-sm rounded-lg border dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Số lượng"
                                                    title="Số lượng tồn kho"
                                                    value={pt.stock}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setFormData(prev => {
                                                            const arr = [...prev.product_type];
                                                            arr[idx] = { ...arr[idx], stock: val };
                                                            return { ...prev, product_type: arr };
                                                        });
                                                    }}
                                                    className="w-full p-3 text-sm rounded-lg border dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                            <div className="sm:col-span-4">
                                                <input
                                                    type="number"
                                                    step="1000"
                                                    placeholder="± Giá (VD: 20000)"
                                                    title="Tiền cộng/trừ thêm so với giá gốc"
                                                    value={pt.price_difference || ''}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setFormData(prev => {
                                                            const arr = [...prev.product_type];
                                                            arr[idx] = { ...arr[idx], price_difference: val };
                                                            return { ...prev, product_type: arr };
                                                        });
                                                    }}
                                                    className="w-full p-3 text-sm rounded-lg border dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Nút xóa phân loại */}
                                        {formData.product_type.length > 1 && (
                                            <button 
                                                type="button" 
                                                className="p-3 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0"
                                                onClick={() => {
                                                    setFormData(prev => {
                                                        const arr = [...prev.product_type];
                                                        arr.splice(idx,1);
                                                        return { ...prev, product_type: arr };
                                                    });
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                
                                <button type="button" className="text-primary font-bold text-sm flex items-center gap-1 mt-2 hover:underline" onClick={() => {
                                    setFormData(prev => ({
                                        ...prev,
                                        product_type: [...prev.product_type, { description: '', stock: '', price_difference: '' }]
                                    }));
                                }}>
                                    <span className="material-symbols-outlined text-[18px]">add_circle</span> Thêm phân loại
                                </button>
                            </div>

                            {/* Danh mục */}
                            <div>
                                <label className="block text-sm font-bold mb-3 dark:text-white">Danh mục (có thể chọn nhiều)</label>
                                {categories.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                        {categories.map(cat => (
                                            <label key={cat._id} className="inline-flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    value={cat._id}
                                                    checked={formData.category_id.includes(cat._id)}
                                                    onChange={e => {
                                                        const id = e.target.value;
                                                        setFormData(prev => {
                                                            const arr = [...prev.category_id];
                                                            if (e.target.checked) arr.push(id);
                                                            else {
                                                                const idx = arr.indexOf(id);
                                                                if (idx > -1) arr.splice(idx, 1);
                                                            }
                                                            return { ...prev, category_id: arr };
                                                        });
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                />
                                                <span className="text-sm dark:text-slate-300 group-hover:text-primary transition-colors">{cat.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-red-500 p-3 bg-red-50 rounded-lg">Chưa có danh mục. Vui lòng liên hệ admin.</div>
                                )}
                            </div>

                            {/* Upload Hình Ảnh */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2 dark:text-white">Ảnh chính (Bìa) <span className="text-red-500">*</span></label>
                                    <input type="file" accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                        onChange={e => {
                                            const f = e.target.files?.[0];
                                            if (f) handleMainImageSelection(f);
                                        }}
                                    />
                                    {formData.main_image && (
                                        <img src={formData.main_image} alt="main" className="w-full h-32 object-cover rounded-xl mt-3 border border-slate-200 shadow-sm" />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-2 dark:text-white flex justify-between">
                                        Ảnh bổ sung
                                        <button type="button" className="text-primary text-xs flex items-center hover:underline" onClick={addImageSlot}>
                                            <span className="material-symbols-outlined text-[14px]">add</span> Thêm ảnh
                                        </button>
                                    </label>
                                    
                                    <div className="space-y-3">
                                        {imageSlots.map((slot, idx) => (
                                            <div key={slot} className="flex items-center gap-3">
                                                <input type="file" accept="image/*" className="w-full text-sm text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                                                    onChange={e => {
                                                        const f = e.target.files?.[0];
                                                        if (f) handleImageSelection(idx, f);
                                                    }}
                                                />
                                                {formData.display_files[idx] && (
                                                    <img src={formData.display_files[idx]} alt="preview" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                                                )}
                                                {imageSlots.length > 1 && (
                                                    <button type="button" className="text-red-500 p-1 hover:bg-red-50 rounded" onClick={() => removeImageSlot(idx)}>
                                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {uploadingImages && <p className="text-sm font-bold text-primary flex items-center gap-2"><span className="material-symbols-outlined animate-spin">sync</span> Đang tải ảnh lên Cloud...</p>}

                            <div>
                                <label className="block text-sm font-bold mb-2 dark:text-white">Mô tả tình trạng <span className="text-red-500">*</span></label>
                                <textarea required className="w-full p-3.5 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]" placeholder="Ví dụ: Áo mặc 2 lần, còn mới 90%, không xù lông..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-xl text-slate-700 dark:text-slate-300 transition-colors">Hủy bỏ</button>
                                <button type="submit" disabled={isSubmitting || uploadingImages} className="flex-1 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                                    {isSubmitting ? <><span className="material-symbols-outlined animate-spin">sync</span> Đang xử lý</> : (editingItem ? 'Lưu Thay Đổi' : 'Đăng Bán Ngay')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AccountLayout>
    );
};

export default My2ndListings;