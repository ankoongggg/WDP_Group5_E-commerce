// src/types/index.ts
export interface Product {
  _id: string; // MongoDB ID
  name: string;
  price: number;
  original_price?: number; // Backend trả về original_price
  main_image: string; // Backend trả về main_image
  // category_id hiện được lưu dưới dạng mảng trong schema
  category_id?: Array<{ _id: string; name: string }> | string;
  description?: string;
  rating?: number; // Nếu có
  sold?: number; // Nếu có
  created_at?: string; // Nếu có
  updated_at?: string; // Nếu có
}

export interface Category {
  _id: string;
  name: string; // Icon hoặc ảnh
}

// Interface cho response trả về từ API phân trang
export interface ProductResponse {
  success: boolean;
  count: number;
  total_pages: number;
  current_page: number;
  data: Product[];
}