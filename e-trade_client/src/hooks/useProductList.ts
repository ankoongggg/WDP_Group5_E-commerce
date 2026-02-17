import { Category } from './../types/home';
// src/hooks/useProductList.ts
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../types/home';
import { ProductService } from '../services/productService';
import { CategoryService } from '../services/categoryService';

export const useProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories,setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Lấy params từ URL (để khi reload trang vẫn giữ filter)
  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || '';
  const keyword = searchParams.get('keyword') || '';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await ProductService.getAll({ 
          page, 
          limit: 12, // Grid 3x4 hoặc 4x3
          category,
          keyword 
        });
        setProducts(res.data);

        const categoriesRes = await CategoryService.getAll({
                });
        
                // Handle different response formats
                if (Array.isArray(categoriesRes)) {
                  setCategories(categoriesRes);
                } else if (categoriesRes?.data && Array.isArray(categoriesRes.data)) {
                  setCategories(categoriesRes.data);
                } else {
                  setCategories([]);
                }

        setTotalPages(res.total_pages);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, category, keyword]); // Chạy lại khi params thay đổi

  // Hàm chuyển trang
  const goToPage = (newPage: number) => {
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    });
    // Scroll lên đầu
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { products, categories, totalPages, currentPage: page, loading, goToPage };
};