// src/pages/account/MyListings.tsx
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


    // Render badge trạng thái
    const renderStatus = (status: string) => {
        if (status === 'active') return <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-md font-bold">Đang Bán</span>;
        if (status === 'pending') return <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-md font-bold">Chờ Duyệt</span>;
        if (status === 'inactive') return <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-md font-bold">Đã Ẩn</span>;
        return <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-md font-bold">{status}</span>;
    };

    return (
        <AccountLayout>
            <div className="bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white">Đồ Cũ Của Tôi</h2>
                        <p className="text-sm text-slate-500">Quản lý các món đồ bạn đang Pass.</p>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">add</span> Đăng Bán Mới
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-slate-500">Đang tải dữ liệu...</div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        Bạn chưa đăng bán món đồ nào.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.map(item => (
                            <div key={item._id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 relative flex flex-col group">
                                <div className="absolute top-2 left-2 z-10">{renderStatus(item.status)}</div>
                                {/* action buttons */}
                                <div className="absolute top-2 right-2 z-10 flex gap-1">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-1 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                                    >
                                        <span className="material-symbols-outlined text-xs">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className="p-1 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                                    >
                                        <span className="material-symbols-outlined text-xs text-red-500">delete</span>
                                    </button>
                                </div>
                                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden mb-3">
                                    <img src={item.main_image || "https://placehold.co/300"} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                </div>
                                <h3 className="font-bold text-slate-800 dark:text-white line-clamp-2">{item.name}</h3>
                                <p className="text-primary font-bold mt-auto pt-2">{formatPrice(item.price)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Đăng Bài Tối Giản */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6 border-b pb-3 dark:border-slate-800">
                            <h3 className="text-xl font-bold dark:text-white">{editingItem ? 'Chỉnh sửa bài đăng' : 'Pass Đồ Cũ'}</h3>
                            <button onClick={() => { setShowModal(false); setEditingItem(null); }} className="text-slate-400 hover:text-red-500">
                                <span className="material-symbols-outlined block">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1 dark:text-white">Tên sản phẩm *</label>
                                <input required className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary" placeholder="VD: Áo Khoác Denim..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1 dark:text-white">Giá Pass (VND) *</label>
                                    <input required type="number" className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary" placeholder="150000" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1 dark:text-white">Giá gốc lúc mua</label>
                                    <input type="number" className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary" placeholder="500000" value={formData.original_price} onChange={e => setFormData({...formData, original_price: e.target.value})} />
                                </div>
                            </div>

                            {/* Product types section */}
                            <div>
                                <label className="block text-sm font-bold mb-1 dark:text-white">Loại sản phẩm (màu, size...) *</label>
                                {formData.product_type.map((pt, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2 items-center">
                                        <input
                                            type="text"
                                            placeholder="Màu/Size"
                                            value={pt.description}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setFormData(prev => {
                                                    const arr = [...prev.product_type];
                                                    arr[idx] = { ...arr[idx], description: val };
                                                    return { ...prev, product_type: arr };
                                                });
                                            }}
                                            className="flex-1 p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Số lượng"
                                            value={pt.stock}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setFormData(prev => {
                                                    const arr = [...prev.product_type];
                                                    arr[idx] = { ...arr[idx], stock: val };
                                                    return { ...prev, product_type: arr };
                                                });
                                            }}
                                            className="w-24 p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary"
                                        />
                                        <input
                                            type="number"
                                            step="1000"
                                            min="0"
                                            placeholder="Chênh lệch giá (VNĐ)"
                                            value={pt.price_difference || ''}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setFormData(prev => {
                                                    const arr = [...prev.product_type];
                                                    arr[idx] = { ...arr[idx], price_difference: val };
                                                    return { ...prev, product_type: arr };
                                                });
                                            }}
                                            className="w-32 p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary"
                                        />
                                        {formData.product_type.length > 1 && (
                                            <button type="button" className="text-red-500" onClick={() => {
                                                setFormData(prev => {
                                                    const arr = [...prev.product_type];
                                                    arr.splice(idx,1);
                                                    return { ...prev, product_type: arr };
                                                });
                                            }}>
                                                x
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" className="text-blue-500 text-sm" onClick={() => {
                                    setFormData(prev => ({
                                        ...prev,
                                        product_type: [...prev.product_type, { description: '', stock: '' }]
                                    }));
                                }}>
                                    + Thêm loại
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1 dark:text-white">Danh mục (có thể chọn nhiều)</label>
                                {categories.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {categories.map(cat => (
                                            <label key={cat._id} className="inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    value={cat._id}
                                                    checked={formData.category_id.includes(cat._id)}
                                                    onChange={e => {
                                                        const id = e.target.value;
                                                        setFormData(prev => {
                                                            const arr = [...prev.category_id];
                                                            if (e.target.checked) {
                                                                arr.push(id);
                                                            } else {
                                                                const idx = arr.indexOf(id);
                                                                if (idx > -1) arr.splice(idx, 1);
                                                            }
                                                            return { ...prev, category_id: arr };
                                                        });
                                                    }}
                                                />
                                                <span className="ml-2">{cat.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-red-500">Chưa có danh mục. Vui lòng liên hệ admin.</div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 dark:text-white">Ảnh chính *</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (f) handleMainImageSelection(f);
                                    }}
                                />
                                {uploadingImages && <p className="text-xs text-slate-500">Đang tải ảnh...</p>}
                                {formData.main_image && (
                                    <img src={formData.main_image} alt="main" className="w-24 h-24 object-cover rounded mt-2" />
                                )}
                            </div>

                            {/* upload ảnh bổ sung (di chuyển xuống sau ảnh chính) */}
                            <div>
                                <label className="block text-sm font-bold mb-1 dark:text-white">Ảnh bổ sung</label>
                                {imageSlots.map((slot, idx) => (
                                    <div key={slot} className="flex items-center gap-2 mb-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => {
                                                const f = e.target.files?.[0];
                                                if (f) handleImageSelection(idx, f);
                                            }}
                                        />
                                        {formData.display_files[idx] && (
                                            <img src={formData.display_files[idx]} alt="preview" className="w-12 h-12 object-cover rounded" />
                                        )}
                                        {imageSlots.length > 1 && (
                                            <button type="button" className="text-red-500" onClick={() => removeImageSlot(idx)}>
                                                x
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" className="text-blue-500 text-sm" onClick={addImageSlot}>
                                    + Thêm ảnh
                                </button>
                                {uploadingImages && <p className="text-xs text-slate-500">Đang tải ảnh...</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 dark:text-white">Mô tả tình trạng *</label>
                                <textarea required className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary min-h-[80px]" placeholder="Áo còn mới 90%, đã mặc 2 lần..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>
                            
                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">Lưu ý: với mỗi loại (màu, size…) bạn có thể nhập số lượng <strong>riêng biệt</strong>.</p>
                            
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 font-bold rounded-lg text-slate-700 dark:text-slate-300">Hủy</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-primary text-white font-bold rounded-lg disabled:opacity-70">
                                    {isSubmitting ? 'Đang xử lý...' : 'Đăng Bán'}
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