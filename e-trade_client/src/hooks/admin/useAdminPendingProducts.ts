
// src/hooks/admin/useAdminPendingProducts.ts
import { useState, useEffect } from 'react';
import { BlacklistService } from '../../services/blacklistService';
import { useToast } from '../../context/ToastContext';

export const useAdminPendingProducts = () => {
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingProducts = async () => {
    setLoading(true);
    try {
      const data = await BlacklistService.getPendingBlacklistedProducts();
      setPendingProducts(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải danh sách sản phẩm chờ duyệt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const handleApproveProduct = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn DUYỆT sản phẩm này cho phép hiển thị?')) return;
    try {
      await BlacklistService.updateProductStatus(id, 'active');
      toast.success('Đã duyệt sản phẩm thành công');
      fetchPendingProducts(); // Refresh danh sách
    } catch (error) {
      toast.error('Lỗi khi duyệt sản phẩm');
    }
  };

  const handleRejectProduct = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn TỪ CHỐI (khóa) sản phẩm này?')) return;
    try {
      await BlacklistService.updateProductStatus(id, 'rejected');
      toast.success('Đã từ chối sản phẩm');
      fetchPendingProducts(); // Refresh danh sách
    } catch (error) {
      toast.error('Lỗi khi từ chối sản phẩm');
    }
  };

  return {
    pendingProducts,
    loading,
    handleApproveProduct,
    handleRejectProduct
  };
};