// src/hooks/admin/useAdminReport.ts
import { useState, useEffect, useMemo } from 'react';
import { StoreService } from '../../services/storeService';
import { StoreReportData } from '../../types/storeReport';
import { removeVietnameseTones } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

export const useAdminReport = () => {
    const [stores, setStores] = useState<StoreReportData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // State cho Search, Filter và Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const fetchStores = async () => {
        try {
            setLoading(true);
            const data = await StoreService.getAdminStores();
            setStores(data);
        } catch (err: any) {
            console.error("Fetch stores error:", err);
            setError("Không thể tải dữ liệu cửa hàng.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    // Hàm cập nhật trạng thái
    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            await StoreService.updateStoreStatus(id, newStatus);
            toast.success(`Đã chuyển trạng thái shop thành: ${newStatus}`);
            fetchStores(); // Reload lại data
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const filteredAndPagedStores = useMemo(() => {
        let result = [...stores];

        if (statusFilter !== 'all') {
            result = result.filter(store => store.status === statusFilter);
        }

        if (searchTerm.trim()) {
            const normalizedSearch = removeVietnameseTones(searchTerm.toLowerCase());
            result = result.filter(store => {
                const normalizedShopName = removeVietnameseTones(store.shop_name.toLowerCase());
                return normalizedShopName.includes(normalizedSearch);
            });
        }

        const totalItems = result.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedData = result.slice(startIndex, startIndex + itemsPerPage);

        // Tính TỔNG HOA HỒNG (Platform Fee)
        const totalPlatformFee = result.reduce((acc, curr) => acc + (curr.platform_fee || 0), 0);

        return {
            data: paginatedData,
            totalPages,
            totalItems,
            totalPlatformFee // Đã đổi tên
        };
    }, [stores, searchTerm, statusFilter, currentPage]);

    return {
        loading,
        error,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        currentPage, handlePageChange: setCurrentPage,
        handleUpdateStatus, // Trả ra hàm mới
        ...filteredAndPagedStores
    };
};