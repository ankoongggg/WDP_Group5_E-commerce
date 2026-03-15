// src/hooks/useProductList.ts
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, Category } from '../types/home';
import { ProductService } from '../services/productService'; // Chú ý path import
import { CategoryService } from '../services/categoryService';

export const useProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [fallbackProducts, setFallbackProducts] = useState<Product[]>([]); 
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Lấy các params từ thanh URL
  const page = parseInt(searchParams.get('page') || '1');
  const categoryParam = searchParams.get('category') || '';
  const keyword = searchParams.get('keyword') || '';
  const filter = searchParams.get('filter') || '';

  const [condition, setCondition] = useState<string>(''); // used, new

  useEffect(() => {
    setCondition(filter);
  }, [filter]);



  // 1. Tải danh mục (Chỉ chạy 1 lần)
  useEffect(() => {
    const loadCats = async () => {
      try {
        const catRes = await CategoryService.getAllOnHomePage({});
        if (Array.isArray(catRes)) setCategories(catRes);
        else if (catRes?.data) setCategories(catRes.data);
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    };
    loadCats();
  }, []);

  // 2. Fetch Sản phẩm MỖI KHI URL PARAM THAY ĐỔI
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Gửi toàn bộ Param lên Backend
        const res = await ProductService.getOnProductList({
           page,
           limit: 12,
           keyword,
           category: categoryParam,
           filter
        });

        if (res.success) {
           setProducts(res.data || []);
          //  setFallbackProducts(res.fallbackData || []); // Lấy mảng gợi ý (nếu có)
           setTotalPages(res.total_pages || 1);
        }
      } catch (error) {
        console.error('Failed to load products', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, keyword, categoryParam, filter]); // Component sẽ tự Re-render khi một trong số này đổi

  const goToPage = (newPage: number) => {
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { 
      products, 
      fallbackProducts,
      categories, 
      totalPages, 
      currentPage: page, 
      loading, 
      goToPage,
      keyword 
  };
};