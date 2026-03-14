// src/services/product.service.ts
import axios from 'axios';
import { ProductResponse } from '../types/home';
import { getInterestsParams } from '../utils/tracker';
import { trackInterest } from '../utils/tracker';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9999/api';

export const ProductService = {
  // Lấy danh sách sản phẩm (có hỗ trợ filter, search, page)
  // Lấy danh sách sản phẩm 
  getAll: async (params: { page?: number; limit?: number; keyword?: string; category?: string }): Promise<ProductResponse> => {
    const response = await axios.get(API_BASE_URL + '/products', { params });
    return response.data;
  },

  // Gọi GỢI Ý ở Homepage
  getRecommendations: async (limit: number = 18): Promise<ProductResponse> => {
      const interestParams = getInterestsParams(); // Nó sẽ trả về object { interests: '...', category_interests: '...' }
      
      // Gọi chung hàm getProducts nhưng truyền thêm params gợi ý
      const response = await axios.get(API_BASE_URL + '/products', { 
          params: { 
              limit, 
              ...interestParams 
          } 
      });
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
  },

  // NOTE: creating / managing "pass" products is handled by customerPassService.ts
  // This service only includes core shop APIs. Remove the previous helper to avoid confusion.

  //admin
  

  
};

// src/services/category.service.ts
// (Giả sử bạn có API lấy category, nếu chưa có thì hardcode tạm ở frontend cũng được)