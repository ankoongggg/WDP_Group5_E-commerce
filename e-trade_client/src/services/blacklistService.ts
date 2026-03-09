import axios from 'axios';
import { get } from 'http';

const API_URL = 'http://localhost:9999/api/blacklist';

// Thêm token nếu có
const getToken = () => localStorage.getItem('accessToken');
const headers = () => ({ Authorization: `Bearer ${getToken()}` });

export const BlacklistService = {
    getAll: async () => {
        const response = await axios.get(API_URL, { headers: headers() });
        return response.data;
    },
    create: async (data: { keyword: string; level: string }) => {
        const response = await axios.post(`${API_URL}/create`, data, { headers: headers() });
        return response.data;
    },
    delete: async (id: string) => {
        const response = await axios.delete(`${API_URL}/${id}`, { headers: headers() });
        return response.data;
    },

    //blacklist products
    getPendingBlacklistedProducts: async (): Promise<any[]> => {
    const response = await axios.get(`${API_URL}/admin/pending-products`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    // Trả về mảng products từ JSON response { products: [...] }
    return response.data.products;
},
    // Cập nhật trạng thái sản phẩm
  updateProductStatus: async (productId: string, status: string): Promise<any> => {
    const response = await axios.put(`${API_URL}/admin/set-status`, 
      { productId, status }, 
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    return response.data;
  }

};