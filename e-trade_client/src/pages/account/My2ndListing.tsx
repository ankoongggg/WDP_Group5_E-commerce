// src/pages/account/MyListings.tsx
import React, { useState, useEffect } from 'react';
import { AccountLayout } from '../components/AccountLayout';
import { customerPassApi } from '../../services/customerPassService';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import {CategoryService} from '../../services/categoryService';
import { uploadMultiple } from '../../utils/cloudinary';
const My2ndListings: React.FC = () => {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { formatPrice } = useCurrency();

    // State cho Modal Đăng Đồ / Chỉnh sửa
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null); // nếu khác null => đang sửa
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        original_price: '',
        main_image: '',
        category_id: [] as string[],
        display_files: [] as string[],
        product_type: [{ description: '', stock: '' }]
        // category_id is array of ids now
    });

    const [uploadingImages, setUploadingImages] = useState(false);
    // image slots for dynamic inputs
    const [imageSlots, setImageSlots] = useState<number[]>([0]);

    const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([]); // danh sách lấy từ server

    useEffect(() => {
        fetchCategories();
    }, []);
    
    const fetchCategories = async () => {
        try {
            const data: any[] = await CategoryService.getAllOnHomePage({});
            // đảm bảo có _id và name, Mongoose trả về _id; tạo thêm id nếu bạn thích
            const normalized = data.map(c => ({ _id: c._id || c.id || '', name: c.name }));
            setCategories(normalized);
        } catch (error) {
            console.error('Error loading categories', error);
            toast.error("Lỗi tải danh mục.");
        }
    };

    const handleImageSelection = async (index: number, file: File) => {
        if (!file) return;
        setUploadingImages(true);
        try {
            const urls = await uploadMultiple([file]);
            setFormData(prev => {
                const current = [...(prev.display_files || [])];
                current[index] = urls[0];
                return { ...prev, display_files: current };
            });
        } catch (err) {
            console.error('Upload error', err);
            toast.error('Tải ảnh thất bại');
        } finally {
            setUploadingImages(false);
        }
    };

    const handleMainImageSelection = async (file: File) => {
        if (!file) return;
        setUploadingImages(true);
        try {
            const urls = await uploadMultiple([file]);
            setFormData(prev => ({ ...prev, main_image: urls[0] }));
        } catch (err) {
            console.error('Upload error', err);
            toast.error('Tải ảnh chính thất bại');
        } finally {
            setUploadingImages(false);
        }
    };

    const addImageSlot = () => {
        setImageSlots(prev => [...prev, prev.length]);
    };

    const removeImageSlot = (idx: number) => {
        setImageSlots(prev => prev.filter(i => i !== idx));
        setFormData(prev => {
            const current = [...(prev.display_files || [])];
            current.splice(idx, 1);
            return { ...prev, display_files: current };
        });
    };


    const fetchListings = async () => {
        setLoading(true);
        try {
            const data = await customerPassApi.getMyListings();
            setListings(data);
        } catch (error) {
            toast.error("Lỗi tải danh sách sản phẩm.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // nếu đã tải danh mục mà chưa chọn thì báo lỗi
            if (categories.length > 0 && !formData.category_id) {
                toast.error('Vui lòng chọn danh mục');
                setIsSubmitting(false);
                return;
            }
            // Chuẩn bị payload (Category có thể cần là mảng tùy DB của bạn)
            const payload: any = {
                ...formData,
                price: Number(formData.price),
                original_price: Number(formData.original_price),
            };
            // already array
            if (formData.category_id && formData.category_id.length) payload.category_id = formData.category_id;
            // convert product types
            if (formData.product_type && formData.product_type.length) {
                payload.product_type = formData.product_type.map((pt: any) => ({
                    description: pt.description,
                    stock: Number(pt.stock) || 0
                }));
            }
            // include display files
            if (formData.display_files && formData.display_files.length) payload.display_files = formData.display_files;

            if (editingItem) {
                await customerPassApi.updateListing(editingItem._id, payload);
                toast.success("Cập nhật bài đăng thành công!");
            } else {
                await customerPassApi.createListing(payload);
                toast.success("Đăng bán đồ cũ thành công!");
            }

            setShowModal(false);
            setEditingItem(null);
            setFormData({ name: '', description: '', price: '', original_price: '', main_image: '', category_id: [], display_files: [], product_type: [{ description: '', stock: '' }] });
            fetchListings();
        } catch (error: any) {
            toast.error(error.response?.data?.message || (editingItem ? "Cập nhật thất bại." : "Đăng bán thất bại."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            name: item.name || '',
            description: item.description || '',
            price: item.price?.toString() || '',
            original_price: item.original_price?.toString() || '',
            main_image: item.main_image || '',
            category_id: item.category_id || [],
            display_files: item.display_files || [],
            product_type: (item.product_type || []).map((pt: any) => ({
                description: pt.description || '',
                stock: pt.stock != null ? String(pt.stock) : ''
            }))
        });
        // rebuild image slots based on existing files
        setImageSlots(Array.from({ length: (item.display_files ? item.display_files.length : 0) || 1 }, (_, i) => i));
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) return;
        try {
            await customerPassApi.deleteListing(id);
            toast.success('Xóa bài đăng thành công');
            fetchListings();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Xóa thất bại');
        }
    };

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