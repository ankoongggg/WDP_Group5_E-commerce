// src/services/product.service.ts
import axios from 'axios';
import { api } from './api';
import { ProductResponse } from '../types/home';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9999/api';

export const ProductService = {
  // Lấy danh sách sản phẩm (có hỗ trợ filter, search, page) - public
  getAll: async (params: { page?: number; limit?: number; keyword?: string; category?: string }): Promise<ProductResponse> => {
    const response = await axios.get(API_BASE_URL + '/products', { params });
    return response.data;
  },

  // Lấy chi tiết 1 sản phẩm - public
  getById: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  },

  getSaleProducts: async (params?: {limit?: number}) =>{
    const res = await axios.get(`${API_BASE_URL}/products/sale`, { params });
    return res.data;
  },

  // --------- Seller Product APIs (requireAuth) ----------
  getSellerProducts: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const endpoint = `/seller/products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return api(endpoint, { requireAuth: true });
  },

  createSellerProduct: async (payload: any) => {
    return api('/seller/products', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(payload),
    });
  },

  updateSellerProduct: async (id: string, payload: any) => {
    return api(`/seller/products/${id}`, {
      method: 'PUT',
      requireAuth: true,
      body: JSON.stringify(payload),
    });
  },

  updateSellerProductStatus: async (id: string, status: 'active' | 'inactive') => {
    return api(`/seller/products/${id}/status`, {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify({ status }),
    });
  },

  softDeleteSellerProduct: async (id: string) => {
    return api(`/seller/products/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  },
};
