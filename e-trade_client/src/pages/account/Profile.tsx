import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../services/api';

const Profile: React.FC = () => {
    const { user, logout, refreshUser } = useAuth();
    const { toast } = useToast();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({ name: "", phone: "", gender: "", dob: "", avatar: "" });
    const [addr, setAddr] = useState({ label: "Home", street: "", district: "", city: "", is_default: true });

    useEffect(() => {
        if (user) {
            setForm({
                name: user.full_name || user.name || "", 
                phone: user.phone || "",
                gender: user.gender || "",
                // Cắt chuẩn "YYYY-MM-DD" để form nhận diện được ngày
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

    const onSave = async () => {
        setSaving(true);
        try {
            const payload = {
                full_name: form.name, 
                phone: form.phone,
                gender: form.gender,
                dob: form.dob || null, // Xử lý triệt để lỗi ngày sinh rỗng
                addresses: [addr],
            };

            await authApi.updateProfile(payload);
            
            // Ép UI tải lại dữ liệu mới nhất
            if (refreshUser) await refreshUser();
            setEditing(false);
            toast.success("Cập nhật thành công! ✅");
        } catch (e: any) {
            toast.error(e?.message || "Lưu thất bại");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex flex-col">
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a110c] px-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Link to="/" className="bg-primary p-1.5 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-2xl">dashboard</span>
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">My Account</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/" className="font-bold text-sm text-slate-500 hover:text-primary transition-all">Return to Shop</Link>
                    <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors font-bold text-sm text-slate-900 dark:text-white">
                        <span className="material-symbols-outlined text-lg">logout</span> Logout
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside className="w-64 bg-white dark:bg-[#1a110c] border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col py-6 px-3">
                    <nav className="flex flex-col gap-1">
                        <Link to="/account" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border-r-4 border-primary text-primary font-medium">
                            <span className="material-symbols-outlined">person</span> Profile
                        </Link>
                        <Link to="/account/orders" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-primary transition-all">
                            <span className="material-symbols-outlined">shopping_bag</span> Orders
                        </Link>
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

                        {/* KHỐI 2: GIAO DIỆN ĐỊA CHỈ ĐÃ ĐƯỢC TRẢ LẠI */}
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
        </div>
    );
};

export default Profile;