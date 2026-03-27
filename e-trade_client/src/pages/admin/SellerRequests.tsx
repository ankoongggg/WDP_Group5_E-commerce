// src/pages/admin/AdminSellerRequests.tsx
import React, { useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { useSellerRequests } from '../../hooks/admin/useSellerRequest';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';

export const AdminSellerRequests: React.FC = () => {
  const {
    requests,
    loading,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    handleApprove,
    handleReject,
    totalItems,
    totalPages,
    page,
    setPage,
    limit
  } = useSellerRequests();

  // State mở modal xem toàn bộ chi tiết đơn đăng ký
  const [viewingRequest, setViewingRequest] = useState<any | null>(null);
  const [checkingTaxCode, setCheckingTaxCode] = useState<string | null>(null);
  const [taxInfoModal, setTaxInfoModal] = useState<any | null>(null);
  const { toast } = useToast();

  const renderStatus = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Chờ duyệt</span>;
      case 'approved': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Đã duyệt</span>;
      case 'active': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Đã duyệt (Active)</span>;
      case 'rejected': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Từ chối</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const handleCheckTaxAPI = async (taxCode: string) => {
      if (!taxCode) return;
      setCheckingTaxCode(taxCode);
      try {
          const res = await axios.get(`https://api.xinvoice.vn/gdt-api/tax-payer-records/${taxCode}`);
          if (res.data && res.data.success && res.data.data && res.data.data.length > 0) {
              setTaxInfoModal({ taxCode, data: res.data.data[0] });
          } else {
              toast.error("Không tìm thấy thông tin cho mã số thuế này.");
          }
      } catch (err: any) {
          if (err.response && err.response.status === 404) {
              toast.error(`Mã số thuế ${taxCode} không tồn tại trên hệ thống thuế.`);
          } else {
              toast.error("Lỗi kết nối tới cổng xác thực MST. Vui lòng thử lại sau.");
          }
      } finally {
          setCheckingTaxCode(null);
      }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Tiêu đề */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Yêu cầu mở Shop</h2>
            <p className="text-sm text-slate-500 mt-1">Quản lý người bán đăng ký gian hàng mới</p>
          </div>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4">
          
          {/* Ô tìm kiếm */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-slate-400 material-symbols-outlined text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Tìm tên shop, chủ shop, email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none dark:text-white transition-all" 
            />
          </div>

          {/* Cụm Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 rounded-xl border border-transparent focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="text-slate-400 material-symbols-outlined text-[18px]">calendar_today</span>
                <input 
                    type="date" 
                    value={dateFrom} 
                    onChange={(e) => setDateFrom(e.target.value)} 
                    className="bg-transparent border-none outline-none py-2.5 text-sm text-slate-700 dark:text-slate-200"
                    title="Từ ngày"
                />
                <span className="text-slate-400">-</span>
                <input 
                    type="date" 
                    value={dateTo} 
                    onChange={(e) => setDateTo(e.target.value)} 
                    className="bg-transparent border-none outline-none py-2.5 text-sm text-slate-700 dark:text-slate-200"
                    title="Đến ngày"
                />
            </div>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 outline-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Bị từ chối</option>
            </select>
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                <tr>
                  <th className="p-4 font-medium">Thông tin Shop</th>
                  <th className="p-4 font-medium">Người đại diện</th>
                  <th className="p-4 font-medium">Định danh / Mã số thuế</th>
                  <th className="p-4 font-medium">Ngày Yêu cầu</th>
                  <th className="p-4 font-medium text-center">Trạng thái</th>
                  <th className="p-4 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Không tìm thấy yêu cầu nào.</td></tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Cột Shop */}
                      <td className="p-4">
                        <div className="font-bold text-primary text-base mb-1">{req.shop_name}</div>
                        <button 
                            onClick={() => setViewingRequest(req)}
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                        >
                            <span className="material-symbols-outlined text-[14px]">visibility</span> Xem chi tiết
                        </button>
                      </td>

                      {/* Cột Chủ Shop */}
                      <td className="p-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{req.user_id?.full_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{req.user_id?.email}</p>
                      </td>

                      {/* Cột Info định danh */}
                      <td className="p-4">
                        <p className="text-slate-700 dark:text-slate-300"><span className="text-slate-400">CCCD:</span> {req.identity_card}</p>
                        <p className="text-slate-700 dark:text-slate-300 flex items-center gap-2 mt-1">
                            <span className="text-slate-400">MST:</span> {req.tax_code || 'N/A'}
                            {req.tax_code && (
                                <button 
                                    onClick={() => handleCheckTaxAPI(req.tax_code)}
                                    disabled={checkingTaxCode === req.tax_code}
                                    className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1 disabled:opacity-50"
                                >
                                    {checkingTaxCode === req.tax_code ? 'Đang check...' : 'Kiểm tra API'}
                                </button>
                            )}
                        </p>
                      </td>

                      {/* Cột Ngày giờ */}
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {new Date(req.created_at).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Cột Trạng thái */}
                      <td className="p-4 text-center">
                        {renderStatus(req.status)}
                      </td>

                      {/* Cột Hành động */}
                      <td className="p-4 text-right">
                        {req.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => handleApprove(req._id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg font-bold transition-colors"
                                    title="Duyệt Shop"
                                >
                                    <span className="material-symbols-outlined text-[18px]">check_circle</span> Duyệt
                                </button>
                                <button 
                                    onClick={() => handleReject(req._id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg font-bold transition-colors"
                                    title="Từ chối"
                                >
                                    <span className="material-symbols-outlined text-[18px]">cancel</span> Hủy
                                </button>
                            </div>
                        ) : (
                            <span className="text-slate-400 italic text-xs">Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                      Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, totalItems)} trong tổng số {totalItems}
                  </span>
                  <div className="flex gap-2">
                      <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">Trước</button>
                      <span className="px-4 py-1.5 font-bold text-sm bg-slate-100 dark:bg-slate-800 rounded-lg dark:text-white">{page} / {totalPages}</span>
                      <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">Sau</button>
                  </div>
              </div>
          )}

        </div>

        {/* Modal xem chi tiết Đơn đăng ký */}
        {viewingRequest !== null && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-fade-in-up my-8 border border-slate-200 dark:border-slate-800">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
                        <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                            <span className="material-symbols-outlined text-primary">storefront</span>
                            Chi tiết đơn đăng ký Shop
                        </h3>
                        <button onClick={() => setViewingRequest(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="p-6 text-slate-700 dark:text-slate-300 space-y-5 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tên Shop</span>
                                <span className="font-bold text-base text-slate-800 dark:text-white">{viewingRequest.shop_name}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Số điện thoại liên hệ</span>
                                <span className="font-medium">{viewingRequest.phone || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">CCCD / CMND</span>
                                <span className="font-medium">{viewingRequest.identity_card}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mã số thuế</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-blue-600 dark:text-blue-400">{viewingRequest.tax_code || 'N/A'}</span>
                                    {viewingRequest.tax_code && (
                                        <button 
                                            onClick={() => handleCheckTaxAPI(viewingRequest.tax_code)}
                                            disabled={checkingTaxCode === viewingRequest.tax_code}
                                            className="text-[11px] font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {checkingTaxCode === viewingRequest.tax_code ? 'Đang tra cứu...' : 'Kiểm tra API'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="md:col-span-2 flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mô tả Shop</span>
                                <span className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 whitespace-pre-wrap">{viewingRequest.shop_description || viewingRequest.description || 'Không có mô tả'}</span>
                            </div>
                            <div className="md:col-span-2 flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ngành hàng kinh doanh</span>
                                <span className="font-medium text-sm">{viewingRequest.business_category || 'N/A'}</span>
                            </div>
                            <div className="md:col-span-2 flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Địa chỉ kho / Lấy hàng</span>
                                <span className="font-medium text-sm">{viewingRequest.pickup_address}</span>
                            </div>
                            <div className="md:col-span-2 flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ảnh chụp CCCD/CMND</span>
                                {viewingRequest.identity_card_image ? (
                                    <a href={viewingRequest.identity_card_image} target="_blank" rel="noreferrer" className="block w-fit">
                                        <img src={viewingRequest.identity_card_image} alt="CCCD" className="max-w-full h-auto max-h-64 rounded-xl border border-slate-200 dark:border-slate-700 object-contain hover:opacity-90 transition-opacity shadow-sm" />
                                    </a>
                                ) : (
                                    <span className="text-sm italic text-slate-400">Người dùng không cung cấp ảnh</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-right bg-slate-50 dark:bg-slate-800/50">
                        <button onClick={() => setViewingRequest(null)} className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 rounded-xl font-bold transition-colors dark:text-white shadow-sm">Đóng</button>
                    </div>
                </div>
            </div>
        )}

        {/* Modal Xem thông tin MST từ API */}
        {taxInfoModal && (
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up border border-slate-200 dark:border-slate-800">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-blue-50 dark:bg-blue-900/20">
                        <h3 className="font-bold text-lg text-blue-800 dark:text-blue-300 flex items-center gap-2">
                            <span className="material-symbols-outlined">verified_user</span>
                            Kết quả tra cứu MST: {taxInfoModal.taxCode}
                        </h3>
                        <button onClick={() => setTaxInfoModal(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="p-6 text-sm space-y-4 dark:text-slate-200 max-h-[60vh] overflow-y-auto">
                        <div className="flex flex-col border-b border-slate-100 dark:border-slate-800 pb-3">
                            <span className="text-slate-500 text-xs mb-1">Tên người nộp thuế / Doanh nghiệp</span>
                            <span className="font-bold text-base text-slate-800 dark:text-white">{taxInfoModal.data.name || 'Không có dữ liệu'}</span>
                        </div>
                        <div className="flex flex-col border-b border-slate-100 dark:border-slate-800 pb-3">
                            <span className="text-slate-500 text-xs mb-1">Loại hình</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{taxInfoModal.data.orgType || 'Không có dữ liệu'}</span>
                        </div>
                        <div className="flex flex-col border-b border-slate-100 dark:border-slate-800 pb-3">
                            <span className="text-slate-500 text-xs mb-1">Địa chỉ đăng ký kinh doanh</span>
                            <span>{taxInfoModal.data.address || 'Không có dữ liệu'}</span>
                        </div>
                        <div className="flex flex-col border-b border-slate-100 dark:border-slate-800 pb-3">
                            <span className="text-slate-500 text-xs mb-1">Cơ quan thuế quản lý</span>
                            <span>{taxInfoModal.data.taxDepartment || 'Không có dữ liệu'}</span>
                        </div>
                        <div className="flex flex-col pb-1">
                            <span className="text-slate-500 text-xs mb-1">Trạng thái hoạt động</span>
                            <span className={`font-medium ${String(taxInfoModal.data.status).toLowerCase().includes('đang hoạt động') ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {taxInfoModal.data.status || 'Không rõ'}
                            </span>
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-500 italic border border-slate-100 dark:border-slate-800">
                            * Dữ liệu được truy xuất trực tiếp từ API của xinvoice.vn. Vui lòng đối chiếu <b>Tên Người Nộp Thuế</b> với thẻ CCCD chủ shop cung cấp.
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </AdminLayout>
  );
};

// Đừng quên default export nếu route đang dùng React.lazy hoặc import trực tiếp
export default AdminSellerRequests;