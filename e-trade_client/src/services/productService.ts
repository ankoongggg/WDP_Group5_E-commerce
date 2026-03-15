import axios from 'axios';
import { api } from './api'; // IMPORT VŨ KHÍ BÍ MẬT VÀO ĐÂY
import { ProductResponse } from '../types/home';
import { getInterestsParams } from '../utils/tracker';
import { trackInterest } from '../utils/tracker';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9999/api';

export const ProductService = {
  // Lấy danh sách sản phẩm (có hỗ trợ filter, search, page)
  // Lấy danh sách sản phẩm 
  getOnHomePage: async (params: { page?: number; limit?: number; keyword?: string; category?: string }): Promise<ProductResponse> => {
    const response = await axios.get(API_BASE_URL + '/products/home', { params });
    return response.data;
  },
  getOnProductList: async (params: { page?: number; limit?: number; keyword?: string; category?: string; filter?: string }): Promise<ProductResponse> => {
    const response = await axios.get(API_BASE_URL + '/products', { params });
    return response.data;
  },

  // Gọi GỢI Ý ở Homepage
  getRecommendations: async (limit: number = 18): Promise<ProductResponse> => {
      const interestParams = getInterestsParams(); // Nó sẽ trả về object { interests: '...', category_interests: '...' }
      
      // Gọi chung hàm getProducts nhưng truyền thêm params gợi ý
      const response = await axios.get(API_BASE_URL + '/products/home', { 
          params: { 
              limit, 
              ...interestParams 
          } 
      });
      return response.data;
  },
  getUsedProducts: async (limit: number = 5) => {
    // Thay đổi đường dẫn /api cho khớp với router bạn vừa khai báo
    const response = await axios.get(`${API_BASE_URL}/products/used/?limit=${limit}`);
    return response.data;
  },

  // Lấy chi tiết 1 sản phẩm
  getById: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/products/${id}`);
    return response.data;
  },

  getSaleProducts: async (params?: {limit?: number}) =>{
    const res = await axios.get(`${API_BASE_URL}/products/sale`, { params });
    return res.data;
  },

  // NOTE: creating / managing "pass" products is handled by customerPassService.ts
  // This service only includes core shop APIs. Remove the previous helper to avoid confusion.

  //admin
  

  // --------- Seller Product APIs (requireAuth) ----------
  // DÙNG HÀM api() ĐỂ TỰ ĐỘNG GẮN TOKEN VÀ REFRESH TOKEN NẾU HẾT HẠN
  
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

  // THÊM SỐ LƯỢNG TỒN KHO: 
  addSellerProductStock: async (id: string, amount: number) => {
    return api(`/seller/products/${id}/stock`, {
      method: 'PATCH',
      requireAuth: true, // Cờ này sẽ tự động gắn Token
      body: JSON.stringify({ amount }),
    });
  },

  softDeleteSellerProduct: async (id: string) => {
    return api(`/seller/products/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  },
};