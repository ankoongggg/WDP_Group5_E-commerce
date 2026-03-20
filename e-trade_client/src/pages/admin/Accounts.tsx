import React, { useEffect, useState } from 'react';
import { useAdminUsers } from '../../hooks/admin/useAdminUsers';
import type { AdminUser } from '../../services/userService';
import { AdminLayout } from '../components/admin/AdminLayout';

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN');
};

const getEffectiveStatus = (user: AdminUser) => {
  if (user.status !== 'banned') return 'active';
  if (!user.banned_until) return 'banned'; // vĩnh viễn
  const now = new Date();
  const bannedUntil = new Date(user.banned_until);
  if (isNaN(bannedUntil.getTime())) return user.status;
  // Nếu đã quá hạn banned_until thì hiển thị là active như yêu cầu
  return bannedUntil <= now ? 'active' : 'banned';
};

export const AdminUsers: React.FC = () => {
  const {
    users,
    loading,
    search,
    setSearch,
    handleSearchSubmit,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    updateUserRole,
    banUser,
    createUser,
    page,
    setPage,
    total,
    totalPages,
    limit,
    setLimit,
  } = useAdminUsers();

  // Debounce cho ô search để tránh gọi API liên tục khi gõ
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // cập nhật search vào hook + reset page về 1 (handleSearchSubmit)
      setSearch(searchInput);
      handleSearchSubmit();
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);

  const [roleDraft, setRoleDraft] = useState<string[]>([]);
  const [banReason, setBanReason] = useState('');
  const [banMode, setBanMode] = useState<'days' | 'date' | 'forever'>('days');
  const [banDays, setBanDays] = useState(7);
  const [banUntil, setBanUntil] = useState('');
  const [banReasonError, setBanReasonError] = useState('');
  const [banDaysError, setBanDaysError] = useState('');
  const [banUntilError, setBanUntilError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [newRoles, setNewRoles] = useState<string[]>(['customer']);
  const [newNameError, setNewNameError] = useState('');
  const [newEmailError, setNewEmailError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [newPasswordConfirmError, setNewPasswordConfirmError] = useState('');

  const totalUsers = total;
  const fromIndex = totalUsers === 0 ? 0 : (page - 1) * limit + 1;
  const toIndex = Math.min(totalUsers, page * limit);

  const renderPaginationPages = () => {
    if (totalPages <= 1) return null;

    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      const left = Math.max(2, page - 1);
      const right = Math.min(totalPages - 1, page + 1);

      if (left > 2) pages.push('ellipsis');
      for (let i = left; i <= right; i++) pages.push(i);
      if (right < totalPages - 1) pages.push('ellipsis');

      pages.push(totalPages);
    }

    return (
      <div className="flex items-center gap-2">
        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`${p}-${idx}`} className="text-slate-400 px-1 select-none">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`min-w-9 h-9 rounded-lg text-sm font-semibold px-2 transition-colors ${
                p === page
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>
    );
  };

  const handleOpenRoleModal = (user: AdminUser) => {
    setSelectedUser(user);
    setRoleDraft(user.role || []);
    setShowRoleModal(true);
  };

  const handleSubmitRole = async () => {
    if (!selectedUser) return;
    await updateUserRole(selectedUser._id, roleDraft);
    setShowRoleModal(false);
  };

  const handleOpenBanModal = (user: AdminUser) => {
    setSelectedUser(user);
    setBanReason(user.ban_reason || '');
    setBanMode('days');
    setBanDays(7);
    setBanUntil('');
    setShowBanModal(true);
  };

  const handleSubmitBan = async () => {
    if (!selectedUser) return;
    const effectiveStatus = getEffectiveStatus(selectedUser);

    if (effectiveStatus === 'active') {
      setBanReasonError('');
      setBanDaysError('');
      setBanUntilError('');

      if (!banReason.trim()) {
        setBanReasonError('Lý do khóa là bắt buộc');
        return;
      }
      if (banMode === 'days' && (!banDays || banDays <= 0)) {
        setBanDaysError('Số ngày khóa phải lớn hơn 0');
        return;
      }
      if (banMode === 'date' && !banUntil) {
        setBanUntilError('Vui lòng chọn ngày hết hạn khóa');
        return;
      }
      // Thực hiện ban
      const payload: any = { action: 'ban', ban_reason: banReason || 'Tài khoản đã bị khóa bởi quản trị viên.' };
      if (banMode === 'days') {
        payload.durationDays = banDays;
      } else if (banMode === 'date' && banUntil) {
        payload.banned_until = new Date(banUntil).toISOString();
      } else if (banMode === 'forever') {
        payload.banned_until = null;
      }
      await banUser(selectedUser._id, payload);
    } else {
      // Đang bị ban -> unban
      await banUser(selectedUser._id, { action: 'unban' });
    }

    setShowBanModal(false);
  };

  const renderStatusBadge = (user: AdminUser) => {
    const effectiveStatus = getEffectiveStatus(user);
    if (effectiveStatus === 'active') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          Hoạt động
        </span>
      );
    }

    const isForever = !user.banned_until;
    return (
      <div className="flex flex-col gap-1">
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          {isForever ? 'Đã khóa vĩnh viễn' : 'Đã khóa'}
        </span>
        {!isForever && (
          <span className="text-[11px] text-slate-500">
            Đến: {formatDate(user.banned_until)}
          </span>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header & Search */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Quản lý người dùng</h2>
            <p className="text-sm text-slate-500">Tổng số: {totalUsers} tài khoản</p>
          </div>

          <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <form
              className="relative w-full sm:w-64"
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchSubmit();
              }}
            >
              <span className="absolute left-3 top-2.5 text-slate-400 material-symbols-outlined text-[20px]">search</span>
              <input
                type="text"
                placeholder="Tìm email, sđt, tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none dark:text-white"
              />
            </form>

            <div className="flex flex-wrap gap-2">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  handleSearchSubmit();
                }}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 outline-none whitespace-nowrap min-w-[110px]"
              >
                <option value="">Tất cả role</option>
                <option value="customer">Customer</option>
                <option value="seller">Seller</option>
                <option value="admin">Admin</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  handleSearchSubmit();
                }}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 px-3 min-w-[150px] text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 outline-none whitespace-nowrap min-w-[130px]"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="banned">Đang bị khóa</option>
              </select>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1 rounded-xl bg-primary text-white text-sm font-semibold px-3 py-2 shadow-sm hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Cấp tài khoản
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                <th className="p-4 font-medium">Người dùng</th>
                <th className="p-4 font-medium">Liên hệ</th>
                <th className="p-4 font-medium">Vai trò (Role)</th>
                <th className="p-4 font-medium">Trạng thái</th>
                <th className="p-4 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              )}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Không có người dùng nào.
                  </td>
                </tr>
              )}

              {!loading &&
                users.map((user) => {
                  const effectiveStatus = getEffectiveStatus(user);
                  const initials = (user.full_name || user.email || '').charAt(0).toUpperCase();

                  return (
                    <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {user.full_name || user.email}
                          </p>
                          {user.created_at && (
                            <p className="text-xs text-slate-500">
                              Tham gia: {formatDate(user.created_at)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-700 dark:text-slate-300">{user.email}</p>
                        <p className="text-xs text-slate-500">{user.phone}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          {user.role.includes('admin') && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-500/20 text-xs rounded font-medium">
                              Admin
                            </span>
                          )}
                          {user.role.includes('seller') && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/20 text-xs rounded font-medium">
                              Seller
                            </span>
                          )}
                          {user.role.includes('customer') && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/20 text-xs rounded font-medium">
                              Customer
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {renderStatusBadge(user)}
                      </td>
                      <td className="p-4 space-y-2">
                        <button
                          onClick={() => handleOpenRoleModal(user)}
                          className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 justify-center"
                        >
                          <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                          Sửa role
                        </button>
                        <button
                          onClick={() => handleOpenBanModal(user)}
                          className={`w-full sm:w-auto px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium text-xs ${
                            effectiveStatus === 'active'
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {effectiveStatus === 'active' ? 'lock' : 'lock_open'}
                          </span>
                          {effectiveStatus === 'active' ? 'Khóa' : 'Mở khóa'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {totalUsers > 0 ? (
              <>
                Hiển thị <span className="font-bold">{fromIndex}</span>-<span className="font-bold">{toIndex}</span> /{' '}
                <span className="font-bold">{totalUsers}</span> tài khoản
              </>
            ) : (
              <>0 tài khoản</>
            )}
          </div>

          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">Hiển thị</span>
              <select
                value={limit}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setLimit(next);
                  setPage(1);
                }}
                className="bg-slate-100 min-w-[60px] dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={totalPages <= 1 || page <= 1}
                className="min-w-10 h-9 rounded-lg text-sm font-semibold px-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                First
              </button>

              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={totalPages <= 1 || page <= 1}
                className="min-w-10 h-9 rounded-lg text-sm font-semibold px-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Prev
              </button>

              {renderPaginationPages()}

              <button
                onClick={() => setPage(Math.min(totalPages || 1, page + 1))}
                disabled={totalPages <= 1 || page >= totalPages}
                className="min-w-10 h-9 rounded-lg text-sm font-semibold px-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Next
              </button>

              <button
                onClick={() => setPage(totalPages)}
                disabled={totalPages <= 1 || page >= totalPages}
                className="min-w-10 h-9 rounded-lg text-sm font-semibold px-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal chỉnh sửa role */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">
              Sửa role - {selectedUser.full_name || selectedUser.email}
            </h3>
            <div className="space-y-3 mb-6">
              {['customer', 'seller', 'admin'].map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={roleDraft.includes(role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRoleDraft((prev) => Array.from(new Set([...prev, role])));
                      } else {
                        setRoleDraft((prev) => prev.filter((r) => r !== role));
                      }
                    }}
                    disabled={role === 'seller' && !selectedUser.role.includes('seller')}
                    className={`rounded border-slate-300 text-primary focus:ring-primary ${role === 'seller' && !selectedUser.role.includes('seller') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <span className={`capitalize ${role === 'seller' && !selectedUser.role.includes('seller') ? 'text-slate-500' : ''}`}>{role}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitRole}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ban/unban */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {getEffectiveStatus(selectedUser) === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
            </h3>

            {getEffectiveStatus(selectedUser) === 'active' ? (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Nhập thông tin khóa tài khoản cho{' '}
                  <span className="font-semibold">{selectedUser.full_name || selectedUser.email}</span>.
                </p>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Lý do khóa tài khoản <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={banReason}
                  onChange={(e) => {
                    setBanReason(e.target.value);
                    if (banReasonError) setBanReasonError('');
                  }}
                    className="w-full min-h-[80px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                    placeholder="Nhập lý do khóa..."
                  />
                {banReasonError && (
                  <p className="text-xs text-red-500 mt-1">{banReasonError}</p>
                )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Thời hạn khóa
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <input
                        type="radio"
                        name="banMode"
                        value="days"
                        checked={banMode === 'days'}
                        onChange={() => setBanMode('days')}
                      />
                      <span>Khóa theo số ngày</span>
                    </label>
                    {banMode === 'days' && (
                      <input
                        type="number"
                        min={1}
                        value={banDays}
                        onChange={(e) => {
                          setBanDays(Number(e.target.value) || 1);
                          if (banDaysError) setBanDaysError('');
                        }}
                        className="w-28 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                      />
                    )}

                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <input
                        type="radio"
                        name="banMode"
                        value="date"
                        checked={banMode === 'date'}
                        onChange={() => setBanMode('date')}
                      />
                      <span>Khóa đến ngày cụ thể</span>
                    </label>
                    {banMode === 'date' && (
                      <input
                        type="datetime-local"
                        value={banUntil}
                        onChange={(e) => {
                          setBanUntil(e.target.value);
                          if (banUntilError) setBanUntilError('');
                        }}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                      />
                    )}

                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <input
                        type="radio"
                        name="banMode"
                        value="forever"
                        checked={banMode === 'forever'}
                        onChange={() => setBanMode('forever')}
                      />
                      <span>Khóa vĩnh viễn</span>
                    </label>
                  </div>
                  {banDaysError && (
                    <p className="text-xs text-red-500 mt-1">{banDaysError}</p>
                  )}
                  {banUntilError && (
                    <p className="text-xs text-red-500 mt-1">{banUntilError}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Bạn chuẩn bị mở khóa tài khoản{' '}
                  <span className="font-semibold">{selectedUser.full_name || selectedUser.email}</span>.
                </p>
                {selectedUser.ban_reason && (
                  <div className="text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                    <div className="font-semibold mb-1">Lý do khóa gần nhất:</div>
                    <p>{selectedUser.ban_reason}</p>
                    {selectedUser.banned_until && (
                      <p className="mt-1 text-xs text-slate-500">
                        Thời hạn khóa: đến {formatDate(selectedUser.banned_until)}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowBanModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitBan}
                className={`px-4 py-2 text-sm rounded-lg text-white ${
                  getEffectiveStatus(selectedUser) === 'active'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {getEffectiveStatus(selectedUser) === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo tài khoản mới */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Cấp tài khoản mới
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (newNameError) setNewNameError('');
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                  placeholder="Nhập họ tên"
                />
                {newNameError && (
                  <p className="text-xs text-red-500 mt-1">{newNameError}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Số điện thoại</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                  placeholder="Tuỳ chọn"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (newEmailError) setNewEmailError('');
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                  placeholder="email@example.com"
                />
                {newEmailError && (
                  <p className="text-xs text-red-500 mt-1">{newEmailError}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (newPasswordError) setNewPasswordError('');
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                  placeholder="Tối thiểu 6 ký tự"
                />
                {newPasswordError && (
                  <p className="text-xs text-red-500 mt-1">{newPasswordError}</p>
                )}
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPasswordConfirm}
                  onChange={(e) => {
                    setNewPasswordConfirm(e.target.value);
                    if (newPasswordConfirmError) setNewPasswordConfirmError('');
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/60"
                  placeholder="Nhập lại mật khẩu"
                />
                {newPasswordConfirmError && (
                  <p className="text-xs text-red-500 mt-1">{newPasswordConfirmError}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Quyền (role)
              </label>
              <div className="flex flex-wrap gap-3">
                {['customer', 'admin'].map((role) => (
                  <label key={role} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={newRoles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewRoles((prev) => Array.from(new Set([...prev, role])));
                        } else {
                          setNewRoles((prev) => prev.filter((r) => r !== role));
                        }
                      }}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  setNewNameError('');
                  setNewEmailError('');
                  setNewPasswordError('');
                  setNewPasswordConfirmError('');

                  if (!newName.trim()) {
                    setNewNameError('Họ tên là bắt buộc');
                    return;
                  }
                  if (!newEmail.trim()) {
                    setNewEmailError('Email là bắt buộc');
                    return;
                  }
                  if (!newPassword) {
                    setNewPasswordError('Mật khẩu là bắt buộc');
                    return;
                  }
                  if (newPassword.length < 6) {
                    setNewPasswordError('Mật khẩu phải tối thiểu 6 ký tự');
                    return;
                  }
                  if (!newPasswordConfirm) {
                    setNewPasswordConfirmError('Vui lòng nhập lại mật khẩu xác nhận');
                    return;
                  }
                  if (newPassword !== newPasswordConfirm) {
                    setNewPasswordConfirmError('Mật khẩu xác nhận không khớp');
                    return;
                  }
                  const roles = newRoles.length > 0 ? newRoles : ['customer'];
                  await createUser({
                    full_name: newName.trim(),
                    email: newEmail.trim(),
                    password: newPassword,
                    phone: newPhone.trim() || undefined,
                    roles,
                  });
                  setShowCreateModal(false);
                  setNewName('');
                  setNewEmail('');
                  setNewPhone('');
                  setNewPassword('');
                  setNewPasswordConfirm('');
                  setNewRoles(['customer']);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90"
              >
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};