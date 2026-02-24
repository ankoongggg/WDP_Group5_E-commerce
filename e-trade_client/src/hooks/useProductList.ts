// src/hooks/useProductList.ts
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, Category } from '../types/home';
import { ProductService } from '../services/productService';
import { CategoryService } from '../services/categoryService';
import { removeVietnameseTones } from '../utils/format';

export const useProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State hiển thị chính
  const [products, setProducts] = useState<Product[]>([]);
  
  // State chứa sản phẩm gợi ý (Fallback khi không tìm thấy)
  const [fallbackProducts, setFallbackProducts] = useState<Product[]>([]); 
  const [isFallback, setIsFallback] = useState(false); // Cờ đánh dấu đang dùng fallback

  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Cache client
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Params
  const page = parseInt(searchParams.get('page') || '1');
  const categoryParam = searchParams.get('category') || '';
  const selectedCategories = categoryParam ? categoryParam.split(',').filter(Boolean) : [];
  const keyword = searchParams.get('keyword') || '';
  const filter = searchParams.get('filter') || '';

  // 1. Init Data
  useEffect(() => {
    const initData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
            CategoryService.getAll({}),
            ProductService.getAll({ limit: 1000 })
        ]);

        if (Array.isArray(catRes)) setCategories(catRes);
        else if (catRes?.data) setCategories(catRes.data);

        if (prodRes?.data) setAllProducts(prodRes.data);
      } catch (error) {
        console.error('Init failed', error);
      }
    };
    initData();
  }, []);

  // 2. Main Filter Logic (Client-side filtering for complex logic)
  useEffect(() => {
    const applyFilter = async () => {
      setLoading(true);
      setIsFallback(false);
      setFallbackProducts([]);

      // Nếu chưa có data thì return để đợi init xong
      if (allProducts.length === 0) {
          setLoading(false);
          return;
      }

      let result = [...allProducts];

      // --- FILTER 1: CATEGORY (Sửa lỗi selected category, hỗ trợ mảng) ---
      if (selectedCategories.length > 0) {
        result = result.filter(p => {
            // category_id có thể là string, object hoặc mảng object
            let catIds: string[] = [];
            if (Array.isArray(p.category_id)) {
                catIds = p.category_id.map(c => typeof c === 'object' ? c._id : String(c));
            } else if (typeof p.category_id === 'object') {
                catIds = [(p.category_id as any)?._id];
            } else if (typeof p.category_id === 'string') {
                catIds = [p.category_id];
            }
            return catIds.some(id => selectedCategories.includes(id));
        });
      }

      // --- FILTER 2: KEYWORD (Sửa logic tìm kiếm không dấu) ---
      if (keyword.trim()) {
        const keywordNoTone = removeVietnameseTones(keyword.toLowerCase());
        
        result = result.filter(p => {
            const nameNoTone = removeVietnameseTones(p.name.toLowerCase());
            // Chỉ so sánh chữ cái (includes), "ao" match "áo"
            return nameNoTone.includes(keywordNoTone);
        });
      }

      // --- LOGIC FALLBACK (Yêu cầu số 3) ---
      // Nếu kết quả rỗng VÀ đang filter theo Category -> Tìm sp cùng category (bỏ qua keyword)
      if (result.length === 0 && selectedCategories.length > 0) {
          setIsFallback(true);
          // Tìm trong allProducts những sản phẩm thuộc cùng category
          const fallback = allProducts.filter(p => {
              let catIds: string[] = [];
              if (Array.isArray(p.category_id)) {
                  catIds = p.category_id.map(c => typeof c === 'object' ? c._id : String(c));
              } else if (typeof p.category_id === 'object') {
                  catIds = [(p.category_id as any)?._id];
              } else if (typeof p.category_id === 'string') {
                  catIds = [p.category_id];
              }
              return catIds.some(id => selectedCategories.includes(id));
          });
          // Cắt lấy 8 sản phẩm gợi ý
          setFallbackProducts(fallback.slice(0, 8));
      } else if (result.length === 0 && !categoryParam) {
          // Nếu chỉ search keyword mà không thấy -> Không hiển thị fallback
          setIsFallback(false);
          setFallbackProducts([]);
      }

      // --- FILTER 3: SORT & PRICE ---
      switch (filter) {
        case 'price-asc': result.sort((a, b) => a.price - b.price); break;
        case 'price-desc': result.sort((a, b) => b.price - a.price); break;
        // ... các case khác
      }

      // --- PAGINATION (Client side pagination vì đang filter client) ---
      const itemsPerPage = 12;
      setTotalPages(Math.ceil(result.length / itemsPerPage));
      const startIndex = (page - 1) * itemsPerPage;
      const paginatedResult = result.slice(startIndex, startIndex + itemsPerPage);

      setProducts(paginatedResult);
      setLoading(false);
    };

    applyFilter();
  }, [page, categoryParam, keyword, filter, allProducts]);

  const goToPage = (newPage: number) => {
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { 
      products, 
      fallbackProducts, // Trả về list gợi ý fallback
      isFallback,       // Trạng thái fallback
      categories, 
      totalPages, 
      currentPage: page, 
      loading, 
      goToPage,
      keyword // Trả về keyword để UI hiển thị
  };
};