import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../services/api';
import { AccountLayout } from "../components/AccountLayout";
import { uploadToCloudinary } from '../../utils/cloudinary';

const Profile: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({ name: "", phone: "", gender: "", dob: "", avatar: "" });
    const [addr, setAddr] = useState({ label: "Home", street: "", district: "", city: "", is_default: true });

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

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.');
            return;
        }

        setUploadingAvatar(true);
        try {
            const imageUrl = await uploadToCloudinary(file);
            setForm(prev => ({ ...prev, avatar: imageUrl }));
            toast.success("Tải ảnh lên thành công!");
        } catch (error) {
            toast.error("Lỗi upload ảnh.");
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const maxDate18 = new Date();
    maxDate18.setFullYear(maxDate18.getFullYear() - 18);
    const maxDateString = maxDate18.toISOString().split("T")[0];

    // ==========================================
    // LOGIC KIỂM TRA DỮ LIỆU (PHẪU THUẬT TẠI ĐÂY)
    // ==========================================
    const validateForm = () => {
        // 1. Kiểm tra Tên
        if (!form.name.trim()) {
            toast.error("Tên không được để trống!");
            return false;
        }

        // 2. Kiểm tra Số điện thoại (Chuẩn 10 số VN)
        // Regex: Bắt đầu bằng 0, tiếp theo là 3,5,7,8,9 và 8 số cuối
        const phoneRegex = /^(0[3|5|7|8|9])([0-9]{8})$/;
        if (form.phone && !phoneRegex.test(form.phone)) {
            toast.error("Số điện thoại phải có 10 số và đúng định dạng (VD: 0912345678)");
            return false;
        }

        // 3. Kiểm tra Ngày sinh
        if (form.dob) {
            const selectedDate = new Date(form.dob);
            const today = new Date();
            
            let age = today.getFullYear() - selectedDate.getFullYear();
            const m = today.getMonth() - selectedDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < selectedDate.getDate())) {
                age--;
            }

            if (age < 18) {
                toast.error("Bạn phải đủ 18 tuổi trở lên!");
                return false;
            }

            const minAgeDate = new Date();
            minAgeDate.setFullYear(today.getFullYear() - 100); // Không thể quá 100 tuổi

            if (selectedDate < minAgeDate) {
                toast.error("Ngày sinh không hợp lệ!");
                return false;
            }
        }

        return true;
    };

    const onSave = async () => {
        // Chặn đầu nếu dữ liệu sai
        if (!validateForm()) return;

        setSaving(true);
        try {
            let updatedAddresses = [];
            if (user?.addresses && user.addresses.length > 0) {
                updatedAddresses = [...user.addresses];
                const defaultIndex = updatedAddresses.findIndex((a: any) => a.is_default);
                if (defaultIndex !== -1) {
                    updatedAddresses[defaultIndex] = { ...updatedAddresses[defaultIndex], ...addr };
                } else {
                    updatedAddresses[0] = { ...updatedAddresses[0], ...addr };
                }
            } else {
                updatedAddresses = [addr];
            }

            const payload = {
                full_name: form.name,
                phone: form.phone,
                gender: form.gender,
                dob: form.dob || null, 
                addresses: updatedAddresses, 
                avatar: form.avatar
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

    return (
        <AccountLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                <section className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                    
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative group cursor-pointer">
                            <div 
                                className={`h-32 w-32 rounded-full overflow-hidden border-4 flex items-center justify-center transition-all ${editing ? 'border-primary shadow-lg shadow-primary/20' : 'border-primary/20 bg-primary/10'}`}
                                onClick={() => editing && fileInputRef.current?.click()}
                            >
                                {uploadingAvatar ? (
                                    <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
                                ) : (
                                    <img src={form.avatar || user?.avatar || "https://via.placeholder.com/150"} className={`h-full w-full object-cover transition-all ${editing ? 'group-hover:opacity-60' : ''}`} alt="avatar" />
                                )}
                            </div>
                            
                            {editing && !uploadingAvatar && (
                                <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => fileInputRef.current?.click()}>
                                    <div className="bg-black/50 text-white rounded-full p-2 flex items-center justify-center backdrop-blur-sm">
                                        <span className="material-symbols-outlined">photo_camera</span>
                                    </div>
                                </div>
                            )}

                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        </div>
                        {editing && <p className="text-xs text-slate-500 font-medium">Bấm ảnh để đổi</p>}
                    </div>

                    <div className="text-center md:text-left flex-1 mt-2">
                        {!editing ? (
                            <>
                                <h2 className="text-2xl font-bold dark:text-white">{user?.full_name || user?.name || "User"}</h2>
                                <div className="mt-2 space-y-1 text-slate-500 dark:text-slate-400">
                                    <p><b>Email:</b> {user?.email}</p>
                                    <p><b>SĐT:</b> {user?.phone || "Chưa cập nhật"}</p>
                                    <p><b>Giới tính:</b> {user?.gender || "Chưa cập nhật"}</p>
                                    <p><b>Ngày sinh:</b> {user?.dob ? new Date(user.dob).toLocaleDateString() : "Chưa cập nhật"}</p>
                                </div>
                                <button onClick={() => setEditing(true)} className="mt-4 bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm shadow">Edit Profile</button>
                            </>
                        ) : (
                            <div className="grid gap-3 max-w-xl">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Họ và tên</label>
                                    <input className="w-full px-4 py-2 rounded-xl border dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Họ và tên" />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Số điện thoại (10 số)</label>
                                    <input 
                                        className="w-full px-4 py-2 rounded-xl border dark:bg-slate-900 dark:border-slate-700 dark:text-white" 
                                        value={form.phone} 
                                        maxLength={10}
                                        onChange={(e) => setForm({...form, phone: e.target.value.replace(/[^0-9]/g, '')})} // Chỉ cho nhập số
                                        placeholder="Ví dụ: 0912345678" 
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 ml-1">Giới tính</label>
                                        <select className="w-full px-4 py-2 rounded-xl border dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})}>
                                            <option value="">-- Chọn --</option>
                                            <option value="Male">Nam</option>
                                            <option value="Female">Nữ</option>
                                            <option value="Other">Khác</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 ml-1">Ngày sinh</label>
                                        <input 
                                            type="date" 
                                            className="w-full px-4 py-2 rounded-xl border dark:bg-slate-900 dark:border-slate-700 dark:text-white" 
                                            value={form.dob} 
                                        max={maxDateString} // Chặn chọn người dưới 18 tuổi trên lịch
                                            onChange={(e) => setForm({...form, dob: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-3">
                                    <button onClick={onSave} disabled={saving || uploadingAvatar} className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm shadow disabled:opacity-50">
                                        {saving ? "Đang lưu..." : "Save Changes"}
                                    </button>
                                    <button onClick={() => setEditing(false)} className="bg-slate-200 dark:bg-slate-800 dark:text-white px-6 py-2 rounded-xl font-bold text-sm text-slate-900">Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <div className="bg-white dark:bg-[#2d1e16] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold mb-6 dark:text-white">Delivery Address</h3>
                    {editing ? (
                        <div className="grid gap-3">
                            <input className="w-full px-4 py-2 rounded-xl border dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={addr.street} onChange={(e) => setAddr({...addr, street: e.target.value})} placeholder="Số nhà, tên đường" />
                            <div className="grid grid-cols-2 gap-3">
                                <input className="px-4 py-2 rounded-xl border dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={addr.district} onChange={(e) => setAddr({...addr, district: e.target.value})} placeholder="Quận/Huyện" />
                                <input className="px-4 py-2 rounded-xl border dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={addr.city} onChange={(e) => setAddr({...addr, city: e.target.value})} placeholder="Tỉnh/Thành phố" />
                            </div>
                        </div>
                    ) : (
                        user?.addresses?.length > 0 ? user.addresses.map((item: any, i: number) => (
                            <div key={i} className={`p-4 border-2 rounded-xl mb-3 ${item.is_default ? 'border-primary/20 bg-primary/5' : 'border-slate-100 dark:border-slate-800'}`}>
                                <div className="flex justify-between items-start">
                                    <p className="font-bold dark:text-white">{item.label || "Địa chỉ"}</p>
                                    {item.is_default && <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-primary text-white rounded">Mặc định</span>}
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item.street}, {item.district}, {item.city}</p>
                            </div>
                        )) : <p className="text-slate-500">Chưa có địa chỉ</p>
                    )}
                </div>
            </div>
        </AccountLayout>
    );
};

export default Profile;