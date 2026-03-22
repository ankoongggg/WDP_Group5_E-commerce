import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { storeApi } from '../../services/api';
import { CategoryService } from '../../services/categoryService';
import { Layout } from './Layout';
import { uploadToCloudinary } from '../../utils/cloudinary';

interface AccountLayoutProps {
    children: React.ReactNode;
}

export const AccountLayout: React.FC<AccountLayoutProps> = ({ children }) => {
    const { user, logout, refreshUser } = useAuth();
    const { toast } = useToast();
    const location = useLocation();
    const { pathname } = useLocation();

    const getLinkClassName = (path: string, isExact: boolean = false) => {
        const baseClass = "flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-primary transition-all";
        const activeClass = "rounded-lg bg-primary/10 border-r-4 border-primary text-primary font-medium";
        const isActive = isExact ? pathname === path : pathname.startsWith(path);
        return isActive ? `${baseClass} ${activeClass}` : baseClass;
    };

    const [showSellerModal, setShowSellerModal] = useState(false);
    const [sellerRegistrationStatus, setSellerRegistrationStatus] = useState<any>(null);
    const [submittingSellerForm, setSubmittingSellerForm] = useState(false);
    const [isEditingSeller, setIsEditingSeller] = useState(false);
    const [categories, setCategories] = useState<Array<{ _id: string, name: string }>>([]);
    const [uploadingIdCard, setUploadingIdCard] = useState(false);

    const [sellerForm, setSellerForm] = useState({
        shop_name: "",
        shop_description: "",
        identity_card: "",
        identity_card_image: "",
        pickup_address: "",
        phone: "",
        business_category: ""
    });

    useEffect(() => {
        if (user && !user.role?.includes('seller')) {
            checkSellerRegistrationStatus();
        } else {
            setSellerRegistrationStatus(null);
        }
    }, [user]);

    useEffect(() => {
        if (showSellerModal) {
            CategoryService.getAllOnHomePage()
                .then((data) => setCategories(data))
                .catch(err => {
                    console.error("Lỗi khi tải danh mục:", err);
                    toast.error("Không thể tải danh mục ngành hàng.");
                });
        }
    }, [showSellerModal]);

    const checkSellerRegistrationStatus = async () => {
        try {
            const status = await storeApi.getSellerRegistrationStatus();
            if (status.status === 'approved' && refreshUser) {
                await refreshUser();
            } else {
                setSellerRegistrationStatus(status);
            }
        } catch (e: any) {
            setSellerRegistrationStatus(null);
        }
    };

    const handleIdCardImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.');
            return;
        }

        setUploadingIdCard(true);
        try {
            const imageUrl = await uploadToCloudinary(file);
            setSellerForm(prev => ({ ...prev, identity_card_image: imageUrl }));
            toast.success("Tải ảnh lên thành công!");
        } catch (error) {
            toast.error("Lỗi upload ảnh.");
        } finally {
            setUploadingIdCard(false);
        }
    };

    const onSubmitSellerForm = async () => {
        setSubmittingSellerForm(true);
        try {
            if (!sellerForm.shop_name || !sellerForm.shop_description || !sellerForm.identity_card || !sellerForm.pickup_address || !sellerForm.business_category || !sellerForm.identity_card_image || !sellerForm.phone) {
                toast.error("Vui lòng điền đầy đủ thông tin bắt buộc (bao gồm cả ảnh CMND/CCCD)");
                setSubmittingSellerForm(false);
                return;
            }
            
            if (!/^\d{12}$/.test(sellerForm.identity_card)) {
                toast.error("Số CMND/CCCD phải bao gồm đúng 12 chữ số");
                setSubmittingSellerForm(false);
                return;
            }

            if (!/^(0[3|5|7|8|9])([0-9]{8})$/.test(sellerForm.phone)) {
                toast.error("Số điện thoại phải có 10 số và đúng định dạng (VD: 0912345678)");
                setSubmittingSellerForm(false);
                return;
            }

            if (isEditingSeller) {
                await storeApi.updateSellerRegistration(sellerForm);
                toast.success("Cập nhật đơn đăng kí thành công! ✅");
            } else {
                await storeApi.registerSeller(sellerForm);
                toast.success("Gửi đơn đăng kí seller thành công! ✅ Vui lòng chờ admin phê duyệt.");
            }

            setShowSellerModal(false);
            setIsEditingSeller(false);
            setSellerForm({
                shop_name: "", shop_description: "", identity_card: "", identity_card_image: "", pickup_address: "", phone: "", business_category: ""
            });
            checkSellerRegistrationStatus();
        } catch (e: any) {
            toast.error(e?.message || "Gửi đơn thất bại");
        } finally {
            setSubmittingSellerForm(false);
        }
    };

    const handleEditSellerRegistration = () => {
        if (!sellerRegistrationStatus) return;
        setSellerForm({
            shop_name: sellerRegistrationStatus.shop_name || "",
            shop_description: sellerRegistrationStatus.shop_description || "",
            identity_card: sellerRegistrationStatus.identity_card || "",
            identity_card_image: sellerRegistrationStatus.identity_card_image || "",
            pickup_address: sellerRegistrationStatus.pickup_address || "",
            phone: sellerRegistrationStatus.phone || "",
            business_category: sellerRegistrationStatus.business_category || ""
        });
        setIsEditingSeller(true);
        setShowSellerModal(true);
    };

    const isActive = (path: string) => {
        if (path === '/account' && location.pathname === '/account') return true;
        if (path !== '/account' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <Layout>
            {showSellerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#2d1e16] rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                        <button 
                            onClick={() => { setShowSellerModal(false); setIsEditingSeller(false); }} 
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl text-primary">storefront</span>
                            </div>
                            <h2 className="text-2xl font-bold dark:text-white">
                                {isEditingSeller ? "Cập nhật thông tin Seller" : "Đăng ký trở thành Seller"}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">
                                {isEditingSeller ? "Chỉnh sửa thông tin cửa hàng của bạn" : "Điền thông tin bên dưới để bắt đầu kinh doanh cùng E-Trade"}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-1">
                                <label className="block font-bold mb-2 text-sm dark:text-white">Tên Shop <span className="text-red-500">*</span></label>
                                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" value={sellerForm.shop_name} onChange={e => setSellerForm({...sellerForm, shop_name: e.target.value})} placeholder="Nhập tên shop của bạn" />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block font-bold mb-2 text-sm dark:text-white">Số điện thoại liên hệ <span className="text-red-500">*</span></label>
                                <input 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" 
                                    value={sellerForm.phone} 
                                    maxLength={10}
                                    onChange={e => setSellerForm({...sellerForm, phone: e.target.value.replace(/[^0-9]/g, '')})} 
                                    placeholder="Nhập 10 số điện thoại" 
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block font-bold mb-2 text-sm dark:text-white">Mô tả Shop <span className="text-red-500">*</span></label>
                                <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none min-h-[100px]" value={sellerForm.shop_description} onChange={e => setSellerForm({...sellerForm, shop_description: e.target.value})} placeholder="Giới thiệu ngắn về shop để thu hút khách hàng" />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block font-bold mb-2 text-sm dark:text-white">Số CMND/CCCD <span className="text-red-500">*</span></label>
                                <input 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" 
                                    value={sellerForm.identity_card} 
                                    maxLength={12}
                                    onChange={e => setSellerForm({...sellerForm, identity_card: e.target.value.replace(/[^0-9]/g, '')})} 
                                    placeholder="Nhập 12 số định danh cá nhân" 
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block font-bold mb-2 text-sm dark:text-white">Ảnh CMND/CCCD <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-4 h-[48px]">
                                    {sellerForm.identity_card_image && (
                                        <img src={sellerForm.identity_card_image} alt="ID Card" className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                                    )}
                                    <label className={`cursor-pointer h-full px-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors dark:text-slate-300 ${uploadingIdCard ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <span className={`material-symbols-outlined text-[18px] ${uploadingIdCard ? 'animate-spin' : ''}`}>{uploadingIdCard ? 'sync' : 'upload'}</span>
                                        {uploadingIdCard ? 'Đang tải...' : (sellerForm.identity_card_image ? 'Đổi ảnh' : 'Tải ảnh lên')}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleIdCardImageChange} disabled={uploadingIdCard} />
                                    </label>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block font-bold mb-2 text-sm dark:text-white">Địa chỉ lấy hàng <span className="text-red-500">*</span></label>
                                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" value={sellerForm.pickup_address} onChange={e => setSellerForm({...sellerForm, pickup_address: e.target.value})} placeholder="Địa chỉ kho hàng/nơi lấy hàng" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block font-bold mb-2 text-sm dark:text-white">Ngành hàng kinh doanh <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    {categories.map(cat => (
                                        <label key={cat._id} className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                checked={sellerForm.business_category.split(',').includes(cat.name)}
                                                onChange={e => {
                                                    let arr = sellerForm.business_category ? sellerForm.business_category.split(',') : [];
                                                    if (e.target.checked) {
                                                        arr.push(cat.name);
                                                    } else {
                                                        arr = arr.filter(c => c !== cat.name);
                                                    }
                                                    setSellerForm({...sellerForm, business_category: arr.join(',')});
                                                }}
                                            />
                                            <span className="text-sm dark:text-slate-300">{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <button 
                                onClick={() => { setShowSellerModal(false); setIsEditingSeller(false); }}
                                className="flex-1 px-6 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={onSubmitSellerForm} 
                                disabled={submittingSellerForm} 
                                className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submittingSellerForm ? (
                                    <><span className="material-symbols-outlined animate-spin text-lg">sync</span> Đang xử lý...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-lg">send</span> {isEditingSeller ? "Cập nhật đơn" : "Gửi đơn đăng ký"}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1440px] mx-auto w-full px-4 md:px-6 py-8 flex flex-col md:flex-row gap-8">
                
                <aside className="w-full md:w-64 shrink-0">
                    <div className="bg-white dark:bg-[#1a110c] border border-slate-200 dark:border-slate-800 rounded-2xl py-6 px-3 sticky top-24 shadow-sm">
                        <nav className="flex flex-col gap-1">
                            <Link to="/account" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/account') ? 'bg-primary/10 border-r-4 border-primary text-primary font-medium' : 'text-slate-500 hover:text-primary'}`}>
                                <span className="material-symbols-outlined">person</span> Profile
                            </Link>
                            <Link to="/account/orders" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/account/orders') ? 'bg-primary/10 border-r-4 border-primary text-primary font-medium' : 'text-slate-500 hover:text-primary'}`}>
                                <span className="material-symbols-outlined">shopping_bag</span> Orders
                            </Link>
                            <Link to="/account/wishlist" className={getLinkClassName('/account/wishlist')}>
                                <span className="material-symbols-outlined">favorite</span> Wishlist & Following
                            </Link>
                            
                            <div className="mt-4 mb-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Pass Đồ Cũ</div>
                            <Link to="/account/my-2nd-listings" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/account/my-listings') ? 'bg-primary/10 border-r-4 border-primary text-primary font-medium' : 'text-slate-500 hover:text-primary'}`}>
                                <span className="material-symbols-outlined">inventory_2</span> Đồ Đang Pass
                            </Link>
                            <Link to="/account/passing-product-orders" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/account/sales-orders') ? 'bg-primary/10 border-r-4 border-primary text-primary font-medium' : 'text-slate-500 hover:text-primary'}`}>
                                <span className="material-symbols-outlined">receipt_long</span> Đơn Khách Đặt
                            </Link>

                            <div className="mt-4 mb-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Khác</div>
                            <Link to="/account/settings" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/account/settings') ? 'bg-primary/10 border-r-4 border-primary text-primary font-medium' : 'text-slate-500 hover:text-primary'}`}>
                                <span className="material-symbols-outlined">lock_reset</span> Đổi mật khẩu
                            </Link>

                            {user?.role?.includes('seller') && (
                                <Link to="/seller/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-primary transition-all mt-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <span className="material-symbols-outlined">storefront</span> Seller Dashboard
                                </Link>
                            )}
                            
                            {!user?.role?.includes('seller') && !sellerRegistrationStatus && (
                                <button onClick={() => { setShowSellerModal(true); setIsEditingSeller(false); }} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-primary transition-all mt-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-left">
                                    <span className="material-symbols-outlined">store</span> Become a Seller
                                </button>
                            )}

                            <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all mt-2 text-left font-medium">
                                <span className="material-symbols-outlined">logout</span> Logout
                            </button>
                        </nav>
                    </div>
                </aside>

                <main className="flex-1 w-full min-h-[500px]">
                    {!user?.role?.includes('seller') && sellerRegistrationStatus && (
                        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="font-bold text-blue-800 dark:text-blue-300">
                                    Đơn đăng ký cửa hàng: 
                                    <span className="ml-2 px-2 py-0.5 rounded text-xs text-white bg-blue-500 uppercase">
                                        {sellerRegistrationStatus.status}
                                    </span>
                                </p>
                                {sellerRegistrationStatus.status === 'rejected' && (
                                    <p className="text-sm text-red-600 mt-1">Lý do từ chối: {sellerRegistrationStatus.rejection_reason}</p>
                                )}
                            </div>
                            {(sellerRegistrationStatus.status === 'pending' || sellerRegistrationStatus.status === 'rejected') && (
                                <button onClick={handleEditSellerRegistration} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">edit</span> Cập nhật
                                </button>
                            )}
                        </div>
                    )}

                    {user?.role?.includes('seller') && location.pathname === '/account' &&(
                         <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-xl flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <span className="material-symbols-outlined text-green-600 text-2xl">verified</span>
                                 <div>
                                     <p className="font-bold text-green-800 dark:text-green-300">Tài khoản Cửa Hàng (Seller)</p>
                                     <p className="text-sm text-green-700 dark:text-green-400">Bạn có thể truy cập Seller Dashboard để quản lý toàn diện.</p>
                                 </div>
                             </div>
                             <Link to="/seller/dashboard" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow hover:bg-green-700 transition-colors">
                                 Tới Dashboard
                             </Link>
                         </div>
                    )}

                    {children}
                </main>
            </div>
        </Layout>
    );
};