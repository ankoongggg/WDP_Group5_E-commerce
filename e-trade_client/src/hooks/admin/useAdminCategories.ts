// src/hooks/admin/useAdminCategories.ts
import { useState, useEffect } from 'react';
import { CategoryService } from '../../services/categoryService';
import { Category } from '../../types/home';
import { useToast } from '../../context/ToastContext';

export const useAdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load danh mục khi khởi tạo
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await CategoryService.getAll({});
      if (Array.isArray(res)) {
        setCategories(res);
      } else if (res?.data && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi khi tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Thêm danh mục
  const handleAddCategory = async (name: string) => {
    if (!name.trim()) return toast.error('Tên danh mục không được để trống');
    try {
      await CategoryService.create(name);
      toast.success('Thêm danh mục thành công');
      fetchCategories(); // Reload lại list
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Lỗi khi thêm danh mục');
    }
  };

  // Cập nhật danh mục
  const handleUpdateCategory = async (id: string, newName: string) => {
    if (!newName.trim()) return toast.error('Tên danh mục không được để trống');
    try {
      await CategoryService.update(id, newName);
      toast.success('Cập nhật danh mục thành công');
      fetchCategories(); // Reload lại list
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi khi cập nhật danh mục');
    }
  };

  // Ẩn/Hiện danh mục
  const handleToggleHideAndShowCategory = async (id: string) => {
    try {
        if(categories.find(cat => cat._id === id)?.is_active) {
            await CategoryService.hide(id);
            toast.success('Đã ẩn danh mục');
        } else {
            await CategoryService.show(id);
            toast.success('Đã hiển thị danh mục');
        }
      fetchCategories(); // Reload lại list
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi khi thay đổi trạng thái danh mục');
    }
  };

  return {
    categories,
    loading,
    handleAddCategory,
    handleUpdateCategory,
    handleToggleHideAndShowCategory,
  };
};