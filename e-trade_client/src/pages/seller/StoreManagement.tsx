import React from 'react';
import SellerLayout from './SellerLayout';
import { useSellerStore } from '../../hooks/seller/useSellerStore';

const renderStatusBadge = (status?: string) => {
  if (!status) return null;
  let classes = 'bg-gray-100 text-gray-800';
  let label = 'Không xác định';

  switch (status) {
    case 'active':
      classes = 'bg-green-100 text-green-800';
      label = 'Đang hoạt động';
      break;
    case 'inactive':
      classes = 'bg-yellow-100 text-yellow-800';
      label = 'Tạm dừng';
      break;
    case 'suspended':
      classes = 'bg-red-100 text-red-800';
      label = 'Bị khóa';
      break;
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full ${classes}`}>
      {label}
    </span>
  );
};

const renderStars = (rating: number) => {
  const fullStars = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, idx) => (
        <span
          key={idx}
          className={`material-symbols-outlined text-sm ${idx < fullStars ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
        >
          star
        </span>
      ))}
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {rating.toFixed(1)}/5
      </span>
    </div>
  );
};

const StoreManagement: React.FC = () => {
  const { store, stats, loading, saving, errors, updateField, save } = useSellerStore();

  if (loading && !store) {
    return (
      <SellerLayout>
        <div className="p-10 text-center">Đang tải thông tin cửa hàng...</div>
      </SellerLayout>
    );
  }

  if (!store) {
    return (
      <SellerLayout>
        <div className="p-10 text-center text-red-500">
          Không tìm thấy thông tin cửa hàng. Vui lòng liên hệ hỗ trợ hoặc chờ admin phê duyệt.
        </div>
      </SellerLayout>
    );
  }

  const averageRating = stats?.averageRating ?? 0;
  const totalReviews = stats?.totalReviews ?? 0;

  return (
    <SellerLayout>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a110c] px-6 flex items-center">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Store Management
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
        {/* Overview card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col md:flex-row gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
              {store.logo ? (
                <img src={store.logo} alt={store.shop_name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-3xl text-slate-400">storefront</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{store.shop_name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {renderStatusBadge(store.status)}
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  {renderStars(averageRating)}
                  {totalReviews > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      dựa trên {totalReviews} đánh giá
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {stats && (
            <div className="flex flex-col justify-between text-sm text-slate-600 dark:text-slate-300 min-w-[180px]">
              <div className="flex justify-between">
                <span className="font-medium">Tổng sản phẩm</span>
                <span className="font-bold">{stats.totalProducts}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="font-medium">Tổng đánh giá</span>
                <span className="font-bold">{stats.totalReviews}</span>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Thông tin cửa hàng</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Store name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={store.shop_name || ''}
                onChange={(e) => updateField('shop_name', e.target.value)}
              />
              {errors.shop_name && (
                <p className="mt-1 text-xs text-red-500">{errors.shop_name}</p>
              )}
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Logo URL
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={store.logo || ''}
                onChange={(e) => updateField('logo', e.target.value)}
                placeholder="https://..."
              />
              <p className="mt-1 text-xs text-slate-500">
                Nhập URL ảnh logo của cửa hàng (bắt đầu bằng http hoặc https).
              </p>
              {errors.logo && <p className="mt-1 text-xs text-red-500">{errors.logo}</p>}
            </div>

            {/* Pickup address */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Địa chỉ nhận hàng
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={store.pickup_address || ''}
                onChange={(e) => updateField('pickup_address', e.target.value)}
              />
              {errors.pickup_address && (
                <p className="mt-1 text-xs text-red-500">{errors.pickup_address}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={store.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            {/* Contact email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Email liên hệ
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={store.contact_email || ''}
                onChange={(e) => updateField('contact_email', e.target.value)}
              />
              {errors.contact_email && (
                <p className="mt-1 text-xs text-red-500">{errors.contact_email}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Mô tả cửa hàng
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px]"
                value={store.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-slate-500">
                Mô tả ngắn gọn về cửa hàng, tối đa 1000 ký tự.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {saving && (
                <span className="material-symbols-outlined animate-spin mr-2 text-sm">
                  progress_activity
                </span>
              )}
              Lưu thay đổi
            </button>
          </div>
        </div>
      </main>
    </SellerLayout>
  );
};

export default StoreManagement;

