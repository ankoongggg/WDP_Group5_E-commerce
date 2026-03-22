import React, { useEffect, useState } from 'react';
import SellerLayout from './SellerLayout';
import { useSellerProductForm } from '../../hooks/seller/useSellerProductForm';
import { CategoryService } from '../../services/categoryService';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ProductService } from '../../services/productService';
import { uploadMultiple } from '../../utils/cloudinary';
import type { Category } from '../../types/home';

const SellerProductForm: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const location = useLocation();

  const [loadingInitial, setLoadingInitial] = useState(isEdit);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const form = useSellerProductForm(undefined, id);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await CategoryService.getAllOnHomePage({});
      if (Array.isArray(res)) setCategories(res);
      else if (Array.isArray(res?.data)) setCategories(res.data);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!isEdit || !id) return;
      try {
        const res: any = await ProductService.getSellerProducts({});
        const all = res.data || res.products || [];
        const found = all.find((p: any) => p._id === id);
        if (found) {
          form.setField('name', found.name);
          form.setField('category_id', found.category_id || []);
          form.setField('price', found.price);
          form.setField('original_price', found.original_price ?? '');
          form.setField('condition', found.condition || '');
          form.setField('description', found.description || '');
          form.setField('main_image', found.main_image || '');
          form.setField('display_files', found.display_files || []);
          form.setField(
            'product_type',
            (found.product_type || []).map((pt: any) => ({
              description: pt.description || '',
              stock: pt.stock ?? 0,
              price_difference: pt.price_difference ?? 0,
            })),
          );
        }
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await form.submit();
    if (ok) {
      navigate('/seller/products');
    }
  };

  const handleUploadMainImage = async (file: File) => {
    if (!file) return;
    setUploadingImages(true);
    try {
      const [url] = await uploadMultiple([file]);
      form.setField('main_image', url);
    } catch (error) {
      console.error('Upload main image', error);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleUploadDisplayImage = async (file: File, index?: number) => {
    if (!file) return;
    setUploadingImages(true);
    try {
      const [url] = await uploadMultiple([file]);
      const current = [...form.values.display_files];
      if (typeof index === 'number') {
        current[index] = url;
      } else {
        current.push(url);
      }
      form.setField('display_files', current);
    } catch (error) {
      console.error('Upload display image', error);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeDisplayImage = (idx: number) => {
    const current = [...form.values.display_files];
    current.splice(idx, 1);
    form.setField('display_files', current);
  };

  const addProductType = () => {
    form.setField('product_type', [
      ...form.values.product_type,
      { description: '', stock: 0, price_difference: 0 },
    ]);
  };

  const removeProductType = (idx: number) => {
    const next = [...form.values.product_type];
    next.splice(idx, 1);
    form.setField('product_type', next);
  };

  const pageTitle = isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới';

  return (
    <SellerLayout>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a110c] px-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{pageTitle}</h1>
        <button
          type="button"
          onClick={() => navigate('/seller/products')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại danh sách
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6"
        >
          {loadingInitial && (
            <p className="text-center text-slate-500">Đang tải dữ liệu sản phẩm...</p>
          )}

          {!loadingInitial && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.values.name}
                    onChange={(e) => form.setField('name', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                    placeholder="Nhập tên sản phẩm"
                  />
                  {form.errors.name && <p className="text-xs text-red-500 mt-1">{form.errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Tình trạng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.values.condition}
                    onChange={(e) => form.setField('condition', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                  >
                    <option value="">Chọn tình trạng</option>
                    <option value="New">Mới</option>
                    
                  </select>
                  {form.errors.condition && <p className="text-xs text-red-500 mt-1">{form.errors.condition}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Giá bán (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.values.price}
                    onChange={(e) => form.setField('price', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                    placeholder="0"
                  />
                  {form.errors.price && <p className="text-xs text-red-500 mt-1">{form.errors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Giá trước khuyến mãi (nếu có)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.values.original_price}
                    onChange={(e) =>
                      form.setField('original_price', e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                    placeholder="0"
                  />
                  {form.errors.original_price && (
                    <p className="text-xs text-red-500 mt-1">{form.errors.original_price}</p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1">
                    Dùng để hiển thị giá đã giảm. Nếu nhập, nên lớn hơn hoặc bằng giá bán hiện tại.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat._id}
                      onClick={() => {
                        const selected = form.values.category_id;
                        if (selected.includes(cat._id)) {
                          form.setField(
                            'category_id',
                            selected.filter((id) => id !== cat._id),
                          );
                        } else {
                          form.setField('category_id', [...selected, cat._id]);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        form.values.category_id.includes(cat._id)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                {form.errors.category_id && <p className="text-xs text-red-500 mt-1">{form.errors.category_id}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Loại sản phẩm</label>
                {form.values.product_type.map((pt, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 items-end">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Tên</label>
                      <input
                        type="text"
                        value={pt.description}
                        onChange={(e) => {
                          const next = [...form.values.product_type];
                          next[idx].description = e.target.value;
                          form.setField('product_type', next);
                        }}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                        placeholder="VD: Đỏ / M / XL"
                      />
                      {form.errors[`product_type_${idx}_description`] && (
                        <p className="text-xs text-red-500 mt-1">{form.errors[`product_type_${idx}_description`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Số lượng</label>
                      <input
                        type="number"
                        min={0}
                        value={pt.stock}
                        onChange={(e) => {
                          const next = [...form.values.product_type];
                          next[idx].stock = e.target.value === '' ? '' : Number(e.target.value);
                          form.setField('product_type', next);
                        }}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                        placeholder="Số lượng"
                      />
                      {form.errors[`product_type_${idx}_stock`] && (
                        <p className="text-xs text-red-500 mt-1">{form.errors[`product_type_${idx}_stock`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Chênh lệch giá</label>
                      <input
                        type="number"
                        min={0}
                        value={pt.price_difference}
                        onChange={(e) => {
                          const next = [...form.values.product_type];
                          next[idx].price_difference = e.target.value === '' ? '' : Number(e.target.value);
                          form.setField('product_type', next);
                        }}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                        placeholder="Chênh lệch giá"
                      />
                    </div>
                    <div className="flex gap-2">
                      {form.values.product_type.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProductType(idx)}
                          className="px-3 py-2 rounded-lg border border-red-300 text-red-500 text-sm"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addProductType} className="text-primary text-sm">
                  + Thêm loại sản phẩm
                </button>
                {form.errors.product_type && <p className="text-xs text-red-500 mt-1">{form.errors.product_type}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Mô tả</label>
                <textarea
                  value={form.values.description}
                  onChange={(e) => form.setField('description', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60 min-h-[100px]"
                  placeholder="Mô tả chi tiết sản phẩm, thông số, bảo hành..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Ảnh chính</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadMainImage(f);
                    }}
                    className="w-full"
                  />
                  {uploadingImages && <p className="text-xs text-slate-500 mt-1">Đang tải ảnh...</p>}
                  {form.values.main_image && (
                    <img src={form.values.main_image} alt="main" className="w-32 h-32 object-cover rounded mt-2" />
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Ảnh phụ</label>
                <div className="space-y-2">
                  {form.values.display_files.map((img, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <img src={img} alt={`addon-${idx}`} className="w-16 h-16 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeDisplayImage(idx)}
                        className="px-2 py-1 text-xs border rounded-lg text-red-500"
                      >
                        Xóa
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadDisplayImage(f, idx);
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Thêm ảnh phụ</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadDisplayImage(f);
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/seller/products')}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={form.submitting}
                  className="px-5 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  {form.submitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                </button>
              </div>
            </>
          )}
        </form>
      </main>
    </SellerLayout>
  );
};

export default SellerProductForm;

