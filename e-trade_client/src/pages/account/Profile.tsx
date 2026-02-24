import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';

const Profile: React.FC = () => {
    const { user, logout, refreshUser } = useAuth(); // Lấy refreshUser để cập nhật lại data sau khi lưu
    const { toast } = useToast();

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form thông tin cá nhân
    const [form, setForm] = useState({
        name: "",
        phone: "",
        gender: "",
        dob: "",
        avatar: "",
    });

    // Form địa chỉ
    const [addr, setAddr] = useState({
        label: "Home",
        recipient_name: "",
        phone: "",
        street: "",
        district: "",
        city: "",
        is_default: true,
    });

    // Đồng bộ dữ liệu từ Context vào Form khi nhấn Edit
    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                phone: user.phone || "",
                gender: user.gender || "",
                dob: user.dob ? user.dob.slice(0, 10) : "",
                avatar: user.avatar || "",
            });

            const defaultAddr = user.addresses?.find((a: any) => a.is_default) || user.addresses?.[0];
            if (defaultAddr) {
                setAddr({
                    label: defaultAddr.label || "Home",
                    recipient_name: defaultAddr.recipient_name || user.name || "",
                    phone: defaultAddr.phone || user.phone || "",
                    street: defaultAddr.street || "",
                    district: defaultAddr.district || "",
                    city: defaultAddr.city || "",
                    is_default: defaultAddr.is_default ?? true,
                });
            }
        }
    }, [user, editing]);

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
    };

    const onSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                addresses: [addr], // Gửi kèm địa chỉ đã sửa
            };

            await api("/users/me", {
                method: "PUT",
                body: JSON.stringify(payload),
            });

            if (refreshUser) await refreshUser(); // Cập nhật lại thông tin user trong Context
            setEditing(false);
            toast.success("Profile updated successfully! ✅");
        } catch (e: any) {
            toast.error(e?.message || "Save failed");
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
                    <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm">Return to Shop</Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors font-bold text-sm text-slate-900 dark:text-white">
                        <span className="material-symbols-outlined text-lg">logout</span> Logout
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside className="w-64 bg-white dark:bg-[#1a110c] border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col py-6">
                    <nav className="flex flex-col gap-1 px-3">
                        <Link to="/account" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border-r-4 border-primary text-primary font-medium">
                            <span className="material-symbols-outlined">person</span> Profile
                        </Link>
                        <Link to="/account/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary transition-all">
                            <span className="material-symbols-outlined">shopping_bag</span> Orders
                        </Link>
                        <Link to="/account/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary transition-all">
                            <span className="material-symbols-outlined">settings</span> Settings
                        </Link>
                    </nav>
                </aside>

                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-5xl mx-auto space-y-8">
                        {/* Section Thông tin cá nhân */}
                        <section className="flex flex-col md:flex-row items-center gap-8 bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-primary/20 flex items-center justify-center bg-primary/10">
                                <img 
                                    src={form.avatar || user?.avatar || "https://via.placeholder.com/150"} 
                                    className="h-full w-full object-cover" 
                                    alt="avatar"
                                />
                            </div>
                            <div className="text-center md:text-left flex-1">
                                {!editing ? (
                                    <>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
                                        <p className="text-slate-500 dark:text-slate-400">{user?.email}</p>
                                        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                                            <button onClick={() => setEditing(true)} className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl font-bold text-sm">Edit Profile</button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="grid gap-3 max-w-xl">
                                        <input className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Name" />
                                        <input className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="Phone" />
                                        <div className="grid grid-cols-2 gap-3">
                                            <select className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white" value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})}>
                                                <option value="">-- Gender --</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                            <input type="date" className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900 text-slate-900 dark:text-white" value={form.dob} onChange={(e) => setForm({...form, dob: e.target.value})} />
                                        </div>
                                        <div className="mt-4 flex gap-3">
                                            <button onClick={onSave} disabled={saving} className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm">{saving ? "Saving..." : "Save Changes"}</button>
                                            <button onClick={() => setEditing(false)} className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-2 rounded-xl font-bold text-sm">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Section Địa chỉ */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white"><span className="material-symbols-outlined text-primary">local_shipping</span> Delivery Addresses</h3>
                                    
                                    {!editing ? (
                                        user?.addresses?.map((item: any, i: number) => (
                                            <div key={i} className={`flex items-start gap-4 p-4 border-2 rounded-xl relative mb-3 ${item.is_default ? 'border-primary/20 bg-primary/5' : 'border-slate-100'}`}>
                                                <span className="material-symbols-outlined text-primary mt-1">home</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-slate-900 dark:text-white">{item.label}</span>
                                                        {item.is_default && <span className="bg-primary text-white text-[10px] uppercase px-2 py-0.5 rounded-full font-bold">Default</span>}
                                                    </div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.street}, {item.district}, {item.city}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="grid gap-3">
                                            <input className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900" value={addr.street} onChange={(e) => setAddr({...addr, street: e.target.value})} placeholder="Street" />
                                            <div className="grid grid-cols-2 gap-3">
                                                <input className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900" value={addr.district} onChange={(e) => setAddr({...addr, district: e.target.value})} placeholder="District" />
                                                <input className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900" value={addr.city} onChange={(e) => setAddr({...addr, city: e.target.value})} placeholder="City" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Reward Sidebar */}
                            <div className="space-y-8">
                                <div className="bg-gradient-to-br from-primary to-orange-600 p-6 rounded-xl text-white">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="material-symbols-outlined text-3xl">loyalty</span>
                                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full uppercase">{(user?.role || []).includes('seller') ? 'Seller' : 'Member'}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-white/70 text-sm">Reward Balance</p>
                                        <p className="text-3xl font-bold">2,450 pts</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Profile;