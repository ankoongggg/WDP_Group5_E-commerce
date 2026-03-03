import axios from 'axios';
import { ProductResponse } from '../types/home';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9999/api';

export const CategoryService = {
    //danh sách category
    getAll : async (params?: {limit?: number}) => {
        const res = await axios.get(`${API_BASE_URL}/categories/all`, { params });
        return res.data;
    },

    getAllOnHomePage: async (params?: { limit?: number }) => {
        const res = await axios.get(`${API_BASE_URL}/categories`, { params: { ...params, is_active: true } });
        return res.data;
    },
    
    create: async (name: string): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/categories/create`, { name });
    return res.data;
  },

  // Sửa tên
  update: async (id: string, name: string): Promise<any> => {
    const res = await axios.put(`${API_BASE_URL}/categories/${id}`, { name });
    return res.data;
  },

  // Ẩn danh mục (Soft delete)
  hide: async (id: string): Promise<any> => {
    const res = await axios.put(`${API_BASE_URL}/categories/${id}/hide`);
    return res.data;
  },
  // Hiển thị danh mục (Soft delete)
  show: async (id: string): Promise<any> => {
    const res = await axios.put(`${API_BASE_URL}/categories/${id}/show`);
    return res.data;
  }
}