import { useState, useEffect } from 'react';
import { BlacklistService } from '../../services/blacklistService';
import { useToast } from '../../context/ToastContext';

export const useAdminBlacklist = () => {
    const [keywords, setKeywords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const fetchKeywords = async () => {
        setLoading(true);
        try {
            const data = await BlacklistService.getAll();
            setKeywords(data);
        } catch (error) {
            console.error(error);
            toast.error('Lỗi khi tải danh sách từ khóa');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKeywords();
    }, []);

    const handleAddKeyword = async (keyword: string, level: string) => {
        if (!keyword.trim()) return toast.error('Vui lòng nhập từ khóa');
        try {
            await BlacklistService.create({ keyword, level });
            toast.success('Thêm từ khóa thành công!');
            fetchKeywords(); // Cập nhật lại danh sách
            return true; // Trả về true để UI biết bề reset form
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi thêm từ khóa');
            return false;
        }
    };

    const handleDeleteKeyword = async (id: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa từ khóa này?')) return;
        try {
            await BlacklistService.delete(id);
            toast.success('Đã xóa từ khóa khỏi Blacklist');
            fetchKeywords();
        } catch (error) {
            toast.error('Lỗi khi xóa từ khóa');
        }
    };

    return {
        keywords,
        loading,
        handleAddKeyword,
        handleDeleteKeyword
    };
};