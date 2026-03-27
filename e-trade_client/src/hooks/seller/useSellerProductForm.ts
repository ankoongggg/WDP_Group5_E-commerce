import { useState } from 'react';
import { ProductService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';

export interface SellerProductFormValues {
  name: string;
  category_id: string[];
  price: number | '';
  original_price?: number | '';
  condition: string;
  description?: string;
  main_image?: string;
  display_files: string[];
  product_type: Array<{ description: string; stock: number | ''; price_difference: number | '' }>;
}

export const useSellerProductForm = (initial?: Partial<SellerProductFormValues>, productId?: string) => {
  const [values, setValues] = useState<SellerProductFormValues>({
    name: initial?.name || '',
    category_id: initial?.category_id || [],
    price: initial?.price ?? '',
    original_price: initial?.original_price ?? '',
    condition: initial?.condition || 'New',
    description: initial?.description || '',
    main_image: initial?.main_image || '',
    display_files: initial?.display_files || [],
    product_type: initial?.product_type || [{ description: 'Mặc định', stock: 0, price_difference: 0 }],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const setField = (field: keyof SellerProductFormValues, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!values.name.trim()) newErrors.name = 'Tên sản phẩm là bắt buộc';
    if (!values.category_id.length) newErrors.category_id = 'Vui lòng chọn ít nhất một danh mục';
    if (values.price === '' || Number(values.price) <= 0) newErrors.price = 'Giá bán phải lớn hơn 0';
    if (values.original_price !== '' && Number(values.original_price) < Number(values.price)) {
      newErrors.original_price = 'Giá gốc phải lớn hơn hoặc bằng giá bán';
    }

    if (!Array.isArray(values.product_type) || values.product_type.length === 0) {
      newErrors.product_type = 'Vui lòng thêm ít nhất 1 loại sản phẩm';
    } else {
      values.product_type.forEach((pt, idx) => {
        if (!pt.description.trim()) {
          newErrors[`product_type_${idx}_description`] = 'Mô tả loại là bắt buộc';
        }
        if (pt.stock === '' || Number(pt.stock) < 0) {
          newErrors[`product_type_${idx}_stock`] = 'Số lượng không hợp lệ';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return false;
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        condition: values.condition || 'New',
        price: Number(values.price),
        original_price: values.original_price === '' ? undefined : Number(values.original_price),
        product_type: values.product_type.map((pt) => ({
          description: pt.description,
          stock: Number(pt.stock) || 0,
          price_difference: Number(pt.price_difference) || 0,
        })),
      };
      if (productId) {
        await ProductService.updateSellerProduct(productId, payload);
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        await ProductService.createSellerProduct(payload);
        toast.success('Tạo sản phẩm thành công');
      }
      return true;
    } catch (error: any) {
      if (error?.errors) {
        setErrors(error.errors);
      }
      toast.error(error?.message || 'Lỗi khi lưu sản phẩm');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    values,
    errors,
    submitting,
    setField,
    submit,
  };
};
