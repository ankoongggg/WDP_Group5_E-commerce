// src/services/product.service.ts
import axios from 'axios';
import { ProductResponse } from '../types/home';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9999/api';

export const ProductService = {
  // Lấy danh sách sản phẩm (có hỗ trợ filter, search, page)
  getAll: async (params: { page?: number; limit?: number; keyword?: string; category?: string }): Promise<ProductResponse> => {
    const response = await axios.get(API_BASE_URL + '/products', { params });
    return response.data;
  },

  // Lấy chi tiết 1 sản phẩm
  getById: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  },

  getSaleProducts: async (params?: {limit?: number}) =>{
    const res = await axios.get(`${API_BASE_URL}/products/sale`, { params });
    return res.data;
  }

  
};

// src/services/category.service.ts
// (Giả sử bạn có API lấy category, nếu chưa có thì hardcode tạm ở frontend cũng được)