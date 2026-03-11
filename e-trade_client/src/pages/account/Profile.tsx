import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi, storeApi } from '../../services/api';
import { CategoryService } from '../../services/categoryService';
import { Layout } from '../components/Layout'; // IMPORT LAYOUT CHUẨN

const Profile: React.FC = () => {
    const [categories, setCategories] = useState<Array<{_id: string, name: string}>>([]);
    const { user, logout, refreshUser } = useAuth();
    const { toast } = useToast();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSellerModal, setShowSellerModal] = useState(false);
    const [sellerRegistrationStatus, setSellerRegistrationStatus] = useState<any>(null);
    const [submittingSellerForm, setSubmittingSellerForm] = useState(false);
    const [isEditingSeller, setIsEditingSeller] = useState(false);

    const [form, setForm] = useState({ name: "", phone: "", gender: "", dob: "", avatar: "" });
    const [addr, setAddr] = useState({ label: "Home", street: "", district: "", city: "", is_default: true });
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
        if (user) {
            setForm({
                name: user.full_name || user.name || "", 
                phone: user.phone || "",
                gender: user.gender || "",
                dob: user.dob ? user.dob.split('T')[0] : "", 
                avatar: user.avatar || "",
            });
            const dAddr = user.addresses?.find((a: any) => a.is_default) || user.addresses?.[0];
            if (dAddr) {
                setAddr({ 
                    label: dAddr.label || "Home", 
                    street: dAddr.street || "", 
                    district: dAddr.district || "", 
                    city: dAddr.city || "", 
                    is_default: true 
                });
            }
        }
    }, [user, editing]);

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
                .then((data) => {
                    setCategories(data);
                })
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

    const onSave = async () => {
        setSaving(true);
        try {
            const payload = {
                full_name: form.name, 
                phone: form.phone,
                gender: form.gender,
                dob: form.dob || null, 
                addresses: [addr],
            };

            await authApi.updateProfile(payload);
            
            if (refreshUser) await refreshUser();
            setEditing(false);
            toast.success("Cập nhật thành công! ✅");
        } catch (e: any) {
            toast.error(e?.message || "Lưu thất bại");
        } finally {
            setSaving(false);
        }
    };

    const onSubmitSellerForm = async () => {
        setSubmittingSellerForm(true);
        try {
            if (!sellerForm.shop_name || !sellerForm.shop_description || !sellerForm.identity_card || !sellerForm.pickup_address || !sellerForm.business_category) {
                toast.error("Vui lòng điền đầy đủ thông tin required");
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
                shop_name: "",
                shop_description: "",
                identity_card: "",
                identity_card_image: "",
                pickup_address: "",
                phone: "",
                business_category: ""
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

    return (
        <Layout>
            {/* Modal Become a Seller */}
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
                                <label className="block font-bold mb-2 text-sm dark:text-white">Số điện thoại liên hệ</label>
                                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" value={sellerForm.phone} onChange={e => setSellerForm({...sellerForm, phone: e.target.value})} placeholder="SĐT liên hệ với shop" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block font-bold mb-2 text-sm dark:text-white">Mô tả Shop <span className="text-red-500">*</span></label>
                                <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none min-h-[100px]" value={sellerForm.shop_description} onChange={e => setSellerForm({...sellerForm, shop_description: e.target.value})} placeholder="Giới thiệu ngắn về shop để thu hút khách hàng" />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block font-bold mb-2 text-sm dark:text-white">Số CMND/CCCD <span className="text-red-500">*</span></label>
                                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" value={sellerForm.identity_card} onChange={e => setSellerForm({...sellerForm, identity_card: e.target.value})} placeholder="Nhập số định danh cá nhân" />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block font-bold mb-2 text-sm dark:text-white">Ảnh CMND/CCCD (Link)</label>
                                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" value={sellerForm.identity_card_image} onChange={e => setSellerForm({...sellerForm, identity_card_image: e.target.value})} placeholder="https://..." />
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

            <div className="flex flex-1 overflow-hidden bg-background-light dark:bg-background-dark font-display">
                <aside className="w-64 bg-white dark:bg-[#1a110c] border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col py-6 px-3">
                    <nav className="flex flex-col gap-1">
                        <Link to="/account" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border-r-4 border-primary text-primary font-medium">
                            <span className="material-symbols-outlined">person</span> Profile
                        </Link>
                        <Link to="/account/orders" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-primary transition-all">
                            <span className="material-symbols-outlined">shopping_bag</span> Orders
                        </Link>
                        <Link to="/account/settings" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-primary transition-all">
                            <span className="material-symbols-outlined">settings</span> Settings
                        </Link>
                        {user?.role?.includes('seller') && (
                            <Link to="/seller/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-primary transition-all">
                                <span className="material-symbols-outlined">storefront</span> Seller Dashboard
                            </Link>
                        )}
                        {!user?.role?.includes('seller') && !sellerRegistrationStatus && (
                            <button onClick={() => { setShowSellerModal(true); setIsEditingSeller(false); }} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-primary transition-all">
                                <span className="material-symbols-outlined">store</span> Become a Seller
                            </button>
                        )}
                    </nav>
                </aside>

                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-5xl mx-auto space-y-8">
                        {/* KHỐI 1: THÔNG TIN CÁ NHÂN */}
                        <section className="flex flex-col md:flex-row items-center gap-8 bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-primary/20 flex items-center justify-center bg-primary/10">
                                <img src={user?.avatar || "https://via.placeholder.com/150"} className="h-full w-full object-cover" alt="avatar" />
                            </div>
                            <div className="text-center md:text-left flex-1">
                                {!editing ? (
                                    <>
                                        <h2 className="text-2xl font-bold dark:text-white">{user?.full_name || user?.name || "User"}</h2>
                                        <div className="mt-2 space-y-1 text-slate-500 dark:text-slate-400">
                                            <p><b>Email:</b> {user?.email}</p>
                                            <p><b>SĐT:</b> {user?.phone || "Chưa cập nhật"}</p>
                                            <p><b>Giới tính:</b> {user?.gender || "Chưa cập nhật"}</p>
                                            <p><b>Ngày sinh:</b> {user?.dob ? new Date(user.dob).toLocaleDateString() : "Chưa cập nhật"}</p>
                                        </div>
                                        <button onClick={() => setEditing(true)} className="mt-4 bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm">Edit Profile</button>
                                    </>
                                ) : (
                                    <div className="grid gap-3 max-w-xl">
                                        <input className="w-full px-4 py-2 rounded-xl border dark:bg-slate-900 dark:text-white" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Full Name" />
                                        <input className="w-full px-4 py-2 rounded-xl border dark:bg-slate-900 dark:text-white" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="Phone" />
                                        <div className="grid grid-cols-2 gap-3">
                                            <select className="px-4 py-2 rounded-xl border dark:bg-slate-900 dark:text-white" value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})}>
                                                <option value="">-- Gender --</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                            <input type="date" className="px-4 py-2 rounded-xl border dark:bg-slate-900 dark:text-white" value={form.dob} onChange={(e) => setForm({...form, dob: e.target.value})} />
                                        </div>
                                        <div className="mt-4 flex gap-3">
                                            <button onClick={onSave} disabled={saving} className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm">{saving ? "Saving..." : "Save Changes"}</button>
                                            <button onClick={() => setEditing(false)} className="bg-slate-200 px-6 py-2 rounded-xl font-bold text-sm text-slate-900">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* KHỐI 1.5: TRẠNG THÁI ĐƠN ĐĂNG KÍ SELLER */}
                        {!user?.role?.includes('seller') && sellerRegistrationStatus && (
                            <section className="bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold dark:text-white">Seller Registration Status</h3>
                                    {(sellerRegistrationStatus.status === 'pending' || sellerRegistrationStatus.status === 'rejected') && (
                                        <button 
                                            onClick={handleEditSellerRegistration}
                                            className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit_note</span>
                                            Edit Application
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium dark:text-white">Status:</span>
                                        <span className={`px-4 py-2 rounded-lg font-bold text-sm ${
                                            sellerRegistrationStatus.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            sellerRegistrationStatus.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {sellerRegistrationStatus.status === 'approved' && '✅ Approved'}
                                            {sellerRegistrationStatus.status === 'rejected' && '❌ Rejected'}
                                            {sellerRegistrationStatus.status === 'pending' && '⏳ Pending'}
                                        </span>
                                    </div>
                                    {sellerRegistrationStatus.rejection_reason && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                                            <p className="text-red-700 dark:text-red-300"><b>Rejection Reason:</b></p>
                                            <p className="text-red-600 dark:text-red-400 mt-2">{sellerRegistrationStatus.rejection_reason}</p>
                                        </div>
                                    )}
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Submitted on: {new Date(sellerRegistrationStatus.created_at).toLocaleDateString()}</p>
                                </div>
                            </section>
                        )}

                        {/* KHỐI 1.6: THÔNG TIN SELLER (NẾU ĐÃ LÀ SELLER) */}
                        {user?.role?.includes('seller') && (
                            <section className="bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold dark:text-white">Seller Account</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium dark:text-white">Trạng thái:</span>
                                        <span className="px-4 py-2 rounded-lg font-bold text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active Seller</span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Chúc mừng! Bạn đã là nhà bán hàng trên E-Trade. Truy cập trang quản lý để đăng sản phẩm và theo dõi đơn hàng.</p>
                                    <div className="pt-4">
                                        <Link to="/seller/dashboard" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
                                            <span className="material-symbols-outlined">storefront</span>
                                            Truy cập Seller Dashboard
                                        </Link>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* KHỐI 2: GIAO DIỆN ĐỊA CHỈ */}
                        <div className="bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-bold mb-6 dark:text-white">Delivery Address</h3>
                            {!editing ? (
                                user?.addresses?.length > 0 ? user.addresses.map((item: any, i: number) => (
                                    <div key={i} className="p-4 border-2 border-primary/20 bg-primary/5 rounded-xl mb-3">
                                        <p className="font-bold dark:text-white">{item.label || "Home"}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.street}, {item.district}, {item.city}</p>
                                    </div>
                                )) : <p className="text-slate-500">Chưa có địa chỉ</p>
                            ) : (
                                <div className="grid gap-3">
                                    <input className="w-full px-4 py-2 rounded-xl border dark:bg-slate-900 dark:text-white" value={addr.street} onChange={(e) => setAddr({...addr, street: e.target.value})} placeholder="Street" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input className="px-4 py-2 rounded-xl border dark:bg-slate-900 dark:text-white" value={addr.district} onChange={(e) => setAddr({...addr, district: e.target.value})} placeholder="District" />
                                        <input className="px-4 py-2 rounded-xl border dark:bg-slate-900 dark:text-white" value={addr.city} onChange={(e) => setAddr({...addr, city: e.target.value})} placeholder="City" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </Layout>
    );
};

export default Profile;