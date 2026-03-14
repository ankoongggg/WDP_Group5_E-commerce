import { useEffect, useState } from 'react';
import { UserService, AdminUser } from '../../services/userService';
import { useToast } from '../../context/ToastContext';

interface UseAdminUsersOptions {
    initialSearch?: string;
}

export const useAdminUsers = ({ initialSearch = '' }: UseAdminUsersOptions = {}) => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState(initialSearch);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(20);
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    const { toast } = useToast();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await UserService.getAdminUsers({ search, page, limit, role: roleFilter || undefined, status: statusFilter || undefined });
            setUsers(res.data || []);
            if (res.pagination) {
                setTotal(res.pagination.total);
                setTotalPages(res.pagination.totalPages);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Lỗi khi tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search, roleFilter, statusFilter]);

    const handleSearchSubmit = () => {
        // chỉ reset về trang 1, useEffect sẽ tự fetch với state mới
        setPage(1);
    };

    const updateUserRole = async (userId: string, roles: string[]) => {
        try {
            await UserService.updateUserRole(userId, roles);
            toast.success('Cập nhật role thành công');
            fetchUsers();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Lỗi khi cập nhật role');
        }
    };

    const banUser = async (userId: string, payload: { action: 'ban' | 'unban'; ban_reason?: string; banned_until?: string | null; durationDays?: number }) => {
        try {
            await UserService.banUser(userId, payload);
            toast.success(payload.action === 'ban' ? 'Khóa tài khoản thành công' : 'Mở khóa tài khoản thành công');
            fetchUsers();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Lỗi khi cập nhật trạng thái tài khoản');
        }
    };

    const createUser = async (payload: { full_name: string; email: string; password: string; phone?: string; roles: string[] }) => {
        try {
            await UserService.createAdminUser(payload);
            toast.success('Tạo tài khoản thành công');
            fetchUsers();
        } catch (error: any) {
            const msg = error?.message || error?.response?.data?.message;
            toast.error(msg || 'Lỗi khi tạo tài khoản');
            throw error;
        }
    };

    return {
        users,
        loading,
        search,
        setSearch,
        page,
        setPage,
        total,
        totalPages,
        limit,
        roleFilter,
        setRoleFilter,
        statusFilter,
        setStatusFilter,
        handleSearchSubmit,
        updateUserRole,
        banUser,
        createUser,
    };
};

