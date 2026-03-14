// src/services/customerPassService.ts
import axios from 'axios';

// product endpoints are mounted under /api/products
const PRODUCT_API_BASE = 'http://localhost:9999/api/products';
// order routes for sellers (including customer‑pass items) live under /api/seller
const SELLER_API_BASE = 'http://localhost:9999/api/seller';

const getToken = () => localStorage.getItem('accessToken');

export const customerPassApi = {
    // API Lấy danh sách sản phẩm đang pass do user đang đăng nhập tạo
    getMyListings: async () => {
        const response = await axios.get(`${PRODUCT_API_BASE}/customer_passed_products`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        return response.data.data;
    },

    // API Tạo sản phẩm pass mới (Tương tự tạo Product, nhưng backend tự biết ép condition)
    createListing: async (productData: any) => {
        const response = await axios.post(`${PRODUCT_API_BASE}/create_2nd_product`, productData, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        return response.data;
    },

    // API Cập nhật thông tin bài đăng hiện có
    updateListing: async (id: string, data: any) => {
        const response = await axios.put(`${PRODUCT_API_BASE}/pass/${id}`, data, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        return response.data;
    },

    // API Xóa / ẩn bài đăng cá nhân
    deleteListing: async (id: string) => {
        const response = await axios.delete(`${PRODUCT_API_BASE}/pass/${id}`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        return response.data;
    },

    // API Lấy đơn hàng khách đặt cho các mặt hàng pass của user (seller)
    getSalesOrders: async (status?: string) => {
        const url = status ? `${SELLER_API_BASE}/2nd_orders?status=${status}` : `${SELLER_API_BASE}/2nd_orders`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        return response.data.data;
    },

    // API Cập nhật trạng thái đơn (Xác nhận, Hủy...)
    updateOrderStatus: async (orderId: string, status: string, reason?: string) => {
        const response = await axios.put(`${SELLER_API_BASE}/update_passed_order_status/${orderId}`,
            { status, reason },
            { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        return response.data;
    }
};