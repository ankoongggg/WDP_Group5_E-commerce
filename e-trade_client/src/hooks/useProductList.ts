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

  // Fetch categories chỉ 1 lần
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRes = await CategoryService.getAll({});
        
        if (Array.isArray(categoriesRes)) {
          setCategories(categoriesRes);
        } else if (categoriesRes?.data && Array.isArray(categoriesRes.data)) {
          setCategories(categoriesRes.data);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error('Failed to fetch categories', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products khi page/category/keyword thay đổi
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await ProductService.getAll({ 
          page, 
          limit: 12,
          category,
          keyword 
        });
        setProducts(res.data);
        setTotalPages(res.total_pages);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, category, keyword]);

  // Hàm chuyển trang
  const goToPage = (newPage: number) => {
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { products, categories, totalPages, currentPage: page, loading, goToPage };
};