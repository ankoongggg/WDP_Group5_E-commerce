// src/hooks/admin/useSellerRequests.ts
import { useState, useEffect, useMemo } from 'react';
import { StoreService } from '../../services/storeService';
import { useToast } from '../../context/ToastContext';
import { removeVietnameseTones } from '../../utils/format';

export const useSellerRequests = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Search & Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending'); // 'pending', 'active', 'rejected', 'all'
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Giả sử API này lấy tất cả các stores/requests, hoặc bạn có thể gọi API chuyên biệt
            // Tạm thời tôi dùng getAdminStores() nếu backend chưa tách API getPendingSellers() rõ ràng
            // Hoặc bạn cứ giữ StoreService.getPendingSellers() của bạn.
            const data = await StoreService.getPendingSellers(); 
            setRequests(data);
        } catch (err: any) {
            console.error(err);
            toast.error('Lỗi khi tải danh sách yêu cầu mở shop.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (id: string) => {
        if (!window.confirm('Bạn có chắc muốn duyệt shop này?')) return;
        try {
            await StoreService.approveSeller(id);
            toast.success('Đã duyệt yêu cầu mở shop!');
            fetchRequests();
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi duyệt yêu cầu.');
        }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm('Bạn có chắc muốn từ chối shop này?')) return;
        try {
            await StoreService.rejectSeller(id);
            toast.success('Đã từ chối yêu cầu mở shop.');
            fetchRequests();
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi từ chối yêu cầu.');
        }
    };

    // Lọc dữ liệu client-side
    const filteredRequests = useMemo(() => {
        return requests.filter((req) => {
            // 1. Lọc theo trạng thái
            if (statusFilter !== 'all' && req.status !== statusFilter) {
                return false;
            }

            // 2. Lọc theo từ khóa (Tên shop, tên chủ, email)
            if (searchTerm.trim()) {
                const term = removeVietnameseTones(searchTerm.toLowerCase());
                const shopName = removeVietnameseTones(req.shop_name?.toLowerCase() || '');
                const ownerName = removeVietnameseTones(req.user_id?.full_name?.toLowerCase() || '');
                const email = removeVietnameseTones(req.user_id?.email?.toLowerCase() || '');
                
                if (!shopName.includes(term) && !ownerName.includes(term) && !email.includes(term)) {
                    return false;
                }
            }

            // 3. Lọc theo ngày
            const reqDate = new Date(req.created_at);
            if (dateFrom && reqDate < new Date(dateFrom)) return false;
            if (dateTo) {
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999); // Lấy hết ngày được chọn
                if (reqDate > to) return false;
            }

            return true;
        });
    }, [requests, searchTerm, statusFilter, dateFrom, dateTo]);

    return {
        requests: filteredRequests,
        loading,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        dateFrom, setDateFrom,
        dateTo, setDateTo,
        handleApprove,
        handleReject,
        refresh: fetchRequests
    };
};