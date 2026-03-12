import { useEffect, useState } from 'react';
import { storeApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export interface SellerStoreStats {
  totalProducts: number;
  totalReviews: number;
  averageRating: number;
}

export interface SellerStore {
  _id: string;
  shop_name: string;
  logo?: string;
  description?: string;
  pickup_address?: string;
  phone?: string;
  contact_email?: string;
  status?: string;
}

export const useSellerStore = () => {
  const [store, setStore] = useState<SellerStore | null>(null);
  const [stats, setStats] = useState<SellerStoreStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();

  const loadStore = async () => {
    setLoading(true);
    try {
      const res: any = await storeApi.getMyStore();
      if (res.success) {
        setStore(res.data.store);
        setStats(res.data.stats);
      } else {
        toast.error(res.message || 'Không thể tải thông tin cửa hàng');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Không thể tải thông tin cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = (values: Partial<SellerStore>) => {
    const newErrors: Record<string, string> = {};

    if (!values.shop_name || values.shop_name.trim().length < 2) {
      newErrors.shop_name = 'Tên cửa hàng là bắt buộc và phải có ít nhất 2 ký tự.';
    }

    if (values.phone && !/^[0-9+\-\s]{8,20}$/.test(values.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ.';
    }

    if (values.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contact_email)) {
      newErrors.contact_email = 'Email liên hệ không hợp lệ.';
    }

    if (values.logo && !/^https?:\/\//i.test(values.logo)) {
      newErrors.logo = 'Logo URL phải bắt đầu bằng http hoặc https.';
    }

    if (values.pickup_address && values.pickup_address.trim().length < 5) {
      newErrors.pickup_address = 'Địa chỉ nhận hàng quá ngắn.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field: keyof SellerStore, value: string) => {
    if (!store) return;
    setStore({ ...store, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const save = async () => {
    if (!store) return;
    const isValid = validate(store);
    if (!isValid) return;

    setSaving(true);
    try {
      const res: any = await storeApi.updateMyStore({
        shop_name: store.shop_name,
        logo: store.logo,
        description: store.description,
        pickup_address: store.pickup_address,
        phone: store.phone,
        contact_email: store.contact_email,
      });

      if (res.success) {
        setStore(res.data);
        toast.success('Cập nhật cửa hàng thành công');
      } else if (res.errors) {
        setErrors(res.errors);
      } else {
        toast.error(res.message || 'Cập nhật cửa hàng thất bại');
      }
    } catch (error: any) {
      console.error(error);
      if (error.errors) {
        setErrors(error.errors);
      } else {
        toast.error(error?.message || 'Cập nhật cửa hàng thất bại');
      }
    } finally {
      setSaving(false);
    }
  };

  return {
    store,
    stats,
    loading,
    saving,
    errors,
    updateField,
    save,
    reload: loadStore,
  };
};

