import { React, useState, useEffect } from 'react';
import { customerPassApi } from '../services/customerPassService';
import { useToast } from '../context/ToastContext';
import { CategoryService } from '../services/categoryService';
import { uploadMultiple } from '../utils/cloudinary';

export interface ProductTypeItem {
  description: string;
  stock: string;
  price_difference?: string;
}

export const useMy2ndListings = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    main_image: '',
    category_id: [] as string[],
    display_files: [] as string[],
    product_type: [{ description: '', stock: '', price_difference: '' } as ProductTypeItem],
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageSlots, setImageSlots] = useState<number[]>([0]);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([]);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      const data: any[] = await CategoryService.getAllOnHomePage({});
      const normalized = data.map(c => ({ _id: c._id || c.id || '', name: c.name }));
      setCategories(normalized);
    } catch (error) {
      console.error('Error loading categories', error);
      toast.error('Lỗi tải danh mục.');
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await customerPassApi.getMyListings();
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings', error);
      toast.error('Lỗi tải danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchListings();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (categories.length > 0 && !formData.category_id.length) {
        toast.error('Vui lòng chọn danh mục');
        return;
      }

      const payload: any = {
        ...formData,
        price: Number(formData.price),
        original_price: Number(formData.original_price),
      };

      if (formData.category_id && formData.category_id.length) payload.category_id = formData.category_id;

      if (formData.product_type && formData.product_type.length) {
        payload.product_type = formData.product_type.map((pt: any) => ({
          description: pt.description,
          stock: Math.min(10, Math.max(0, Number(pt.stock) || 0)),
          price_difference: Number(pt.price_difference) || 0,
        }));
      }

      if (formData.display_files && formData.display_files.length) payload.display_files = formData.display_files;

      if (editingItem) {
        await customerPassApi.updateListing(editingItem._id, payload);
        toast.success('Cập nhật bài đăng thành công!');
      } else {
        await customerPassApi.createListing(payload);
        toast.success('Đăng bán đồ cũ thành công!');
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        original_price: '',
        main_image: '',
        category_id: [],
        display_files: [],
        product_type: [{ description: '', stock: '', price_difference: '' }],
      });
      fetchListings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (editingItem ? 'Cập nhật thất bại.' : 'Đăng bán thất bại.'));
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
        stock: pt.stock != null ? String(pt.stock) : '',
        price_difference: pt.price_difference != null ? String(pt.price_difference) : '',
      })),
    });
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

  return {
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
  };
};
