import React, { useEffect, useState } from 'react';
import SellerLayout from './SellerLayout';
import { useSellerProductForm } from '../../hooks/seller/useSellerProductForm';
import { CategoryService } from '../../services/categoryService';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ProductService } from '../../services/productService';
import type { Category } from '../../types/home';

const SellerProductForm: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const location = useLocation();

  const [loadingInitial, setLoadingInitial] = useState(isEdit);
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useSellerProductForm(undefined, id);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await CategoryService.getAll({});
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
                    <option value="new">Mới</option>
                    <option value="used">Đã qua sử dụng</option>
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Ảnh chính (URL)</label>
                  <input
                    type="text"
                    value={form.values.main_image}
                    onChange={(e) => form.setField('main_image', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                    placeholder="https://..."
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

