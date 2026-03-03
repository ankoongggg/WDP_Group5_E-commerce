// src/hooks/admin/useAdminReport.ts
import { useState, useEffect, useMemo } from 'react';
import { StoreService,  } from '../../services/storeService';
import { StoreReportData } from '../../types/storeReport';
import { removeVietnameseTones } from '../../utils/format'; // Dùng lại hàm xóa dấu bài trước

export const useAdminReport = () => {
    const [stores, setStores] = useState<StoreReportData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State cho Search, Filter và Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive', 'banned'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Số item trên 1 trang

    useEffect(() => {
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
        fetchStores();
    }, []);

    // Reset về trang 1 mỗi khi search hoặc filter thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    // Derived State: Tính toán danh sách hiển thị (Filter -> Search -> Paginate)
    const filteredAndPagedStores = useMemo(() => {
        let result = [...stores];

        // 1. Lọc theo Status
        if (statusFilter !== 'all') {
            result = result.filter(store => store.status === statusFilter);
        }

        // 2. Tìm kiếm theo Tên Shop (Không phân biệt hoa thường và dấu)
        if (searchTerm.trim()) {
            const normalizedSearch = removeVietnameseTones(searchTerm.toLowerCase());
            result = result.filter(store => {
                const normalizedShopName = removeVietnameseTones(store.shop_name.toLowerCase());
                return normalizedShopName.includes(normalizedSearch);
            });
        }

        // Tính toán tổng số trang dựa trên kết quả đã lọc
        const totalItems = result.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        // 3. Cắt mảng để Phân trang
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedData = result.slice(startIndex, startIndex + itemsPerPage);

        // Tính tổng doanh thu của toàn bộ kết quả lọc (để hiển thị thống kê tổng)
        const totalFilteredRevenue = result.reduce((acc, curr) => acc + (curr.total_revenue || 0), 0);

        return {
            data: paginatedData,
            totalPages,
            totalItems,
            totalFilteredRevenue
        };
    }, [stores, searchTerm, statusFilter, currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return {
        loading,
        error,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        currentPage,
        handlePageChange,
        ...filteredAndPagedStores // data, totalPages, totalItems, totalFilteredRevenue
    };
};